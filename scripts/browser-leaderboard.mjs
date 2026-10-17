import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9225
const DEV_PORT = 5173
const BASE = `http://127.0.0.1:${DEV_PORT}`
const PROJECT_REF = 'qyowerafreocmutjblmw'
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`
const SESSION_FILE = process.env.LB_SESSION_FILE || 'C:/Users/Anant/AppData/Local/Temp/opencode/smoke-session.json'

const results = []
const pass = (m) => { results.push('PASS ' + m); console.log('PASS ' + m) }
const fail = (m) => { results.push('FAIL ' + m); console.log('FAIL ' + m) }
const check = (cond, ok, bad) => (cond ? pass(ok) : fail(bad))

function bootServer() {
  return spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: process.cwd(), stdio: 'ignore', shell: process.platform === 'win32',
  })
}

async function ensureServer() {
  try {
    const r = await fetch(BASE)
    if (r.ok) return null
  } catch {}
  const server = bootServer()
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(BASE); if (r.ok) return server } catch {}
    await sleep(300)
  }
  throw new Error('dev server did not come up')
}

async function waitForDebugger() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json`); if (r.ok) return r.json() } catch {}
    await sleep(200)
  }
  throw new Error('Chrome debugger never came up')
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    ws.onopen = () => resolve(ws)
    ws.onerror = () => reject(new Error('ws connect failed'))
  })
}

