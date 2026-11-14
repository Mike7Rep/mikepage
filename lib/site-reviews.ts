export type PublicReview = { author: string; company: string; position: string; rating: number; text: string }
export type ReviewSummary = { count: number; average: number | null; recommendation: number | null; reviews: PublicReview[] }

// Quoted CSV fields may contain commas, escaped quotes and multiple lines.
export function summarizeReviews(csv: string): ReviewSummary {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i]
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') { field += '"'; i++ } else quoted = !quoted
    } else if (c === ',' && !quoted) { row.push(field); field = '' }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && csv[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += c
  }
  if (quoted) throw new Error('Invalid review CSV')
  if (field || row.length) { row.push(field); rows.push(row) }
  const headers = (rows.shift() ?? []).map(h => h.replace(/^\uFEFF/, '').trim())
  const columns = ['Vorname', 'Nachname', 'Unternehmen', 'Position', 'Wie zufrieden waren Sie insgesamt', 'Was hat Ihnen an der Zusammenarbeit', 'Würden Sie Michael Repolusk weiterempfehlen', 'Dürfen Ihre Bewertung und Ihr Feedback'].map(prefix => headers.findIndex(h => h.startsWith(prefix)))
  if (columns.some(i => i < 0)) throw new Error('Review columns missing')
  let total = 0, count = 0, recommended = 0
  const reviews: PublicReview[] = []
  const timestampColumn = headers.indexOf('Zeitstempel')
  const newestFirst = rows.map((row, index) => {
    const raw = row[timestampColumn] ?? ''
    const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})[, ]+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    const timestamp = match ? Date.UTC(+match[3], +match[2] - 1, +match[1], +match[4], +match[5], +(match[6] ?? 0)) : Date.parse(raw)
    return { row, index, timestamp }
  }).sort((a, b) => Number.isFinite(a.timestamp) && Number.isFinite(b.timestamp) ? b.timestamp - a.timestamp || b.index - a.index : b.index - a.index)
  for (const { row } of newestFirst) {
    const [first, last, company, position, score, text, recommendation, consent] = columns.map(i => (row[i] ?? '').trim())
    const rating = Number(score)
    if (!Number.isInteger(rating) || rating < 1 || rating > 6) continue
    total += rating; count++
    if (recommendation === 'Ja') recommended++
    // Fail closed: only the two explicit publication choices permit a public card.
    if (consent === 'Ja, aber anonym.') {
      reviews.push({ author: 'Anonym', company: '', position: '', rating, text })
    } else if (consent === 'Ja, mit meinem Vor- und Nachnamen sowie meinem Unternehmen (falls angegeben)') {
      const initials = [first, last].map(n => n ? `${Array.from(n)[0]}.` : '').join(' ').toLocaleUpperCase('de-CH')
      reviews.push({ author: initials || 'Anonym', company, position, rating, text })
    }
  }
  return { count, average: count ? total / count : null, recommendation: count ? Math.round(recommended / count * 100) : null, reviews }
}
