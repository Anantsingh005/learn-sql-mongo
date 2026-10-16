/**
 * Practice picker end-to-end check.
 *
 * Boots its own dev server, drives the /practice setup screen in headless
 * Chrome and asserts the things the animation pass can silently break:
 *
 *   - the count shown for a combination equals the real bank (recomputed here
 *     from practice-questions.json, NOT from the app's own helper);
 *   - a session starts from a non-empty combination;
 *   - the filter state survives a reload and back/forward navigation;
 *   - no horizontal scrollbar at 1440 / 1024 / 390;
 *   - the entrance cascade + CTA pulse exist with motion on, and every picker
 *     animation is switched off with prefers-reduced-motion: reduce.
 *
 * Usage: node scripts/browser-practice-picker.mjs
 */
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9231
const DEV_PORT = 5173
const BASE = `http://127.0.0.1:${DEV_PORT}`

const questions = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/data/practice/practice-questions.json', import.meta.url)), 'utf8'),
)

// The section->topic map only ever confirms a question's stored topic or falls
// back to it, so counting by the stored `topic` is exactly what the picker shows.
function expected(topic = 'all', level = 'all', type = 'all') {
  return questions.filter(
    (q) =>
      (topic === 'all' || q.topic === topic) &&
      (level === 'all' || q.difficulty === level) &&
      (type === 'all' || q.type === type),
  ).length
}

function bootServer() {
  return spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'dev', '--', '--port', String(DEV_PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: process.cwd(), stdio: 'ignore', shell: process.platform === 'win32' },
  )
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE)
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
    const timer = setTimeout(() => reject(new Error('no reply: ' + method)), 15000)
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
  const r = await send(ws, 'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text)
  return r.result?.result?.value
}

async function waitFor(ws, expr, label, ms = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ev(ws, expr)) return
    await sleep(250)
  }
  throw new Error('timeout: ' + label)
}

async function goto(ws, url, readyExpr, label, ms = 15000) {
  await send(ws, 'Page.navigate', { url })
  await waitFor(ws, readyExpr, label, ms)
}

const steps = []
const pass = (s) => {
  steps.push('PASS ' + s)
  console.log('PASS ' + s)
}
const fail = (s) => {
  steps.push('FAIL ' + s)
  console.log('FAIL ' + s)
}
const check = (ok, s) => (ok ? pass(s) : fail(s))

const PICKER_READY = `document.body.innerText.includes('Pick Your Practice')`
const EMPTY_READY = `document.body.innerText.includes('No questions match those filters')`
const SESSION_READY = `document.body.innerText.includes('End practice')`
const READ_COUNT = `(() => {
  const el = document.querySelector('[role="status"]')
  if (!el || /Loading/.test(el.textContent)) return null
  const m = el.textContent.match(/\\d+/)
  return m ? Number(m[0]) : null
})()`

async function readCount(ws, want) {
  const t0 = Date.now()
  let last = null
  while (Date.now() - t0 < 6000) {
    const v = await ev(ws, READ_COUNT)
    if (v !== null) {
      last = v
      if (v === want) return v
    }
    await sleep(150)
  }
  return last
}

async function startDisabled(ws) {
  return ev(ws, `(() => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start Practicing'))
    return el ? el.disabled : null
  })()`)
}

const COMBOS = [
  ['all', 'all', null, 646, 'all · all · all'],
  ['table-query', 'all', null, expected('table-query'), 'table-query · all'],
  ['joins', 'all', null, expected('joins'), 'joins · all'],
  ['aggregation', 'all', null, expected('aggregation'), 'aggregation · all'],
  ['all', 'all', 'write', expected('all', 'all', 'write'), 'all · write'],
  ['all', 'all', 'bug', expected('all', 'all', 'bug'), 'all · bug'],
  ['all', 'all', 'mcq', expected('all', 'all', 'mc'), 'all · mcq'],
  ['table-query', 'easy', null, expected('table-query', 'easy'), 'table-query · easy'],
  ['joins', 'hard', 'bug', expected('joins', 'hard', 'bug'), 'joins · hard · bug'],
  ['aggregation', 'medium', null, expected('aggregation', 'medium'), 'aggregation · medium'],
  ['joins', 'easy', 'write', 0, 'joins · easy · write (empty)'],
]

function comboUrl([topic, level, type]) {
  const p = new URLSearchParams()
  p.set('topic', topic)
  if (level !== 'all') p.set('level', level)
  if (type) p.set('type', type)
  return `${BASE}/practice?${p.toString()}`
}

