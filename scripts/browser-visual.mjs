/**
 * Visual-risk audit.
 *
 * A note on why this exists: the screenshot harness (`browser-shots.mjs`)
 * captures every route, but reviewing a PNG needs eyes, and assertions on
 * contrast ratios and element heights are not the same thing as looking at the
 * page. Phase 5 replaced ~1500 Tailwind classes with codemods, and codemods
 * fail in ways that satisfy every existing check:
 *
 *   - a typo'd utility (`bg-ink/12`) generates no CSS at all, so the element
 *     silently loses its background and nothing reports an error;
 *   - a decorative gradient whose three stops were all rewritten to the same
 *     token is "valid CSS, correct contrast" and completely invisible;
 *   - a card whose background now equals the page behind it has no separation,
 *     which is a design failure no assertion can express.
 *
 * So this checks the five things a class-level rewrite can break and a
 * ratio-level test cannot see. It reports risk, it does not assert, and every
 * finding names the file and line so it can be judged rather than obeyed.
 *
 * Check 5 (transparent text with an atomic inline between it and its
 * background-clip: text painter) was added after the hero's second headline line
 * shipped invisible while passing all four of the other checks. Keep it.
 */
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9230
const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5173'

const ROUTES = ['/', '/quiz/sql', '/academy', '/academy/sql', '/practice', '/leaderboard', '/auth', '/profile', '/admin', '/quiz/mongo']

/* ------------------------------------------------------------------ *
 * Check 1 (static, no browser): classes used in JSX that generate no CSS.
 * ------------------------------------------------------------------ */
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(jsx|js)$/.test(e)) out.push(full)
  }
  return out
}

// Utilities whose effect is invisible even when the class exists: they set no
// colour of their own. Excluded so the check does not cry wolf.
const NON_VISUAL = /^(group|peer|flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|container|antialiased|truncate|sr-only|uppercase|lowercase|capitalize|truncate|shadow-sm|shadow|overflow-|cursor-|select-|pointer-events|transition|duration|ease|delay|animate-|space-|gap-|p-|px-|py-|pt-|pb-|pl-|pr-|m-|mx-|my-|mt-|mb-|ml-|mr-|w-|h-|min-|max-|rounded|border$|font-|leading-|tracking|whitespace|break-|truncate|list-|object-|aspect|divide-|ring$|outline$|placeholder$|sr$|col-|row-|order-|z-|top-|bottom-|left-|right-|inset|transform|origin|scale|rotate|translate|blur|backdrop|opacity-100|italic|not-italic|underline|line-through|no-underline|resize|appearance|caret|accent|fill-|stroke-)/

// A class name: starts with a letter, then letters/digits plus the punctuation
// Tailwind uses for variants, opacity modifiers and arbitrary values. Requiring
// a leading letter is what rejects a stray `:` or `?` left over from a ternary.
const CLASS_SHAPED = /^[A-Za-z][A-Za-z0-9_:@!./()[\],%#*&+-]*$/

function collectUsedClasses() {
  const used = new Map() // class -> [{file, line}]
  for (const file of walk('src')) {
    const rel = file.replace(/\\/g, '/')
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = line.match(/class(?:Name)?\s*=\s*(.*)$/)
      if (!m) return
      // Narrow to the className's own value before looking for literals.
      // `className={menuItem} role="menuitem"` is one line, and reading every
      // quoted string on it harvested `menuitem` out of the sibling attribute.
      // If the value is a brace expression, only its contents are candidates;
      // a bare identifier then yields nothing and is correctly skipped.
      let expr = m[1]
      if (/^\s*\{/.test(expr)) {
        let depth = 0
        let end = -1
        for (let i = 0; i < expr.length; i++) {
          if (expr[i] === '{') depth++
          else if (expr[i] === '}') {
            depth--
            if (depth === 0) { end = i; break }
          }
        }
        if (end === -1) return // multiline expression; not resolvable line-wise
        expr = expr.slice(0, end + 1)
      }
      // A className holding a bare identifier (`className={codeClass}`) or a
      // call resolves at runtime, so it is not knowable here — skip it. Only
      // quoted literals are. Only the *first* literal counts: a ternary
      // (`done ? 'a' : 'b'`) therefore contributes just its first branch, which
      // can only cause a class to go unchecked — the safe direction for a gate.
      const literals = [...expr.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)]
      if (!literals.length) return
      const lit = literals[0]
      for (const tok of (lit[1] ?? lit[2] ?? lit[3] ?? '').split(/\s+/)) {
        const cls = tok.trim()
        if (!cls || NON_VISUAL.test(cls)) continue
        // Interpolations and conditional fragments are resolved at runtime.
        if (cls.includes('$') || cls.includes('{') || cls.includes('}')) continue
        // Must look like a class name. Anything starting with punctuation is
        // punctuation that leaked in from a ternary or a regex.
        if (!CLASS_SHAPED.test(cls)) continue
        if (!used.has(cls)) used.set(cls, [])
        used.get(cls).push(`${rel}:${i + 1}`)
      }
    })
  }
  return used
}

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${PORT}`, '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-visual', BASE], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function targets() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`)
      if (r.ok) return r.json()
    } catch {}
    await sleep(200)
  }
  throw new Error('no debugger')
}
function conn(u) {
  return new Promise((res, rej) => {
    const w = new WebSocket(u)
    w.onopen = () => res(w)
    w.onerror = () => rej(new Error('ws'))
  })
}
let id = 0
function send(ws, method, params = {}) {
  const mid = ++id
  return new Promise((res, rej) => {
    const on = (e) => {
      const d = JSON.parse(e.data)
      if (d.id === mid) {
        ws.removeEventListener('message', on)
        if (d.error) rej(new Error(d.error.message))
          else res(d.result)
      }
    }
    ws.addEventListener('message', on)
    ws.send(JSON.stringify({ id: mid, method, params }))
    setTimeout(() => rej(new Error('timeout')), 30000)
  })
}

