const TYPES = [
  {
    sql: 'INNER JOIN',
    alias: '= JOIN',
    keeps: 'Rows that match on both sides',
    drops: 'Unmatched rows from both tables',
    dropped: 'both',
  },
  {
    sql: 'LEFT JOIN',
    alias: '= LEFT OUTER JOIN',
    keeps: 'Every row from the left table',
    drops: 'Unmatched rows from the right table only',
    dropped: 'right',
  },
  {
    sql: 'RIGHT JOIN',
    alias: '= RIGHT OUTER JOIN',
    keeps: 'Every row from the right table',
    drops: 'Unmatched rows from the left table only',
    dropped: 'left',
  },
  {
    sql: 'FULL OUTER JOIN',
    alias: '',
    keeps: 'Every row from both tables',
    drops: 'Nothing — unmatched rows arrive padded with NULL',
    dropped: 'none',
  },
]

const SIDES = ['left', 'right']

/**
 * The join-types map. Chapter 4's whole argument is that a join is a promise
 * about which rows survive, so the map shows that promise for each type instead
 * of another grid of results — the numbers live in the verified examples
 * beside it.
 */
export default function JoinMap({ accent = '#38bdf8' }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Join types · which rows survive
      </div>

      <div className="space-y-1.5">
        {TYPES.map((t) => (
          <div
            key={t.sql}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-[12px] font-bold" style={{ color: accent }}>
                {t.sql}
              </code>
              {t.alias && (
                <span className="font-mono text-[10px] text-slate-600">{t.alias}</span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              {SIDES.map((side) => {
                const lost = t.dropped === side || t.dropped === 'both'
                return (
                  <div key={side} className="flex flex-1 items-center gap-1.5">
                    <div
                      className={`h-6 flex-1 rounded border ${
                        lost
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : 'border-slate-700 bg-slate-800/60'
                      }`}
                    />
                    <span
                      className={`shrink-0 font-mono text-[9px] uppercase tracking-wider ${
                        lost ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {side}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{t.keeps}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
              <span className="text-rose-400/90">Drops:</span> {t.drops}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Red means those rows disappear. A red side is how a join quietly loses
        data you did not know was there.
      </p>
    </div>
  )
}
