import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9225
const BASE = 'http://127.0.0.1:5173'

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-routes',
  BASE,
], { stdio: 'ignore' })

async function pg() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json`); if (r.ok) return r.json() } catch {}
    await sleep(200)
  }
  throw new Error('no debugger')
}
function conn(wsUrl) {
  return new Promise((res, rej) => { const w = new WebSocket(wsUrl); w.onopen = () => res(w); w.onerror = () => rej(new Error('ws')) })
}
let id = 0
function send(ws, method, params = {}) {
  const mid = ++id
  return new Promise((res) => {
    const on = (e) => { const d = JSON.parse(e.data); if (d.id === mid) { ws.removeEventListener('message', on); res(d) } }
    ws.addEventListener('message', on)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
}
async function ev(ws, expression) {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.result?.value
}
async function waitFor(ws, expr, label, ms = 10000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return
    await sleep(300)
  }
  throw new Error(`timeout: ${label}`)
}

try {
  const pages = await pg()
  const ws = await conn(pages.find((p) => p.type === 'page').webSocketDebuggerUrl)
  await send(ws, 'Runtime.enable')

  const checks = [
    ['/', 'Test your database skills', 'home'],
    ['/leaderboard', 'Leaderboard', 'leaderboard'],
    ['/quiz/mongo', 'MongoDB', 'mongo placeholder'],
  ]
  for (const [path, text, label] of checks) {
    await ev(ws, `location.href = '${BASE}${path}'`)
    await waitFor(ws, `document.body.innerText.includes('${text}')`, label)
    console.log(`PASS route ${path} ("${label}") rendered`)
  }

  await ev(ws, `location.href = '${BASE}/quiz/sql'`)
  await waitFor(ws, `document.body.innerText.includes('Start Quiz')`, 'sql quiz start')
  console.log('PASS route /quiz/sql rendered')

  // check for any console/page errors on the last route
  const bodyOk = await ev(ws, `!document.body.innerText.includes('Something went wrong')`)
  console.log(bodyOk ? 'PASS no runtime error banner on any route' : 'FAIL error banner detected')
  ws.close()
} catch (e) {
  console.log('ROUTES CHECK ERROR:', e.message)
} finally {
  chrome.kill()
}
process.exit(0)