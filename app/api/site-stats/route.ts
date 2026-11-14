import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getRedis } from "@/lib/dashboard-auth"

const key = "website:metrics:v1"
const headers = { "Cache-Control": "no-store" }

export async function GET() {
  try {
    const redis = await getRedis()
    const values = await redis.hGetAll(key)
    return NextResponse.json({ visitors: Number(values.visitors ?? 77), cv: Number(values.cv ?? 0), cta: Number(values.cta ?? 0) }, { headers })
  } catch {
    return NextResponse.json({ error: "Zähler momentan nicht verfügbar." }, { status: 503, headers })
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return new NextResponse(null, { status: 403 })
  }
  if (Number(request.headers.get("content-length") ?? 0) > 256) return new NextResponse(null, { status: 413 })
  let event: unknown
  try { event = (await request.json()).event } catch { return new NextResponse(null, { status: 400 }) }
  if (!["visit", "cv", "cta"].includes(String(event))) return new NextResponse(null, { status: 400 })
  const cookie = request.cookies.get("site_visit")?.value
  const id = cookie && /^[a-f0-9-]{36}$/.test(cookie) ? cookie : randomUUID()
  try {
    const redis = await getRedis()
    await redis.eval(`
      redis.call('HSETNX', KEYS[1], 'visitors', 77)
      redis.call('HSETNX', KEYS[1], 'cv', 0)
      redis.call('HSETNX', KEYS[1], 'cta', 0)
      if redis.call('SET', KEYS[2], '1', 'EX', 86400, 'NX') then
        redis.call('HINCRBY', KEYS[1], 'visitors', 1)
      end
      if ARGV[1] == 'cv' and redis.call('SET', KEYS[3], '1', 'EX', 86400, 'NX') then
        redis.call('HINCRBY', KEYS[1], 'cv', 1)
      end
      if ARGV[1] == 'cta' and redis.call('SET', KEYS[4], '1', 'EX', 2, 'NX') then
        redis.call('HINCRBY', KEYS[1], 'cta', 1)
      end
      return 1
    `, { keys: [key, `${key}:visit:${id}`, `${key}:cv:${id}`, `${key}:cta:${id}`], arguments: [String(event)] })
    const response = new NextResponse(null, { status: 204, headers })
    if (!cookie || cookie !== id) response.cookies.set("site_visit", id, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 86400, path: "/" })
    return response
  } catch {
    return NextResponse.json({ error: "Zähler momentan nicht verfügbar." }, { status: 503, headers })
  }
}
