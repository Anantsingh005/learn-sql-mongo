import { useState } from 'react'
import { resolveSchema } from '../../engine/queryCheck.js'
import { stagger } from '../site/motion.js'

const DESKTOP_QUERY = '(min-width: 1024px)'

function defaultOpen() {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia(DESKTOP_QUERY).matches
}

function DatabaseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
      <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// Sample rows from question.schema. Wide tables scroll inside the card: the
// wrapper is the scroll container, the table sizes to its content (min-w-full
// so it still fills when narrow) and never stretches the page.
//
// `cascade` is opt-in (practice turns it on): rows rise in one after another
// while the panel fades in. Both classes are no-ops without it, so the quiz
// screen that shares this component is untouched.
function SchemaTable({ columns, rows, cascade = false }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-line">
      <table className="w-max min-w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-line text-brand-700">
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap border-b border-line px-3 py-1.5 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? 'bg-white/40' : 'bg-line/30'} ${cascade ? 'trow' : ''}`}
              style={cascade ? stagger(i, 45, 80) : undefined}
            >
              {row.map((v, j) => (
                <td key={j} className="whitespace-nowrap border-b border-line px-3 py-1 text-body">
                  {v === null || v === undefined ? <span className="italic text-muted">NULL</span> : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SchemaPanel({ schema, className = 'mt-5', cascade = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const resolved = resolveSchema(schema)
  if (!resolved) return null
  const tables = Object.entries(resolved)
  if (tables.length === 0) return null

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)] ${cascade ? 'quiz-fade-swap' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left outline-none transition-colors hover:bg-mist focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset"
      >
        <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-body">
          <DatabaseIcon className="h-4 w-4 text-brand-600" />
          Schema
        </span>
        <span className="flex items-center gap-2 text-[11px] font-medium text-muted">
          {tables.length} {tables.length === 1 ? 'table' : 'tables'}
          <ChevronIcon className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className={`flex flex-col gap-4 border-t border-line bg-white px-4 py-4 ${cascade ? 'trows-in' : ''}`}>
          {tables.map(([name, def]) => {
            const columns = def?.columns ?? []
            const rows = def?.rows ?? []
            return (
              <div key={name} className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                  <span className="font-mono text-xs font-bold text-brand-700">{name}</span>
                </div>
                <SchemaTable columns={columns} rows={rows} cascade={cascade} />
                <p className="mt-1.5 text-[11px] font-medium text-muted">
                  {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SchemaPanel
export { SchemaTable }
