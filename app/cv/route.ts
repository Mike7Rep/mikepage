import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  const source = await readFile(path.join(process.cwd(), "public/cv/2026_Michael_Repolusk.html"), "utf8")
  const html = source.replace("</head>", '<link rel="icon" href="/icon.svg"><script src="/site-metrics.js" defer></script></head>')
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" } })
}
