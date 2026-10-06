/**
 * Text-contrast audit.
 *
 * The design sweep only looks at background colours, which is how 47 files full
 * of `text-slate-400` on a white body can pass it cleanly. Those pages are not
 * dark-themed so much as *unreadable*: light-grey body copy on white. This walks
 * every visible text node instead, resolves the nearest painted ancestor
 * background, and computes the real WCAG ratio — so "converted to light theme"
 * is a measurable claim rather than an impression.
 *
 * Thresholds are WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text
 * (>=24px, or >=18.66px when bold). Elements below 1px are treated as
 * non-text and skipped; so are disabled controls, which are exempt by spec.
 *
 * Three blind spots from the first version, each of which let a real defect
 * through, are closed here:
 *
 *   1. Chapter pages were not in ROUTES, so ChapterOutline, SectionQuiz and
 *      SyntaxMap — where the dark-chip and accent-button failures lived — were
 *      never measured at all.
 *   2. `background-clip: text` was skipped wholesale. Correct for a gradient
 *      that is painted dark, catastrophic for the six headlines whose stops had
 *      been rewritten to `brand-50`: they were invisible and reported nothing.
 *      The stops are now measured against the backdrop behind the element.
 *   3. Nothing hovered. `bg-brand-600 text-white hover:bg-brand-100` is a 6.7:1
 *      button at rest and a 1.3:1 button under the cursor, so ~28 of those
 *      shipped invisible-on-hover while every run read PASS. Interactive
 *      elements that carry a `hover:bg-*` rule are now pointed at with a real
 *      CDP mouse move and re-probed. Only done at desktop width — a touch
 *      viewport has no hover state to be wrong about.
 *
 * Opacity is no longer a reason to skip a node. An ancestor at opacity < 1
 * that is *mid-animation* is still skipped (that measures a frame, not a
 * design), but a deliberately dimmed element is composited toward the page and
 * measured, which is how the post-answer de-emphasis in SectionQuiz gets seen.
 * The composite assumes the shell behind the group is white — true for every
 * surface in this app.
 */
import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9228
const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5173'

/** Hover simulation is desktop-only; keep the per-route budget small so the
 *  whole sweep stays in the low minutes rather than tens of minutes. */
const MAX_HOVER = 10
const HOVER_SETTLE_MS = 240

const ROUTES = [
  '/',
  '/quiz/sql',
  '/academy',
  '/academy/sql',
  '/academy/sql/reading-data',
  '/academy/sql/joins',
  '/academy/sql/aggregation',
  '/academy/sql/ctes-windows',
  '/practice',
  '/leaderboard',
  '/auth',
  '/profile',
  '/profile/report/sql/easy',
  '/admin',
  '/quiz/mongo',
  '/privacy',
  '/terms',
]

const VIEWPORTS = [
  { w: 1600, h: 1000, label: 'desktop' },
  { w: 390, h: 844, label: 'mobile' },
]

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-contrast',
    BASE,
  ],
  { stdio: 'ignore' }
)

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

function conn(wsUrl) {
  return new Promise((res, rej) => {
    const w = new WebSocket(wsUrl)
    w.onopen = () => res(w)
    w.onerror = () => rej(new Error('ws'))
  })
}

let id = 0
function send(ws, method, params = {}) {
  const mid = ++id
  return new Promise((res) => {
    const on = (e) => {
      const d = JSON.parse(e.data)
      if (d.id === mid) {
        ws.removeEventListener('message', on)
        res(d)
      }
    }
    ws.addEventListener('message', on)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
}

async function ev(ws, expression) {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.text }
  return r.result?.result?.value
}

async function waitFor(ws, expr, label, ms = 20000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return true
    await sleep(250)
  }
  throw new Error(`timeout: ${label}`)
}

/* Marks the element under test with data-hp, so a hover probe can be scoped to
   exactly the node the mouse is on instead of re-walking the whole document. */
