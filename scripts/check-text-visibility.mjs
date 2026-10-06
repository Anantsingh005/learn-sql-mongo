/**
 * Static text-visibility gate.
 *
 * `browser-contrast.mjs` measures what actually paints, which is the only
 * honest answer — but it needs a running dev server, it samples rather than
 * enumerates, and it can only see states it knows to drive. This one reads the
 * source instead and fails on the three class combinations that have shipped
 * invisible text in this repo:
 *
 *   1. `text-white` on a light background in the same class string. This is
 *      the white-on-white family: leftover from the dark theme, invisible by
 *      construction, and the single largest defect class found in the light
 *      conversion (~24 sites across 17 files).
 *   2. `text-white` with no background class at all — the form that made the
 *      Practice results card and the admin panels unreadable. The background
 *      comes from a parent, which a class-level read cannot see, so this is a
 *      failure to prove rather than a proven failure: review the list, and
 *      silence a genuine false positive with `contrast-allow` on that line.
 *   3. `text-transparent` with a `background-clip: text` gradient whose
 *      palest stop cannot be read against white. Six H1s shipped this way
 *      (`from-brand-50 via-brand-50 to-plum-50`): the class compiles, the
 *      element has text content, every DOM-level check passes, and the page
 *      shows nothing.
 *
 * Whether a background is "light" is not a name heuristic — the token values
 * are read out of src/index.css and the real WCAG ratio against white is
 * computed, so retuning a shade re-tunes the gate with it. Unknown tokens fall
 * back to a shade heuristic.
 *
 * Exit 1 on any failure. Needs no server and no browser, so it is cheap
 * enough to run before every commit.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

/* ------------------------------------------------------------------ *
 * Palette: --color-* tokens from the stylesheet, so "is this light" is
 * measured rather than guessed.
 * ------------------------------------------------------------------ */
function loadTokens() {
  const css = readFileSync(join(SRC, 'index.css'), 'utf8')
  const out = new Map()
  for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*#([0-9a-fA-F]{3,8})\b/g)) {
    out.set(m[1], m[2])
  }
  return out
}

const TOKENS = loadTokens()
TOKENS.set('white', 'ffffff')

const hexRgb = (hex) => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const lum = ({ r, g, b }) => {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const ratio = (a, b) => {
  const [x, y] = [lum(a) + 0.05, lum(b) + 0.05].sort((p, q) => q - p)
  return x / y
}

const WHITE = { r: 255, g: 255, b: 255 }
const over = (fg, bg, a) => ({
  r: fg.r * a + bg.r * (1 - a),
  g: fg.g * a + bg.g * (1 - a),
  b: fg.b * a + bg.b * (1 - a),
})

/** Resolve `bg-<token>` / `from-<token>` to a colour over white, or null when
    the name is not in this project's palette. */
function resolveColor(name) {
  const [key, alphaStr] = name.split('/')
  const alpha = alphaStr === undefined ? 1 : Number(alphaStr)
  if (key === 'transparent') return { color: null, alpha: 0 }
  const hex = TOKENS.get(key)
  if (!hex) return null
  const rgb = hexRgb(hex)
  const color = alpha >= 1 ? rgb : over(rgb, WHITE, alpha)
  return { color, alpha }
}

/** Does white text survive on this background? (AA for normal text.) */
function whiteTextPasses(bg) {
  return ratio(WHITE, bg) >= 4.5
}

const PALE_SHADE = /-(50|100|200)$/
const LIGHT_NAMES = new Set(['white', 'line', 'line-soft', 'mist', 'shell', 'paper'])

/** Tokens treated as light without a palette entry (unknown families). */
function looksPale(key) {
  if (LIGHT_NAMES.has(key)) return true
  if (PALE_SHADE.test(key)) return true
  return false
}

/* ------------------------------------------------------------------ *
 * Scan
 * ------------------------------------------------------------------ */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.jsx?$/.test(entry)) out.push(p)
  }
  return out
}

/** Every quoted segment in the file, template literals included, so a
    multi-line className template is still read as one class string. */
