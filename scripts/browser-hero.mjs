/**
 * Landing-page checks the route sweep cannot make.
 *
 * The design sweep asserts structure — header height, footer presence, no dark
 * backgrounds. It cannot tell whether the hero headline is actually *readable*,
 * because a headline whose reveal never runs leaves every glyph `visibility:
 * hidden` while still being present in the DOM and still passing a
 * `textContent.includes(...)` check. So this walks the properties that only
 * matter on `/`:
 *
 *   - the typewriter reaches its end state: on every viewport the headline's
 *     glyphs all become visible at some point (the reveal is JS-driven and
 *     loops, so a single snapshot can land mid-erase — the gate waits for the
 *     full end state, then reads structure)
 *   - a dedicated pass confirms the reveal actually animates: glyphs type up
 *     progressively, hold at full, then erase and loop rather than snapping on
 *   - the visible headline matches its expected copy. The landing page swaps
 *     heroes below 1024px: the desktop Hero's two forced lines (`Test your` /
 *     `database skills`) at >= 1024px, MobileHome's single-line
 *     `Master Database Skills` below. Both are asserted, per width.
 *   - everything above the footer still fits one screen at the desktop sizes it
 *     is budgeted for. The landing page carries the site footer, so it scrolls
 *     by exactly the footer's height; what is asserted is that the hero and
 *     cards above it have not outgrown the viewport. Below those sizes the
 *     stacked layout scrolls by design
 *   - `prefers-reduced-motion` yields a fully visible headline, since the
 *     reduced-motion branch has to hand back the end state rather than the
 *     resting one
 *   - the guest-only clear-progress control is present and wired to a confirm
 *     (desktop only — MobileHome does not render it)
 */
import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9227
const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5173'

/* 1440x900 is in here as well as 1600x1000: the hero's illustration cap ladder
   tops out at xl, so 1440 is the width where the two-column split and the cap
   change at once. It is the size the one-screen budget was originally measured
   against, so it is the one most likely to overflow.

   `mustFit` now means "the content above the footer fits one screen", not "the
   page fits one screen" — the landing page grew a footer, and the original
   budget for the hero and cards is still the thing worth protecting. */
const VIEWPORTS = [
  { w: 1920, h: 1080, mustFit: true, label: '1920x1080' },
  { w: 1600, h: 1000, mustFit: true, label: '1600x1000' },
  { w: 1440, h: 900, mustFit: true, label: '1440x900' },
  { w: 1280, h: 900, mustFit: true, label: '1280x900' },
  { w: 834, h: 1112, mustFit: false, label: '834x1112' },
  { w: 390, h: 844, mustFit: false, label: '390x844' },
]

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-hero',
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

async function settle(ws) {
  // Wait for every *finite* animation to finish, then for layout to read back.
  // A fixed sleep is wrong here: on the very first hit Vite transforms ~177
  // modules on demand, so the animation clock starts well after the sleep began
  // and the probe reads a half-finished headline. That failure mode looks
  // exactly like a broken animation, which is worse than no test at all.
  //
  // Finite only. The caret blink, the badge halo and the illustration drift all
  // run `infinite`, so awaiting their `finished` promise hangs the check
  // forever — `iterations === Infinity` is the filter, not a timeout.
  await ev(
    ws,
    `Promise.all(
       document.getAnimations()
         .filter(a => a.effect?.getComputedTiming?.().iterations !== Infinity)
         .map(a => a.finished.catch(() => {}))
     ).then(() => true)`
  )
  await ev(ws, `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))).then(() => true)`)
}

const failures = []
let passCount = 0
const check = (ok, msg) => {
  if (ok) {
    passCount++
    console.log(`  PASS ${msg}`)
  } else {
    failures.push(msg)
    console.log(`  FAIL ${msg}`)
  }
}

const VISIBLE_H1 = `([...document.querySelectorAll('h1')].find(h => h.getBoundingClientRect().width > 0) ?? null)`

// The reveal is `visibility` on each glyph, driven by React state, so this is
// the "is the headline readable" question: every `.type-char` currently shown.
// Desktop renders the Hero AND MobileHome together, with MobileHome's subtree
// `display: none` — so scope to the visible h1, never a bare querySelector.
const FULL_VISIBLE = `
(() => {
  const h1 = ${VISIBLE_H1};
  if (!h1) return false;
  const cs = [...h1.querySelectorAll('.type-char')];
  return cs.length > 0 && cs.every(c => c.style.visibility === 'visible');
})()
`

