// Run against a local app backed by a dedicated, empty Redis instance.
// SITE_METRICS_TEST_URL=http://localhost:3021 node --test tests/site-metrics.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
const base = process.env.SITE_METRICS_TEST_URL

test('visitor deduplication, CV counts, CTA double clicks and input validation', { skip: !base }, async () => {
  const url = new URL(base)
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname), 'Only run against a local test server')
  const read = async () => (await fetch(`${base}/api/site-stats`)).json()
  const post = (event, cookie, origin = base) => fetch(`${base}/api/site-stats`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ event }) })
  const initial = await read()
  const visit = await post('visit')
  assert.equal(visit.status, 204)
  const cookie = visit.headers.get('set-cookie').split(';')[0]
  await Promise.all(Array.from({ length: 8 }, () => post('visit', cookie)))
  assert.deepEqual(await read(), { ...initial, visitors: initial.visitors + 1 })
  await Promise.all([post('cv', cookie), post('cv', cookie)])
  await Promise.all([post('cta', cookie), post('cta', cookie)])
  assert.deepEqual(await read(), { visitors: initial.visitors + 1, cv: initial.cv + 1, cta: initial.cta + 1 })
  assert.equal((await post('invalid', cookie)).status, 400)
  assert.equal((await post('visit', cookie, 'https://example.org')).status, 403)
  assert.deepEqual(await read(), { visitors: initial.visitors + 1, cv: initial.cv + 1, cta: initial.cta + 1 })
})
