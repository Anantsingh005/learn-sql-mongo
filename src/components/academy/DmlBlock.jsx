import Console from './Console.jsx'
import SqlCode from './SqlCode.jsx'
import ResultTable from '../quiz/ResultTable.jsx'

/**
 * A statement that changes the database. `INSERT`, `UPDATE` and `DELETE` hand
 * back no rows, so the block carries the query that shows the table afterwards —
 * the reader sees the actual consequence of the statement, not a promise about
 * it. `scripts/verify-lessons.mjs` runs the statement and asserts that same
 * table, so the grid cannot drift from the prose.
 */
export default function DmlBlock({ code, caption, tone, expectError, after }) {
  const bad = tone === 'bad' || expectError

  return (
    <div className="space-y-2.5">
      <Console
        title="sql"
        badge={expectError ? 'Refused' : bad ? 'Careful' : 'Writes'}
        badgeClass={
          expectError || bad
            ? 'bg-rose-500/15 text-rose-300'
            : 'bg-amber-500/15 text-amber-300'
        }
        className={bad ? 'border-rose-500/35 shadow-[0_0_24px_rgba(244,63,94,0.12)]' : 'border-amber-500/30'}
        bodyClass="p-3.5"
      >
        <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed">
          <SqlCode code={code} />
        </pre>
      </Console>

      {caption && (
        <p className="px-0.5 text-[13px] leading-relaxed text-slate-600 italic">{caption}</p>
      )}

      {expectError && (
        <p className="px-0.5 text-[13px] leading-relaxed text-rose-700">
          The database refuses this one, and no rows change.
        </p>
      )}

      {after && (
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {after.label ?? 'The table afterwards'}
          </div>
          <pre className="mb-2 overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-500">
            <SqlCode code={after.query} />
          </pre>
          <ResultTable columns={after.columns} rows={after.rows} />
        </div>
      )}
    </div>
  )
}
