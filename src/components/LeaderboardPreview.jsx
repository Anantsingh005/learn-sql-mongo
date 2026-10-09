import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import RankBadge from './RankBadge.jsx'

const MAX_LIVES = 3

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Hearts({ lives }) {
  const left = Math.max(0, Math.min(lives ?? 0, MAX_LIVES))
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${left} lives left`}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3 w-3 ${i < left ? 'text-danger-500' : 'text-line'}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </span>
  )
}

export default function LeaderboardPreview() {
  const { user, profile } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(() => isSupabaseConfigured)

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) return undefined
    fetchPlayerSnapshot({ game: 'sql', userId: user?.id, top: 5 }).then((res) => {
      if (!active) return
      setRows(res.top ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user?.id])

  return (
    <section className="enter-rise relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-500 via-amber-400 to-brand-400 opacity-80" />

      <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-[minmax(0,200px)_1fr] md:items-start md:gap-6">
        <div className="flex flex-col items-start">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </span>

          <div className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-gradient">
            Leaderboard
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            See who&apos;s crushing the queries. Finish a quiz to save your score and climb the global rankings.
          </p>

          <Link
            to="/leaderboard"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-700"
          >
            View Leaderboard
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-end">
            <Link
              to="/leaderboard"
              className="group inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition-colors hover:text-brand-600"
            >
              View all
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line/80 bg-mist/70">
                  <th className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:px-3">Rank</th>
                  <th className="w-full px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:px-3">User</th>
                  <th className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:px-3">Score</th>
                  <th className="hidden px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:table-cell">Correct</th>
                  <th className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:px-3">Lives</th>
                  <th className="hidden px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-[13px] text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-[13px] text-muted">
                      {isSupabaseConfigured
                        ? 'No scores yet — finish a quiz and take the top spot!'
                        : 'Leaderboard is unavailable until Supabase is configured.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => {
                    const isYou = Boolean(user?.id && row.user_id === user.id)
                    const name = row.username || 'Anonymous'
                    const initial = name.charAt(0).toUpperCase()
                    const avatarUrl = isYou ? profile?.avatar_url || '' : ''
                    const correct = row.correct_count ?? 0
                    const total = row.total_questions ?? 0
                    return (
                      <tr
                        key={row.id ?? i}
                        className={`border-t border-line/70 ${isYou ? 'bg-brand-50' : ''}`}
                      >
                        <td className="px-2 py-1.5 sm:px-3">
                          <RankBadge rank={i + 1} />
                        </td>
                        <td className="w-full px-2 py-1.5 sm:px-3">
                          <span className="flex items-center gap-1.5">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded-full border border-brand-200 object-cover"
                              />
                            ) : (
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                  isYou
                                    ? 'border-brand-200 bg-white text-brand-700'
                                    : 'border-line bg-mist text-muted'
                                }`}
                              >
                                {initial}
                              </span>
                            )}
                            <span className={`block min-w-0 truncate text-[13px] ${isYou ? 'font-semibold text-ink' : 'text-muted'}`}>
                              {name}
                              {isYou && (
                                <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-px text-[9px] font-bold uppercase text-brand-700">
                                  You
                                </span>
                              )}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right text-sm font-bold tabular-nums text-ink sm:px-3 sm:text-left">
                          {row.score}
                        </td>
                        <td className="hidden px-3 py-1.5 tabular-nums text-muted sm:table-cell">
                          {correct}/{total}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3">
                          <Hearts lives={row.lives_left} />
                        </td>
                        <td className="hidden px-3 py-1.5 font-mono text-muted sm:table-cell">
                          {formatTime(row.time_seconds)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
