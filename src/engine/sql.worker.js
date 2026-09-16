import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url'
import sqljsModule from 'sql.js'
import { runSchema } from './sqlSchema.js'

const initSqlJs = typeof sqljsModule === 'function' ? sqljsModule : sqljsModule?.Module

let db = null
let SQL = null

async function ensureInit() {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => wasmUrl })
}

function toResultSet(result) {
  if (!result) return { columns: [], rows: [] }
  return { columns: result.columns, rows: result.values }
}

function lastResult(results) {
  if (!results || results.length === 0) return { columns: [], rows: [] }
  return toResultSet(results[results.length - 1])
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data
  try {
    await ensureInit()
    if (type === 'setup') {
      if (db) db.close()
      db = new SQL.Database()
      runSchema(db, payload.schema)
      self.postMessage({ id, ok: true })
    } else if (type === 'run') {
      if (!db) throw new Error('No database loaded. Setup the question first.')
      const results = db.exec(payload.sql)
      self.postMessage({ id, ok: true, payload: lastResult(results) })
    } else if (type === 'reset') {
      if (db) db.close()
      db = null
      self.postMessage({ id, ok: true })
    } else {
      self.postMessage({ id, ok: false, error: `Unknown command: ${type}` })
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: error.message || String(error) })
  }
}

self.postMessage({ id: 0, type: 'ready' })