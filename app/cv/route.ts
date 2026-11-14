import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  const html = await readFile(path.join(process.cwd(), "public/cv/2026_Michael_Repolusk.html"), "utf8")
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" } })
}