async function main() {
  const server = bootServer()
  let chrome
  try {
    await waitForServer()
    chrome = spawn(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `--remote-debugging-port=${PORT}`,
        '--user-data-dir=C:/Users/Anant/AppData/Local/Temp/opencode/chrome-picker',
        BASE,
      ],
      { stdio: 'ignore' },
    )

    const pages = await waitForDebugger()
    const page = pages.find((p) => p.type === 'page')
    if (!page) throw new Error('no page target')
    const ws = await connect(page.webSocketDebuggerUrl)
    await send(ws, 'Runtime.enable')
    await send(ws, 'Page.enable')
    await send(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    })

    // 0. Bare /practice shows the mode select; the SQL card opens the picker.
    await goto(
      ws,
      `${BASE}/practice`,
      `[...document.querySelectorAll('button')].some((b) => b.textContent.includes('SQL Practice'))`,
      'game select',
      45000,
    )
    pass('bare /practice renders the mode select')
    await waitFor(
      ws,
      `(() => {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('SQL Practice'))
        if (!b) return false
        b.click()
        return true
      })()`,
      'click sql card',
    )
    await waitFor(ws, PICKER_READY, 'picker from card')
    pass('SQL card opens the picker')

    // 1. Counts vs the real bank for several combinations.
    for (const combo of COMBOS) {
      const [, , , want, label] = combo
      if (want === 0) {
        await goto(ws, comboUrl(combo), EMPTY_READY, `empty ${label}`)
        check(
          await ev(ws, `!document.body.innerText.includes('Pick Your Practice')`),
          `${label} shows the empty screen, not the picker`,
        )
        continue
      }
      await goto(ws, comboUrl(combo), PICKER_READY, `picker ${label}`)
      const got = await readCount(ws, want)
      check(got === want, `count ${label}: bank=${want} ui=${got}`)
      check((await startDisabled(ws)) === false, `Start enabled for ${label}`)
    }

    // 2. A deep-linked empty combination shows the friendly empty screen; its
    // button returns to the (now populated) setup screen.
    await goto(ws, comboUrl(['joins', 'easy', 'write']), EMPTY_READY, 'empty combo')
    check(
      await ev(ws, `!document.body.innerText.includes('Pick Your Practice')`),
      'empty combo replaces the picker',
    )
    await ev(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Back to setup')).click()`)
    await waitFor(ws, PICKER_READY, 'back to setup')
    pass('Back to setup returns to the picker')

    // 3. Start a session from a non-empty combination.
    await goto(ws, comboUrl(['table-query', 'easy', null]), PICKER_READY, 'table easy')
    await readCount(ws, expected('table-query', 'easy'))
    await ev(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start Practicing')).click()`)
    await waitFor(
      ws,
      `document.body.innerText.includes('End practice') && /Question\\s*1\\s*\\//.test(document.body.innerText)`,
      'session started',
      20000,
    )
    pass('session starts and renders the first question')

    // 4. URL params survive reload.
    await goto(ws, comboUrl(['joins', 'hard', 'bug']), PICKER_READY, 'joins hard bug')
    await ev(ws, `location.reload()`)
    await waitFor(ws, PICKER_READY, 'picker after reload')
    const selectedAfterReload = await ev(ws, `(() => {
      const row = document.querySelector('[aria-labelledby="practice-filter-topic-label"]')
      const chip = row && [...row.querySelectorAll('[role="radio"]')].find((c) => c.getAttribute('aria-checked') === 'true')
      return chip ? chip.textContent.trim() : null
    })()`)
    check(selectedAfterReload === 'Joins', `reload restores topic chip (got ${selectedAfterReload})`)
    const urlAfterReload = await ev(ws, `location.search`)
    check(/topic=joins/.test(urlAfterReload ?? ''), 'reload keeps ?topic=joins')

    // 5. Back / forward restores the previous selection.
    const clickTopic = (label) => `(() => {
      const row = document.querySelector('[aria-labelledby="practice-filter-topic-label"]')
      const chip = row && [...row.querySelectorAll('[role="radio"]')].find((c) => c.textContent.trim() === ${JSON.stringify(label)})
      if (!chip) return false
      chip.click()
      return true
    })()`
    await ev(ws, clickTopic('Aggregation'))
    await waitFor(ws, `location.search.includes('topic=aggregation')`, 'topic aggregation')
    await ev(ws, `history.back()`)
    await waitFor(ws, `location.search.includes('topic=joins')`, 'back to joins')
    pass('history.back() restores joins')
    await ev(ws, `history.forward()`)
    await waitFor(ws, `location.search.includes('topic=aggregation')`, 'forward to aggregation')
    pass('history.forward() restores aggregation')

    // 6. No horizontal scrollbar at three widths.
    for (const [w, h, label] of [
      [1440, 900, '1440'],
      [1024, 800, '1024'],
      [390, 844, '390'],
    ]) {
      await send(ws, 'Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: w < 700,
      })
      await goto(ws, comboUrl(['all', 'all', null]), PICKER_READY, `picker ${label}`)
      await sleep(400)
      const overflow = await ev(ws, `({
        doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      })`)
      check(overflow.doc <= 0 && overflow.body <= 0, `no horizontal scroll at ${label} (${JSON.stringify(overflow)})`)
    }

    // 7. Motion on: entrance cascade + CTA pulse are present.
    await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await send(ws, 'Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
    await goto(ws, comboUrl(['all', 'all', null]), PICKER_READY, 'motion on')
    await ev(ws, `document.querySelector('[role="radiogroup"]').scrollIntoView({ block: 'center' })`)
    await waitFor(ws, `document.querySelectorAll('.picker-row').length === 3`, 'rows animated in')
    const chipCount = await ev(ws, `document.querySelectorAll('.picker-chip').length`)
    check(chipCount === 12, `all 12 chips carry the entrance class (got ${chipCount})`)
    const delays = await ev(ws, `[...document.querySelectorAll('.picker-chip')].map((c) => getComputedStyle(c).animationDelay)`)
    check(new Set(delays).size > 1, 'chips have staggered animation delays')
    const pulse = await ev(
      ws,
      `getComputedStyle([...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start Practicing')).parentElement).animationName`,
    )
    check(pulse === 'picker-cta-pulse', `enabled CTA pulses (got ${pulse})`)

    // 8. Hover lifts a chip (transform-only change). Target an unselected,
    // enabled chip — selected/disabled chips intentionally do not lift. Wait for
    // the entrance cascade to settle so the chip stays under the pointer.
    const UNSELECTED_CHIP = `[...document.querySelectorAll('[role="radio"]')].find((c) => c.getAttribute('aria-checked') !== 'true' && c.getAttribute('aria-disabled') !== 'true')`
    await ev(ws, `(() => { const c = ${UNSELECTED_CHIP}; if (c) c.scrollIntoView({ block: 'center' }) })()`)
    await sleep(1300)
    const before = await ev(ws, `(() => {
      const c = ${UNSELECTED_CHIP}
      const s = getComputedStyle(c)
      return s.transform + '|' + s.translate + '|' + s.scale
    })()`)
    const box = await ev(ws, `(() => {
      const c = ${UNSELECTED_CHIP}
      const r = c.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: c.textContent.trim() }
    })()`)
    await send(ws, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y })
    await sleep(450)
    const after = await ev(ws, `(() => {
      const c = ${UNSELECTED_CHIP}
      const s = getComputedStyle(c)
      return s.transform + '|' + s.translate + '|' + s.scale
    })()`)
    check(before !== after, `chip "${box.label}" hover changes transform (${before} -> ${after})`)

    // 9. Reduced motion: every picker animation is off.
    await send(ws, 'Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await goto(ws, comboUrl(['all', 'all', null]), PICKER_READY, 'reduced motion')
    check(await ev(ws, `window.matchMedia('(prefers-reduced-motion: reduce)').matches`), 'reduced motion emulated')
    const reduced = await ev(ws, `(() => {
      const names = new Set()
      for (const sel of ['.picker-row', '.picker-chip', '.picker-check']) {
        const el = document.querySelector(sel)
        if (el) names.add(getComputedStyle(el).animationName)
      }
      const cta = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start Practicing'))
      if (cta) names.add(getComputedStyle(cta.parentElement).animationName)
      const card = document.querySelector('.reveal')
      if (card) names.add(getComputedStyle(card).opacity)
      return [...names]
    })()`)
    check(
      reduced.every((n) => n === 'none' || n === '1'),
      `reduced motion disables picker animations (${JSON.stringify(reduced)})`,
    )

    // 10. Session screen: a11y semantics, keyboard shortcuts, touch targets,
    // and no horizontal scroll at multiple widths.
    const pressKey = (k) =>
      ev(ws, `window.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true }))`)

    await send(ws, 'Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
    await goto(ws, `${BASE}/practice?type=mcq`, PICKER_READY, 'mc picker')
    await ev(ws, `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start Practicing')).click()`)
    await waitFor(ws, SESSION_READY, 'mc session', 20000)
    pass('multiple-choice session starts')

    const radiogroup = await ev(ws, `(() => {
      const g = document.querySelector('[role="radiogroup"]')
      if (!g) return null
      const opts = [...g.querySelectorAll('[role="radio"]')]
      return { label: g.getAttribute('aria-label'), count: opts.length, checked: opts.filter((o) => o.getAttribute('aria-checked') === 'true').length }
    })()`)
    check(!!radiogroup && radiogroup.count >= 2, `options form a labelled radiogroup (${JSON.stringify(radiogroup)})`)
    check(radiogroup?.checked === 0, 'no option is checked before choosing')

    await pressKey('b')
    await sleep(150)
    check(
      (await ev(ws, `document.querySelectorAll('[role="radio"][aria-checked="true"]').length`)) === 1,
      'pressing B selects exactly one option',
    )

    const progressbar = await ev(ws, `(() => {
      const p = document.querySelector('[role="progressbar"]')
      return p ? { now: p.getAttribute('aria-valuenow'), max: p.getAttribute('aria-valuemax') } : null
    })()`)
    check(!!progressbar?.now, `progress exposes role=progressbar (${JSON.stringify(progressbar)})`)

    await pressKey('Enter')
    await waitFor(ws, `document.body.innerText.includes('Next question')`, 'mc feedback', 8000)
    const live = await ev(
      ws,
      `(() => { const r = document.querySelector('[role="status"][aria-live="polite"]'); return r ? r.textContent.trim() : '' })()`,
    )
    check(/Correct|Not quite|skipped/.test(live), `verdict announced in the live region ("${live}")`)

    await pressKey('Enter')
    await waitFor(
      ws,
      `!document.body.innerText.includes('Next question') && /Question\\s*2\\s*\\//.test(document.body.innerText)`,
      'mc advanced',
      8000,
    )
    pass('Enter advances from feedback to the next question')

    // S skips the current choice question (both types offer a Skip control).
    await pressKey('s')
    await waitFor(ws, `document.body.innerText.includes('Skipped')`, 'mc skip', 8000)
    const skipLive = await ev(
      ws,
      `(() => { const r = document.querySelector('[role="status"][aria-live="polite"]'); return r ? r.textContent.trim() : '' })()`,
    )
    check(/skipped/i.test(skipLive), `S skips a choice question and announces it ("${skipLive}")`)
    await pressKey('Enter')
    await waitFor(ws, `!document.body.innerText.includes('Next question')`, 'mc advanced after skip', 8000)
    pass('Enter advances after a skip')

    const smallTargets = await ev(ws, `(() => {
      const small = []
      for (const b of document.querySelectorAll('button, [role="radio"]')) {
        const r = b.getBoundingClientRect()
        if (r.height > 0 && r.height < 44) small.push(b.textContent.trim().slice(0, 24) + ':' + Math.round(r.height))
      }
      return small
    })()`)
    check(smallTargets.length === 0, `every session control is >=44px tall (${JSON.stringify(smallTargets)})`)

    for (const [w, label] of [[1440, '1440'], [1200, '1200'], [1024, '1024'], [390, '390']]) {
      await send(ws, 'Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 })
      await sleep(350)
      const o = await ev(ws, `document.documentElement.scrollWidth - document.documentElement.clientWidth`)
      check(o <= 0, `no horizontal scroll on the session at ${label} (${o})`)
    }

    ws.close()
  } finally {
    const killTree = (proc) => {
      if (!proc) return
      if (process.platform === 'win32') {
        try {
          execFileSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
          return
        } catch {}
      }
      try {
        proc.kill()
      } catch {}
    }
    killTree(chrome)
    killTree(server)
  }

  const failures = steps.filter((s) => s.startsWith('FAIL'))
  console.log(`\n${steps.length - failures.length}/${steps.length} checks passed`)
  if (failures.length) {
    console.log('PICKER E2E FAILED')
    process.exit(1)
  }
  console.log('PICKER E2E OK')
  process.exit(0)
}

main().catch((e) => {
  console.log('PICKER E2E ERROR:', e.message)
  process.exit(1)
})
