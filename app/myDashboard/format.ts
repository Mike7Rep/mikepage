const currencyFormatterCache = new Map<string, Intl.NumberFormat>()

export const percentFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "percent",
})

export const quantityFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 6,
  minimumFractionDigits: 0,
})

export const dateTimeFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
  timeStyle: "short",
})

export const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
})

export function formatCurrency(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) {
    return "Nicht verfügbar"
  }

  try {
    return normalizeSwissNumber(currencyFormatter(currency).format(value))
  } catch {
    return normalizeSwissNumber(currencyFormatter("USD").format(value))
  }
}

export function formatPercent(value: number | null) {
  return value === null || Number.isNaN(value) ? "Nicht verfügbar" : percentFormatter.format(value)
}

export function formatQuantity(value: number) {
  return normalizeSwissNumber(quantityFormatter.format(value))
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function valueTone(value: number) {
  if (value > 0) return "text-primary"
  if (value < 0) return "text-destructive"
  return "text-white/70"
}

function currencyFormatter(currency: string) {
  if (!currencyFormatterCache.has(currency)) {
    currencyFormatterCache.set(
      currency,
      new Intl.NumberFormat("de-CH", {
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: "currency",
      })
    )
  }
  return currencyFormatterCache.get(currency)!
}

function normalizeSwissNumber(value: string) {
  return value.replace(/\u2019/g, "'")
}
