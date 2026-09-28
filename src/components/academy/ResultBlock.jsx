import ResultTable from '../quiz/ResultTable.jsx'
import Console from './Console.jsx'

/**
 * A result set shown on its own, with no query attached — used for the reference
 * tables in the book (the customers grid, the six comparison operators, and so on).
 */
export default function ResultBlock({ label, caption, columns, rows }) {
  return (
    <div className="space-y-2.5">
      <Console title={label} bodyClass="p-3">
        <ResultTable columns={columns} rows={rows} />
      </Console>
      {caption && (
        <p className="px-0.5 text-[13px] leading-relaxed text-slate-600 italic">{caption}</p>
      )}
    </div>
  )
}
