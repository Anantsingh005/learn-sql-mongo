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

export default function JoinMap({ accent = '#1554c7', ink = accent }) {
  return (
    <div className="rounded-xl border border-line/80 bg-white p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        Join types · which rows survive
      </div>

      <div className="space-y-1.5">
        {TYPES.map((t) => (
          <div
            key={t.sql}
            className="rounded-lg border border-line bg-white/40 p-2.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-[12px] font-bold" style={{ color: ink }}>
                {t.sql}
              </code>
              {t.alias && (
                <span className="font-mono text-[10px] text-body">{t.alias}</span>
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
                          ? 'border-danger-200 bg-danger-50'
                          : 'border-line bg-line/60'
                      }`}
                    />
                    <span
                      className={`shrink-0 font-mono text-[9px] uppercase tracking-wider ${
                        lost ? 'text-danger-600' : 'text-leaf-600'
                      }`}
                    >
                      {side}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="mt-1.5 text-[11px] leading-snug text-muted">{t.keeps}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-body">
              <span className="text-danger-600/90">Drops:</span> {t.drops}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Red means those rows disappear. A red side is how a join quietly loses
        data you did not know was there.
      </p>
    </div>
  )
}