const HOVER_SCAN = `(() => {
  document.querySelectorAll('[data-hp]').forEach((e) => e.removeAttribute('data-hp'));
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('a,button,[role="button"],.group')) {
    if (out.length >= ${MAX_HOVER}) break;
    if (seen.has(el)) continue;
    const cn = typeof el.className === 'string' ? el.className : '';
    const selfHover = /(^|\\s)(hover:|focus:)/.test(cn) && /hover:bg-/.test(cn);
    const groupHover = el.classList.contains('group') && el.querySelector('[class*="group-hover:bg"]');
    if (!selfHover && !groupHover) continue;
    const r = el.getBoundingClientRect();
    // Fully on screen and clear of the 70px sticky header: the probe point has
    // to actually be the point the mouse can reach, or the hover never lands.
    if (r.width < 1 || r.height < 1) continue;
    if (r.top < 76 || r.bottom > window.innerHeight) continue;
    seen.add(el);
    out.push({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
  }
  window.__hp = [...seen];
  return out;
})()`

/* Runs in the page. `parse` accepts rgb()/rgba() and the oklab()/oklch() forms
   Chrome reports for any colour resolved from a modern CSS space — without it
   every token defined in oklch silently reads as black and every ratio is wrong.

   `scope` is a CSS selector; when given, only that element and its subtree are
   measured, which is what makes a hover probe cheap enough to run per element. */
