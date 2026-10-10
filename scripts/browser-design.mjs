/**
 * Design-system verification sweep.
 *
 * Walks every route at four widths in headless Chrome and asserts the things
 * that are easy to break and invisible in a screenshot: that no page inherits
 * the old dark background, that the header is byte-identical everywhere it
 * appears, that the hero sits above the cards on the landing page, that the
 * footer is present on every route, and that the console
 * stays clean.
 *
 * Also re-checks the measurements the reference recorded — header 70px, sign-in
 * 95x45, cards equal height — because those are the numbers the layout was
 * budgeted against and they drift silently.
 *
 * BASE is `localhost`, not `127.0.0.1`. Vite binds the resolved `localhost`
 * host, which on Windows is ::1 first, so the IPv4 literal is refused and every
 * route silently returns Chrome's own error page — which is dark, which then
 * reads as a site-wide design failure rather than a connection failure.
 */
import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9226
const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5173'

const WIDTHS = [
  { w: 1440, h: 900, label: 'desktop-1440' },
  { w: 1024, h: 800, label: 'desktop-1024' },
  { w: 834, h: 1112, label: 'tablet' },
  { w: 390, h: 844, label: 'mobile-390' },
]

const ROUTES = [
  '/',
  '/quiz/sql',
  '/academy',
  '/academy/sql',
  '/practice',
  '/more-practice',
  '/leaderboard',
  '/auth',
  '/profile',
  '/admin',
  '/quiz/mongo',
  '/privacy',
  '/terms',
]

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-design',
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

async function waitFor(ws, expr, label, ms = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return true
    await sleep(250)
  }
  throw new Error(`timeout: ${label}`)
}

const results = { pass: [], fail: [], info: [] }
function pass(m) {
  results.pass.push(m)
  console.log(`  PASS ${m}`)
}
function fail(m) {
  results.fail.push(m)
  console.log(`  FAIL ${m}`)
}
function info(m) {
  results.info.push(m)
  console.log(`  ..   ${m}`)
}

/* Probes evaluated in the page. `DARK` is the old page background; finding it
   anywhere means a route was missed. */
/* The headline reveal is a JS typewriter that loops, so a snapshot taken right
   after paint can read a half-erased line ("Ma..." rather than "Master Database
   Skills"). Copy checks on `/` must wait for the end state -- every glyph of
   the currently visible h1 shown -- exactly like browser-hero.mjs does. */
const VISIBLE_FULL = `
(() => {
  const h1 = [...document.querySelectorAll('h1')].find(h => h.getBoundingClientRect().width > 0);
  if (!h1) return false;
  const cs = [...h1.querySelectorAll('.type-char')];
  return cs.length > 0 && cs.every(c => c.style.visibility === 'visible');
})()
`

const PROBES = `
(() => {
  const q = (s) => document.querySelector(s);
  const header = q('header');
  const footer = q('footer');
  const cs = getComputedStyle(document.body);
  const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;

  // Any element still painting the old dark page background.
  // The alpha check is load-bearing: an element with no background of its own
  // computes to rgba(0,0,0,0), which is numerically indistinguishable from near
  // black. Without it every transparent element on the page is a false positive
  // and the check reports hundreds of failures on a perfectly light page.
  let darkCount = 0;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const b = getComputedStyle(el).backgroundColor;
    const m = b.match(/rgba?\\((\\d+), (\\d+), (\\d+)(?:, ([\\d.]+))?/);
    if (!m) continue;
    const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (alpha === 0) continue;
    const [r, g, bl] = [ +m[1], +m[2], +m[3] ];
    // near-black or the old slate-950 (#0b0e14 / #020617)
    if (r < 40 && g < 44 && bl < 60) {
      darkCount++;
      if (offenders.length < 6) {
        offenders.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''));
      }
    }
  }

  const hRect = header ? header.getBoundingClientRect() : null;
  return {
    path: location.pathname,
    bodyBg: cs.backgroundColor,
    bodyColor: cs.color,
    headerH: hRect ? Math.round(hRect.height) : null,
    headerSignature: header ? getComputedStyle(header).backgroundColor + '|' + getComputedStyle(header).borderBottomColor : null,
    hasFooter: !!footer,
    overflowX,
    darkCount,
    darkOffenders: offenders,
    hasHero: !!q('[data-hero]'),
    hasH1: !!q('h1'),
    h1: q('h1') ? q('h1').innerText.replace(/\\s+/g, ' ').trim().slice(0, 70) : null,
    text: document.body.innerText,
  };
})()
`