// Everything the page can actually paint, asked of the page itself.
const PROBE = `(() => {
  const flat = (c) => {
    const m = String(c).match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(s => parseFloat(s))
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  };
  const key = (c) => c ? [c.r, c.g, c.b, c.a].map(v => Math.round(v)).join(',') : 'none';

  // Resolved backdrop: nearest painted ancestor background, composited.
  const backdrop = (el) => {
    let n = el.parentElement, acc = null;
    while (n) {
      const c = flat(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? { r: acc.r*c.a + c.r*(1-acc.a), g: acc.g*c.a + c.g*(1-acc.a), b: acc.b*c.a + c.b*(1-acc.a), a: 1 } : c;
        if (acc.a >= 1) return acc;
      }
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const flatStops = (img) => {
    if (!img || img === 'none') return null;
    const cols = [...img.matchAll(/rgba?[(]([^)]+)[)]/g)]
      .map(m => { const p = m[1].split(',').map(s => parseFloat(s)); return { r:p[0], g:p[1], b:p[2], a: p.length>3?p[3]:1 }; })
      .filter(c => !Number.isNaN(c.r));
    return cols.length ? cols : null;
  };

  const out = { flatGradient: [], noSeparation: [], invisible: [], tiny: [], unpaintedText: [] };

  // An "atomic inline" forms its own paint box, which is the whole of check 5.
  const ATOMIC = ['inline-block', 'inline-flex', 'inline-grid', 'inline-table'];
  const clipOf = (s) => s.webkitBackgroundClip || s.backgroundClip;
  const isTransparent = (s) => { const c = flat(s.color); return !!c && c.a === 0; };
  // One finding per clipping ancestor, so a 15-glyph headline reports once.
  const seenClippers = [];

  for (const el of document.querySelectorAll('body *')) {
    // SVG and MathML internals paint with fill/stroke, which none of the checks
    // below read. Every <path>/<ellipse>/<rect> would otherwise report as an
    // unpainted box, which is how the first run filled the log with noise.
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    const cls = (el.getAttribute('class') || '').slice(0, 110);
    const label = (el.textContent || '').trim().slice(0, 28);
    const bg = flat(cs.backgroundColor);
    // Declared once per element: both the separation check and the invisibility
    // check need these, and a block-scoped const in one of them would not be
    // visible to the other.
    const bdr = bdrOf(cs);
    const sh = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : null;

    // 1. Flattened decoration: a gradient whose every stop is the same colour.
    const stops = flatStops(cs.backgroundImage);
    if (stops && stops.length > 1) {
      const uniq = new Set(stops.map(key));
      if (uniq.size === 1) out.flatGradient.push({ label, cls, stops: stops.length });
    }

    // 2. No separation: a card-sized block whose own background is identical to
    //    the page behind it, with no border and no shadow to define an edge.
    const w = r.width, h = r.height;
    const hasElemChild = el.children.length > 0;
    // A "card" worth complaining about: has an edge of its own (a radius), holds
    // content, and is not a full-bleed layout wrapper. Full-bleed wrappers are
    // legitimately the same colour as the page.
    const cardish = hasElemChild && w > 140 && h > 70 && w < innerWidth * 0.98
      && parseFloat(cs.borderTopLeftRadius) > 0;
    if (cardish && bg && bg.a >= 1) {
      const bd = backdrop(el);
      if (key(bg) === key(bd) && bdr === 0 && !sh) {
        out.noSeparation.push({ label, cls, color: cs.backgroundColor });
      }
    }

    // 3. A leaf element with nothing to paint and nothing in it: no background, no
    //    gradient, no border, no shadow, no text node at all. Structural
    //    wrappers are excluded, or every layout div in the app reports here.
    //    "No text node" means literally none, not "no non-whitespace": the
    //    hero's typewriter wraps every character in its own span, so the spaces
    //    between words are empty-text spans that reserve real width via
    //    whitespace-pre. Trimming first reported all of them as broken.
    const hasTextNode = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.length > 0);
    const leaf = !hasElemChild && !hasTextNode;
    if (leaf && (!bg || bg.a === 0) && !stops && bdr === 0 && !sh && w > 2 && h > 2) {
      out.invisible.push({ label, cls, w: Math.round(w), h: Math.round(h) });
    }

    // 4. Sub-pixel decoration: too small to read as anything.
    if (w > 0 && w < 3 && h > 8) out.tiny.push({ label, cls, w: Math.round(w), h: Math.round(h) });

    // 5. Transparent text that nothing is painting. background-clip:text is
    //    the only way a gradient can paint glyphs, and it clips to the text run
    //    of the element it is applied to -- ordinary inline descendants
    //    included, atomic inlines NOT. An inline-block between the two forms
    //    its own paint box, so the glyphs inside it are no longer part of the
    //    clipper's text run, never receive the clipped background, and simply
    //    inherit the wrapper's transparent color. The element then renders
    //    blank while remaining fully present in the DOM.
    //
    //    This is not hypothetical. It is exactly how the hero's second headline
    //    line shipped invisible: the per-character spans were inline-block so
    //    the reveal could use a transform, inside a wrapper whose gradient
    //    painted the text. Four gates passed it -- contrast skips
    //    background-clip:text on purpose, the hero sweep explicitly disclaims
    //    readability, the design sweep checks text CONTENT, and check 3 above
    //    only fires on leaves with no content at all.
    //
    //    Deduplicated by the clipping ancestor, not by the transparent run. An
    //    earlier version skipped any element whose parent was also transparent,
    //    on the theory that the outermost one would be reported instead -- but
    //    the outermost one is precisely the element that legitimately carries
    //    background-clip:text and so is skipped above. That version silently
    //    reported nothing for the exact bug it was written for.
    if (isTransparent(cs) && clipOf(cs) !== 'text' && (el.textContent || '').trim()) {
      let n = el, blocked = null, clipper = null;
      while (n && n !== document.body) {
        const s = getComputedStyle(n);
        // The clipper is never itself a blocker, so test this FIRST. Order
        // matters: .grad-text also matches .enter-word, which sets
        // display:inline-block, so testing atomic before clip made the
        // painter register as its own blocker and the rule fired on correct
        // code. A background-clip:text element paints its own text run
        // whatever its own display is -- what breaks is an atomic inline
        // strictly BETWEEN the glyphs and the clipper.
        if (clipOf(s) === 'text') { clipper = n; break; }
        if (!blocked && ATOMIC.includes(s.display)) blocked = n;
        n = n.parentElement;
      }
      if (blocked && clipper && seenClippers.indexOf(clipper) === -1) {
        seenClippers.push(clipper);
        out.unpaintedText.push({
          label,
          cls: (el.getAttribute('class') || '').slice(0, 90),
          blockedBy: (blocked.getAttribute('class') || blocked.tagName).slice(0, 50),
          display: getComputedStyle(blocked).display,
          painter: (clipper.getAttribute('class') || clipper.tagName).slice(0, 50),
        });
      }
    }
  }

  function bdrOf(cs) {
    return parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
  }

  const cap = (a) => a.slice(0, 6);
  return { ...out, flatGradient: cap(out.flatGradient), noSeparation: cap(out.noSeparation), invisible: cap(out.invisible), tiny: cap(out.tiny), unpaintedText: cap(out.unpaintedText),
           counts: { flatGradient: out.flatGradient.length, noSeparation: out.noSeparation.length, invisible: out.invisible.length, tiny: out.tiny.length, unpaintedText: out.unpaintedText.length } };
})()`

