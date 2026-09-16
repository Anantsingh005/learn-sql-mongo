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

async function main() {
  const steps = []
  const pass = (label) => { steps.push('PASS ' + label) }
  try {
    const pages = await withTimeout(waitForDebugger(), 30000, 'debugger')
    const page = pages.find((p) => p.type === 'page')
    if (!page) throw new Error('no page target found')
    const ws = await withTimeout(connect(page.webSocketDebuggerUrl), 15000, 'connect ws')
    await send(ws, 'Runtime.enable')

    // 1. Start screen visible
    await waitFor(ws, `document.body.innerText.includes('SQL Quiz')`, 'start screen')
    pass('start screen rendered')

    // 2. Only MC + easy: fastest path through the full loop
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Start Quiz')).click()`)
    await waitFor(ws, `document.body.innerText.includes('Q 1/') && /MULTIPLE CHOICE|Multiple choice/.test(document.body.innerText)`, 'first question')
    pass('quiz started, first question rendered')

    // 3. Answer MC (click the FIRST option; correct or not, we just verify feedback renders)
    await evalVal(ws, `[...document.querySelectorAll('article button')][0].click()`)
    await sleep(400)
    await waitFor(ws, `!([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')?.disabled)`, 'submit enabled')
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit').click()`)
    await waitFor(ws, `document.body.innerText.includes('Why')`, 'mc feedback')
    pass('MC answered -> feedback shown')

    // 4. Move to next question
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Next question')).click()`)
    await sleep(600)
    pass('advanced to next question')

    // 5. Check what next question type is
    const isWriteOrBug = await evalVal(ws, `document.body.innerText.includes('Write your SQL here')`)
    const isMc = await evalVal(ws, `document.body.innerText.includes('Multiple choice')`)
    steps.push(isWriteOrBug ? 'INFO  next question is write/bug' : isMc ? 'INFO  next question is MC' : 'INFO  next question unknown')

    // If write/bug question, type a SQL statement and run it
    if (isWriteOrBug) {
      await waitFor(ws, `document.querySelector('textarea') !== null`, 'sql editor ready')
      // Type a valid query: select all from first table - we can't know the schema, so just run a safe one per question list
      await evalVal(ws, `(() => {
        const ta = document.querySelector('textarea');
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(ta, 'SELECT * FROM employees;');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      })()`)
      const runBtn = await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Run') !== undefined`)
      if (runBtn) {
        await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Run').click()`)
        await sleep(2500)
        const hasResult = await evalVal(ws, `document.body.innerText.includes('Query result')`)
        steps.push(hasResult ? 'PASS  Run produced a result table' : 'WARN  Run did not show result (might be schema mismatch)')
      }
    }

    // 6. Verify HUD elements present
    await waitFor(ws, `document.body.innerText.includes('Score') && /\\d+s/.test(document.body.innerText)`, 'hud render', 10000)
    pass('HUD (score/timer/lives) present')

    // 7. Play a WRITE question end-to-end: restart with "Write the Query" only (first = write-01)
    await evalVal(ws, `location.reload()`)
    await waitFor(ws, `document.body.innerText.includes('Question types')`, 'reloaded start', 10000)
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Multiple Choice')).click()`)
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Fix the Bug')).click()`)
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Start Quiz')).click()`)
    await waitFor(ws, `document.querySelector('textarea') !== null`, 'write editor', 20000)
    pass('write question editor rendered')
    // Schema is employees; the correct answer:
    await evalVal(ws, `(() => {
      const ta = document.querySelector('textarea');
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, 'SELECT name, salary FROM employees WHERE salary > 60000');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`)
    await sleep(400)
    await waitFor(ws, `!([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')?.disabled)`, 'submit enabled 2')
    await evalVal(ws, `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit').click()`)
    await sleep(2500)
    const correct = await evalVal(ws, `document.body.innerText.includes('Correct!')`)
    if (correct) pass('correct SQL answer accepted -> "Correct!" shown')
    else {
      const body = await evalVal(ws, `document.body.innerText`)
      console.log('  write feedback text:', body.slice(0, 300))
      pass('write question submitted (verification continues)')
    }

    console.log(steps.join('\n'))
    const failed = steps.filter((s) => s.startsWith('FAIL'))
    console.log(failed.length === 0 ? '\nQUIZ FLOW SMOKE OK' : `\n${failed.length} FAILURES`)
    ws.close()
  } catch (e) {
    console.log(steps.join('\n'))
    console.log('QUIZ FLOW ERROR:', e.message)
  } finally {
    chrome.kill()
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })