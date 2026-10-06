/**
 * Light-theme repair pass 3.
 *
 * Pass 1 mapped Tailwind's `bg-slate-900`/`950` onto `bg-ink`, which kept ~95
 * surfaces dark on purpose-looking grounds. That was the wrong call: those
 * classes are cards, panels, table wrappers and code blocks, and a light SaaS
 * with 95 dark cards is not a light SaaS. Worse, the foregrounds on them had
 * already been mapped to dark steps by pass 1, so every one of those panels was
 * dark-on-dark.
 *
 * This pass fixes that, plus the two things no class-based codemod can reach:
 *
 *   - arbitrary hex colours (`#38bdf8`) and inline `rgba()`, which are opaque to
 *     any Tailwind-class rule;
 *   - `text-white` on a tint, which pass 2 only caught inside single-quoted
 *     class strings and therefore missed template literals and ternaries.
 *
 * The scrim/bar exceptions are the interesting part. `bg-ink/40` is also how a
 * modal overlay is spelled, and a light theme still needs a dark scrim; the
 * scroll-progress bar is meant to be a dark rule. Those are listed explicitly
 * rather than pattern-matched, because "make everything light" is exactly the
 * kind of rule that quietly deletes a modal's backdrop.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'

/* ------------------------------------------------------------------ *
 * R1. Dark card surfaces -> white.
 *
 * `bg-ink` bare and the high-alpha variants (these were near-opaque dark cards,
 * so white is the faithful light-theme equivalent). The low-alpha bracket forms
 * were subtle washes for code chips and hover states, and become `bg-shell`.
 * ------------------------------------------------------------------ */
const R1_CARD = /\bbg-ink(?:\/(?:70|80|90|95|100)|)\b/g
const r1card = () => 'bg-white'
const R1_WASH = /\bbg-ink\/(?:40|30|\[0\.0\d\])\b/g
const r1wash = () => 'bg-shell'

/* Border and ring tints derived from ink. */
const R1_BORDER = /\bborder-ink\/(?:10|15|20|30|40|60)\b/g
const r1border = (m) => `border-ink/${Number(m[1]) * 2}`
const R1_RING = /\bring-brand-600\/10\b/g
const r1ring = () => 'ring-brand-200'

/* ------------------------------------------------------------------ *
 * R2. Arbitrary hex colours.
 *
 * The neon Tailwind defaults that survived pass 1 because they were written as
 * hex rather than as classes. Same target ramp as pass 2's NEON map.
 * ------------------------------------------------------------------ */
const HEX = new Map([
  ['#38bdf8', '#1554c7'], // sky-400
  ['#0ea5e9', '#2f6ad0'], // sky-500
  ['#22d3ee', '#1554c7'], // cyan-400
  ['#06b6d4', '#2f6ad0'], // cyan-500
  ['#34d399', '#3d7f55'], // emerald-400
  ['#10b981', '#3d7f55'], // emerald-500
  ['#059669', '#316644'], // emerald-600
  ['#6ee7b7', '#3d7f55'], // emerald-300
  ['#fbbf24', '#a5680f'], // amber-400
  ['#f59e0b', '#a5680f'], // amber-500
  ['#fb923c', '#a5680f'], // orange-400
  ['#f97316', '#a5680f'], // orange-500
  ['#fb7185', '#d24444'], // rose-400
  ['#f43f5e', '#b03333'], // rose-500
  ['#e11d48', '#a32e2e'], // rose-600
  ['#f87171', '#d24444'], // red-400
  ['#ef4444', '#b03333'], // red-500
  ['#818cf8', '#2f6ad0'], // indigo-400
  ['#6366f1', '#1554c7'], // indigo-500
  ['#4f46e5', '#1449a3'], // indigo-600
  ['#a78bfa', '#6b46c9'], // violet-400
  ['#8b5cf6', '#6b46c9'], // violet-500
  ['#c084fc', '#6b46c9'], // purple-400
  ['#a855f7', '#573499'], // purple-500
  /* Dark slate hexes: the old theme's own surfaces and greys. */
  ['#0f172a', '#102a43'], // slate-900
  ['#1e293b', '#102a43'], // slate-800
  ['#334155', '#243b53'], // slate-700
  ['#475569', '#243b53'], // slate-600
  ['#64748b', '#556d85'], // slate-500
  ['#94a3b8', '#556d85'], // slate-400
  /* Odd near-black custom values in the old palette. */
  ['#0e2136', '#102a43'],
  ['#0b1a2b', '#102a43'],
])

