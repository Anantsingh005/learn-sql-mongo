import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress } from '../lib/progress.js'
import { fetchUserScores } from '../lib/profile.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const MODES = [
  { key: 'mc', label: 'Multiple Choice', short: 'MC' },
  { key: 'write', label: 'Write a Query', short: 'Write' },
  { key: 'bug', label: 'Fix the Bug', short: 'Bug' },
]

const LEVELS = [
  { key: 'easy', label: 'Easy', ring: 'border-emerald-500/50', chip: 'bg-emerald-500/15 text-emerald-300', glow: 'shadow-[0_0_18px_rgba(16,185,129,0.25)]' },
  { key: 'medium', label: 'Medium', ring: 'border-amber-500/50', chip: 'bg-amber-500/15 text-amber-300', glow: 'shadow-[0_0_18px_rgba(245,158,11,0.25)]' },
  { key: 'hard', label: 'Hard', ring: 'border-rose-500/50', chip: 'bg-rose-500/15 text-rose-300', glow: 'shadow-[0_0_18px_rgba(244,63,94,0.25)]' },
]

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '—'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${Math.floor(totalSeconds % 60)}s`
  return `${Math.round(totalSeconds)}s`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function initialFor({ profile, user }) {
  return (profile?.username ?? user?.email ?? '?').charAt(0).toUpperCase()
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  )
}

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const [progress, setProgress] = useState(null)
  const [scores, setScores] = useState(null)

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    Promise.all([getProgress('sql', user.id), getProgress('mongo', user.id)])
      .then(([sql, mongo]) => {
        if (!active) return
        setProgress({ sql, mongo })
      })
      .catch(() => {
        if (!active) return
        setProgress({ sql: { completed: [], best: {} }, mongo: { completed: [], best: {} } })
      })
    fetchUserScores(user.id).then((res) => {
      if (!active) return
      setScores(res)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-slate-500">
        Profile is unavailable until Supabase is configured.
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Your profile</h1>
        <p className="mt-3 text-sm text-slate-400">Sign in to see your account details and game progress.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Sign in
        </Link>
      </div>
    )
  }

  const sqlProgress = progress?.sql ?? { completed: [], best: {} }
  const mongoProgress = progress?.mongo ?? { completed: [], best: {} }
  const stats = scores?.stats
  const recentRows = (scores?.rows ?? []).slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full border border-indigo-500/20" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full border border-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border border-cyan-500/10" />

        <div className="relative flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-indigo-400/40 bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-3xl font-black text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]">
            {initialFor({ profile, user })}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{profile?.username ?? 'player'}</h1>
            {profile?.name && <div className="text-sm text-slate-300">{profile.name}</div>}
            <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:justify-start">
              <span>{user.email}</span>
              <span>Member since {formatDate(profile?.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-rose-700/60 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 sm:ml-auto"
          >
            Sign out
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">SQL game progress</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((mode) => (
            <div key={mode.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{mode.label}</div>
              <div className="grid grid-cols-1 gap-2">
                {LEVELS.map((lv) => {
                  const pct = sqlProgress.best[`${mode.key}_${lv.key}`] ?? 0
                  const done = (sqlProgress.completed ?? []).includes(`${mode.key}_${lv.key}`)
                  const active = pct > 0
                  return (
                    <div key={lv.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black ${
                            active ? `${lv.ring} ${lv.chip}` : 'border-slate-700 bg-slate-800 text-slate-600'
                          }`}
                        >
                          {pct}%
                        </div>
                        <span className="text-xs text-slate-400">{lv.label}</span>
                      </div>
                      {done ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">✔ done</span>
                      ) : active ? (
                        <span className="text-[10px] text-slate-500">in progress</span>
                      ) : (
                        <span className="text-[10px] text-slate-600">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {(mongoProgress.completed ?? []).length > 0 || Object.keys(mongoProgress.best ?? {}).length > 0 ? (
          <p className="mt-3 text-xs text-slate-500">
            Mongo progress saved: {mongoProgress.completed.length} completed level{(mongoProgress.completed.length === 1 ? '' : 's')}.
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Practice &amp; sessions</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Sessions" value={stats ? String(stats.sessions) : '…'} />
          <Stat label="Total play time" value={stats ? formatDuration(stats.totalSeconds) : '…'} />
          <Stat label="Average score" value={stats ? (stats.averageScore === null ? '—' : `${stats.averageScore}%`) : '…'} />
          <Stat label="Best score" value={stats?.best ? `${stats.best.score}%` : '—'} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {stats ? `${stats.byGame.sql} SQL · ${stats.byGame.mongo} Mongo submissions` : ''}
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <h3 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Recent sessions</h3>
          {recentRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No sessions yet.{' '}
              <Link to="/quiz/sql" className="text-indigo-300 hover:text-indigo-200">Play a level</Link> to record one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {recentRows.map((row) => (
                <li key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                      {row.game}
                    </span>
                    <span className="text-slate-500">{formatDate(row.created_at)}</span>
                  </span>
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">{row.score}%</span> · {formatDuration(row.time_seconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}