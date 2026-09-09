import assert from "node:assert/strict"
import test from "node:test"

test("depot sync, review memory and manual orders against an isolated database", { skip: !process.env.DEPOT_TEST_DATABASE_URL }, async (t) => {
  const url = new URL(process.env.DEPOT_TEST_DATABASE_URL!)
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname === "/depot_test", "Only an explicitly isolated local depot_test database is allowed")
  process.env.DATABASE_URL = url.toString()
  process.env.ALPACA_ENDPOINT = "https://paper-api.alpaca.markets"
  process.env.ALPACA_KEY = "test-only"; process.env.ALPACA_SECRET = "test-only"
  process.env.ALPACA_DATA_ENDPOINT = "https://data.alpaca.markets"
  process.env.OPENAI_API_KEY = "test-only"; process.env.OPENAI_MODEL = "test-model"
  const { prisma } = await import("./prisma")
  const { sixMonthsAgo, tradingDate } = await import("./depot-calculations")
  const { syncDepot, getDepotData } = await import("./depot-data")
  const { alpacaAccountKey, createAlpacaClient } = await import("./python-api")
  const { startTrader, advanceTrader, getTraderState } = await import("./depot-trader")
  const { previewOrder, submitMarketOrder } = await import("./depot-orders")
  const account = { id: `depot-test-${Date.now()}`, equity: "2200", cash: "1000", currency: "USD", buying_power: "4000", non_marginable_buying_power: "1000", status: "ACTIVE" }
  const accountKey = alpacaAccountKey(account)
  const today = tradingDate(new Date())
  const day = (offset: number) => new Date(new Date(`${today}T12:00:00Z`).getTime() - offset * 86_400_000).toISOString().slice(0, 10)
  const activities = Array.from({ length: 101 }, (_, index) => ({
    id: `fill-${index}`, activity_type: "FILL", symbol: index % 2 ? "AAPL" : "MSFT", side: index % 3 ? "buy" : "sell",
    qty: "1", price: "100", transaction_time: `${day(2)}T15:00:00Z`,
  }))
  const positions = ["AAPL", "MSFT"].map((symbol) => ({ symbol, asset_class: "us_equity", qty: "6", qty_available: "6", current_price: "100", avg_entry_price: "80", cost_basis: "480", market_value: "600", unrealized_pl: "120", unrealized_plpc: "0.25" }))
  let marketOpen = true, failAI = false, unknownOrder = false, postCount = 0
  const sent = new Map<string, Record<string, unknown>>()
  const prompts: Record<string, unknown>[] = []
  const mock = t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const target = new URL(String(input))
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
    if (target.hostname === "api.openai.com") {
      const body = JSON.parse(String(init?.body))
      const context = JSON.parse(body.input); prompts.push(context)
      if (failAI && context.symbol === "MSFT") return reply({}, 500)
      return reply({ status: "completed", model: "test-model", output: [
        { type: "web_search_call", action: { sources: [{ title: "Company report", url: "https://example.com/report" }] } },
        { type: "message", content: [{ type: "output_text", text: JSON.stringify({ action: "hold", confidence: "medium", thesis: "Testthese", changes: "Keine Änderung", risks: ["Test-Risiko"], previousAssessment: "Vorherige Entscheidung geprüft" }) }] },
      ] })
    }
    if (!["paper-api.alpaca.markets", "api.alpaca.markets", "data.alpaca.markets"].includes(target.hostname)) throw new Error(`Unexpected network request: ${target.hostname}`)
    const path = target.pathname
    if (path === "/v2/account") return reply(account)
    if (path === "/v2/positions") return reply(positions)
    if (path === "/v2/clock") return reply({ is_open: marketOpen })
    if (path.startsWith("/v2/assets/")) return reply({ class: "us_equity", status: "active", tradable: true, fractionable: true })
    if (path === "/v2/account/activities") return reply(target.searchParams.has("page_token") ? activities.slice(100) : activities.slice(0, 100))
    if (path === "/v2/account/portfolio/history") return reply({ timestamp: [day(3), day(2), day(1)].map((date) => Date.parse(`${date}T12:00:00Z`) / 1000), equity: [2000, 2100, 2150] })
    if (path === "/v2/stocks/bars") {
      const symbol = target.searchParams.get("symbols")!
      return reply({ bars: { [symbol]: Array.from({ length: 15 }, (_, i) => ({ t: `${day(15 - i)}T12:00:00Z`, o: 95 + i, h: 97 + i, l: 94 + i, c: 96 + i, v: 1000 })) } })
    }
    if (path === "/v2/orders" && init?.method === "POST") {
      postCount++
      const body = JSON.parse(String(init.body))
      const order = { ...body, id: body.client_order_id, status: "filled", filled_qty: body.qty, filled_avg_price: "100" }
      sent.set(body.client_order_id, order)
      if (unknownOrder) throw new TypeError("Simulated connection loss after acceptance")
      return reply(order)
    }
    if (path === "/v2/orders") return reply([])
    if (path === "/v2/orders:by_client_order_id") {
      const order = sent.get(target.searchParams.get("client_order_id")!)
      return order ? reply(order) : reply({ message: "not found" }, 404)
    }
    throw new Error(`Unexpected test endpoint: ${path}`)
  })
  try {
    await t.test("paginated synchronization is idempotent and enforces retention", async () => {
      const oldDate = new Date(sixMonthsAgo().getTime() - 86_400_000)
      await prisma.depotSnapshot.create({ data: { accountKey, date: oldDate, equity: 1, currency: "USD" } })
      await syncDepot(accountKey); await syncDepot(accountKey)
      assert.equal(await prisma.depotActivity.count({ where: { accountKey } }), 101)
      assert.equal(await prisma.depotSnapshot.count({ where: { accountKey } }), 4)
      const data = await getDepotData(accountKey)
      assert.equal(data.points[0].costBasis, null)
      assert.equal(data.points.at(-1)!.costBasis, 960)
      assert.equal(data.fills.length, 101)
      assert.equal((await createAlpacaClient().getCashActivities()).length, 101)
    })
    await t.test("parallel starts share one run; reviews persist and subsequent runs see feedback", async () => {
      const [a, b] = await Promise.all([startTrader(true), startTrader(true)])
      assert.equal(a.id, b.id)
      let state = await advanceTrader(a.id)
      assert.equal(state.run!.symbols.length, 2)
      state = await advanceTrader(a.id)
      assert.equal(state.run!.reviews.length, 1)
      state = await advanceTrader(a.id)
      assert.equal(state.run!.status, "completed")
      assert.equal(state.run!.reviews.length, 2)
      await advanceTrader(a.id)
      assert.equal(await prisma.review.count({ where: { runId: a.id } }), 2)
      await prisma.review.updateMany({ where: { runId: a.id }, data: { createdAt: new Date(`${day(10)}T12:00:00Z`) } })
      const next = await startTrader(true)
      assert.notEqual(next.id, a.id)
      await advanceTrader(next.id); await advanceTrader(next.id); await advanceTrader(next.id)
      assert.ok(prompts.at(-1)!.previousDecision)
      assert.ok(prompts.at(-1)!.feedback)
      assert.ok((prompts.at(-1)!.executedTradesSincePrevious as unknown[]).length > 0)
    })
    await t.test("one failed model request does not lose other reviews or depot data", async () => {
      failAI = true
      const run = await startTrader(true)
      await advanceTrader(run.id); await advanceTrader(run.id)
      const state = await advanceTrader(run.id)
      assert.equal(state.run!.status, "partial")
      assert.equal(state.run!.symbols.find((item) => item.symbol === "MSFT")!.status, "failed")
      assert.ok((await getTraderState(accountKey)).reviews.length)
      assert.equal((await getDepotData(accountKey)).points.length, 4)
    })
    await t.test("preview never trades; oversells, excessive buys and closed sessions fail", async () => {
      await assert.rejects(previewOrder("AAPL", "sell", "7"), /Bestand/)
      await assert.rejects(previewOrder("AAPL", "buy", "11"), /Guthaben/)
      marketOpen = false
      await assert.rejects(previewOrder("AAPL", "buy", "1"), /Handelszeiten/)
      marketOpen = true
      await previewOrder("AAPL", "buy", "1")
      assert.equal(postCount, 0)
    })
    await t.test("double submits and an ambiguous broker response produce exactly one market order", async () => {
      const preview = await previewOrder("AAPL", "buy", "1")
      unknownOrder = true
      await submitMarketOrder(preview.id)
      await submitMarketOrder(preview.id)
      assert.equal(postCount, 1)
      const order = sent.get(`dashboard-${preview.id}`)!
      assert.equal(order.type, "market"); assert.equal(order.time_in_force, "day")
      assert.equal((await prisma.depotOrder.findUniqueOrThrow({ where: { id: preview.id } })).status, "filled")
    })
    await t.test("an expired preview cannot submit", async () => {
      const preview = await previewOrder("AAPL", "sell", "1")
      await prisma.depotOrder.update({ where: { id: preview.id }, data: { expiresAt: new Date(0) } })
      await assert.rejects(submitMarketOrder(preview.id), /abgelaufen/)
      assert.equal(postCount, 1)
    })
    await t.test("account and market conditions are rechecked after preview", async () => {
      const preview = await previewOrder("AAPL", "buy", "1")
      marketOpen = false
      await assert.rejects(submitMarketOrder(preview.id), /Handelszeiten/)
      marketOpen = true
      assert.equal(postCount, 1)
      const other = await previewOrder("AAPL", "buy", "1")
      const originalId = account.id
      account.id = "different-account"
      await assert.rejects(submitMarketOrder(other.id), /nicht gefunden/)
      account.id = originalId
      assert.equal(postCount, 1)
    })
    await t.test("live orders require explicit server enablement", async () => {
      process.env.ALPACA_ENDPOINT = "https://api.alpaca.markets"
      process.env.ALPACA_ALLOW_LIVE_TRADING = "false"
      await assert.rejects(previewOrder("AAPL", "buy", "1"), /Live-Handel/)
      process.env.ALPACA_ENDPOINT = "https://paper-api.alpaca.markets"
      assert.equal(postCount, 1)
    })
  } finally {
    mock.mock.restore()
    await prisma.review.deleteMany({ where: { run: { accountKey } } })
    await prisma.run.deleteMany({ where: { accountKey } })
    await prisma.depotOrder.deleteMany({ where: { accountKey } })
    await prisma.depotActivity.deleteMany({ where: { accountKey } })
    await prisma.depotSnapshot.deleteMany({ where: { accountKey } })
    await prisma.$disconnect()
  }
})
