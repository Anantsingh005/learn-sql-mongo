/**
 * Light-theme repair pass 2.
 *
 * Pass 1 (`codemod-light.mjs`) mapped colours but deliberately left two things
 * alone, because getting them right needs intent rather than a regex:
 *
 *   1. `text-white`. Whether white is correct depends on whether its container
 *      is dark, and only a browser knows that.
 *   2. Translucent tints and arbitrary `rgba()` glows. These were authored to
 *      sit on a dark card; on a white card a 15%-opacity tint is invisible and
 *      a neon `0 0 28px` glow is a halo artefact.
 *
 * Pass 1 also left some artifacts of its own. This script cleans up exactly
 * those four classes of problem and nothing else. Every rule is listed below
 * with the reasoning, because a repair pass nobody can audit is just a second
 * bug.
 *
 * Contrast is verified afterwards by `scripts/browser-contrast.mjs`, which is
 * the authority — not this file.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'

/* ------------------------------------------------------------------ *
 * R1. `text-<family>-ink` is not a token.
 *
 * Pass 1 mapped shade 900 to the literal string 'ink', producing
 * `text-brand-ink`, `text-leaf-ink` and friends. Those classes do not exist,
 * so the element silently inherited its colour and the contrast audit read it
 * against whatever the parent happened to be. The intent was "the darkest
 * step of this family", which is the family's 700.
 * ------------------------------------------------------------------ */
const R1 = /\btext-(brand|leaf|plum|amber|danger|success|warning)-ink\b/g
const r1 = (m) => `text-${m[1]}-700`

/* ------------------------------------------------------------------ *
 * R2. Translucent pale tints.
 *
 * On the old dark cards `bg-brand-100/15` read as a faint brand wash against
 * near-black. On white it is 15% of a pale tint over white: effectively
 * white. The light-theme equivalent of "faint wash" is a *solid* pale step,
 * so quantise the alpha onto the 50/100 steps instead of keeping it.
 * ------------------------------------------------------------------ */
const R2_BG = /\bbg-(brand|leaf|plum|amber|danger|success|warning)-(50|100|200)\/(\d{1,2})\b/g
const r2bg = (m) => {
  const [, fam, base, alpha] = m
  const a = Number(alpha)
  // A 200 step is already quite saturated; keep it solid rather than washing
  // it out to 50, or the tint loses its meaning.
  if (base === '200') return `bg-${fam}-100`
  return a <= 15 ? `bg-${fam}-50` : `bg-${fam}-100`
}

/* Borders: a 40%-opacity border on a white card is a rendering difference
   nobody can see. Make the step solid and keep the weight in the colour. */
const R2_BORDER = /\bborder-(brand|leaf|plum|amber|danger|success|warning)-200\/\d{1,2}\b/g
const r2border = (m) => `border-${m[1]}-200`

/* The `glow` gradient stops (from/via/to with a low alpha) were pure neon
   bloom on dark. On light they are just a faint wash; collapse them to the
   flat 50 step so the card keeps a hint of accent without the halo. */
const R2_GRAD = /\b(from|via|to)-(brand|leaf|plum|amber|danger|success|warning)-(50|100|200)\/(?:[1-9]|[1-4]\d|50)\b/g
const r2grad = (m) => `${m[1]}-${m[2]}-50`

/* ------------------------------------------------------------------ *
 * R3. Neon `rgba()` inside arbitrary shadow values.
 *
 * `shadow-[0_0_28px_rgba(16,185,129,0.6)]` is Tailwind's emerald-500 at 60%,
 * blurred 28px in every direction. On white that is a green fog, not a glow.
 * Map the raw Tailwind triples onto the site's own ramp, then cap the alpha:
 * on a light surface a shadow should read as depth, never as colour light.
 * ------------------------------------------------------------------ */
