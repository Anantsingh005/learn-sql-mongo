import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { getProgress } from '../lib/progress.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { isNarrow } from '../lib/viewport.js'
import SqlProgressGrid from './SqlProgressGrid.jsx'
import RankBadge from './RankBadge.jsx'

const GAMES = [
  { id: 'sql', label: 'SQL' },
  { id: 'mongo', label: 'Mongo' },
]

const MODES = [
  { key: 'mc', label: 'MC', icon: 'A', full: 'Multiple Choice' },
  { key: 'write', label: 'Write', icon: '>_', full: 'Write the Query' },
  { key: 'bug', label: 'Fix Bug', icon: '!', full: 'Fix the Bug' },
  { key: 'global', label: 'Global', icon: '∞', full: 'Global · all modes & levels' },
]

const LEVELS = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'all', label: 'All Levels' },
]

const MODE_ACCENTS = {
  mc: {
    strip: 'from-brand-500 to-brand-400',
    chip: 'border-brand-200 bg-brand-50 text-brand-700',
    iconBox: 'border-brand-200 bg-brand-50 text-brand-700',
    glow: 'shadow-[0_2px_10px_rgba(#2f6ad0,0.22)]',
    tag: 'text-brand-700',
  },
  write: {
    strip: 'from-leaf-500 to-leaf-400',
    chip: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    iconBox: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    glow: 'shadow-[0_2px_10px_rgba(#4c9a68,0.22)]',
    tag: 'text-leaf-700',
  },
  bug: {
    strip: 'from-danger-500 to-amber-400',
    chip: 'border-danger-200 bg-danger-50 text-danger-700',
    iconBox: 'border-danger-200 bg-danger-50 text-danger-700',
    glow: 'shadow-[0_2px_10px_rgba(#d24444,0.22)]',
    tag: 'text-danger-700',
  },
  global: {
    strip: 'from-brand-500 to-plum-400',
    chip: 'border-brand-200 bg-brand-50 text-brand-700',
    iconBox: 'border-brand-200 bg-brand-50 text-brand-700',
    glow: 'shadow-[0_2px_10px_rgba(#1554c7,0.22)]',
    tag: 'text-brand-700',
  },
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function getUserName(row) {
  return row.username || 'Anonymous'
}

function Row({ rank, row, isYou, pinned = false, name, avatarUrl }) {
  const correct = row.correct_count ?? 0
  const total = row.total_questions ?? 0
  const lives = row.lives_left ?? 0
  const initial = getUserName(row).charAt(0).toUpperCase()
  return (
    <tr className={`${isYou ? 'bg-brand-50' : ''} ${!isYou || pinned ? 'border-t border-line/70' : ''}`}>
      <td className="px-2 py-3 sm:px-4">
        <RankBadge rank={rank} />
      </td>
      <td className="w-full px-2 py-3 sm:px-4">
        <span className="flex items-center gap-2.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full border border-brand-200 object-cover" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-[11px] font-bold text-brand-700">
              {initial}
            </span>
          )}
          <span className="block min-w-0">
            <span className={`block truncate text-sm ${isYou ? 'font-semibold text-ink' : 'text-muted'}`}>
              {name ?? getUserName(row)}
              {isYou ? <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">you</span> : null}
            </span>
            <span className="mt-0.5 block truncate text-[11px] tabular-nums text-muted sm:hidden">
              {correct}/{total} · {lives}♥ · {formatTime(row.time_seconds)}
            </span>
          </span>
        </span>
      </td>
      <td className="px-2 py-3 text-right text-[15px] font-bold tabular-nums text-ink sm:px-4 sm:text-left">
        {row.score}
      </td>
      <td className="hidden px-4 py-3 tabular-nums text-muted sm:table-cell">
        {correct}/{total}
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">{lives}♥</td>
      <td className="hidden px-4 py-3 font-mono text-muted sm:table-cell">
        {formatTime(row.time_seconds)}
      </td>
    </tr>
  )
}

