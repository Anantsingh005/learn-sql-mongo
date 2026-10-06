/**
 * Screenshot capture for visual review.
 *
 * Every other script in this folder asserts something numeric: contrast
 * ratios, element heights, overflow. That is not the same as looking at the
 * page. Phase 5 replaced ~1500 class names across 70 files with codemods, and
 * a codemod that satisfies every assertion can still leave a page that looks
 * wrong — a decorative gradient flattened to a single flat colour, a card with
 * no separation from the page behind it, a badge that is technically present
 * and visually invisible.
 *
 * So this script does not assert. It captures full-page PNGs and writes them to
 * a directory for a human (or an agent with eyes) to review. Kept separate from
 * the assertion scripts on purpose: a tool that only fails loudly is no use for
 * judging whether something looks good.
 *
 * Usage:
 *   node scripts/browser-shots.mjs                 # every route, desktop + mobile
 *   node scripts/browser-shots.mjs /leaderboard    # one route
 *   node scripts/browser-shots.mjs --desktop-only
 */
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9229
const BASE = process.env.DESIGN_BASE ?? 'http://localhost:5173'
const OUT = 'C:/Users/Anant/AppData/Local/Temp/opencode/shots'

const ROUTES = [
  '/',
  '/quiz/sql',
  '/academy',
  '/academy/sql',
  '/practice',
  '/leaderboard',
  '/auth',
  '/profile',
  '/admin',
  '/quiz/mongo',
  // Every remaining declared route. The alias and the two legal pages were
  // missing here, so a "look at every page" pass silently skipped them.
  '/more-practice',
  '/privacy',
  '/terms',
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const args = process.argv.slice(2)
const desktopOnly = args.includes('--desktop-only')
const only = args.filter((a) => a.startsWith('/'))
const routes = only.length ? only : ROUTES
const viewports = desktopOnly ? VIEWPORTS.slice(0, 1) : VIEWPORTS

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-shots',
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
  throw new Error('Chrome debugger never came up')
}

function conn(wsUrl) {
  return new Promise((res, rej) => {
    const w = new WebSocket(wsUrl)
    w.onopen = () => res(w)
    w.onerror = () => rej(new Error('websocket failed'))
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
        if (d.error) rej(new Error(`${method}: ${d.error.message}`))
        else res(d.result)
      }
    }
    ws.addEventListener('message', on)
    ws.send(JSON.stringify({ id: mid, method, params }))
    setTimeout(() => rej(new Error(`${method} timed out`)), 30000)
  })
}

/* Animations are the reason a full-page shot is often wrong: the card reveal
   uses an IntersectionObserver and a stagger, so a page captured the instant it
   loads has cards still at opacity 0 and reads as "the layout is broken". Wait
   for the observer to have fired and the stagger to have finished. */
const SETTLE = `(async () => {
  window.scrollTo(0, document.body.scrollHeight)
  await new Promise(r => setTimeout(r, 250))
  window.scrollTo(0, 0)
  await new Promise(r => setTimeout(r, 400))
  const anim = document.getAnimations ? document.getAnimations() : []
  for (const a of anim) { try { a.finish() } catch {} }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  return true
})()`

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const list = await targets()
const page = list.find((p) => p.type === 'page')
if (!page) {
  chrome.kill()
  throw new Error('no page target')
}
const ws = await conn(page.webSocketDebuggerUrl)
await send(ws, 'Page.enable')

let n = 0
for (const vp of viewports) {
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.name === 'mobile',
  })

  for (const route of routes) {
    const url = `${BASE}${route}`
    await send(ws, 'Page.navigate', { url })
    // Chrome resolves navigate before the SPA has painted its route content;
    // the network-idle-ish wait below is what actually matters.
    await sleep(900)
    await send(ws, 'Runtime.evaluate', { expression: SETTLE, awaitPromise: true })

    const metrics = await send(ws, 'Page.getLayoutMetrics')
    const full = metrics.cssContentSize ?? metrics.contentSize
    const height = Math.min(Math.ceil(full.height), 20000)

    const { data } = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: vp.width, height, scale: 1 },
    })

    const slug = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '')
    const file = `${OUT}/${slug}.${vp.name}.png`
    writeFileSync(file, Buffer.from(data, 'base64'))
    n++
    console.log(`  ${String(n).padStart(2)}  ${vp.name.padEnd(7)} ${route.padEnd(16)} ${height}px  -> ${file}`)
  }
}

ws.close()
chrome.kill()
console.log(`\n${n} screenshot(s) in ${OUT}`)