const makeProbe = (scope) => `
(() => {
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };

  const parse = (str) => {
    if (!str) return null;
    let m = str.match(/rgba?\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
    }
    m = str.match(/oklab\\(([^)]+)\\)/);
    if (m) {
      const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
      const [L, a, b] = p;
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      const l = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
      // oklab -> LINEAR rgb; the browser then gamma-encodes before painting and
      // before any alpha composite, so decode to display sRGB or a translucent
      // layer ends up composited in linear space and reads much darker than the
      // page actually paints (a bg-line/70 chip reported 4.14 where the ink is
      // really 5.17 on it).
      const g = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * (v ** (1 / 2.4)) - 0.055;
      const enc = (v) => 255 * g(Math.max(0, Math.min(1, v)));
      return {
        r: enc(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss),
        g: enc(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss),
        b: enc(-0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * ss),
        a: p[3] === undefined ? 1 : p[3],
      };
    }
    return null;
  };

  // Relative luminance per WCAG 2.1.
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a) + 0.05, lum(b) + 0.05].sort((p, q) => q - p);
    return x / y;
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  // Group opacity composites the whole subtree onto what is behind it, so the
  // glyphs and their own backdrop both drift toward the page. Compositing both
  // against white is exact on this shell (white cards on a white/mist page) and
  // only approximate on a dark card — of which there are none behind a dimmed
  // group today.
  const dim = (c, op) => (op >= 1 ? c : {
    r: c.r * op + WHITE.r * (1 - op),
    g: c.g * op + WHITE.g * (1 - op),
    b: c.b * op + WHITE.b * (1 - op),
    a: 1,
  });
  const rgb = (c) => 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')';

// Resolve the painted backdrop as a *set* of colours, not one.
//
// Three cases force this. A gradient lives in background-image, so
// backgroundColor stays transparent and white-on-gradient text would otherwise
// resolve against the page white and report a bogus 1:1. A translucent layer
// has to be composited over whatever is beneath it before it means anything:
// an 8-digit hex like #1554c71a is a pale blue, not brand-600, and treating it
// as opaque turns a perfectly good chip into a false failure. And a stack has a
// top: once an opaque layer is hit, everything below it is invisible.
//
// So: walk leaf -> root collecting layers, then fold root -> leaf, compositing
// as we go and resetting the candidate set at each opaque layer. What survives
// is exactly the set of backdrops the glyphs can actually sit on, and the
// worst of them is the honest answer to "can this text be read here".
const collectBg = (el) => {
  const stack = [];
  let node = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const img = cs.backgroundImage;
    const bc = parse(cs.backgroundColor);

    if (img && img !== 'none' && /gradient/.test(img)) {
      const stops = [...img.matchAll(/rgba?[(][^)]+[)]/g)]
        .map((m) => parse(m[0]))
        .filter(Boolean);
      // The gradient paints above its own element's background-color.
      stack.push({ grad: stops, under: bc && bc.a > 0 ? bc : null });
    } else if (bc && bc.a > 0) {
      stack.push({ color: bc });
    }
    node = node.parentElement;
  }

  const htmlc = parse(getComputedStyle(document.documentElement).backgroundColor);
  let base = htmlc && htmlc.a > 0 ? htmlc : WHITE;
  if (base.a < 1) base = over(base, WHITE);

  const out = [];
  // An opaque layer hides everything beneath it, so it RESETS the candidate set
  // rather than joining it. Getting this wrong is how a white label on a solid
  // brand button gets compared against the white card behind the button and
  // reports a 1:1 that does not exist.
  const offer = (c) => {
    if (c.a >= 1) out.length = 0;
    out.push(c);
  };
  for (let i = stack.length - 1; i >= 0; i--) {
    const layer = stack[i];
    if (layer.grad) {
      let b = layer.under && layer.under.a > 0 ? over(layer.under, base) : base;
      for (const s of layer.grad) {
        const v = s.a < 1 ? over(s, b) : s;
        offer(v);
        if (v.a >= 1) b = v; // this stop hides everything beneath it
      }
      base = b;
    } else {
      base = layer.color.a >= 1 ? layer.color : over(layer.color, base);
      offer(base);
    }
  }

  if (!out.length) return [base];
  const seen = new Set();
  return out.filter((c) => {
    const k = [c.r, c.g, c.b].map((v) => Math.round(v * 4)).join(',');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

  const scope = ${scope ? JSON.stringify(scope) : 'null'};
  const scopeEl = scope ? document.querySelector(scope) : null;
  if (scope && !scopeEl) return [];
  const iter = scopeEl ? [scopeEl, ...scopeEl.querySelectorAll('*')] : [...document.querySelectorAll('body *')];

  const fails = [];
  const seen = new Set();
  for (const el of iter) {
    // Only elements with their own text.
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.bottom < 0 || r.top > window.innerHeight * 4) continue;

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;

    // Accumulate group opacity through the ancestors. An ancestor that is
    // *mid-flight* disqualifies the measurement — an entrance animation at 40%
    // is not a colour the design ever ships. A static dim, by contrast, is the
    // design, and is composited rather than skipped.
    let op = 1;
    let faded = false;
    let node = el;
    while (node && node !== document.body) {
      const o = Number(getComputedStyle(node).opacity);
      if (o < 1) {
        const running = typeof node.getAnimations === 'function' &&
          node.getAnimations().some((a) => a.playState === 'running');
        if (running) { faded = true; break; }
        op *= o;
      }
      node = node.parentElement;
    }
    if (faded || op === 0) continue;

    const fg = parse(cs.color);
    if (!fg) continue;

    const clip = cs.webkitBackgroundClip || cs.backgroundClip;
    if (clip === 'text') {
      // The gradient is the ink: the color property is transparent by design, so
      // comparing it to the page reports 1:1 for text that may be perfectly
      // legible — or, with stops rewritten to brand-50, completely invisible.
      // Measure the stops themselves against whatever sits behind the element.
      // An element with no parseable stops has nothing painted and nothing to
      // judge.
      const img = cs.backgroundImage;
      const stops = img && img !== 'none'
        ? [...img.matchAll(/rgba?\\([^)]+\\)/g)].map((m) => parse(m[0])).filter(Boolean)
        : [];
      if (!stops.length) continue;
      const behind = collectBg(el.parentElement || document.body);
      const worst = Math.min(...stops.flatMap((s) => behind.map((b) => {
        const ink = s.a < 1 ? over(s, b) : s;
        return ratio(dim(ink, op), dim(b, op));
      })));
      if (worst < need) {
        const key = 'gradient|' + cs.fontSize + '|' + el.className;
        if (seen.has(key)) continue;
        seen.add(key);
        fails.push({
          text: el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 46),
          cls: (typeof el.className === 'string' ? el.className : '').trim().split(/\\s+/).slice(0, 4).join(' '),
          color: 'gradient ' + stops.map(rgb).join(' '),
          size: Math.round(size),
          got: Math.round(worst * 100) / 100,
          need,
        });
      }
      continue;
    }

    const bgs = collectBg(el);
    const composited = bgs.map((bg) => (fg.a < 1 ? over(fg, bg) : fg));

    // Worst case across every backdrop the glyphs might sit on.
    const got = Math.min(...composited.map((c, i) => ratio(dim(c, op), dim(bgs[i], op))));

    if (got < need) {
      const key = cs.color + '|' + cs.fontSize + '|' + el.className;
      if (seen.has(key)) continue;
      seen.add(key);
      fails.push({
        text: el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 46),
        cls: (typeof el.className === 'string' ? el.className : '').trim().split(/\\s+/).slice(0, 4).join(' '),
        color: op < 1 ? rgb(dim(fg, op)) + ' @opacity ' + Math.round(op * 100) / 100 : cs.color,
        size: Math.round(size),
        got: Math.round(got * 100) / 100,
        need,
      });
    }
  }
  return fails;
})()
`