const NEON = new Map([
  ['99,102,241', '#1554c7'], // indigo-500
  ['129,140,248', '#2f6ad0'], // indigo-400
  ['79,70,229', '#1449a3'], // indigo-600
  ['16,185,129', '#3d7f55'], // emerald-500
  ['52,211,153', '#4c9a68'], // emerald-400
  ['16,185,129,0', '#3d7f55'],
  ['34,211,238', '#1554c7'], // cyan-400
  ['6,182,212', '#1554c7'], // cyan-500
  ['245,158,11', '#a5680f'], // amber-500
  ['251,191,36', '#a5680f'], // amber-400
  ['250,204,21', '#a5680f'], // yellow-400
  ['244,63,94', '#b03333'], // rose-500
  ['251,113,133', '#d24444'], // rose-400
  ['239,68,68', '#b03333'], // red-500
  ['248,113,113', '#d24444'], // red-400
  ['123,75,216', '#6b46c9'], // violet-600
  ['139,92,246', '#6b46c9'], // violet-500
  ['148,163,184', '#8fa8bf'], // slate-400
  ['226,232,240', '#c3d2e0'], // slate-200
  ['100,116,139', '#8fa8bf'], // slate-500
  ['71,85,105', '#486581'], // slate-600
])

const R3 = /rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([\d.]+)\)/g
const r3 = (m) => {
  const key = `${m[1]},${m[2]},${m[3]}`
  const hex = NEON.get(key)
  if (!hex) return m[0] // site colours and true blacks pass through untouched
  // Cap at 0.22: enough to tint a shadow, not enough to glow.
  const a = Math.min(Number(m[4]), 0.22)
  return `rgba(${hex},${a})`
}

/* Blur radii were also tuned for neon bloom. 28px of blur on a light surface
   is a smudge, so pull the big radii down to ordinary elevation. */
const R3_BLUR = /shadow-\[0_0_(\d+)px_/g
const r3blur = (m) => {
  const n = Number(m[1])
  return n <= 12 ? `shadow-[0_0_${n}px_` : 'shadow-[0_2px_10px_'
}

/* ------------------------------------------------------------------ *
 * R4. `text-white` on a tint pass 1 created.
 *
 * Pass 1 turned `bg-indigo-600` into `bg-brand-100`, which left white text on
 * a pale blue — 1.26:1. The original was a saturated fill with white text,
 * which is a perfectly good light-theme primary button, so the honest repair
 * is to restore the saturation rather than recolour the label. Only applies
 * where `text-white` and a pale `bg-` sit in the same class string, which is
 * exactly the pair pass 1 broke.
 * ------------------------------------------------------------------ */
const r4 = (cls) => {
  if (!/\btext-white\b/.test(cls)) return null
  const m = cls.match(/\bbg-(brand|leaf|plum|amber|danger|success|warning)-(50|100|200)\b/)
  if (!m) return null
  return cls.replace(m[0], `bg-${m[1]}-600`)
}

const RULES = [
  { name: 'r1 bogus -ink token', re: R1, fn: (m) => r1(m) },
  { name: 'r2 bg tint alpha', re: R2_BG, fn: (m) => r2bg(m) },
  { name: 'r2 border tint alpha', re: R2_BORDER, fn: (m) => r2border(m) },
  { name: 'r2 gradient stop alpha', re: R2_GRAD, fn: (m) => r2grad(m) },
  { name: 'r3 neon rgba -> site ramp', re: R3, fn: (m) => r3(m) },
  { name: 'r3 glow blur radius', re: R3_BLUR, fn: (m) => r3blur(m) },
]

/* Applied per class-string so R4 can see the whole class list at once. */
const CLASS_STR = /'([^'\n]*(?:bg-|text-)[^'\n]*)'/g

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

  // R4 first, on whole class strings.
  after = after.replace(CLASS_STR, (full, cls) => {
    const fixed = r4(cls)
    if (fixed && fixed !== cls) {
      bump('r4 white-on-tint -> saturated fill')
      return `'${fixed}'`
    }
    return full
  })

  for (const rule of RULES) {
    after = after.replace(rule.re, (...args) => {
      const m = args.slice(0, -2)
      const next = rule.fn(m)
      if (!next || next === m[0]) return m[0]
      bump(rule.name)
      return next
    })
  }

  if (after !== before) {
    writeFileSync(file, after, 'utf8')
    touched.push(rel)
  }
}

console.log(`repair pass 2: ${touched.length} file(s) touched\n`)
for (const [name, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${name}`)
}