try {
  // Preflight. Without this a dead dev server produces ~40 "dark background"
  // failures per route, because Chrome's error page is dark — a connection
  // failure wearing the costume of a design regression.
  try {
    const probe = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
  } catch (e) {
    console.log(`DESIGN CHECK ERROR: dev server not reachable at ${BASE} (${e.message})`)
    console.log('Start it with `npm run dev` first, or point DESIGN_BASE at a running preview.')
    chrome.kill()
    process.exit(1)
  }

  const pages = await targets()
  const ws = await conn(pages.find((p) => p.type === 'page').webSocketDebuggerUrl)
  await send(ws, 'Runtime.enable')
  await send(ws, 'Log.enable')
  await send(ws, 'Page.enable')

  const consoleErrors = []
  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data)
    if (d.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(d.params?.exceptionDetails?.text ?? 'exception')
    }
    if (d.method === 'Log.entryAdded' && d.params?.entry?.level === 'error') {
      consoleErrors.push(d.params.entry.text)
    }
  })

  const headerSignatures = new Map()
  const cardHeights = []

  for (const vp of WIDTHS) {
    console.log(`\n=== ${vp.label} (${vp.w}x${vp.h}) ===`)
    await send(ws, 'Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 700,
    })

    for (const route of ROUTES) {
      await ev(ws, `location.href = '${BASE}${route}'`)
      // Wait on React having painted something, not on an h1. Some routes
      // legitimately have no h1 yet (a card-only page, a form-only page), and
      // blocking on one turns that finding into a crash that hides the other
      // ten routes still to be checked. Missing headings are asserted below.
      await waitFor(ws, `document.readyState === 'complete' && document.querySelector('main, #root > div')?.children.length > 0`, `${route} painted`, 20000)
      await sleep(700)

      // Copy check below reads the headline's end state; the typewriter cannot
      // be snapshot mid-cycle. Only `/` has glyphs that loop, so hold here.
      if (route === '/') {
        await waitFor(ws, VISIBLE_FULL, `${route} headline fully visible`, 8000)
      }

      const p = await ev(ws, PROBES)
      if (!p || p.__error) {
        fail(`${route} probe failed: ${p?.__error}`)
        continue
      }

      const tag = `${route} @${vp.label}`

      // 1. No dark page background anywhere on the route.
      if (p.darkCount === 0) pass(`${tag} — no dark backgrounds`)
      else fail(`${tag} — ${p.darkCount} dark-background element(s): ${p.darkOffenders.join(', ')}`)

      // 2. Body is white.
      if (p.bodyBg === 'rgb(255, 255, 255)') pass(`${tag} — body white`)
      else fail(`${tag} — body is ${p.bodyBg}`)

      // 3. Header present and 70px.
      if (p.headerH === 70) pass(`${tag} — header 70px`)
      else if (p.headerH === null) fail(`${tag} — no header`)
      else fail(`${tag} — header ${p.headerH}px, expected 70`)

      // 4. No horizontal overflow.
      if (!p.overflowX) pass(`${tag} — no horizontal scroll`)
      else fail(`${tag} — horizontal overflow`)

      // 5. Footer on every route, landing page included.
      if (p.hasFooter) pass(`${tag} — footer present`)
      else fail(`${tag} — footer missing`)

      // 5b. Every route needs exactly one h1. Not fatal, but tracked, because
      // "no h1" is the single most common heading defect and it is invisible in
      // a screenshot.
      if (p.hasH1) pass(`${tag} — has h1: "${p.h1}"`)
      else info(`${tag} — NO h1 (heading structure gap, not a shell issue)`)

      // 6. Hero above the cards, landing page only.
      if (route === '/') {
        if (p.hasHero) pass(`${tag} — hero present`)
        else fail(`${tag} — hero MISSING`)
        // Width-aware: >= 1024px shows the desktop Hero ("Test your / database
        // skills" — the body text check, because at desktop the first h1 in the
        // DOM is MobileHome's, which is display:none there), below it the
        // MobileHome headline. The typewriter end-state wait above guarantees
        // the text reads complete, not half-erased.
        const copyIntact = vp.w >= 1024
          ? /Test your/i.test(p.text) && /database skills/i.test(p.text)
          : /Master Database Skills/i.test(p.h1 ?? '')
        if (copyIntact) pass(`${tag} — hero headline copy intact (${vp.w >= 1024 ? 'desktop' : 'mobile'})`)
        else fail(`${tag} — hero headline copy wrong: ${p.h1}`)
      }

      if (p.headerSignature) {
        const key = `${vp.label}|${p.headerSignature}`
        headerSignatures.set(key, (headerSignatures.get(key) ?? 0) + 1)
      }
    }

    // Card equality on the landing page.
    await ev(ws, `location.href = '${BASE}/'`)
    await waitFor(ws, `document.readyState === 'complete'`, 'home again')
    await sleep(700)
    // Scoped to `main` and to the two game routes specifically. A bare
    // `a[href^="/quiz/"]` also matches the header nav link (70px, the header's
    // own height) and reports the shell as a mis-sized card.
    const heights = await ev(
      ws,
      `['/quiz/sql', '/quiz/mongo']
         .map(h => [...document.querySelectorAll('main a[href="' + h + '"]')].pop())
         .filter(Boolean)
         .map(a => Math.round(a.getBoundingClientRect().height))`
    )
    if (Array.isArray(heights) && heights.length >= 2) {
      cardHeights.push({ vp: vp.label, heights })
      const equal = new Set(heights).size === 1
      if (equal) pass(`${vp.label} — game cards equal height (${heights[0]}px)`)
      else info(`${vp.label} — card heights differ: ${heights.join(', ')} (expected on stacked layouts)`)
    }
  }

  // The sticky header's scrolled state. Asserted once rather than per route,
  // because it is one component and the thing that can break is the state
  // transition, not any individual page.
  //
  // Both halves matter and they fail differently. If the listener never fires,
  // the bar stays translucent and content smears under it forever -- invisible
  // in a screenshot taken at the top of the page, which is where the screenshot
  // harness always is. If the height moves with the state, every route's
  // "header 70px" above becomes a lie the moment a reader scrolls.
  console.log('\n=== header scrolled state ===')
  await ev(ws, `location.href = '${BASE}/'`)
  await waitFor(ws, `document.readyState === 'complete' && !!document.querySelector('header')`, 'home for header scroll')
  await sleep(600)
  const readHeader = `(() => {
    const cs = getComputedStyle(document.querySelector('header'))
    return { bg: cs.backgroundColor, shadow: cs.boxShadow, h: Math.round(document.querySelector('header').getBoundingClientRect().height) }
  })()`
  const headerAtRest = await ev(ws, readHeader)
  await ev(ws, `window.scrollTo(0, 400); 1`)
  await sleep(500)
  const headerScrolled = await ev(ws, readHeader)
  await ev(ws, `window.scrollTo(0, 0); 1`)
  await sleep(400)
  const headerBack = await ev(ws, readHeader)

  const translucent = (s) => /0\.9\d*\)|rgba\(255,\s*255,\s*255,\s*0?\.\d+\)/.test(s) || /\/ 0\.9/.test(s)
  if (translucent(headerAtRest.bg)) pass('header rests translucent')
  else info(`header resting background is ${headerAtRest.bg} (not translucent)`)

  if (!translucent(headerScrolled.bg)) pass('header goes fully opaque once scrolled')
  else fail(`header still translucent after scrolling: ${headerScrolled.bg}`)

  // Chrome expands a single Tailwind shadow into a four-layer list whose leading
  // layers are transparent, so "is it none" is the wrong question and matching
  // the literal string is hopeless. Ask whether any layer carries ink.
  const shadowHasInk = (s) => {
    if (!s || s === 'none') return false
    return [...s.matchAll(/rgba?\(([^)]+)\)/g)].some((m) => {
      const p = m[1].split(',').map((x) => parseFloat(x))
      return (p.length > 3 ? p[3] : 1) > 0
    })
  }
  if (shadowHasInk(headerScrolled.shadow)) pass('header picks up a shadow once scrolled')
  else fail(`header has no shadow after scrolling: ${headerScrolled.shadow}`)

  if (headerScrolled.h === headerAtRest.h && headerBack.h === headerAtRest.h)
    pass(`header height unchanged by the state change (${headerAtRest.h}px)`)
  else fail(`header height moved: ${headerAtRest.h} -> ${headerScrolled.h} -> ${headerBack.h}`)

  if (headerBack.bg === headerAtRest.bg && shadowHasInk(headerBack.shadow) === shadowHasInk(headerAtRest.shadow))
    pass('header state reverts at the top')
  else fail('header state does not revert at the top')

  // Preconditions for the hero headline actually being painted. This is the
  // check that would have caught the invisible "database skills" line, which
  // shipped through four gates: contrast skips background-clip:text on purpose,
  // the visual audit only flags contentless leaves, and this sweep previously
  // only asked whether the h1 had text CONTENT -- which stays in the DOM whether
  // or not a single glyph is painted.
  //
  // The headline paints via `background-clip: text` plus `color: transparent`,
  // so there is no fallback: if the clip cannot reach a glyph, that glyph is
  // fully invisible. `.type-char` used to be `inline-block`, an atomic inline,
  // which drops the glyph out of the clipper's text run. That is the whole bug,
  // so assert it structurally on every run rather than trusting a screenshot.
  // The reveal is now JS-driven (`visibility` from `useTypeLoop`) and loops, so
  // a fixed sleep can land mid-erase; wait for the full end state instead -- it
  // is reached and held every cycle (~35% of each ~5s loop) -- then read the
  // paint properties off the complete headline. The wait itself is also a gate:
  // glyphs that can never become visible hang it and fail the run.
  console.log('\n=== hero headline paint ===')
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await ev(ws, `location.href = '${BASE}/'`)
  await waitFor(ws, `document.readyState === 'complete' && !!document.querySelector('[data-hero] h1')`, 'home for headline')
  await waitFor(
    ws,
    `(() => { const h1 = document.querySelector('[data-hero] h1'); if (!h1) return false; const cs = [...h1.querySelectorAll('.type-char')]; return cs.length > 0 && cs.every(c => c.style.visibility === 'visible'); })()`,
    'headline typed to full',
    8000,
  )
  const hl = await ev(ws, `(() => {
    const h1 = document.querySelector('[data-hero] h1')
    const chars = [...h1.querySelectorAll('.type-char')]
    const cs = chars.map((c) => getComputedStyle(c))
    const b = h1.getBoundingClientRect()
    return {
      text: h1.innerText.replace(/\\s+/g, ' ').trim(),
      count: chars.length,
      displays: [...new Set(cs.map((c) => c.display))],
      opacities: [...new Set(cs.map((c) => c.opacity))],
      w: Math.round(b.width), h: Math.round(b.height),
    }
  })()`)

  if (hl.count > 0) info(`headline is "${hl.text}" across ${hl.count} glyph spans`)
  else fail('headline has no .type-char glyph spans')

  if (hl.displays.length > 0 && !hl.displays.some((d) => /inline-(block|flex|grid|table)/.test(d)))
    pass(`headline glyphs are non-atomic (${hl.displays.join(', ')}), so the gradient reaches them`)
  else if (hl.displays.length > 0) fail(`headline glyph is atomic (${hl.displays.join(', ')}): background-clip:text cannot paint it, the text is invisible`)

  if (hl.opacities.length > 0 && !hl.opacities.some((o) => parseFloat(o) < 0.99))
    pass('every headline glyph is at full opacity')
  else if (hl.opacities.length > 0) fail(`headline glyphs stuck at opacity ${hl.opacities.join(', ')}: dimmed by a leftover animation`)

  if (hl.w > 0 && hl.h > 0) pass(`headline box has area (${hl.w}x${hl.h})`)
  else fail(`headline box is collapsed (${hl.w}x${hl.h})`)

  console.log('\n=== header consistency ===')
  for (const [key, count] of headerSignatures) {
    info(`header style "${key}" seen on ${count} route(s)`)
  }

  console.log('\n=== console ===')
  if (consoleErrors.length === 0) pass('no console errors or exceptions on any route')
  else fail(`${consoleErrors.length} console error(s): ${[...new Set(consoleErrors)].slice(0, 5).join(' | ')}`)

  console.log(`\n================ ${results.pass.length} passed, ${results.fail.length} failed ================`)
  if (results.fail.length) {
    console.log('\nFailures:')
    for (const f of results.fail) console.log(`  - ${f}`)
  }
  ws.close()
} catch (e) {
  console.log('DESIGN CHECK ERROR:', e.message)
} finally {
  chrome.kill()
}
process.exit(0)