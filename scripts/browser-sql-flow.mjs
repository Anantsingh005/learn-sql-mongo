import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9226
const DEV_PORT = 5173

function bootServer() {
  return spawn('npm.cmd', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  })
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEV_PORT}`)
      if (res.ok) return
    } catch {}
    await sleep(300)
  }
  throw new Error('dev server did not come up')
}

async function waitForDebugger() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`)
      if (res.ok) return res.json()
    } catch {}
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

let msgId = 0
function send(ws, method, params = {}) {
  const id = ++msgId
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no reply: ' + method)), 10000)
    const onMsg = (e) => {
      const d = JSON.parse(e.data)
      if (d.id === id) {
        clearTimeout(timer)
        ws.removeEventListener('message', onMsg)
        resolve(d)
      }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function ev(ws, expression) {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.result?.value
}

async function waitFor(ws, expr, label, ms = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return
    await sleep(300)
  }
  throw new Error('timeout: ' + label)
}

async function clickByText(ws, text, label) {
  const ok = await ev(ws, `(() => {
    const el = [...document.querySelectorAll('button, [role="button"], a')].find((b) => b.textContent.includes('${text}'))
    if (!el) return false
    el.click()
    return true
  })()`)
  if (!ok) throw new Error('could not click: ' + label)
}

const steps = []
const pass = (s) => steps.push('PASS ' + s)
const fail = (s) => steps.push('FAIL ' + s)

async function main() {
  const server = bootServer()
  try {
    await waitForServer()

    const chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      '--remote-debugging-port=' + PORT,
      '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/dbquiz-chrome-sqlflow',
      'http://127.0.0.1:' + DEV_PORT,
    ], { stdio: 'ignore' })

    try {
      const pages = await waitForDebugger()
      const page = pages.find((p) => p.type === 'page')
      if (!page) throw new Error('no page target')
      const ws = await connect(page.webSocketDebuggerUrl)
      await send(ws, 'Runtime.enable')
      await send(ws, 'Page.enable')

      await send(ws, 'Page.navigate', { url: 'http://127.0.0.1:' + DEV_PORT + '/quiz/sql' })
      await sleep(1500)

      await clickByText(ws, 'SQL', 'home SQL card')
      await sleep(1200 laquelle')
      await waitFor(ws, `document.body.innerText.includes('Multiple Choice')`, 'mode cards visible')
      pass('mode cards rendered')

      await clickByText(ws, 'Multiple Choice', 'MC mode')
      await waitFor(ws, `document.body.innerText.includes('Easy')`, 'level cards visible')
      pass('level cards rendered')

      await clickByText(ws, 'Easy', 'easy level')
      await waitFor(ws, `document.body.innerText.includes('Question') || document.body.innerText.includes('What')`, 'first question visible', 20000)
      pass('quiz started')

    } finally {
      chrome.kill()
    }
  } finally {
    server.kill()
  }

  console.log(steps.join('\n'))
  if (steps.some((s) => s.startsWith('FAIL'))) process.exit(1)
  console.log('\nSQL MODE-LEVEL FLOW OK')
  process.exit(0)
}

main().catch((e) => {
  console.log(steps.length ? steps.join('\n') + '\n' : '')
  console.log('SQL FLOW ERROR:', e.message)
  process.exit(1)
})
