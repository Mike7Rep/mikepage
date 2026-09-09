import { prisma } from "@/lib/prisma"
import { AlpacaRequestError, createAlpacaClient } from "@/lib/python-api"
import { orderQuantity, requiredNumber, sixMonthsAgo, type BrokerRecord } from "@/lib/depot-calculations"
import { getTradingAccount, jsonValue } from "@/lib/depot-data"

export type OrderPreview = {
  id: string; symbol: string; side: "buy" | "sell"; qty: string; estimate: number
  currency: string; available: number; paper: boolean; expiresAt: string
}
export type DepotOrderView = { id: string; symbol: string; side: string; qty: string; status: string; filledQty: string; filledPrice: number | null; createdAt: string }
const terminal = ["filled", "canceled", "expired", "rejected", "replaced"]

async function validateOrder(symbol: string, side: "buy" | "sell", qty: string) {
  const client = createAlpacaClient()
  const [account, asset, positions] = await Promise.all([getTradingAccount(), client.getAsset(symbol), client.getPositions()])
  if (!account.canTrade) throw new Error(account.blockedReason || "Handel nicht möglich.")
  if (!account.marketOpen) throw new Error("Market-Orders sind hier nur während der regulären US-Handelszeiten möglich.")
  if (asset.class !== "us_equity" || asset.tradable !== true || asset.status !== "active") throw new Error("Dieses Asset ist nicht als US-Aktie handelbar.")
  if (!asset.fractionable && !Number.isInteger(Number(qty))) throw new Error("Für dieses Asset sind nur ganze Stückzahlen möglich.")
  const position = positions.find((item) => item.symbol === symbol)
  if (!position) throw new Error("Bitte eine bestehende Depotposition auswählen.")
  const estimate = requiredNumber(position.current_price, "Aktueller Kurs") * Number(qty)
  if (estimate <= 0) throw new Error("Kein gültiger Schätzkurs verfügbar.")
  if (side === "buy" && estimate > account.available) throw new Error("Der geschätzte Kaufbetrag übersteigt das verfügbare Guthaben.")
  if (side === "sell" && Number(qty) > Math.max(0, requiredNumber(position.qty_available, "Verkaufbarer Bestand"))) {
    throw new Error("Die Stückzahl übersteigt den frei verkaufbaren Bestand.")
  }
  return { account, estimate }
}

export async function previewOrder(symbolValue: unknown, sideValue: unknown, quantity: unknown): Promise<OrderPreview> {
  const symbol = String(symbolValue).trim().toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,14}$/.test(symbol)) throw new Error("Ungültiges Aktiensymbol.")
  if (sideValue !== "buy" && sideValue !== "sell") throw new Error("Ungültige Orderrichtung.")
  const qty = orderQuantity(quantity)
  const { account, estimate } = await validateOrder(symbol, sideValue, qty)
  const expiresAt = new Date(Date.now() + 120_000)
  const row = await prisma.depotOrder.create({ data: {
    accountKey: account.accountKey, symbol, side: sideValue, qty, expiresAt,
    data: jsonValue({ estimate, paper: account.paper }),
  } })
  return { id: row.id, symbol, side: sideValue, qty, estimate, currency: account.currency, available: account.available, paper: account.paper, expiresAt: expiresAt.toISOString() }
}

