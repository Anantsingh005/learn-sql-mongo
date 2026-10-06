import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { isNarrow } from '../lib/viewport.js'

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

const LEVEL_ACCENTS = {
  easy: {
    chip: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    glow: 'shadow-[0_0_12px_rgba(#3d7f55,0.22)]',
  },
  medium: {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    glow: 'shadow-[0_0_12px_rgba(#a5680f,0.22)]',
  },
  hard: {
    chip: 'border-danger-200 bg-danger-50 text-danger-700',
    glow: 'shadow-[0_0_12px_rgba(#b03333,0.22)]',
  },
  all: {
    chip: 'border-brand-200 bg-brand-50 text-brand-700',
    glow: 'shadow-[0_0_12px_rgba(#1554c7,0.22)]',
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

function rankClass(rank) {
  if (rank === 1)
    return 'border-amber-200 bg-amber-100 text-amber-700 shadow-[0_0_12px_rgba(#a5680f,0.22)]'
  if (rank === 2)
    return 'border-line/50 bg-mist/15 text-body shadow-[0_0_10px_rgba(#c3d2e0,0.2)]'
  if (rank === 3)
    return 'border-amber-200 bg-amber-100 text-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.25)]'
  return 'border border-line bg-shell text-muted'
}

function Row({ rank, row, isYou, pinned = false, name }) {
  const correct = row.correct_count ?? 0
  const total = row.total_questions ?? 0
  const lives = row.lives_left ?? 0
  return (
    <tr className={`${isYou ? 'bg-brand-50' : ''} ${!isYou || pinned ? 'border-t border-line/70' : ''}`}>
      <td className="px-2 py-2.5 sm:px-4">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black ${rankClass(rank)}`}>
          {rank}
        </span>
      </td>
      <td className="w-full px-2 py-2.5 sm:px-4">
        <span className={`block truncate text-sm ${isYou ? 'font-semibold text-ink' : 'text-muted'}`}>
          {name ?? getUserName(row)}
          {isYou ? <span className="ml-2 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">you</span> : null}
        </span>
        <span className="mt-0.5 block truncate text-[11px] tabular-nums text-muted sm:hidden">
          {correct}/{total} · {lives}♥ · {formatTime(row.time_seconds)}
        </span>
      </td>
      <td className="px-2 py-2.5 text-right font-bold tabular-nums text-ink sm:px-4 sm:text-left">
        {row.score}
      </td>
      <td className="hidden px-4 py-2.5 tabular-nums text-muted sm:table-cell">
        {correct}/{total}
      </td>
      <td className="hidden px-4 py-2.5 sm:table-cell">{lives}♥</td>
      <td className="hidden px-4 py-2.5 font-mono text-muted sm:table-cell">
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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Scoreboard · Ranked
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-2xl font-black tracking-tight text-transparent sm:text-4xl">
          The Leaderboard
        </h1>
        <p className="mt-2 text-sm text-muted">
          {user ? `Signed in as ${user.email ?? 'you'}` : 'Sign in to save your scores.'}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => change({ nextGame: g.id })}
                className={
                  'relative flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:min-h-0 sm:w-auto sm:py-1 ' +
                  (game === g.id
                    ? 'pop-on bg-brand-600 text-white'
                    : 'bg-shell text-muted hover:bg-shell hover:text-body')
                }
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {MODES.map((m) => {
              const a = MODE_ACCENTS[m.key]
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => change({ nextMode: m.key })}
                  title={m.full}
                  className={
                    'group relative flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all sm:min-h-0 sm:w-auto sm:py-1.5 ' +
                    (active
                      ? `pop-on ${a.chip} ${a.glow}`
                      : 'border-line bg-shell text-muted hover:border-brand-200 hover:text-body')
                  }
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-black ${active ? a.iconBox : 'border-line bg-shell text-muted'}`}>
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
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                {LEVELS.map((lv) => {
                  const a = LEVEL_ACCENTS[lv.key]
                  const active = level === lv.key
                  return (
                    <button
                      key={lv.key}
                      onClick={() => change({ nextLevel: lv.key })}
                      className={
                        'relative flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all sm:min-h-0 sm:w-auto sm:py-1 ' +
                        (active
                          ? `pop-on ${a.chip} ${a.glow}`
                          : 'bg-shell text-muted hover:bg-brand-50 hover:text-body')
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

      <div
        className={`relative mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_10px_rgba(#1554c7,0.08)] ${accent.glow}`}
      >
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
              className="mt-4 inline-block rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
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
                  className="shrink-0 self-start rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:self-auto"
                >
                  Play {activeMode?.full ?? 'a quiz'}
                </Link>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line/80 bg-white/60">
                  <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">#</th>
                  <th className="w-full px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Player</th>
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
                  />
                ))}
                {you && you.rank > rows.length ? (
                  <Row rank={you.rank} row={you} isYou pinned name={you.username || 'You'} />
                ) : null}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-body">
        Ranked by score · then lives · then fastest time
      </p>
    </div>
  )
}