/** Collects hover-state failures for the element the mouse is currently on.
    A pointer at (x, y) over a card also hovers its ancestors, so `group-hover`
    rules fire from the same move without needing a separate pass. */
async function hoverProbe(ws, point) {
  await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y })
  await sleep(HOVER_SETTLE_MS)
  const fails = await ev(ws, makeProbe('[data-hp]'))
  return Array.isArray(fails) ? fails : []
}

try {
  try {
    const probe = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
  } catch (e) {
    console.log(`CONTRAST CHECK ERROR: dev server not reachable at ${BASE} (${e.message})`)
    chrome.kill()
    process.exit(1)
  }

  const pages = await targets()
  const ws = await conn(pages.find((p) => p.type === 'page').webSocketDebuggerUrl)
  await send(ws, 'Runtime.enable')

  let totalFails = 0
  const byRoute = new Map()

  const record = (route, fails) => {
    if (!fails.length) return
    totalFails += fails.length
    const list = byRoute.get(route) ?? []
    byRoute.set(route, [...list, ...fails])
  }

  for (const vp of VIEWPORTS) {
    await send(ws, 'Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 700,
    })

    for (const route of ROUTES) {
      await ev(ws, `location.href = '${BASE}${route}'`)
      await waitFor(ws, `document.readyState === 'complete' && document.querySelector('main')?.children.length > 0`, `${route} painted`)
      await sleep(750)

      const seen = new Set()
      const keyOf = (f) => [f.text, f.color, f.size, f.cls].join('|')
      // Base and hover passes accumulate into one list, deduped against each
      // other: the same element measured at rest and again under the pointer
      // must be reported once, at whichever ratio is worse.
      const list = []
      const collect = (fails) => {
        if (!Array.isArray(fails)) return false
        for (const f of fails) {
          const k = keyOf(f)
          if (seen.has(k)) continue
          seen.add(k)
          list.push(f)
        }
        return true
      }

      const base = await ev(ws, makeProbe(null))
      if (!Array.isArray(base)) {
        console.log(`  ??   ${route} @${vp.label} — probe returned nothing`)
        continue
      }
      collect(base)

      // Hover is a desktop-only affordance: on a touch viewport the state that
      // fails is unreachable, so probing it there would report defects nobody
      // can encounter.
      if (vp.w >= 700) {
        const points = await ev(ws, HOVER_SCAN)
        if (Array.isArray(points)) {
          for (const point of points.slice(0, MAX_HOVER)) {
            collect(await hoverProbe(ws, point))
          }
          await ev(ws, "document.querySelectorAll('[data-hp]').forEach((e) => e.removeAttribute('data-hp'))")
          // Park the pointer away from the content so no element keeps a
          // :hover state into the next route.
          await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 })
        }
      }

      if (list.length === 0) {
        console.log(`  PASS ${route} @${vp.label} — all text meets AA${vp.w >= 700 ? ' (rest + hover)' : ''}`)
        continue
      }

      record(route, list)
      console.log(`  FAIL ${route} @${vp.label} — ${list.length} contrast failure(s)`)
    }
  }

  console.log('\n================ detail ================')
  for (const [route, fails] of byRoute) {
    console.log(`\n${route}`)
    for (const f of fails.slice(0, 14)) {
      console.log(`  ${String(f.got).padStart(5)}:1 (need ${f.need})  ${f.color}  ${f.size}px  "${f.text}"`)
      console.log(`         ${f.cls}`)
    }
    if (fails.length > 14) console.log(`  ... and ${fails.length - 14} more`)
  }

  console.log(`\n================ ${totalFails} contrast failure(s) across ${byRoute.size} route(s) ================`)
  ws.close()
} catch (e) {
  console.log('CONTRAST CHECK ERROR:', e.message)
} finally {
  chrome.kill()
}
process.exit(0)