const PROBE = `
(() => {
  const h1 = ${VISIBLE_H1};
  const chars = h1 ? [...h1.querySelectorAll('.type-char')] : [];

  // How many rows the headline actually lays out on. The desktop hero forces the
  // break with two block wrappers, and a display-of-block count is the obvious
  // proxy — but .enter-word sets display:inline-block in unlayered CSS, which
  // beats the layered block utility, so one wrapper always reads as inline.
  // Measuring which rows the glyphs land on is the honest version: two distinct
  // rows means the forced split is holding; the single flow of MobileHome's h1
  // collapses to whatever wrapping the width gives it.
  const tops = chars.map(c => c.getBoundingClientRect().top).sort((a, b) => a - b)
  let lineRows = 0
  let prevTop = -Infinity
  for (const t of tops) {
    if (t - prevTop > 4) { lineRows++; prevTop = t }
  }

  const clear = [...document.querySelectorAll('button')].find(b => /clear your progress/i.test(b.textContent));

  return {
    charCount: chars.length,
    visibleCount: chars.filter(c => c.style.visibility !== 'hidden').length,
    lineRows,
    h1Text: h1 ? h1.innerText.replace(/\\s+/g, ' ').trim() : null,
    hasClearProgress: !!clear,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    heroH: Math.round(document.querySelector('[data-hero]')?.getBoundingClientRect().height ?? 0),
    footerH: Math.round(document.querySelector('footer')?.getBoundingClientRect().height ?? 0),
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
})()
`

// Observe one full loop of the typewriter. The loop is ~5s (0.7s delay, ~1.4s
// typing, 1.8s hold, ~0.8s erase, 0.5s gap); sampling every 150ms catches a
// full state, mid-states, and the drop back down.
const CYCLE = `
(async () => {
  const h1 = ${VISIBLE_H1};
  if (!h1) return { error: 'no visible h1' };
  const cs = [...h1.querySelectorAll('.type-char')];
  if (!cs.length) return { error: 'no .type-char glyphs' };
  const shown = () => cs.filter(c => c.style.visibility !== 'hidden').length;
  let prev = shown();
  let prevFull = prev === cs.length;
  const out = { changes: 0, mid: 0, full: 0, dropped: 0, total: cs.length };
  const t0 = performance.now();
  while (performance.now() - t0 < 5000) {
    const n = shown();
    if (n !== prev) { out.changes++; prev = n; }
    if (n > 0 && n < cs.length) out.mid++;
    const full = n === cs.length;
    if (full && !prevFull) out.full++;
    if (!full && prevFull) out.dropped++;
    prevFull = full;
    await new Promise(r => setTimeout(r, 150));
  }
  return out;
})()
`

