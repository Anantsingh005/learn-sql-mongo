import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9225
const DEV_PORT = 5173

function bootServer() {
  return spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    shell: process.platform === 'win32',
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

let mid = 0
function send(ws, method, params = {}) {
  const id = ++mid
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no reply: ${method}`)), 10000)
    const on = (e) => {
      const d = JSON.parse(e.data)
      if (d.id === id) {
        clearTimeout(timer)
        ws.removeEventListener('message', on)
        resolve(d)
      }
    }
    ws.addEventListener('message', on)
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
  throw new Error(`timeout: ${label}`)
}

async function setInput(ws, selector, value) {
  await ev(ws, `(() => {
    const el = document.querySelector('${selector}')
    if (!el) return false
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, ${JSON.stringify(value)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)
}

const steps = []
const pass = (s) => { steps.push('PASS ' + s) }

async function main() {
  const server = bootServer()
  try {
    await waitForServer()

    const chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox',
      `--remote-debugging-port=${PORT}`,
      '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/dbquiz-chrome-signup',
      `http://127.0.0.1:${DEV_PORT}/quiz/sql`,
    ], { stdio: 'ignore' })

    try {
      const pages = await waitForDebugger()
      const page = pages.find((p) => p.type === 'page')
      if (!page) throw new Error('no page target')
      const ws = await connect(page.webSocketDebuggerUrl)
      await send(ws, 'Runtime.enable')

      await ev(ws, `location.href = 'http://127.0.0.1:${DEV_PORT}/auth?mode=signup'`)
      await waitFor(ws, `document.body.innerText.includes('Create account')`, 'signup page')
      pass('signup form rendered')

      const uniq = Date.now().toString(36)
      const email = `smoke${uniq}@local.test`
      await setInput(ws, 'input[type="email"]', email)
      await setInput(ws, 'input[type="password"]', 'secret123')
      await sleep(300)

      const exists = await ev(ws, `document.body.innerText.includes('Create account')`)
      if (!exists) {
        await waitFor(ws, `document.body.innerText.includes('Sign up')`, 'signup alt label')
      }

      const clicked = await ev(ws, `(() => {
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /Create account|Sign up/.test(b.textContent))
        if (!btn) return false
        btn.click()
        return true
      })()`)
      if (!clicked) throw new Error('could not find create-account button')
      pass('create-account clicked')

      await waitFor(ws, `location.pathname !== '/auth'`, 'redirected after signup', 20000)
      await waitFor(ws, `document.body.innerText.includes('${email.split('@')[0]}') !== false && document.body.innerText.length > 50`, 'home content', 15000)
      pass('signed in · redirected home')
    } finally {
      chrome.kill()
    }
  } finally {
    server.kill()
  }

  console.log(steps.join('\n'))
  if (steps.some((s) => s.startsWith('FAIL'))) process.exit(1)
  console.log('\nLOCAL SIGNUP SMOKE OK')
  process.exit(0)
}

main().catch((e) => {
  console.log(steps.length ? steps.join('\n') + '\n' : '')
  console.log('SIGNUP SMOKE ERROR:', e.message)
  process.exit(1)
})
