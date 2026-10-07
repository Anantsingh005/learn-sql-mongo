import ResultTable from '../quiz/ResultTable.jsx'
import Console from './Console.jsx'

export default function FlowDiagram({ steps, caption, accent = '#1554c7', ink = accent }) {
  return (
    <div className="space-y-2.5">
      <Console title="row flow" badge={`${steps.length} steps`} badgeClass="bg-line text-body">
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex items-center gap-2 py-1 pl-3" aria-hidden="true">
                  <span className="h-5 w-px" style={{ background: `${accent}55` }} />
                  <svg
                    className="h-3 w-3 -translate-y-1.5"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{ color: accent }}
                  >
                    <path
                      d="M6 8.5V3.5M6 3.5 3 6.5M6 3.5l3 3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="rounded-xl border border-line bg-white/60 p-2.5 transition-colors hover:bg-white/80">
                <div className="mb-2 flex items-start gap-2">
                  <span
                    className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[9px] font-black"
                    style={{ background: '#fff', color: ink, boxShadow: `inset 0 0 0 1px ${accent}66` }}
                  >
                    {i + 1}
                  </span>
                  <code className="font-mono text-[12px] leading-snug text-body">
                    {step.label}
                  </code>
                  <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-wider text-body">
                    {step.rows.length} {step.rows.length === 1 ? 'row' : 'rows'}
                  </span>
                </div>

                <ResultTable columns={step.columns} rows={step.rows} />

                {step.note && (
                  <p className="mt-2 border-t border-line pt-2 text-[12px] leading-relaxed text-muted">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Console>

      {caption && (
        <p className="px-0.5 text-[13px] leading-relaxed text-body italic">{caption}</p>
      )}
    </div>
  )
}