const ws = await conn((await targets()).find((p) => p.type === 'page').webSocketDebuggerUrl)
await send(ws, 'Page.enable')
await send(ws, 'Runtime.enable')

const report = {}
for (const route of ROUTES) {
  await send(ws, 'Page.navigate', { url: `${BASE}${route}` })
  await sleep(1100)
  const r = await send(ws, 'Runtime.evaluate', { expression: PROBE, returnByValue: true })
  if (r.exceptionDetails || !r.result || r.result.value === undefined) {
    console.log(`PROBE ERROR on ${route}`)
    console.log(JSON.stringify(r.exceptionDetails ?? r, null, 2).slice(0, 2000))
    process.exit(1)
  }
  report[route] = r.result.value
}
ws.close()
chrome.kill()

console.log('\n================ visual-risk audit ================\n')
let total = 0
for (const [route, r] of Object.entries(report)) {
  const c = r.counts
  const n = c.flatGradient + c.noSeparation + c.invisible + c.unpaintedText
  total += n
  if (!n) continue
  console.log(`${route}  (flattened ${c.flatGradient}, no-separation ${c.noSeparation}, invisible ${c.invisible}, unpainted-text ${c.unpaintedText})`)
  for (const k of ['flatGradient', 'noSeparation', 'invisible', 'unpaintedText']) {
    for (const f of r[k]) {
      console.log(`   [${k}] "${f.label}"`)
      console.log(`        ${f.cls}`)
      // Name the blocker, because "invisible text" on its own does not say
      // which declaration to go and look at.
      if (f.display) console.log(`        display:${f.display} on "${f.blockedBy}" blocks the paint from "${f.painter}"`)
    }
  }
  console.log('')
}
console.log(`total findings: ${total}\n`)

