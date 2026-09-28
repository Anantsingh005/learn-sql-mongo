import Console from './Console.jsx'
import SqlCode from './SqlCode.jsx'
import ResultTable from '../quiz/ResultTable.jsx'

const TONES = {
  good: {
    ring: 'border-emerald-500/30',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.10)]',
    badge: 'Works',
    badgeClass: 'bg-emerald-500/15 text-emerald-300',
  },
  bad: {
    ring: 'border-rose-500/35',
    glow: 'shadow-[0_0_24px_rgba(244,63,94,0.12)]',
    badge: 'Broken',
    badgeClass: 'bg-rose-500/15 text-rose-300',
  },
  plain: {
    ring: 'border-slate-700/80',
    glow: '',
    badge: '',
    badgeClass: '',
  },
}

/** A SQL listing, and the result it produces when the block declares one. */
export default function CodeBlock({ code, caption, tone, expect, expectError }) {
  const t = TONES[tone] ?? TONES.plain
  const outcome = expectError
    ? { badge: 'Will not run', badgeClass: 'bg-rose-500/15 text-rose-300' }
    : expect
      ? { badge: 'Runs', badgeClass: 'bg-emerald-500/15 text-emerald-300' }
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
        <p className="px-0.5 text-[13px] leading-relaxed text-slate-600 italic">{caption}</p>
      )}

      {expect && (
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {expect.label ?? 'Result'}
          </div>
          <ResultTable columns={expect.columns} rows={expect.rows} />
        </div>
      )}
    </div>
  )
}