export async function submitMarketOrder(id: string) {
  const account = await getTradingAccount()
  const row = await prisma.depotOrder.findFirst({ where: { id, accountKey: account.accountKey } })
  if (!row) throw new Error("Ordervorschau nicht gefunden.")
  const client = createAlpacaClient()
  const clientId = `dashboard-${id}`
  if (row.status !== "preview") {
    // An uncertain POST is never repeated. Only reconcile the original client ID.
    await refreshOrder(row.id, row.accountKey)
    return getDepotOrders(row.accountKey)
  }
  if (row.expiresAt.getTime() < Date.now()) throw new Error("Die Vorschau ist abgelaufen. Bitte erneut prüfen.")
  if (row.side !== "buy" && row.side !== "sell") throw new Error("Ungültige Orderrichtung.")
  const claimed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${row.accountKey}))`
    const unresolved = await tx.depotOrder.findFirst({ where: { accountKey: row.accountKey, id: { not: row.id }, status: { notIn: ["preview", ...terminal] } } })
    if (unresolved) throw new Error("Bitte zuerst den Status der noch offenen Order aktualisieren.")
    return tx.depotOrder.updateMany({ where: { id, status: "preview", expiresAt: { gt: new Date() } }, data: { status: "validating" } })
  })
  if (!claimed.count) throw new Error("Diese Order wurde bereits übermittelt oder die Vorschau ist abgelaufen.")
  try {
    const validation = await validateOrder(row.symbol, row.side, row.qty.toString())
    if (validation.account.accountKey !== row.accountKey) throw new Error("Das Alpaca-Konto wurde gewechselt.")
  } catch (error) {
    await prisma.depotOrder.update({ where: { id }, data: { status: "rejected", data: jsonValue({ message: error instanceof Error ? error.message : "Orderprüfung fehlgeschlagen." }) } })
    throw error
  }
  await prisma.depotOrder.update({ where: { id }, data: { status: "submitting" } })
  let result: BrokerRecord
  try {
    result = await client.submitOrder({ symbol: row.symbol, qty: row.qty.toString(), side: row.side, type: "market", time_in_force: "day", extended_hours: false, client_order_id: clientId })
  } catch (error) {
    // A transport/server error can occur after Alpaca accepted the order.
    const definitive = error instanceof AlpacaRequestError && [400, 401, 403, 422].includes(error.status)
    await prisma.depotOrder.update({ where: { id }, data: { status: definitive ? "rejected" : "unknown", data: jsonValue({ message: definitive ? error.message : "Übermittlung unklar. Originalorder über die Client-ID abgleichen; nicht erneut senden." }) } })
    if (!definitive) {
      await refreshOrder(id, row.accountKey)
      return getDepotOrders(row.accountKey)
    }
    throw error
  }
  await prisma.depotOrder.update({ where: { id }, data: { status: String(result.status || "accepted"), data: jsonValue(result) } })
  return getDepotOrders(row.accountKey)
}

async function refreshOrder(id: string, accountKey: string) {
  try {
    const result = await createAlpacaClient().getOrder(`dashboard-${id}`)
    await prisma.depotOrder.updateMany({ where: { id, accountKey }, data: { status: String(result.status), data: jsonValue(result) } })
  } catch (error) {
    if (error instanceof AlpacaRequestError && error.status === 404) return
    throw error
  }
}

export async function refreshDepotOrders() {
  const account = await getTradingAccount()
  const pending = await prisma.depotOrder.findMany({ where: { accountKey: account.accountKey, status: { notIn: ["preview", ...terminal] } } })
  for (const order of pending) await refreshOrder(order.id, order.accountKey)
  return { account: await getTradingAccount(), orders: await getDepotOrders(account.accountKey) }
}

export async function getDepotOrders(accountKey: string): Promise<DepotOrderView[]> {
  const rows = await prisma.depotOrder.findMany({ where: {
    accountKey, status: { not: "preview" },
    OR: [{ createdAt: { gte: sixMonthsAgo() } }, { status: { notIn: terminal } }],
  }, orderBy: { createdAt: "desc" }, take: 30 })
  return rows.map((row) => {
    const data = row.data as BrokerRecord
    return { id: row.id, symbol: row.symbol, side: row.side, qty: row.qty.toString(), status: row.status, filledQty: String(data.filled_qty ?? "0"), filledPrice: data.filled_avg_price == null ? null : Number(data.filled_avg_price), createdAt: row.createdAt.toISOString() }
  })
}
