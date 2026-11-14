import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeReviews } from './site-reviews'
const headers = ['Vorname', 'Nachname', 'Unternehmen', 'Position', 'Wie zufrieden waren Sie insgesamt', 'Was hat Ihnen an der Zusammenarbeit', 'Würden Sie Michael Repolusk weiterempfehlen', 'Dürfen Ihre Bewertung und Ihr Feedback']
const csv = (rows: unknown[][]) => [headers, ...rows].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n')
const named = 'Ja, mit meinem Vor- und Nachnamen sowie meinem Unternehmen (falls angegeben)'
test('all responses contribute, only explicitly consented reviews are published', () => {
 const result = summarizeReviews(csv([
  ['Klara', 'Huber', 'Firma', 'Leitung', 6, 'Gute, schnelle "Arbeit"\nDanke!', 'Ja', named],
  ['Privat', 'Anonym', 'Secret company', 'Secret position', 4, 'Gut', 'Vielleicht', 'Ja, aber anonym.'],
  ['Hidden', 'Person', 'Secret', 'Secret', 2, 'Private feedback', 'Nein', 'Nein, mein Feedback ist ausschliesslich für Michael bestimmt'],
  ['No', 'Consent', '', '', 4, 'Also private', 'Ja', ''],
 ]))
 assert.equal(result.average, 4); assert.equal(result.count, 4); assert.equal(result.recommendation, 50)
 assert.equal(result.reviews.length, 2)
 assert.deepEqual(result.reviews[0], { author: 'KH', company: 'Firma', position: 'Leitung', rating: 6, text: 'Gute, schnelle "Arbeit"\nDanke!' })
 assert.deepEqual(result.reviews[1], { author: 'Anonym', company: '', position: '', rating: 4, text: 'Gut' })
 assert.ok(!JSON.stringify(result).includes('Secret')); assert.ok(!JSON.stringify(result).includes('Private feedback'))
})
test('empty sheet, invalid scores, missing columns and malformed CSV', () => {
 assert.deepEqual(summarizeReviews(csv([])), { count: 0, average: null, recommendation: null, reviews: [] })
 assert.equal(summarizeReviews(csv([['A','B','','',7,'','Ja',named],['A','B','','',0,'','Nein',named]])).count, 0)
 assert.throws(() => summarizeReviews('<html>Login</html>'))
 assert.throws(() => summarizeReviews('"unclosed'))
})
