import SiteFeedback from "./site-feedback"

export default async function FeedbackSection() {
  let ratings: { initials: string; rating: number }[] = []
  let formUrl: string | null = null
  let unavailable = Boolean(process.env.GOOGLE_REVIEWS_JSON_URL)
  try {
    const url = new URL(process.env.GOOGLE_REVIEWS_FORM_URL ?? '')
    if (url.protocol === 'https:' && ['docs.google.com', 'forms.gle'].includes(url.hostname)) formUrl = url.href
  } catch {}
  try {
    const url = new URL(process.env.GOOGLE_REVIEWS_JSON_URL ?? '')
    if (url.protocol === 'https:' && url.hostname === 'script.google.com') {
      const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const data: unknown = await response.json()
        if (Array.isArray(data)) {
          unavailable = false
          ratings = data.filter((r): r is { initials: string; rating: number } => typeof r?.initials === 'string' && /^[\p{L}]{1,4}$/u.test(r.initials) && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 6).slice(0, 5000)
        }
      }
    }
  } catch {}
  return <SiteFeedback ratings={ratings} formUrl={formUrl} unavailable={unavailable}/>
}
