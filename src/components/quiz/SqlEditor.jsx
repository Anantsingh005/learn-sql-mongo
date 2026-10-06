import { useCallback, useEffect, useRef, useState } from 'react'
import QueryRunner from '../../engine/QueryRunner.js'
import ResultTable from './ResultTable.jsx'

function SqlEditor({ question, onSubmit, disabled }) {
  const [sql, setSql] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [schemaReady, setSchemaReady] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    let active = true
    QueryRunner.setup(question.schema)
      .then(() => active && setSchemaReady(true))
      .catch(() => active && setError('Failed to load question database.'))
    return () => { active = false }
  }, [question])

  const handleRun = useCallback(async () => {
    if (!sql.trim() || running) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const rows = await QueryRunner.run(sql)
      setResult(rows)
    } catch (e) {
      setError(e.message || 'Query failed')
    } finally {
      setRunning(false)
    }
  }, [sql, running])

  const handleSubmit = useCallback(async () => {
    if (!sql.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(sql)
    } finally {
      setSubmitting(false)
    }
  }, [sql, submitting, onSubmit])

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line bg-white px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="font-mono">query.sql</span>
          </div>
          <button
            type="button"
            onClick={() => textareaRef.current?.focus()}
            className="rounded px-2 py-0.5 text-xs text-muted hover:bg-line hover:text-muted"
          >
            focus
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Write your SQL here — try Ctrl/Cmd + Enter to submit…"
          spellCheck={false}
          disabled={disabled}
          className="block min-h-28 w-full resize-y bg-transparent px-3 py-2 font-mono text-sm text-leaf-700 outline-none placeholder:text-body disabled:opacity-60"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={!sql.trim() || running || !schemaReady || disabled}
          className="rounded-lg border border-line bg-line px-4 py-1.5 text-sm font-medium text-body transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? 'Running…' : 'Run'}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!sql.trim() || submitting || running || !schemaReady || disabled}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Checking…' : 'Submit'}
        </button>
        {!schemaReady && !error && (
          <span className="text-xs text-muted">Preparing database…</span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 font-mono text-xs text-danger-700">
          {error}
        </div>
      )}

      {result && !error && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted">
            Query result{result.rows.length > 0 ? ` (${result.rows.length} rows)` : ''}:
          </div>
          <ResultTable columns={result.columns} rows={result.rows} />
        </div>
      )}
    </div>
  )
}

export default SqlEditor