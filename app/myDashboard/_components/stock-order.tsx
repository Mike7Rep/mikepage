"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { placeStockOrderAction } from "../actions"

export function StockOrder({ symbol, quantity }: { symbol: string; quantity: number }) {
  const [side, setSide] = useState<"buy" | "sell" | null>(null)
  const [type, setType] = useState<"market" | "limit">("market")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const attempt = useRef<{ id: string; payload: string } | null>(null)
  return <div className="flex flex-col gap-2">
    <div className="flex gap-2"><Button onClick={() => { setMessage(""); setSide("buy") }}>Kaufen</Button><Button variant="outline" disabled={quantity <= 0} onClick={() => { setMessage(""); setSide("sell") }}>Verkaufen</Button></div>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Dialog open={side !== null} onOpenChange={open => { if (!open && !busy) setSide(null) }}>
      <DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>{symbol} · {side === "buy" ? "Kaufen" : "Verkaufen"}</DialogTitle></DialogHeader>
        <form key={side} className="grid gap-4" onSubmit={async e => {
          e.preventDefault()
          if (busy || !side) return
          const form = new FormData(e.currentTarget)
          const values = { symbol, side, qty: String(form.get("qty")), type, limit: String(form.get("limit") ?? "") }
          const payload = JSON.stringify(values)
          if (attempt.current && attempt.current.payload !== payload) { setMessage("Vor neuer Order den Status der vorherigen Order im Broker prüfen."); return }
          attempt.current ??= { id: crypto.randomUUID(), payload }
          setBusy(true)
          try {
            const result = await placeStockOrderAction({ ...values, id: attempt.current.id })
            if (result.ok) { setMessage("Order: " + result.status); attempt.current = null; setSide(null) }
            else setMessage(result.error)
          } catch { setMessage("Orderstatus unklar. Erneut senden prüft dieselbe Order.") }
          finally { setBusy(false) }
        }}>
          <label className="grid gap-1">Stückzahl<input className="rounded border p-2" name="qty" type="number" min="0.000000001" step="any" required defaultValue={side === "sell" ? quantity : 1} /></label>
          <label className="grid gap-1">Ordertyp<select className="rounded border bg-background p-2" value={type} onChange={e => setType(e.target.value as typeof type)}><option value="market">Market · DAY</option><option value="limit">Limit · DAY</option></select></label>
          {type === "limit" && <label className="grid gap-1">Limit (USD)<input className="rounded border p-2" name="limit" type="number" step="any" min="0.0001" required /></label>}
          {message && <p role="alert" className="text-sm">{message}</p>}
          <Button disabled={busy} type="submit">{busy ? "Wird gesendet …" : side === "buy" ? "Kauf verbindlich senden" : "Verkauf verbindlich senden"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </div>
}
