import SiteFeedback from "./site-feedback"
import { summarizeReviews, type ReviewSummary } from "@/lib/site-reviews"

export default async function FeedbackSection() {
  let summary: ReviewSummary = { count: 0, average: null, recommendation: null, reviews: [] }
  let unavailable = false
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1S6rMKluhRY-s-TmeMcKtjos6eAhIVPkWpqcSsZkTGRs/export?format=csv&gid=2061172240', { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('Review sheet unavailable')
    summary = summarizeReviews(await response.text())
  } catch { unavailable = true }
  // Only aggregates and explicitly permitted public fields cross the client boundary.
  return <SiteFeedback summary={summary} formUrl="https://forms.gle/8kT9yds33rNTKFd37" unavailable={unavailable}/>
}
