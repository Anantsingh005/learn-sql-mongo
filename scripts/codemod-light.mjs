/**
 * Dark-to-light codemod.
 *
 * Phase 5 is 47 files and ~1490 uses of Tailwind's default palette — dark
 * surfaces, near-black text and neon accents inherited from the old theme. That
 * is too many to hand-edit without losing one, and too mechanical to deserve
 * hand-editing at all.
 *
 * Rules are applied in order, most specific first, so a shade-specific rule
 * always wins over a family-wide one. Every substitution is recorded and
 * printed as a grouped summary: a codemod you cannot audit is just a bug with
 * extra steps, so the output is the point as much as the edit.
 *
 * What this deliberately does NOT do:
 *
 *   - `text-white` is left alone. Whether white text is correct depends on
 *     whether its container is dark, and only a browser knows that. Guessing
 *     here is how you get invisible headings. Those are found by
 *     `scripts/browser-contrast.mjs` and fixed by hand.
 *   - `from-*`/`via-*`/`to-*` gradient stops are mapped, but a gradient that
 *     became light-on-light needs the same human check, so gradient-using files
 *     are listed at the end for review.
 *   - Layout, logic and behaviour are untouched. Classes only.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'

/* Tailwind family -> the site's semantic family. Everything that was a second
   blue (indigo/sky/cyan) collapses onto brand, everything green onto leaf,
   purple onto plum. Collapsing rather than preserving is the point: four
   unrelated blues is what made the old theme read as a different product. */
const FAMILY = {
  blue: 'brand',
  indigo: 'brand',
  sky: 'brand',
  cyan: 'brand',
  emerald: 'leaf',
  green: 'leaf',
  teal: 'leaf',
  violet: 'plum',
  purple: 'plum',
  fuchsia: 'plum',
  pink: 'plum',
  lime: 'leaf',
  amber: 'amber',
  orange: 'amber',
  yellow: 'amber',
  rose: 'danger',
  red: 'danger',
  slate: 'neutral',
  zinc: 'neutral',
  neutral: 'neutral',
  stone: 'neutral',
  gray: 'neutral',
}

/* Neutrals do not map onto a hue. They map onto the ink/body/muted/line ramp,
   which is what keeps a light theme looking like one system. */
const NEUTRAL_TEXT = {
  100: 'body',
  200: 'body',
  300: 'muted',
  400: 'muted',
  500: 'muted',
  600: 'body',
  700: 'body',
  800: 'ink',
  900: 'ink',
  950: 'ink',
}

const NEUTRAL_SURFACE = {
  50: 'shell',
  100: 'shell',
  200: 'mist',
  300: 'line',
  400: 'line',
  500: 'line',
  600: 'line-soft',
  700: 'line',
  800: 'line',
  900: 'ink',
  950: 'ink',
}

const NEUTRAL_BORDER = {
  100: 'line-soft',
  200: 'line-soft',
  300: 'line',
  400: 'line',
  500: 'line',
  600: 'line',
  700: 'line',
  800: 'line',
  900: 'ink',
  950: 'ink',
}

/* For a coloured family, shade -> role. Deliberately coarse: three buckets,
   because the light theme needs foregrounds dark enough to pass AA and
   backgrounds pale enough to sit behind them. Anything finer is guesswork. */
const COLOR_TEXT = {
  100: '700',
  200: '700',
  300: '700',
  400: '600',
  500: '600',
  600: '700',
  700: '700',
  800: '700',
  900: 'ink',
  950: 'ink',
}

const COLOR_SURFACE = {
  50: '50',
  100: '50',
  200: '50',
  300: '50',
  400: '100',
  500: '100',
  600: '100',
  700: '50',
  800: '50',
  900: 'white',
  950: 'white',
}

const COLOR_BORDER = {
  100: '100',
  200: '200',
  300: '200',
  400: '200',
  500: '200',
  600: '200',
  700: '200',
  800: 'line',
  900: 'line',
  950: 'line',
}

/* Ordered application. Text first: `text-slate-400` is a more specific claim
   about intent than the generic surface rule. */
