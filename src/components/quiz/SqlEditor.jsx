import { useCallback, useEffect, useRef, useState } from 'react'
import QueryRunner from '../../engine/QueryRunner.js'
import ResultTable from './ResultTable.jsx'
import QuizCardFooter from './QuizCardFooter.jsx'

function PlayIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}

function AlertIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}

function BugIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 9a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0V9Z" />
      <path d="M12 5v2M8.5 7.5 6.8 5.8M15.5 7.5l1.7-1.7" />
      <path d="M4.5 12H8M16 12h3.5M5 16l2.6-1.2M19 16l-2.6-1.2M6.5 20l2.3-2.4M17.5 20l-2.3-2.4" />
    </svg>
  )
}

function TableIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9 4.5v15" />
    </svg>
  )
}

function ComparisonResult({ answer, question }) {
  const actual = answer?.actualResult
  return (
    <div className={`grid gap-4 ${actual ? 'sm:grid-cols-2' : ''}`}>
      {actual && (
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            Your result
          </div>
          <ResultTable columns={actual.columns} rows={actual.rows} />
        </div>
      )}
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" aria-hidden="true" />
          Expected result
        </div>
        <ResultTable columns={question.expected.columns} rows={question.expected.rows} />
      </div>
    </div>
  )
}

function SqlEditor({ question, onSubmit, isFeedback = false, snapshot, onNext, disabled = false }) {
  const isBug = question.type === 'bug'
  const [sql, setSql] = useState(() => (isBug ? question.buggyQuery ?? '' : ''))
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

  const locked = disabled || isFeedback || running || submitting
  const answer = isFeedback ? snapshot?.answers?.[snapshot.answers.length - 1] : null
  const isLast = snapshot ? snapshot.index + 1 >= snapshot.total || snapshot.lives <= 0 : false

  let statusText = 'Write your query, then submit'
  let statusTone = 'text-muted'
  let detail = null
  if (isFeedback && answer) {
    statusText = answer.correct ? 'Correct!' : 'Not quite'
    statusTone = answer.correct ? 'text-leaf-700' : 'text-danger-700'
    detail = (
      <>
        {answer.reason && <p className="mt-1 text-sm leading-relaxed text-body">{answer.reason}</p>}
        {question.explanation && (
          <p className="mt-1 text-sm leading-relaxed text-body">{question.explanation}</p>
        )}
      </>
    )
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-colors focus-within:border-brand-300">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-mist/60 px-3.5 py-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-danger-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-leaf-200" />
            </span>
            <span className="font-mono text-xs font-medium text-body">
              {isBug ? 'buggy_query.sql' : 'query.sql'}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
              schemaReady
                ? 'border-leaf-200 bg-leaf-50 text-leaf-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${schemaReady ? 'bg-leaf-500' : 'bg-amber-500 animate-pulse motion-reduce:animate-none'}`} />
            {schemaReady ? 'DB ready' : 'Loading DB'}
          </span>
        </div>

        {isBug && (
          <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-50/60 px-3.5 py-1.5 text-xs font-semibold text-amber-700">
            <BugIcon className="h-3.5 w-3.5" />
            Buggy query — fix it in the editor
          </div>
        )}

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
          placeholder="Write your SQL here…"
          spellCheck={false}
          disabled={locked}
          className="block min-h-32 w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none placeholder:text-muted/70 disabled:opacity-70"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
        <div className="flex items-center justify-between border-b border-line bg-mist/50 px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-body">
            {isFeedback ? 'Feedback' : 'Result'}
          </span>
          {running && <span className="font-mono text-[11px] text-muted">Running…</span>}
          {!running && result && !error && !isFeedback && (
            <span className="font-mono text-[11px] text-muted">
              {result.rows.length} {result.rows.length === 1 ? 'row' : 'rows'}
            </span>
          )}
        </div>
        <div className="p-3">
          {error ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-3.5 py-3">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-danger-700">SQL error</div>
                <p className="mt-1 font-mono text-xs leading-relaxed text-danger-700">{error}</p>
              </div>
            </div>
          ) : isFeedback && answer ? (
            <ComparisonResult answer={answer} question={question} />
          ) : result ? (
            <ResultTable columns={result.columns} rows={result.rows} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-mist/30 px-4 py-8 text-center">
              <TableIcon className="h-6 w-6 text-muted" />
              <p className="text-sm text-muted">Run your query to preview the result here.</p>
            </div>
          )}
        </div>
      </div>

      <QuizCardFooter status={statusText} statusTone={statusTone} detail={detail}>
        {isFeedback ? (
          <button
            type="button"
            onClick={onNext}
            className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 motion-safe:active:scale-[0.97]"
          >
            {isLast ? 'See results' : 'Next question'}
            <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
          </button>
        ) : (
          <>
            <span className="hidden font-mono text-[11px] text-muted sm:inline">Ctrl / Cmd + Enter</span>
            <button
              type="button"
              onClick={handleRun}
              disabled={!sql.trim() || running || !schemaReady || disabled}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-body transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40 motion-safe:enabled:active:scale-[0.97]"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              {running ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!sql.trim() || submitting || running || !schemaReady || disabled}
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:enabled:active:scale-[0.97]"
            >
              {submitting ? 'Checking…' : 'Submit'}
              <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
            </button>
          </>
        )}
      </QuizCardFooter>
    </div>
  )
}

export default SqlEditor
