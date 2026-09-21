import ResultTable from './ResultTable.jsx'
import { resolveSchema } from '../../engine/queryCheck.js'

function SchemaPanel({ schema }) {
  const resolved = resolveSchema(schema)
  if (!resolved) return null
  const tables = Object.entries(resolved)
  if (tables.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 text-xs font-medium text-slate-400">Tables</div>
      <div className="flex flex-col gap-3">
        {tables.map(([name, def]) => (
          <div key={name}>
            <div className="mb-1 font-mono text-xs font-semibold text-sky-300">{name}</div>
            <ResultTable columns={def.columns} rows={def.rows} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SchemaPanel
