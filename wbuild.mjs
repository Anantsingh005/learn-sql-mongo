import fs from 'node:fs'
const D = new Set(['easy', 'medium', 'hard'])
const TARGET = { easy: 25, medium: 15, hard: 20 }
const files = fs.readdirSync('.').filter((f) => f.endsWith('.mjs') && !f.startsWith('_') && f !== 'qs0-seed.mjs')
const seen = new Set()
const all = []
for (const f of files) {
  let mod
  try { mod = await import('./' + f) } catch { console.log('SKIP', f); continue }
  for (const q of mod.qs || []) {
    if (seen.has(q[0])) continue
    seen.add(q[0])
    all.push(q)
  }
}
function diffOf(t) { return D.has(t[1]) ? t[1] : D.has(t[2]) ? t[2] : null }
const picked = []
const by = {}
for (const q of all) {
  const d = diffOf(q)
  if (!d) continue
  if ((by[d] || 0) >= TARGET[d]) continue
  by[d] = (by[d] || 0) + 1
  picked.push(q)
}
const objs = picked.map(build).map((o) => '  ' + JSON.stringify(o)).join(',\n')
const out = 'export const writeQuery = [\n' + objs + '\n]\n'
fs.writeFileSync('src/data/sql/writeQuery.js', out)
function build(q) {
  const diff = diffOf(q)
  const topic = D.has(q[1]) ? q[2] : q[1]
  const question = q[3]
  const schema = {}
  let i = 4
  while (i + 2 < q.length && typeof q[i] === 'string' && Array.isArray(q[i + 1])) {
    schema[q[i]] = { columns: q[i + 1], rows: q[i + 2] }
    i += 3
  }
  let expCols = q[i++], expRows = q[i++]
  let orderMatters = typeof q[i] === 'boolean' ? q[i] : false
  if (typeof q[i] === 'boolean') i++
  let hint = typeof q[i] === 'string' ? q[i] : ''
  if (typeof q[i] === 'string') i++
  let explanation = typeof q[i] === 'string' ? q[i] : ''
  return { id: q[0], type: 'write', topic, difficulty: diff, question, schema, expected: { columns: expCols, rows: expRows, orderMatters }, hint, explanation }
}
console.log('WROTE', JSON.stringify(by), 'total', picked.length)