let mid = 0
function send(ws, method, params = {}) {
  const id = ++mid
  return new Promise((resolve) => {
    const on = (e) => { const d = JSON.parse(e.data); if (d.id === id) { ws.removeEventListener('message', on); resolve(d) } }
    ws.addEventListener('message', on)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function ev(ws, expression) {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.result?.value
}
async function waitFor(ws, expr, label, ms = 12000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return true
    await sleep(250)
  }
  fail('timeout waiting for ' + label)
  return false
}
async function go(ws, path) {
  await ev(ws, `location.href = ${JSON.stringify(BASE + path)}`)
  await sleep(500)
}
async function setViewport(ws, width, height) {
  await send(ws, 'Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
}

async function clickRadio(ws, label) {
  const ok = await ev(ws, `(() => {
    const b = [...document.querySelectorAll('button[role="radio"]')].find((x) => x.getAttribute('aria-label') === ${JSON.stringify(label)})
    if (!b) return false
    b.click(); return true
  })()`)
  check(ok, `clicked filter "${label}"`, `filter "${label}" not found`)
}

async function boardRows(ws) {
  return await ev(ws, `(() => {
    const tbody = document.querySelector('#leaderboard-table tbody')
    if (!tbody) return null
    const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim()
    return [...tbody.querySelectorAll('tr')].map((r) => {
      const tds = [...r.querySelectorAll('td')]
      const value = (td) => clean(td && td.lastElementChild ? td.lastElementChild.innerText : '')
      const name = tds[1] ? tds[1].querySelector('.truncate') : null
      return [
        clean(tds[0] && tds[0].innerText),
        clean(name && name.innerText),
        clean(tds[2] && tds[2].innerText),
        value(tds[3]),
        value(tds[4]),
        value(tds[5]),
      ]
    })
  })()`)
}

function matches(rows, expected) {
  if (expected.length === 0) return rows === null || rows.length === 0
  if (!rows || rows.length !== expected.length) return false
  return rows.every((r, i) => r.join('|') === expected[i].join('|'))
}

async function expectBoard(ws, expected, label, ms = 9000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const rows = await boardRows(ws)
    if (matches(rows, expected)) { pass(`board "${label}" matches live data (${expected.length} rows)`); return true }
    await sleep(250)
  }
  const rows = await boardRows(ws)
  fail(`board "${label}" mismatch. got=${JSON.stringify(rows)}`)
  return false
}

async function scrollTable(ws) {
  await ev(ws, `document.getElementById('leaderboard-table')?.scrollIntoView({ block: 'start' })`)
  await sleep(600)
}

async function bodyHas(ws, text) {
  return await ev(ws, `document.body.innerText.includes(${JSON.stringify(text)})`)
}

async function eventually(ws, expr, ms = 8000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return true
    await sleep(250)
  }
  return false
}

const MC_EASY = [
  ['1', 'Infinite', '2500', '25/25', '3/3', '10:00'],
  ['2', 'Infinite', '2400', '24/25', '2/3', '6:20'],
  ['3', 'Thinku', '2300', '23/25', '1/3', '9:46'],
  ['4', 'Infinite', '400', '4/7', '0/3', '2:04'],
  ['5', 'ken', '300', '3/6', '0/3', '0:45'],
  ['6', 'Infinite', '100', '1/4', '0/3', '0:17'],
  ['7', 'Infinite', '0', '0/3', '0/3', '0:16'],
]
const SQL_GLOBAL = [
  ['1', 'Infinite', '3300', '33/33', '3/3', '24:25'],
  ['2', 'Infinite', '2500', '25/25', '3/3', '10:00'],
  ['3', 'Infinite', '2400', '24/25', '2/3', '6:20'],
  ['4', 'Infinite', '2400', '12/15', '0/3', '5:59'],
  ['5', 'Thinku', '2300', '23/25', '1/3', '9:46'],
  ['6', 'Infinite', '400', '4/7', '0/3', '2:04'],
  ['7', 'ken', '300', '3/6', '0/3', '0:45'],
  ['8', 'Infinite', '100', '1/4', '0/3', '0:17'],
  ['9', 'Infinite', '0', '0/3', '0/3', '0:16'],
]
const WRITE_MEDIUM = [['1', 'Infinite', '2400', '12/15', '0/3', '5:59']]
const BUG_EASY = [['1', 'Infinite', '3300', '33/33', '3/3', '24:25']]

async function guestSuite(ws) {
  console.log('\n== GUEST ==')
  await setViewport(ws, 1280, 900)
  await go(ws, '/')
  await ev(ws, `localStorage.clear()`)
  await go(ws, '/leaderboard')
  await waitFor(ws, `document.querySelector('h1') && document.querySelector('h1').innerText.includes('Leaderboard')`, 'hero h1')

  check((await ev(ws, `document.querySelectorAll('h1').length`)) === 1, 'exactly one h1', 'expected exactly one h1')
  check(await bodyHas(ws, 'SCOREBOARD'), 'hero eyebrow present', 'hero eyebrow missing')
  check(await ev(ws, `/sql game progress/i.test(document.body.innerText)`), 'progress panel present', 'progress panel missing')

  check((await ev(ws, `document.querySelectorAll('[role="radiogroup"]').length`)) === 3, 'three filter groups (Database/Mode/Difficulty)', 'filter groups count wrong')
  await waitFor(ws, `new URLSearchParams(location.search).get('db')==='sql' && new URLSearchParams(location.search).get('mode')==='mc' && new URLSearchParams(location.search).get('level')==='easy'`, 'default URL sql/mc/easy')
  pass('default filters sql/mc/easy reflected in URL')

  check(await bodyHas(ws, 'Sign in to track your progress'), 'guest progress sign-in banner shown', 'guest sign-in banner missing')
  const guestRows = await ev(ws, `document.body.innerText.split('Sign in to play').length - 1`)
  check(guestRows >= 12, `guest sees ${guestRows} "Sign in to play" level rows`, `expected >=12 guest level rows, got ${guestRows}`)

  await scrollTable(ws)
  await expectBoard(ws, MC_EASY, 'sql/mc/easy')

  // Global
  await clickRadio(ws, 'Global \u00b7 all modes & levels')
  await waitFor(ws, `new URLSearchParams(location.search).get('mode')==='global'`, 'URL mode=global')
  const levelDisabled = await ev(ws, `[...document.querySelectorAll('button[role="radio"]')].filter((b) => ['Easy','Medium','Hard','All Levels'].includes(b.getAttribute('aria-label'))).every((b) => b.disabled)`)
  check(levelDisabled, 'difficulty pills disabled while Global selected', 'difficulty pills should be disabled in Global')
  await scrollTable(ws)
  await expectBoard(ws, SQL_GLOBAL, 'sql/global')

  // MC + All Levels (empty)
  await clickRadio(ws, 'Multiple Choice')
  await clickRadio(ws, 'All Levels')
  await waitFor(ws, `new URLSearchParams(location.search).get('level')==='all'`, 'URL level=all')
  await expectBoard(ws, [], 'sql/mc/all (empty)')
  check(await bodyHas(ws, 'No scores yet'), 'empty board shows "No scores yet"', 'empty board message missing')

  // MC + Hard (empty)
  await clickRadio(ws, 'Hard')
  await waitFor(ws, `new URLSearchParams(location.search).get('level')==='hard'`, 'URL level=hard')
  await expectBoard(ws, [], 'sql/mc/hard (empty)')

  // Write + Medium
  await clickRadio(ws, 'Write the Query')
  await clickRadio(ws, 'Medium')
  await waitFor(ws, `new URLSearchParams(location.search).get('mode')==='write' && new URLSearchParams(location.search).get('level')==='medium'`, 'URL write/medium')
  await expectBoard(ws, WRITE_MEDIUM, 'sql/write/medium')

  // Fix Bug + Easy
  await clickRadio(ws, 'Fix the Bug')
  await clickRadio(ws, 'Easy')
  await waitFor(ws, `new URLSearchParams(location.search).get('mode')==='bug' && new URLSearchParams(location.search).get('level')==='easy'`, 'URL bug/easy')
  await expectBoard(ws, BUG_EASY, 'sql/bug/easy')

  // Mongo placeholder
  await clickRadio(ws, 'Mongo')
  await waitFor(ws, `new URLSearchParams(location.search).get('db')==='mongo'`, 'URL db=mongo')
  check(await bodyHas(ws, 'MongoDB boards are on the way'), 'Mongo placeholder shown', 'Mongo placeholder missing')
  check(await bodyHas(ws, 'Switch to SQL'), 'Mongo "Switch to SQL" button shown', 'Mongo switch button missing')
  await ev(ws, `(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === 'Switch to SQL'); if (b) b.click() })()`)
  await waitFor(ws, `new URLSearchParams(location.search).get('db')==='sql'`, 'URL back to db=sql')
  pass('"Switch to SQL" returns to the SQL board')

  // no horizontal overflow desktop
  check(await ev(ws, `document.documentElement.scrollWidth <= window.innerWidth + 1`), 'no horizontal overflow @1280', 'horizontal overflow @1280')

  // mobile
  await setViewport(ws, 375, 800)
  await sleep(400)
  await go(ws, '/leaderboard?db=sql&mode=mc&level=easy')
  await waitFor(ws, `!!document.querySelector('h1')`, 'mobile h1')
  await scrollTable(ws)
  await expectBoard(ws, MC_EASY, 'sql/mc/easy (mobile 375)')
  check(await ev(ws, `document.documentElement.scrollWidth <= window.innerWidth + 1`), 'no horizontal overflow @375', 'horizontal overflow @375')
  await setViewport(ws, 1280, 900)
  await sleep(300)
}

async function signedInSuite(ws, session) {
  console.log('\n== SIGNED IN (smoke session) ==')
  await setViewport(ws, 1280, 900)
  await go(ws, '/')
  await ev(ws, `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(session))})`)
  await go(ws, '/leaderboard?db=sql&mode=mc&level=easy')
  const ok = await waitFor(ws, `!document.body.innerText.includes('Sign in to track your progress') && /sql game progress/i.test(document.body.innerText)`, 'signed-in render', 20000)
  if (!ok) { fail('could not establish signed-in state from seeded session'); return }
  pass('seeded session recognised (guest banner gone)')
  check(await ev(ws, `/completed/i.test(document.body.innerText)`), 'progress cards show Completed meters', 'progress meters missing when signed in')
  const banner = await eventually(ws, `/signed in as/i.test(document.body.innerText)`, 10000)
  check(banner, 'not-on-board banner shown for signed-in user with no score', 'not-on-board banner missing')

  const notStarted = await ev(ws, `document.body.innerText.split('Not started').length - 1`)
  check(notStarted >= 6, `easy+medium rows show "Not started" (${notStarted})`, `expected >=6 "Not started" rows, got ${notStarted}`)
  check(await bodyHas(ws, 'Unlock by scoring 75% on Easy and Medium'), 'Hard rows show the correct unlock line', 'Hard unlock line missing')
  check(await bodyHas(ws, 'Unlock by scoring 75% on Easy, Medium and Hard'), 'All Levels rows show the correct unlock line', 'All Levels unlock line missing')
  const zeroCount = await ev(ws, `document.body.innerText.split('0/4').length - 1`)
  check(zeroCount >= 3, `mode cards show empty "0/4" meters (${zeroCount})`, `expected >=3 "0/4" meters, got ${zeroCount}`)

  await scrollTable(ws)
  await expectBoard(ws, MC_EASY, 'sql/mc/easy (signed in, public rows)')
  const youCount = await ev(ws, `[...document.querySelectorAll('#leaderboard-table tbody tr')].filter((r) => r.innerText.includes('You')).length`)
  check(youCount === 0, 'no "You" row for a user with no score', 'unexpected "You" row')

  // Play link href
  const href = await ev(ws, `(() => { const a = [...document.querySelectorAll('a')].find((x) => x.getAttribute('aria-label') === 'Play Easy in Multiple Choice'); return a ? a.getAttribute('href') : null })()`)
  check(href === '/quiz/sql?mode=mc&level=easy', `Play link href correct (${href})`, `Play link href wrong: ${href}`)

  // level-row click updates URL + scrolls to table
  await ev(ws, `window.scrollTo(0, 0)`)
  await sleep(200)
  const clicked = await ev(ws, `(() => { const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Multiple Choice, Medium, not started'); if (!b) return false; b.click(); return true })()`)
  check(clicked, 'clicked unlocked level row (Multiple Choice, Medium)', 'unlocked level row not found')
  await waitFor(ws, `new URLSearchParams(location.search).get('level')==='medium'`, 'level row sets URL level=medium')
  pass('level row updates filter + URL')
  await sleep(1600)
  const nearTop = await ev(ws, `(() => { const el = document.getElementById('leaderboard-table'); if (!el) return false; const t = el.getBoundingClientRect().top; return t > -40 && t < 400 })()`)
  check(nearTop, 'level row scrolled the scores table into view', 'table was not scrolled into view')

  // clicking a Play link navigates to the quiz with the right query
  await go(ws, '/leaderboard?db=sql&mode=mc&level=easy')
  await waitFor(ws, `!!document.querySelector('a[aria-label="Play Easy in Multiple Choice"]')`, 'play link present')
  await ev(ws, `document.querySelector('a[aria-label="Play Easy in Multiple Choice"]').click()`)
  await waitFor(ws, `location.pathname === '/quiz/sql'`, 'navigated to /quiz/sql')
  const search = await ev(ws, `location.search`)
  check(search.includes('mode=mc') && search.includes('level=easy'), `Play navigated to /quiz/sql with ${search}`, `unexpected quiz query: ${search}`)
}

async function reducedMotionSuite(ws) {
  console.log('\n== REDUCED MOTION ==')
  await send(ws, 'Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await go(ws, '/leaderboard?db=sql&mode=mc&level=easy')
  await waitFor(ws, `!!document.querySelector('h1')`, 'rm h1')
  await scrollTable(ws)
  await expectBoard(ws, MC_EASY, 'sql/mc/easy (reduced motion: instant swap)')
  await send(ws, 'Emulation.setEmulatedMedia', { features: [] })
}

async function main() {
  const server = await ensureServer()
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-leaderboard',
    `${BASE}/leaderboard`,
  ], { stdio: 'ignore' })

  try {
    const pages = await waitForDebugger()
    const page = pages.find((p) => p.type === 'page')
    if (!page) throw new Error('no page target')
    const ws = await connect(page.webSocketDebuggerUrl)
    await send(ws, 'Runtime.enable')
    await send(ws, 'Page.enable')
    await sleep(1200)

    await guestSuite(ws)
    await reducedMotionSuite(ws)

    if (existsSync(SESSION_FILE)) {
      try {
        const raw = readFileSync(SESSION_FILE, 'utf8').replace(/^\uFEFF/, '')
        const session = JSON.parse(raw)
        await signedInSuite(ws, session)
      } catch (e) {
        fail('could not read session file: ' + e.message)
      }
    } else {
      console.log('\n(skipping signed-in suite — no session file at ' + SESSION_FILE + ')')
    }

    ws.close()
  } finally {
    chrome.kill()
    if (server) server.kill()
  }

  const failed = results.filter((r) => r.startsWith('FAIL'))
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) { console.log('\nLEADERBOARD E2E FAILED'); process.exit(1) }
  console.log('\nLEADERBOARD E2E OK')
  process.exit(0)
}

main().catch((e) => { console.log('LEADERBOARD E2E ERROR:', e.message); process.exit(1) })
