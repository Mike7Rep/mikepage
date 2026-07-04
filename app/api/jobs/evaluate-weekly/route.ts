import { updateTag } from "next/cache"

import { evaluateWeekly } from "@/lib/python-api"

export async function POST(request: Request) {
  const token = process.env.INTERNAL_JOB_TOKEN || process.env.PYTHON_API_TOKEN
  const header = request.headers.get("x-internal-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

  if (!token || header !== token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await readJson(request)
  const result = await evaluateWeekly({
    execute: body.execute ?? true,
    force: body.force ?? false,
  })

  updateTag("dashboard:portfolio")
  return Response.json(result)
}

async function readJson(request: Request) {
  try {
    return await request.json() as { execute?: boolean; force?: boolean }
  } catch {
    return {}
  }
}
