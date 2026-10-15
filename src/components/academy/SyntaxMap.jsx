import BlockCard from './BlockCard.jsx'
import { SyntaxIcon } from './BlockIcons.jsx'

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
    <BlockCard
      icon={<SyntaxIcon className="h-4 w-4" />}
      title="Clause order"
      tone="plum"
      bodyClassName="p-4 sm:p-5"
    >
      <div className="overflow-x-auto">
        <ol className="relative min-w-[280px] space-y-1">
          <span
            className="absolute left-[11px] top-3 bottom-3 w-px"
            style={{
              background: `linear-gradient(180deg, ${accent}00, ${accent}66 12%, ${accent}66 88%, ${accent}00)`,
            }}
            aria-hidden="true"
          />

          {CLAUSES.map((c, i) => {
            const on = !lit || lit.includes(c.key)
            return (
              <li
                key={c.key}
                className={`relative flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg px-1.5 py-1.5 transition-colors ${
                  on ? 'bg-plum-50/60' : ''
                }`}
              >
                <span
                  className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-black"
                  style={{
                    borderColor: on ? `${accent}88` : 'var(--color-line)',
                    background: on ? `${accent}1f` : 'var(--color-mist)',
                    color: on ? ink : 'var(--color-muted)',
                  }}
                >
                  {i + 1}
                </span>
                <code
                  className="w-20 shrink-0 font-mono text-[12px] font-bold"
                  style={{ color: on ? ink : 'var(--color-body)' }}
                >
                  {c.sql}
                </code>
                <span className="min-w-0 text-[12px] leading-snug text-muted">{c.what}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </BlockCard>
  )
}
