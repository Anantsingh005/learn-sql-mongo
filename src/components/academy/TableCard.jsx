import { useInView } from '../../hooks/useInView.js'
import { TableIcon } from './BlockIcons.jsx'

// A result table presented as a card: a small label chip with the table name,
// a header row, then zebra-striped body rows. Wide tables scroll horizontally
// inside the card (the wrapper is the only thing that scrolls), so a table can
// never widen the lesson page.

function Chip({ label }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-plum-200 bg-plum-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-plum-700">
      <TableIcon className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  )
}

export default function TableCard({
  label,
  columns,
  rows,
  caption,
  className = '',
  bodyClassName = '',
}) {
  const list = rows ?? []
  const count = list.length
  const [ref, inView] = useInView({ threshold: 0, rootMargin: '0px 0px -40px 0px' })

  return (
    <div ref={ref} className={`min-w-0 overflow-hidden rounded-xl border border-line bg-white ${className}`}>
      {(label || columns) && (
        <div className="flex items-center gap-2 border-b border-line bg-plum-50/50 px-3 py-2">
          {label && <Chip label={label} />}
          <span className="ml-auto shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
            {count} {count === 1 ? 'row' : 'rows'}
          </span>
        </div>
      )}

      {count === 0 ? (
        <p className="px-3 py-3 text-center text-xs text-muted">0 rows returned</p>
      ) : (
        <div className={`overflow-x-auto ${bodyClassName}`}>
          <table className="min-w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-line/40">
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className="whitespace-nowrap border-b border-line px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-body"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={inView ? 'trows-in' : undefined}>
              {list.map((row, i) => (
                <tr
                  key={i}
                  className={`trow ${i % 2 === 0 ? 'bg-white' : 'bg-mist/60'}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                >
                  {row.map((v, j) => (
                    <td
                      key={j}
                      className="whitespace-nowrap border-b border-line-soft px-3 py-1.5 text-body"
                    >
                      {v === null || v === undefined ? (
                        <span className="text-muted">NULL</span>
                      ) : (
                        String(v)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {caption && (
        <p className="border-t border-line-soft px-3 py-2 text-[12px] italic leading-relaxed text-muted">
          {caption}
        </p>
      )}
    </div>
  )
}