export default function Leaderboard() {
  const { user, profile } = useAuth()
  const [params] = useSearchParams()

  const initialMode = ['mc', 'write', 'bug', 'global'].includes(params.get('mode'))
    ? params.get('mode')
    : null
  const initialLevel = ['easy', 'medium', 'hard', 'all'].includes(params.get('level'))
    ? params.get('level')
    : 'easy'
  const initialGame = GAMES.some((g) => g.id === params.get('game')) ? params.get('game') : 'sql'

  const [mode, setMode] = useState(() => initialMode ?? (isNarrow() ? null : 'mc'))
  const [level, setLevel] = useState(initialLevel)
  const [game, setGame] = useState(initialGame)
  const [rows, setRows] = useState([])
  const [you, setYou] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sqlProgress, setSqlProgress] = useState(null)

  function change({ nextGame, nextMode, nextLevel }) {
    const g = nextGame ?? game
    const m = nextMode ?? mode
    const l = nextLevel ?? level
    if (g !== game) setGame(g)
    if (m !== mode) setMode(m)
    if (l !== level) setLevel(l)
    setRows([])
    setYou(null)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) return undefined
    if (mode === null) return undefined
    const scopedMode = mode === 'global' ? null : mode
    const scopedLevel = mode === 'global' ? null : level
    fetchPlayerSnapshot({ game, mode: scopedMode, level: scopedLevel, userId: user?.id, top: 10 }).then((res) => {
      if (!active) return
      setRows(res.top ?? [])
      setYou(res.you ?? null)
      setError(res.error)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [game, mode, level, user?.id])

  useEffect(() => {
    let active = true
    getProgress('sql', user?.id)
      .then((p) => {
        if (active) setSqlProgress(p)
      })
      .catch(() => {
        if (active) setSqlProgress({ completed: [], best: {} })
      })
    return () => {
      active = false
    }
  }, [user?.id])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-muted">
          Leaderboard is unavailable until Supabase is configured.
        </p>
      </div>
    )
  }

  const accent = MODE_ACCENTS[mode] ?? MODE_ACCENTS.mc
  const activeMode = MODES.find((m) => m.key === mode)

  const notOnBoardYet = !!user && !you && !loading && !error && mode !== null
  const playHref = mode && mode !== 'global' ? `/quiz/sql?mode=${mode}&level=easy` : '/quiz/sql'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-brand-50 via-white to-plum-50 px-6 py-9 text-center sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-brand-200/70" />
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full border border-plum-200/70" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border border-brand-200/60" />
        <div className="relative">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-brand-600">
            Scoreboard · Ranked
          </div>
          <h1 className="mt-2 bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-2xl font-black tracking-tight text-transparent sm:text-4xl">
            Leaderboard &amp; Progress
          </h1>
          <p className="mt-2 text-sm text-muted">
            {user ? `Signed in as ${user.email ?? 'you'}` : 'Sign in to save your scores.'}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">SQL game progress</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-body">3 modes · 4 levels</span>
        </div>
        {sqlProgress ? (
          <SqlProgressGrid sqlProgress={sqlProgress} />
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)]">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-1.5">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => change({ nextGame: g.id })}
                className={
                  'flex min-h-11 w-[calc(50%-0.1875rem)] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:py-1.5 ' +
                  (game === g.id
                    ? 'pop-on bg-brand-700 text-white'
                    : 'text-muted hover:bg-mist hover:text-body')
                }
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {MODES.map((m) => {
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => change({ nextMode: m.key })}
                  title={m.full}
                  className={
                    'flex min-h-11 w-[calc(50%-0.1875rem)] items-center justify-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:px-4 sm:py-1.5 ' +
                    (active
                      ? 'pop-on bg-brand-700 text-white'
                      : 'text-muted hover:bg-mist hover:text-body')
                  }
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-black ${active ? 'border-white/30 bg-white/15 text-white' : 'border-line bg-white text-muted'}`}>
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              )
            })}
          </div>

          {mode && mode !== 'global' && (
            <div className="reveal-levels mt-3">
              <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted sm:hidden">
                Level
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((lv) => {
                  const active = level === lv.key
                  return (
                    <button
                      key={lv.key}
                      onClick={() => change({ nextLevel: lv.key })}
                      className={
                        'flex min-h-11 w-[calc(50%-0.1875rem)] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:py-1.5 ' +
                        (active
                          ? 'pop-on bg-brand-700 text-white'
                          : 'text-muted hover:bg-mist hover:text-body')
                      }
                    >
                      {lv.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)]">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        {mode === null ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell font-mono text-lg font-black text-muted">
              ?
            </div>
            <p className="mt-3 text-muted">
              Pick a mode above — Multiple Choice, Write the Query, Fix the Bug or Global — to load the board.
            </p>
          </div>
        ) : loading ? (
          <p className="p-8 text-center text-muted">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-danger-600">{error.message}</p>
        ) : rows.length === 0 && !you ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell font-mono text-lg font-black text-muted">
              {activeMode?.icon}
            </div>
            <p className="mt-3 text-muted">
              {user
                ? 'Nobody has scored on this board yet. Finish a quiz and take the top spot!'
                : 'No scores yet for this board yet.'}
            </p>
            <Link
              to={playHref}
              className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Play {activeMode?.full ?? 'a quiz'}
            </Link>
            {!user && (
              <p className="mt-3 text-xs text-muted">
                <Link to="/auth" className="text-brand-700 underline-offset-2 hover:underline">
                  Sign in
                </Link>{' '}
                to save your score.
              </p>
            )}
          </div>
        ) : (
          <div>
            {notOnBoardYet && (
              <div className="mx-4 mb-4 mt-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:mx-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  You&apos;re signed in as{' '}
                  <span className="font-semibold text-ink">{profile?.username ?? user.email ?? 'you'}</span>, but you
                  have no score on this board yet. Finish a quiz and you&apos;ll appear here.
                </p>
                <Link
                  to={playHref}
                  className="shrink-0 self-start rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:self-auto"
                >
                  Play {activeMode?.full ?? 'a quiz'}
                </Link>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line/80 bg-mist/70">
                  <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Rank</th>
                  <th className="w-full px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">User</th>
                  <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4 sm:text-left">Score</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:table-cell">Correct</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:table-cell">Lives</th>
                  <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <Row
                    key={row.id ?? `${row.createdAt}-${i}`}
                    rank={i + 1}
                    row={row}
                    isYou={!!(user?.id && row.user_id === user.id)}
                    avatarUrl={user?.id && row.user_id === user.id ? profile?.avatar_url || '' : ''}
                  />
                ))}
                {you && you.rank > rows.length ? (
                  <Row rank={you.rank} row={you} isYou pinned name={you.username || 'You'} avatarUrl={profile?.avatar_url || ''} />
                ) : null}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-body">
        Ranked by score · then lives · then fastest time
      </p>
    </div>
  )
}