// Static check: classes with no generated CSS.
const used = collectUsedClasses()
const cssFile = readdirSync('dist/assets').find((f) => f.endsWith('.css'))
if (!cssFile) throw new Error('no built CSS in dist/assets — run `npm run build` first')
const css = readFileSync('dist/assets/' + cssFile, 'utf8')

// Tailwind backslash-escapes everything in a selector that is not a letter,
// digit, dash or underscore, so `hover:bg-brand-100` is emitted as
// `.hover\:bg-brand-100:hover`. This has to be a plain substring search, not a
// RegExp: in a regex `\:` collapses to `:`, so the escape we just added is
// silently discarded by the pattern compiler and every variant class looks
// dead. That bug cost two runs and 242 phantoms.
function cssSelector(cls) {
  return '.' + cls.replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch)
}

const dead = []
for (const [cls, where] of used) {
  const needle = cssSelector(cls)
  const at = css.indexOf(needle)
  // Reject a prefix hit: `.text-sm` must not satisfy a search for `.text-sm`.
  const next = at === -1 ? '' : css[at + needle.length]
  if (at === -1 || /[-_a-zA-Z0-9]/.test(next)) dead.push({ cls, where: where.slice(0, 3) })
}
console.log('================ classes with no generated CSS ================\n')
if (!dead.length) console.log('none\n')
else {
  // Grouped by variant prefix only (`hover:`, `sm:`) — the part worth scanning
  // at a glance. Grouping on a dash-truncated fragment produced keys like
  // `focus-visible:ring` for `focus-visible:ring-2`, which reads like a class
  // name that does not exist and makes the report impossible to trust.
  const byVariant = new Map()
  for (const d of dead) {
    const k = d.cls.includes(':') ? d.cls.slice(0, d.cls.indexOf(':') + 1) : '(no variant)'
    if (!byVariant.has(k)) byVariant.set(k, [])
    byVariant.get(k).push(d)
  }
  for (const [k, list] of [...byVariant.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(list.length).padStart(3)}  ${k}`)
    for (const d of list.slice(0, 8)) console.log(`        ${d.cls.padEnd(34)} ${d.where.join(' ')}`)
    if (list.length > 8) console.log(`        ... and ${list.length - 8} more`)
  }
  console.log(`\ntotal dead classes: ${dead.length}`)
}

// Chrome is killed above, but its process group can outlive the handle and keep
// stdout open, so the parent hangs after the report is already printed. Every
// failure path exits non-zero on its own; reaching here means the audit ran.
process.exit(dead.length ? 1 : 0)