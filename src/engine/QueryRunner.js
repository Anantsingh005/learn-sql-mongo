let worker = null
let sequence = 0
const pending = new Map()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./sql.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (event) => {
    const { id, ok, payload, error, type } = event.data
    if (type === 'ready') return
    const handler = pending.get(id)
    if (!handler) return
    pending.delete(id)
    if (ok) handler.resolve(payload)
    else handler.reject(new Error(error || 'Unknown worker error'))
  }
  worker.onerror = (event) => {
    for (const [, handler] of pending) handler.reject(new Error(event.message || 'Worker crashed'))
    pending.clear()
  }
  return worker
}

function post(type, payload) {
  const id = ++sequence
  return new Promise((resolve, reject) => {
    const w = getWorker()
    pending.set(id, { resolve, reject })
    w.postMessage({ id, type, payload })
  })
}

export const QueryRunner = {
  async setup(schema) {
    return post('setup', { schema })
  },
  async run(sql) {
    return post('run', { sql })
  },
  async reset() {
    if (!worker) return
    return post('reset')
  },
}

export default QueryRunner