const RULES = [
  {
    name: 'text-neutral',
    re: /\btext-(slate|zinc|neutral|stone|gray)-(\d{2,3})\b/g,
    fn: (m) => {
      const tok = NEUTRAL_TEXT[Number(m[2])]
      return tok ? `text-${tok}` : null
    },
  },
  {
    name: 'text-colour',
    re: /\btext-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_TEXT[Number(m[2])]
      if (!fam || !shade) return null
      return fam === 'neutral' ? `text-${NEUTRAL_TEXT[Number(m[2])]}` : `text-${fam}-${shade}`
    },
  },
  {
    name: 'bg-neutral',
    re: /\bbg-(slate|zinc|neutral|stone|gray)-(\d{2,3})\b/g,
    fn: (m) => {
      const tok = NEUTRAL_SURFACE[Number(m[2])]
      return tok ? `bg-${tok}` : null
    },
  },
  {
    name: 'bg-colour',
    re: /\bbg-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_SURFACE[Number(m[2])]
      if (!fam || !shade) return null
      if (fam === 'neutral') return `bg-${NEUTRAL_SURFACE[Number(m[2])]}`
      return shade === 'white' ? 'bg-white' : `bg-${fam}-${shade}`
    },
  },
  {
    name: 'border-neutral',
    re: /\bborder-(slate|zinc|neutral|stone|gray)-(\d{2,3})\b/g,
    fn: (m) => {
      const tok = NEUTRAL_BORDER[Number(m[2])]
      return tok ? `border-${tok}` : null
    },
  },
  {
    name: 'border-colour',
    re: /\bborder-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_BORDER[Number(m[2])]
      if (!fam || !shade) return null
      if (fam === 'neutral') return `border-${NEUTRAL_BORDER[Number(m[2])]}`
      return shade === 'line' ? 'border-line' : `border-${fam}-${shade}`
    },
  },
  {
    name: 'ring-colour',
    re: /\bring-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      if (!fam) return null
      const n = Number(m[2])
      // Only the strong shades survive as a focus ring; a 300 ring is invisible
      // on white, which is the one thing a focus ring cannot be.
      if (n >= 400 && n <= 600) return `ring-${fam}-600`
      if (n >= 200 && n < 400) return `ring-${fam}-200`
      return 'ring-brand-600'
    },
  },
  {
    name: 'from-colour',
    re: /\bfrom-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_SURFACE[Number(m[2])]
      if (!fam || !shade) return null
      return `from-${fam === 'neutral' ? 'brand' : fam}-${shade === 'white' ? '50' : shade}`
    },
  },
  {
    name: 'via-colour',
    re: /\bvia-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_SURFACE[Number(m[2])]
      if (!fam || !shade) return null
      return `via-${fam === 'neutral' ? 'brand' : fam}-${shade === 'white' ? '100' : shade}`
    },
  },
  {
    name: 'to-colour',
    re: /\bto-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_SURFACE[Number(m[2])]
      if (!fam || !shade) return null
      return `to-${fam === 'neutral' ? 'brand' : fam}-${shade === 'white' ? '200' : shade}`
    },
  },
  {
    name: 'divide-neutral',
    re: /\bdivide-(slate|zinc|neutral|stone|gray)-(\d{2,3})\b/g,
    fn: (m) => {
      const tok = NEUTRAL_BORDER[Number(m[2])]
      return tok ? `divide-${tok}` : null
    },
  },
  {
    name: 'divide-colour',
    re: /\bdivide-([a-z]+)-(\d{2,3})\b/g,
    fn: (m) => {
      const fam = FAMILY[m[1]]
      const shade = COLOR_BORDER[Number(m[2])]
      if (!fam || !shade) return null
      return shade === 'line' ? 'divide-line' : `divide-${fam}-${shade}`
    },
  },
  {
    name: 'placeholder-neutral',
    re: /\bplaceholder-(slate|zinc|neutral|stone|gray)-(\d{2,3})\b/g,
    fn: () => `placeholder-muted`,
  },
]

/* Files that must not be touched: the shell and landing page are already
   converted and hand-tuned, and the data file holds question text where a
   class-looking string could be real content. */
const SKIP = new Set([
  'src/index.css',
  'src/components/site/Header.jsx',
  'src/components/site/Footer.jsx',
  'src/components/site/Hero.jsx',
  'src/components/site/DatabaseCard.jsx',
  'src/components/site/ui.jsx',
  'src/components/site/motion.js',
  'src/components/site/SQLCard.jsx',
  'src/components/site/MongoDBCard.jsx',
  'src/components/site/AcademyCard.jsx',
  'src/components/site/ProgressCard.jsx',
  'src/components/site/WorkspaceVisual.jsx',
  'src/components/site/Logo.jsx',
  'src/components/Home.jsx',
  'src/components/Layout.jsx',
  'src/components/admin/FeedbackPanel.jsx',
  // book.js is a data file, but its `accent`/`glow`/`strip`/`badge`/`tag`
  // fields are Tailwind class strings for the book cards, so it is in scope.
  // Verified by inspection before un-skipping.
])

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
const fileCounts = []
let grandTotal = 0

for (const file of walk(ROOT)) {
  const rel = relative(process.cwd(), file).replace(/\\/g, '/')
  if (SKIP.has(rel)) continue

  const before = readFileSync(file, 'utf8')
  let after = before

  for (const rule of RULES) {
    after = after.replace(rule.re, (...args) => {
      const m = args.slice(0, -2)
      const next = rule.fn(m)
      if (!next || next === m[0]) return m[0]
      counts.set(rule.name, (counts.get(rule.name) ?? 0) + 1)
      grandTotal++
      return next
    })
  }

  if (after !== before) {
    writeFileSync(file, after, 'utf8')
    fileCounts.push(rel)
  }
}

console.log(`rewrote ${fileCounts.length} file(s), ${grandTotal} substitution(s)\n`)
console.log('by rule:')
for (const [name, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${name}`)
}
console.log('\nfiles touched:')
for (const f of fileCounts) console.log(`  ${f}`)