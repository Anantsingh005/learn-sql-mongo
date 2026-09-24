import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

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
    strip: 'from-indigo-400 to-cyan-400',
    chip: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    iconBox: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    glow: 'shadow-[0_0_14px_rgba(129,140,248,0.35)]',
    tag: 'text-indigo-300',
  },
  write: {
    strip: 'from-emerald-400 to-teal-400',
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    iconBox: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.35)]',
    tag: 'text-emerald-300',
  },
  bug: {
    strip: 'from-rose-400 to-orange-400',
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    iconBox: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    glow: 'shadow-[0_0_14px_rgba(251,113,133,0.35)]',
    tag: 'text-rose-300',
  },
  global: {
    strip: 'from-cyan-400 to-fuchsia-400',
    chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    iconBox: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    glow: 'shadow-[0_0_14px_rgba(34,211,238,0.35)]',
    tag: 'text-cyan-300',
  },
}

const LEVEL_ACCENTS = {
  easy: {
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  medium: {
    chip: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  },
  hard: {
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
  },
  all: {
    chip: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    glow: 'shadow-[0_0_12px_rgba(34,211,238,0.3)]',
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
    return 'border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
  if (rank === 2)
    return 'border-slate-300/50 bg-slate-200/15 text-slate-200 shadow-[0_0_10px_rgba(226,232,240,0.2)]'
  if (rank === 3)
    return 'border-amber-700/70 bg-amber-700/20 text-amber-500 shadow-[0_0_10px_rgba(180,83,9,0.25)]'
  return 'border-slate-700 bg-slate-800/70 text-slate-500'
}

function Row({ i, row, isYou }) {
  return (
    <tr className={`${isYou ? 'bg-indigo-500/10' : ''} ${!isYou ? 'border-t border-slate-800/70' : ''}`}>
      <td className="px-4 py-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black ${rankClass(i + 1)}`}>
          {i + 1}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className={`text-sm ${isYou ? 'font-semibold text-white' : 'text-slate-300'}`}>
          {getUserName(row)}
          {isYou ? <span className="ml-2 rounded-full bg-indigo-500/25 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">you</span> : null}
        </span>
      </td>
      <td className="px-4 py-2.5 font-bold text-white">{row.score}</td>
      <td className="px-4 py-2.5 tabular-nums text-slate-400">{row.correct_count ?? 0}/{row.total_questions ?? 0}</td>
      <td className="px-4 py-2.5">{row.lives_left ?? 0}♥</td>
      <td className="px-4 py-2.5 font-mono text-slate-500">{formatTime(row.time_seconds)}</td>
    </tr>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [params] = useSearchParams()

  const initialMode = ['mc', 'write', 'bug', 'global'].includes(params.get('mode'))
    ? params.get('mode')
    : 'mc'
  const initialLevel = ['easy', 'medium', 'hard', 'all'].includes(params.get('level'))
    ? params.get('level')
    : 'easy'
  const initialGame = GAMES.some((g) => g.id === params.get('game')) ? params.get('game') : 'sql'

  const [game, setGame] = useState(initialGame)
  const [mode, setMode] = useState(initialMode)
  const [level, setLevel] = useState(initialLevel)
  const [rows, setRows] = useState([])
  const [you, setYou] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function change({ nextGame, nextMode, nextLevel }) {
    let g = nextGame ?? game
    let m = nextMode ?? mode
    let l = nextLevel ?? level
    if (m === 'global') l = null
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
        <p className="mt-4 text-slate-500">
          Leaderboard is unavailable until Supabase is configured.
        </p>
      </div>
    )
  }

  const accent = MODE_ACCENTS[mode]
  const activeMode = MODES.find((m) => m.key === mode)
  const activeLevel = mode !== 'global' ? LEVELS.find((l) => l.key === level) : null
  const categoryLabel = mode === 'global' ? 'Global' : `${activeMode?.full} · ${activeLevel?.label ?? 'All'}`

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Scoreboard · Ranked
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          The Leaderboard
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {user ? `Signed in as ${user.email ?? 'you'}` : 'Sign in to save your scores.'}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => change({ nextGame: g.id })}
                className={
                  'rounded-lg px-3 py-1 text-sm font-semibold transition-colors ' +
                  (game === g.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/70 text-slate-500 hover:bg-slate-700/70 hover:text-slate-300')
                }
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {MODES.map((m) => {
              const a = MODE_ACCENTS[m.key]
              const active = mode === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => change({ nextMode: m.key })}
                  title={m.full}
                  className={
                    'group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ' +
                    (active
                      ? `${a.chip} ${a.glow}`
                      : 'border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-300')
                  }
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-xs font-black ${active ? a.iconBox : 'border-slate-700 bg-slate-800/70 text-slate-400'}`}>
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              )
            })}
          </div>

          {mode !== 'global' && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {LEVELS.map((lv) => {
                const a = LEVEL_ACCENTS[lv.key]
                const active = level === lv.key
                return (
                  <button
                    key={lv.key}
                    onClick={() => change({ nextLevel: lv.key })}
                    className={
                      'rounded-lg px-3 py-1 text-sm font-semibold transition-all ' +
                      (active
                        ? `${a.chip} ${a.glow}`
                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300')
                    }
                  >
                    {lv.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0_0_24px_rgba(99,102,241,0.08)] ${accent.glow}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-rose-400">{error.message}</p>
        ) : rows.length === 0 && !you ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 font-mono text-lg font-black text-slate-500">
              {activeMode?.icon}
            </div>
            <p className="mt-3 text-slate-400">
              No scores yet for {categoryLabel} — finish a quiz in {activeMode?.full} to land here!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Player</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Score</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Correct</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Lives</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <Row key={row.id ?? `${row.createdAt}-${i}`} i={i} row={row} isYou={!!(user?.id && row.user_id === user.id)} />
                ))}
                {you && you.rank > rows.length ? (
                  <tr className="border-t border-slate-800/70 bg-indigo-500/10">
                    <td className="px-4 py-2.5">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-black ${rankClass(you.rank)}`}>
                        {you.rank}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-white">
                      {you.username || 'You'}
                      <span className="ml-2 rounded-full bg-indigo-500/25 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">you</span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-white">{you.score}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-400">{you.correct_count ?? 0}/{you.total_questions ?? 0}</td>
                    <td className="px-4 py-2.5">{you.lives_left ?? 0}♥</td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{formatTime(you.time_seconds)}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-slate-600">
        Ranked by score · then lives · then fastest time
      </p>
    </div>
  )
}