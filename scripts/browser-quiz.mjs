import { spawn } from 'node:child_process'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9223
const DEV_PORT = 5173

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-quiz',
  `http://127.0.0.1:${DEV_PORT}/quiz/sql`,
], { stdio: 'ignore' })

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)),
  ])
}

async function waitForDebugger() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`)
      if (res.ok) return res.json()
    } catch {}
    await sleep(200)
  }
  throw new Error('Chrome debugging port never came up')
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    ws.onopen = () => resolve(ws)
    ws.onerror = (e) => reject(new Error(`ws error: ${e.message ?? 'unknown'}`))
  })
}

let messageId = 0
function send(ws, method, params = {}) {
  const id = ++messageId
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no reply to ${method}`)), 10000)
    const onMsg = (event) => {
      const data = JSON.parse(event.data)
      if (data.id === id) {
        clearTimeout(timer)
        ws.removeEventListener('message', onMsg)
        resolve(data)
      }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evalVal(ws, expression) {
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true })
  return r.result?.result?.value
}

async function waitFor(ws, expression, label, timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const v = await evalVal(ws, expression)
    if (v === true) return true
    await sleep(300)
  }
  throw new Error(`waitFor timeout: ${label}`)
}

// The start screen is now a mode picker (Multiple Choice / Write the Query /
// Fix the Bug), followed by a level screen whose unlocked levels carry a Play
// button. Pick a mode by its card text, then hit Play on the easy level.
async function pickMode(ws, label, steps) {
  await evalVal(
    ws,
    `[...document.querySelectorAll('button')].find((b) => b.textContent.includes(${JSON.stringify(label)})).click()`,
  )
  await waitFor(
    ws,
    `document.body.innerText.includes('Easy') && [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Play')`,
    `${label} level cards`,
  )
  steps.push(`PASS  ${label} -> level cards rendered`)
  await evalVal(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Play').click()`)
}

async function main() {
  const steps = []
  const pass = (label) => { steps.push('PASS ' + label) }
  try {
    const pages = await withTimeout(waitForDebugger(), 30000, 'debugger')
    const page = pages.find((p) => p.type === 'page')
    if (!page) throw new Error('no page target found')
    const ws = await withTimeout(connect(page.webSocketDebuggerUrl), 15000, 'connect ws')
    await send(ws, 'Runtime.enable')

    // 1. Start screen (mode picker) visible
    await waitFor(ws, `document.body.innerText.includes('Multiple Choice')`, 'start screen')
    pass('start screen rendered')

    // 2. MC + easy: fastest path through the full loop
    await pickMode(ws, 'Multiple Choice', steps)
    await waitFor(
      ws,
      `document.querySelector('article button') !== null && document.body.innerText.includes('Time Left')`,
      'first question',
    )
    pass('quiz started, first question rendered')

    // 3. Answer MC (first option; correct or not, we just verify feedback renders)
    await evalVal(ws, `[...document.querySelectorAll('article button')][0].click()`)
    await sleep(400)
    await waitFor(
      ws,
      `!([...document.querySelectorAll('button')].find((b) => b.textContent.includes('Submit'))?.disabled)`,
      'submit enabled',
    )
    await evalVal(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Submit')).click()`)
    await waitFor(ws, `/Correct!|Not quite|Time ran out/.test(document.body.innerText)`, 'mc feedback')
    pass('MC answered -> feedback shown')

    // 4. Move to next question
    await evalVal(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Next question')).click()`)
    await sleep(800)
    pass('advanced to next question')

    // 5. Verify HUD elements present
    await waitFor(
      ws,
      `document.querySelector('[role="timer"]') !== null && /lives/i.test(document.body.innerText)`,
      'hud render',
      10000,
    )
    pass('HUD (timer/lives) present')

    // 6. Play a WRITE question end-to-end
    await evalVal(ws, `location.reload()`)
    await waitFor(ws, `document.body.innerText.includes('Multiple Choice')`, 'reloaded start', 10000)
    await pickMode(ws, 'Write the Query', steps)
    await waitFor(ws, `document.querySelector('textarea') !== null`, 'write editor', 20000)
    pass('write question editor rendered')

    await evalVal(ws, `(() => {
      const ta = document.querySelector('textarea');
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, 'SELECT * FROM employees;');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`)
    await sleep(400)
    await waitFor(
      ws,
      `!([...document.querySelectorAll('button')].find((b) => b.textContent.includes('Submit'))?.disabled)`,
      'submit enabled 2',
    )
    await evalVal(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Submit')).click()`)
    await waitFor(ws, `/Correct!|Not quite/.test(document.body.innerText)`, 'write feedback', 15000)
    pass('write question submitted -> feedback shown')

    console.log(steps.join('\n'))
    const failed = steps.filter((s) => s.startsWith('FAIL'))
    console.log(failed.length === 0 ? '\nQUIZ FLOW SMOKE OK' : `\n${failed.length} FAILURES`)
    ws.close()
  } catch (e) {
    console.log(steps.join('\n'))
    console.log('QUIZ FLOW ERROR:', e.message)
    process.exitCode = 1
  } finally {
    chrome.kill()
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => { console.error(e); process.exit(1) })
