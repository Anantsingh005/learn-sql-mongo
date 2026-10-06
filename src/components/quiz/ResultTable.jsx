function ResultTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return <p className="py-2 text-center text-xs text-muted">0 rows returned</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-line text-brand-700">
            {columns.map((c) => (
              <th key={c} className="border-b border-line px-3 py-1.5 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white/40' : 'bg-line/30'}>
              {row.map((v, j) => (
                <td key={j} className="border-b border-line px-3 py-1 text-body">
                  {v === null || v === undefined ? <span className="text-body">NULL</span> : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultTable