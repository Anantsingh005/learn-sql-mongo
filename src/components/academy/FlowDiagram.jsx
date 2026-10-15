import BlockCard from './BlockCard.jsx'
import TableCard from './TableCard.jsx'
import { FlowIcon } from './BlockIcons.jsx'
import { Badge } from './BlockParts.jsx'

// "How the rows transform" — a white card containing a short chain of steps,
// each showing the query and the rows it produces. The chain scrolls inside the
// card on small screens.

export default function FlowDiagram({ steps, caption, accent = '#1554c7', ink = accent }) {
  return (
    <BlockCard
      icon={<FlowIcon />}
      title="Row flow"
      tone="plum"
      meta={<Badge tone="slate">{steps.length} steps</Badge>}
      bodyClassName="space-y-3 p-4 sm:p-5"
    >
      <div className="space-y-1 overflow-x-auto">
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

            <div className="rounded-xl border border-line bg-mist/30 p-3">
              <div className="mb-2 flex items-start gap-2">
                <span
                  className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[9px] font-black"
                  style={{ background: '#fff', color: ink, boxShadow: `inset 0 0 0 1px ${accent}66` }}
                >
                  {i + 1}
                </span>
                <code className="min-w-0 font-mono text-[12px] leading-snug text-body">
                  {step.label}
                </code>
                <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted">
                  {step.rows.length} {step.rows.length === 1 ? 'row' : 'rows'}
                </span>
              </div>

              <TableCard columns={step.columns} rows={step.rows} />

              {step.note && (
                <p className="mt-2 border-t border-line pt-2 text-[12px] leading-relaxed text-muted">
                  {step.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {caption && (
        <p className="text-[13px] italic leading-relaxed text-body">{caption}</p>
      )}
    </BlockCard>
  )
}