const R2 = /#[0-9a-fA-F]{6}\b/g
const r2 = (m) => HEX.get(m[0].toLowerCase()) ?? m[0]

/* rgba() equivalents, reusing the same targets. */
const R2_RGBA = /rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([\d.]+)\)/g
const r2rgba = (m) => {
  const asHex = '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('')
  const mapped = HEX.get(asHex.toLowerCase())
  if (!mapped) return m[0]
  const n = parseInt(mapped.slice(1), 16)
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return `rgba(${rgb.join(',')},${m[4]})`
}

/* ------------------------------------------------------------------ *
 * R3. `text-white` on a pale tint, including inside template literals.
 *
 * Pass 2's R4 only looked at `'...'` strings, so `className={`... text-white
 * bg-brand-100 ...`}` and ternaries were missed. The repair is the same: a
 * saturated fill with white text is a valid primary button at 6.72:1, whereas
 * white on brand-100 is 1.26:1.
 * ------------------------------------------------------------------ */
const R3 = /\bbg-(brand|leaf|plum|amber|danger|success|warning)-(50|100|200)\b(?=[^'"]*\btext-white\b)/g
const r3 = (m) => `bg-${m[1]}-600`

/* Inputs that are dark with white text are internally consistent but read as a
   hole in a light form. Make them light and darken the label. */
const R3_INPUT = /\bbg-ink px-4 py-2 text-sm text-white\b/g
const r3input = () => 'bg-white px-4 py-2 text-sm text-ink'

/* ------------------------------------------------------------------ *
 * Exceptions: dark where dark is the point.
 * ------------------------------------------------------------------ */
const KEEP_DARK = [
  'src/components/site/Footer.jsx', // modal scrim
  'src/components/admin/FeedbackPanel.jsx', // modal scrim
  'src/components/academy/ScrollProgress.jsx', // the progress rule itself
]

const RULES = [
  { name: 'r1 dark card -> white', re: R1_CARD, fn: r1card },
  { name: 'r1 dark wash -> shell', re: R1_WASH, fn: r1wash },
  { name: 'r1 ink border alpha', re: R1_BORDER, fn: r1border },
  { name: 'r1 faint brand ring', re: R1_RING, fn: r1ring },
  { name: 'r2 neon/slate hex', re: R2, fn: r2 },
  { name: 'r2 neon/slate rgba', re: R2_RGBA, fn: r2rgba },
  { name: 'r3 white-on-tint fill', re: R3, fn: r3 },
  { name: 'r3 dark input -> light', re: R3_INPUT, fn: r3input },
]

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(jsx|js)$/.test(entry)) out.push(full)
  }
  return out
}

const counts = new Map()
const bump = (n) => counts.set(n, (counts.get(n) ?? 0) + 1)
const touched = []

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/')
  const before = readFileSync(file, 'utf8')
  let after = before

  if (!KEEP_DARK.includes(rel)) {
    for (const rule of RULES) {
      after = after.replace(rule.re, (...args) => {
        const m = args.slice(0, -2)
        const next = rule.fn(m)
        if (!next || next === m[0]) return m[0]
        bump(rule.name)
        return next
      })
    }
  }

  if (after !== before) {
    writeFileSync(file, after, 'utf8')
    touched.push(rel)
  }
}

console.log(`repair pass 3: ${touched.length} file(s) touched\n`)
for (const [name, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${name}`)
}
console.log(`\nkept dark (scrim / progress rule): ${KEEP_DARK.join(', ')}`)