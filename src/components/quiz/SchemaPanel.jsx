import { useState } from 'react'
import ResultTable from './ResultTable.jsx'
import { resolveSchema } from '../../engine/queryCheck.js'

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

function SchemaPanel({ schema, variant = 'full' }) {
  const [open, setOpen] = useState(defaultOpen)
  const resolved = resolveSchema(schema)
  if (!resolved) return null
  const tables = Object.entries(resolved)
  if (tables.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
        <div className="flex items-center gap-2 border-b border-line bg-mist/50 px-4 py-2.5">
          <DatabaseIcon className="h-4 w-4 text-brand-600" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-body">Schema</span>
        </div>
        <div className="flex flex-col gap-3 px-4 py-3.5">
          {tables.map(([name, def]) => (
            <div key={name}>
              <div className="font-mono text-xs font-bold text-brand-700">{name}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {def.columns.map((col) => (
                  <span key={col} className="rounded-md bg-mist px-1.5 py-0.5 font-mono text-[10px] text-body">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-mist"
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
        <div className="flex flex-col gap-4 border-t border-line bg-white px-4 py-4">
          {tables.map(([name, def]) => (
            <div key={name}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-brand-700">{name}</span>
              </div>
              <ResultTable columns={def.columns} rows={def.rows} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SchemaPanel
