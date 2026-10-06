const CLAUSES = [
  { key: 'select', sql: 'SELECT', what: 'Choose the columns' },
  { key: 'from', sql: 'FROM', what: 'Choose the table they come from' },
  { key: 'where', sql: 'WHERE', what: 'Filter rows, one at a time' },
  { key: 'group', sql: 'GROUP BY', what: 'Collapse rows into groups' },
  { key: 'having', sql: 'HAVING', what: 'Filter the groups' },
  { key: 'order', sql: 'ORDER BY', what: 'Sort what is left' },
  { key: 'limit', sql: 'LIMIT', what: 'Cut off the end' },
]

export default function SyntaxMap({ highlight, accent = '#1554c7', ink = accent }) {
  const lit = Array.isArray(highlight) ? highlight : highlight ? [highlight] : null

  return (
    <div className="rounded-xl border border-line/80 bg-white p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Clause order · fixed by the grammar
      </div>

      <ol className="relative space-y-1">
        <span
          className="absolute left-[11px] top-3 bottom-3 w-px"
          style={{ background: `linear-gradient(180deg, ${accent}00, ${accent}66 12%, ${accent}66 88%, ${accent}00)` }}
          aria-hidden="true"
        />

        {CLAUSES.map((c, i) => {
          const on = !lit || lit.includes(c.key)
          return (
            <li
              key={c.key}
              className={`relative flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors ${
                on ? 'bg-brand-50/60' : ''
              }`}
            >
              <span
                className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-black"
                style={{
                  borderColor: on ? `${accent}88` : '#cbd5e1',
                  background: on ? `${accent}1f` : '#eef2f7',
                  color: on ? ink : '#4a6178',
                }}
              >
                {i + 1}
              </span>
              <code
                className="w-20 shrink-0 font-mono text-[12px] font-bold"
                style={{ color: on ? ink : '#3d566e' }}
              >
                {c.sql}
              </code>
              <span className="text-[12px] leading-snug text-muted">{c.what}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