try {
  try {
    const probe = await fetch(BASE, { signal: AbortSignal.timeout(5000) })
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
  } catch (e) {
    console.log(`HERO CHECK ERROR: dev server not reachable at ${BASE} (${e.message})`)
    chrome.kill()
    process.exit(1)
  }

  const pages = await targets()
  const ws = await conn(pages.find((p) => p.type === 'page').webSocketDebuggerUrl)
  await send(ws, 'Runtime.enable')
  await send(ws, 'Page.enable')

  /* ---- normal motion, every viewport ---- */
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.label} ===`)
    await send(ws, 'Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 700,
    })
    await ev(ws, `location.href = '${BASE}/'`)
    await waitFor(ws, `!!document.querySelector('.type-char')`, 'hero mounted')
    await settle(ws)

    // The typewriter reveals by JS state and loops forever, so a snapshot can
    // land mid-erase. Wait for the full end state — the actual promise of the
    // animation — then read structure off the complete headline.
    await waitFor(ws, FULL_VISIBLE, `${vp.label} — headline typed to full`, 8000)

    const p = await ev(ws, PROBE)
    if (!p || p.__error) {
      check(false, `${vp.label} — probe failed: ${p?.__error}`)
      continue
    }

    check(p.charCount > 0, `${vp.label} — headline has ${p.charCount} glyphs`)
    check(
      p.visibleCount === p.charCount && p.charCount > 0,
      `${vp.label} — all ${p.charCount} glyphs visible at end state (got ${p.visibleCount})`
    )

    const desktop = vp.w >= 1024
    const headlineOk = desktop
      ? /^Test your\s*database skills/i.test(p.h1Text ?? '')
      : /^Master\s*database skills/i.test(p.h1Text ?? '')
    check(
      headlineOk,
      `${vp.label} — headline copy ${desktop ? '"Test your database skills"' : '"Master Database Skills"'} (got "${p.h1Text}")`
    )

    if (desktop) {
      check(
        p.lineRows === 2,
        `${vp.label} — desktop headline renders on exactly 2 rows (got ${p.lineRows})`
      )
      check(p.hasClearProgress, `${vp.label} — guest clear-progress control present`)
    } else {
      console.log(`  ..   ${vp.label} — MobileHome headline (${p.lineRows} row${p.lineRows === 1 ? '' : 's'}), no forced split or clear-progress`)
    }
    check(p.bodyBg === 'rgb(255, 255, 255)', `${vp.label} — body white`)

    const overflow = p.scrollHeight - p.innerHeight
    if (vp.mustFit) {
      // The footer is excluded on purpose, and it is the whole point of the
      // check. `above` is header+hero+cards, which is what the one-screen budget
      // was written against; the footer is a constant the landing page now
      // carries on every route. Asserting the page fits one screen would just
      // re-assert the footer's height. Asserting `above` fits keeps the original
      // promise — the hero and cards have not outgrown a screen — while letting
      // the footer be the only thing that spills, and still fails if they grow.
      const above = p.scrollHeight - p.footerH
      check(
        p.footerH > 0 && above <= p.innerHeight + 2,
        `${vp.label} — header+hero+cards occupy ${above}px of the ${p.innerHeight}px viewport, footer (${p.footerH}px) below it, page scrolls ${overflow}px`
      )
    } else {
      console.log(
        `  ..   ${vp.label} — content ${p.scrollHeight}px, hero ${p.heroH}px, footer ${p.footerH}px (stacked layouts scroll by design)`
      )
    }
  }

  /* ---- the typewriter actually cycles ---- */
  console.log('\n=== typewriter cycle (1600x1000) ===')
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await ev(ws, `location.href = '${BASE}/'`)
  await waitFor(ws, `!!document.querySelector('.type-char')`, 'hero mounted (cycle)')
  await settle(ws)
  const cy = await ev(ws, CYCLE)
  if (!cy || cy.error) {
    check(false, `typewriter cycle — ${cy?.error ?? 'probe failed'}`)
  } else {
    check(
      cy.full > 0,
      `typewriter reaches the full headline (${cy.full} full-state sample${cy.full === 1 ? '' : 's'}, ${cy.total} glyphs)`
    )
    check(cy.changes > 0, `typewriter animates (${cy.changes} visible-count change${cy.changes === 1 ? '' : 's'} over 5s)`)
    check(cy.mid > 0, `typewriter types progressively (${cy.mid} mid-state samples)`)
    check(cy.dropped > 0, `typewriter erases and loops (${cy.dropped} drop${cy.dropped === 1 ? '' : 's'} from full)`)
  }

  /* ---- reduced motion ---- */
  console.log('\n=== prefers-reduced-motion: reduce ===')
  await send(ws, 'Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await ev(ws, `location.href = '${BASE}/'`)
  await waitFor(ws, `!!document.querySelector('.type-char')`, 'hero mounted (reduced motion)')
  await settle(ws)

  const rm = await ev(ws, PROBE)
  check(rm?.charCount > 0, `reduced-motion — characters present (${rm?.charCount})`)
  check(
    rm && rm.visibleCount === rm.charCount && rm.charCount > 0,
    `reduced-motion — headline fully visible without animating (${rm?.visibleCount}/${rm?.charCount} glyphs)`
  )
  await send(ws, 'Emulation.setEmulatedMedia', { features: [] })

  console.log(`\n================ ${passCount} passed, ${failures.length} failed ================`)
  if (failures.length) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  - ${f}`)
  }
  ws.close()
} catch (e) {
  console.log('HERO CHECK ERROR:', e.message)
} finally {
  chrome.kill()
}
process.exit(failures.length ? 1 : 0)