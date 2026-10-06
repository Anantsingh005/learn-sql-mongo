import Console from './Console.jsx'
import SqlCode from './SqlCode.jsx'
import ResultTable from '../quiz/ResultTable.jsx'

export default function DmlBlock({ code, caption, tone, expectError, after }) {
  const bad = tone === 'bad' || expectError

  return (
    <div className="space-y-2.5">
      <Console
        title="sql"
        badge={expectError ? 'Refused' : bad ? 'Careful' : 'Writes'}
        badgeClass={
          expectError || bad
            ? 'bg-danger-50 text-danger-700'
            : 'bg-amber-50 text-amber-700'
        }
        className={bad ? 'border-danger-200 shadow-[0_2px_10px_rgba(#b03333,0.12)]' : 'border-amber-200'}
        bodyClass="p-3.5"
      >
        <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed">
          <SqlCode code={code} />
        </pre>
      </Console>

      {caption && (
        <p className="px-0.5 text-[13px] leading-relaxed text-body italic">{caption}</p>
      )}

      {expectError && (
        <p className="px-0.5 text-[13px] leading-relaxed text-danger-700">
          The database refuses this one, and no rows change.
        </p>
      )}

      {after && (
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {after.label ?? 'The table afterwards'}
          </div>
          <pre className="mb-2 overflow-x-auto font-mono text-[12px] leading-relaxed text-muted">
            <SqlCode code={after.query} />
          </pre>
          <ResultTable columns={after.columns} rows={after.rows} />
        </div>
      )}
    </div>
  )
}