function stringSegments(text) {
  const segs = []
  const re = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g
  let m
  while ((m = re.exec(text))) segs.push({ value: m[2], index: m.index })
  return segs
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length

const tokensOf = (s) => s.split(/\s+/).filter(Boolean)

/** Split `hover:bg-brand-700` into variants + utility. */
function classify(token) {
  const parts = token.split(':')
  const utility = parts[parts.length - 1]
  const variants = parts.slice(0, -1)
  return { variants, utility }
}

const failures = []
const warnings = []

function fail(file, line, rule, message, snippet) {
  failures.push({ file, line, rule, message, snippet })
}
function warn(file, line, rule, message, snippet) {
  warnings.push({ file, line, rule, message, snippet })
}

for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8')
  const rel = relative(ROOT, file).replaceAll('\\', '/')
  const lines = text.split('\n')

  for (const seg of stringSegments(text)) {
    const line = lineOf(text, seg.index)
    const src = lines[line - 1] ?? ''
    if (/contrast-allow/.test(src)) continue

    const toks = tokensOf(seg.value)
    if (!toks.length) continue

    const whiteText = toks.some((t) => t === 'text-white' || t === 'text-white/70')
    const clipped = toks.some((t) => t === 'bg-clip-text' || t === 'text-transparent')
    const bgToks = toks.filter((t) => classify(t).utility.startsWith('bg-'))

    // Rule 1: white text over a background that cannot carry it — including
    // hover: and focus: variants, which are exactly the states the browser
    // audit used to be blind to.
    if (whiteText) {
      const offenders = []
      for (const t of bgToks) {
        const { utility } = classify(t)
        const raw = utility.slice(3)
        if (raw.startsWith('[')) {
          const hex = raw.replace(/^[[#]+/, '').replace(/\]+$/, '').split('/')[0]
          if (/^[0-9a-fA-F]{6}$/.test(hex) && !whiteTextPasses(hexRgb(hex))) offenders.push(t)
          continue
        }
        const res = resolveColor(raw)
        if (res && res.alpha > 0) {
          if (!whiteTextPasses(res.color)) offenders.push(t)
        } else if (res === null && looksPale(raw)) {
          offenders.push(t)
        }
      }
      if (offenders.length) {
        fail(rel, line, 'white-on-light',
          `text-white cannot be read on ${offenders.join(', ')}`, src.trim())
      } else if (!bgToks.length) {
        // Rule 2: no background proven here. Almost always a bug — the dark
        // shell these were written against no longer exists — but a parent
        // could still be dark, so review rather than assume.
        warn(rel, line, 'white-unproven',
          'text-white with no background class in this string (parent must be dark, or it is invisible)',
          src.trim())
      }
    }

    // Rule 3: gradient-clipped text whose palest stop disappears into white.
    if (clipped && toks.includes('bg-clip-text')) {
      const stops = toks.filter((t) => /^(from|via|to)-/.test(t))
      const pale = []
      for (const t of stops) {
        const key = t.replace(/^(from|via|to)-/, '')
        const res = resolveColor(key)
        if (res && res.color && !whiteTextPasses(res.color)) pale.push(t)
        else if (res === null && looksPale(key)) pale.push(t)
      }
      if (pale.length) {
        fail(rel, line, 'pale-gradient',
          `background-clip:text gradient stops too light on white: ${pale.join(', ')}`,
          src.trim())
      }
    }

    // Rule 4: transparent text with nothing to paint it. `browser-visual.mjs`
    // checks the rendered DOM for this; this catches it in source too.
    if (toks.includes('text-transparent') && !toks.includes('bg-clip-text')) {
      warn(rel, line, 'transparent-unproven',
        'text-transparent with no background-clip:text in this string (needs a painter, or it renders nothing)',
        src.trim())
    }
  }
}

const clip = (s, n = 150) => (s.length > n ? s.slice(0, n) + '…' : s)

if (failures.length) {
  console.log(`${failures.length} text-visibility failure(s):\n`)
  for (const f of failures) {
    console.log(`  FAIL ${f.file}:${f.line}  [${f.rule}] ${f.message}`)
    console.log(`       ${clip(f.snippet)}`)
  }
}

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s) to review (not counted as failures):\n`)
  for (const w of warnings) {
    console.log(`  WARN ${w.file}:${w.line}  [${w.rule}] ${w.message}`)
    console.log(`       ${clip(w.snippet)}`)
  }
}

if (!failures.length && !warnings.length) {
  console.log('PASS — no white-on-light, pale-gradient or unpainted-text classes in src/')
} else if (!failures.length) {
  console.log('\nPASS — no static text-visibility failures (warnings above are review items)')
}

process.exit(failures.length ? 1 : 0)
