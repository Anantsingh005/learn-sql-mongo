function ResultTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return <p className="py-2 text-center text-xs text-slate-500">0 rows returned</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-slate-800 text-indigo-300">
            {columns.map((c) => (
              <th key={c} className="border-b border-slate-700 px-3 py-1.5 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/30'}>
              {row.map((v, j) => (
                <td key={j} className="border-b border-slate-800 px-3 py-1 text-slate-300">
                  {v === null || v === undefined ? <span className="text-slate-600">NULL</span> : String(v)}
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