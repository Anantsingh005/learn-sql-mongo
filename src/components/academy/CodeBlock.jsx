import Console from './Console.jsx'
import SqlCode from './SqlCode.jsx'
import ResultTable from '../quiz/ResultTable.jsx'

const TONES = {
  good: {
    ring: 'border-leaf-200',
    glow: 'shadow-[0_2px_10px_rgba(#3d7f55,0.1)]',
    badge: 'Works',
    badgeClass: 'bg-leaf-50 text-leaf-700',
  },
  bad: {
    ring: 'border-danger-200',
    glow: 'shadow-[0_2px_10px_rgba(#b03333,0.12)]',
    badge: 'Broken',
    badgeClass: 'bg-danger-50 text-danger-700',
  },
  plain: {
    ring: 'border-line/80',
    glow: '',
    badge: '',
    badgeClass: '',
  },
}

export default function CodeBlock({ code, caption, tone, expect, expectError }) {
  const t = TONES[tone] ?? TONES.plain
  const outcome = expectError
    ? { badge: 'Will not run', badgeClass: 'bg-danger-50 text-danger-700' }
    : expect
      ? { badge: 'Runs', badgeClass: 'bg-leaf-50 text-leaf-700' }
      : { badge: '', badgeClass: '' }

  return (
    <div className="space-y-2.5">
      <Console
        title="sql"
        badge={outcome.badge}
        badgeClass={outcome.badgeClass}
        className={`${t.ring} ${t.glow}`}
        bodyClass="p-3.5"
      >
        <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed">
          <SqlCode code={code} />
        </pre>
      </Console>

      {caption && (
        <p className="px-0.5 text-[13px] leading-relaxed text-body italic">{caption}</p>
      )}

      {expect && (
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {expect.label ?? 'Result'}
          </div>
          <ResultTable columns={expect.columns} rows={expect.rows} />
        </div>
      )}
    </div>
  )
}
