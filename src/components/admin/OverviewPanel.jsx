import { useEffect, useState } from 'react'
import { fetchStats } from '../../lib/admin.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${Math.floor(seconds % 60)}s`
  return `${Math.round(seconds)}s`
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export default function OverviewPanel() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let active = true
    fetchStats().then((s) => {
      if (!active) return
      setStats(s)
    })
    return () => {
      active = false
    }
  }, [])

  if (!stats) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading overview…</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Registered users" value={stats.profiles} sub={`${stats.admins} admin`} />
        <StatCard label="Scores submitted" value={stats.scores} sub={`${stats.byGame.sql} SQL · ${stats.byGame.mongo} Mongo`} />
        <StatCard label="Average score" value={stats.avgScore === null ? '—' : `${stats.avgScore.toFixed(1)}%`} sub="across all games" />
        <StatCard label="Total play time" value={formatTime(stats.totalSeconds)} sub="all submissions" />
        <StatCard label="Levels completed" value={stats.completed} sub="across user_progress" />
        <StatCard label="Question bank" value="SQL" sub="static, in src/data/sql" />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <h3 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Leaderboard topline (SQL)</h3>
        {stats.top.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">No scores yet.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {stats.top.map((row, i) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="flex items-center gap-3">
                  <span className="w-5 text-slate-500">{i + 1}</span>
                  <span className="font-medium text-slate-200">{row.username || 'Anonymous'}</span>
                </span>
                <span className="text-slate-400">
                  {row.score} · {i === 0 ? 'best' : `${formatTime(row.time_seconds)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}