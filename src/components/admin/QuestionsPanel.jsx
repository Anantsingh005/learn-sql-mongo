import { useMemo } from 'react'
import { questionAnalytics } from '../../lib/admin.js'

const TYPE_LABELS = { mc: 'Multiple choice', write: 'Write a query', bug: 'Fix the bug' }

export default function QuestionsPanel() {
  const data = useMemo(() => questionAnalytics(), [])

  const types = Object.entries(data.byType).sort((a, b) => (TYPE_LABELS[a[0]] ?? a[0]).localeCompare(TYPE_LABELS[b[0]] ?? b[0]))
  const topicRows = Object.entries(data.topics).sort((a, b) => b[1] - a[1]).slice(0, 25)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Total questions</div>
          <div className="mt-1 text-2xl font-bold text-ink">{data.total}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4 sm:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Integrity check</div>
          {data.issues.length === 0 && data.dupIds.length === 0 ? (
            <div className="mt-2 text-sm font-medium text-leaf-600">All questions pass — no duplicates or missing fields.</div>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-danger-700">
              {data.dupIds.map((id) => (
                <li key={`dup-${id}`}>Duplicate id: {id}</li>
              ))}
              {data.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-white">
          <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">By type and difficulty</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-line/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Type / Difficulty</th>
                <th className="px-4 py-2 text-right font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {types.map(([type, count]) => (
                <tr key={type}>
                  <td className="px-4 py-2 text-body">{TYPE_LABELS[type] ?? type}</td>
                  <td className="px-4 py-2 text-right text-muted">{count}</td>
                </tr>
              ))}
              <tr className="bg-line/40">
                <td className="px-4 py-2 font-medium text-body">Easy</td>
                <td className="px-4 py-2 text-right font-medium text-muted">{data.byDiff.easy ?? 0}</td>
              </tr>
              <tr className="bg-line/40">
                <td className="px-4 py-2 font-medium text-body">Medium</td>
                <td className="px-4 py-2 text-right font-medium text-muted">{data.byDiff.medium ?? 0}</td>
              </tr>
              <tr className="bg-line/40">
                <td className="px-4 py-2 font-medium text-body">Hard</td>
                <td className="px-4 py-2 text-right font-medium text-muted">{data.byDiff.hard ?? 0}</td>
              </tr>
              <tr className="bg-line/40">
                <td className="px-4 py-2 font-medium text-ink">Matrix</td>
                <td className="px-4 py-2 text-right text-xs text-muted">
                  {Object.entries(data.matrix).map(([cell, n]) => (
                    <span key={cell} className="ml-2">{cell.split('/')[0]}:{cell.split('/')[1]} → {n}</span>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-white">
          <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Topics ({Object.keys(data.topics).length})</h3>
          {topicRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No topic labels found.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line/60 overflow-y-auto">
              {topicRows.map(([topic, count]) => (
                <li key={topic} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-muted">{topic}</span>
                  <span className="text-xs text-muted">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Schema usage</h3>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {Object.entries(data.schemaRefs).map(([ref, count]) => (
            <span key={ref} className="rounded-full bg-line px-3 py-1 text-xs text-muted">
              {ref === 'inline' ? 'inline schema' : `'${ref}'`} · {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}