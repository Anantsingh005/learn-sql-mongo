import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchPlayerSnapshot } from '../lib/leaderboard.js'
import { getProgress } from '../lib/progress.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { isNarrow } from '../lib/viewport.js'
import { useInView } from '../hooks/useInView.js'
import { useInViewCount } from '../hooks/useInViewCount.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import SqlProgressPanel from './SqlProgressPanel.jsx'
import LeaderboardFilters from './LeaderboardFilters.jsx'

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

function TrophyBadgeIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function ControllerIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.8 8h10.4a4.2 4.2 0 0 1 4.12 5.03l-.62 3.1A3.1 3.1 0 0 1 17.64 16l-1.42-1.5H7.78L6.36 16a3.1 3.1 0 0 1-3.06-1.13l-.62-3.1A4.2 4.2 0 0 1 6.8 8Z" />
      <path d="M8.4 10.6v2.4M7.2 11.8h2.4" />
      <circle cx="15.4" cy="10.9" r="0.9" />
      <circle cx="17.4" cy="13.1" r="0.9" />
    </svg>
  )
}

function LayersIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function StarIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
    </svg>
  )
}

function HeroStatTile({ icon, value, label, suffix = null, className = '', style }) {
  return (
    <div style={style} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-line/70 bg-white/70 px-2.5 py-2 text-center shadow-[0_1px_2px_rgba(45,0,34,0.04)] min-[600px]:flex-row min-[600px]:items-center min-[600px]:gap-2.5 min-[600px]:px-3 min-[600px]:py-2.5 min-[600px]:text-left ${className}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 min-[600px]:h-9 min-[600px]:w-9">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-center gap-1 tabular-nums text-base font-bold text-ink min-[600px]:text-lg min-[600px]:justify-start">
          {value}
          {suffix ? <span className="text-xs font-semibold text-muted">{suffix}</span> : null}
        </div>
        <div className="text-[9px] font-semibold uppercase tracking-widest text-muted min-[600px]:text-[10px]">{label}</div>
      </div>
    </div>
  )
}

function HeroDivider() {
  return (
    <div className="hidden self-stretch bg-line/60 min-[1000px]:mx-3 min-[1000px]:my-2 min-[1000px]:block min-[1000px]:w-px" />
  )
}

function avatarTone(name) {
  const tones = [
    'border-brand-200 bg-brand-50 text-brand-700',
    'border-plum-200 bg-plum-50 text-plum-700',
    'border-leaf-200 bg-leaf-50 text-leaf-700',
    'border-amber-200 bg-amber-50 text-amber-700',
  ]
  let sum = 0
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i)
  return tones[sum % tones.length]
}

function TableRank({ rank, reveal = false }) {
  if (rank === 1 || rank === 2 || rank === 3) {
    const look =
      rank === 1
        ? 'border-amber-300 bg-amber-100 text-amber-600'
        : rank === 2
          ? 'border-[#d7dbe2] bg-[#eef0f4] text-[#6b7280]'
          : 'border-[#e2c2a2] bg-[#f6e7d7] text-[#9a5a24]'
    return (
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${look} ${rank === 1 && reveal ? 'lb-crown-shine' : ''}`}
      >
        <span className="sr-only">{rank}</span>
        {rank === 1 ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M2 8l5 4 5-7 5 7 5-4-2 11H4L2 8z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
            <path d="M11 12 5.12 2.2" />
            <path d="m13 12 5.88-9.8" />
            <circle cx="12" cy="17" r="5" />
          </svg>
        )}
      </span>
    )
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-shell text-[11px] font-black text-muted">
      {rank}
    </span>
  )
}

function Hearts({ lives }) {
  const total = 3
  const filled = Math.max(0, Math.min(total, lives))
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${i < filled ? 'text-danger-500' : 'text-line'}`}
          fill={i < filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ))}
      <span className="ml-1 text-[11px] tabular-nums text-muted">
        {lives}/{total}
      </span>
    </span>
  )
}

function Row({ rank, row, isYou, pinned = false, name, avatarUrl, anim = null, active = false, index = 0 }) {
  const correct = row.correct_count ?? 0
  const total = row.total_questions ?? 0
  const lives = row.lives_left ?? 0
  const displayName = name ?? getUserName(row)
  const initial = displayName.charAt(0).toUpperCase()
  const chip = 'hidden text-[9px] font-bold uppercase tracking-widest text-muted max-[699px]:inline'
  const shownScore = useInViewCount(row.score, active)
  const animClass = anim === 'leave' ? 'lb-row-leave' : anim === 'in' ? 'lb-row-in' : ''
  return (
    <tr
      role="row"
      className={`lb-row ${isYou ? 'lb-you-glow bg-brand-50 max-[699px]:bg-brand-50' : 'max-[699px]:bg-white'} ${pinned ? 'max-[699px]:border-brand-200' : ''} ${animClass} max-[699px]:grid max-[699px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[699px]:items-center max-[699px]:gap-x-3 max-[699px]:gap-y-2 max-[699px]:rounded-xl max-[699px]:border max-[699px]:border-line max-[699px]:px-3 max-[699px]:py-2.5`}
      style={anim === 'in' ? { animationDelay: `${index * 40}ms` } : undefined}
    >
      <td
        role="cell"
        className="border-t border-line/70 px-2 py-3 align-middle sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0"
      >
        <TableRank rank={rank} reveal={active && anim !== 'leave'} />
      </td>
      <td
        role="cell"
        className="min-w-0 border-t border-line/70 px-2 py-3 align-middle sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-brand-200 object-cover"
            />
          ) : (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${avatarTone(displayName)}`}
            >
              {initial}
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className={`truncate ${isYou ? 'font-semibold text-ink' : 'text-muted'}`}>
              {displayName}
            </span>
            {isYou ? (
              <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                You
              </span>
            ) : null}
          </span>
        </span>
      </td>
      <td
        role="cell"
        className="border-t border-line/70 px-2 py-3 text-right align-middle text-[15px] font-bold tabular-nums text-ink sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0"
      >
        {shownScore}
      </td>
      <td
        role="cell"
        className="border-t border-line/70 px-2 py-3 text-right align-middle tabular-nums text-muted sm:px-4 max-[699px]:flex max-[699px]:items-center max-[699px]:justify-between max-[699px]:gap-1.5 max-[699px]:rounded-full max-[699px]:bg-shell max-[699px]:border-t-0 max-[699px]:px-2.5 max-[699px]:py-1 max-[699px]:text-xs"
      >
        <span className={chip}>Correct</span>
        <span>
          {correct}/{total}
        </span>
      </td>
      <td
        role="cell"
        className="border-t border-line/70 px-2 py-3 text-right align-middle sm:px-4 max-[699px]:flex max-[699px]:items-center max-[699px]:justify-between max-[699px]:gap-1.5 max-[699px]:rounded-full max-[699px]:bg-shell max-[699px]:border-t-0 max-[699px]:px-2.5 max-[699px]:py-1 max-[699px]:text-xs"
      >
        <span className={chip}>Lives</span>
        <Hearts lives={lives} />
      </td>
      <td
        role="cell"
        className="border-t border-line/70 px-2 py-3 text-right align-middle font-mono text-muted sm:px-4 max-[699px]:flex max-[699px]:items-center max-[699px]:justify-between max-[699px]:gap-1.5 max-[699px]:rounded-full max-[699px]:bg-shell max-[699px]:border-t-0 max-[699px]:px-2.5 max-[699px]:py-1 max-[699px]:text-xs"
      >
        <span className={chip}>Time</span>
        <span>{formatTime(row.time_seconds)}</span>
      </td>
    </tr>
  )
}

function SkeletonRows({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i} role="row" className="max-[699px]:grid max-[699px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[699px]:items-center max-[699px]:gap-x-3 max-[699px]:gap-y-2 max-[699px]:rounded-xl max-[699px]:border max-[699px]:border-line max-[699px]:px-3 max-[699px]:py-2.5">
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="shimmer block h-7 w-7 rounded-full bg-line" />
          </td>
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="flex items-center gap-2.5">
              <span className="shimmer block h-8 w-8 rounded-full bg-line" />
              <span className="shimmer block h-3.5 w-28 rounded bg-line" />
            </span>
          </td>
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="shimmer block h-3.5 w-12 rounded bg-line" />
          </td>
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="shimmer block h-3.5 w-10 rounded bg-line" />
          </td>
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="shimmer block h-3.5 w-14 rounded bg-line" />
          </td>
          <td role="cell" className="border-t border-line/70 px-2 py-3 sm:px-4 max-[699px]:border-t-0 max-[699px]:px-0 max-[699px]:py-0">
            <span className="shimmer block h-3.5 w-12 rounded bg-line" />
          </td>
        </tr>
      ))}
    </>
  )
}

export default function Leaderboard() {
  const { user, profile } = useAuth()
  const [params, setParams] = useSearchParams()

  const initialMode = ['mc', 'write', 'bug', 'global'].includes(params.get('mode'))
    ? params.get('mode')
    : null
  const initialLevel = ['easy', 'medium', 'hard', 'all'].includes(params.get('level'))
    ? params.get('level')
    : 'easy'
  // Prefer ?db=; fall back to legacy ?game= so old links keep working.
  const dbParam = ['sql', 'mongo'].includes(params.get('db'))
    ? params.get('db')
    : params.get('game')
  const initialGame = GAMES.some((g) => g.id === dbParam) ? dbParam : 'sql'

  const [mode, setMode] = useState(() => initialMode ?? (isNarrow() ? null : 'mc'))
  const [level, setLevel] = useState(initialLevel)
  const [game, setGame] = useState(initialGame)
  const [rows, setRows] = useState([])
  const [you, setYou] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState(null)
  const [sqlProgress, setSqlProgress] = useState(null)
  const [bestScore, setBestScore] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [headerFlash, setHeaderFlash] = useState(0)

  const reduce = useReducedMotion()
  const latestRef = useRef({ rows: [], you: null, reduce: false })
  const pendingRef = useRef(null)
  const leaveTimerRef = useRef(0)

  useEffect(() => {
    latestRef.current = { rows, you, reduce }
  }, [rows, you, reduce])

  function retry() {
    setRows([])
    setYou(null)
    setLeaving(false)
    setLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  function change({ nextGame, nextMode, nextLevel }) {
    const g = nextGame ?? game
    const m = nextMode ?? mode
    const l = nextLevel ?? level
    if (g !== game) setGame(g)
    if (m !== mode) setMode(m)
    if (l !== level) setLevel(l)
    setLeaving(false)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) return undefined
    if (game === 'mongo') return undefined // no MongoDB data yet — empty state renders instead
    if (mode === null) return undefined
    const scopedMode = mode === 'global' ? null : mode
    const scopedLevel = mode === 'global' ? null : level
    fetchPlayerSnapshot({ game, mode: scopedMode, level: scopedLevel, userId: user?.id, top: 10 }).then((res) => {
      if (!active) return
      const next = { rows: res.top ?? [], you: res.you ?? null, error: res.error }
      const { rows: oldRows, you: oldYou, reduce: prefersReduce } = latestRef.current
      const hasOld = oldRows.length > 0 || oldYou
      // Hold the current rows, fade them out, then let the new rows cascade in.
      // Reduced motion (or an empty board) swaps states instantly, no tween.
      if (!prefersReduce && hasOld) {
        pendingRef.current = next
        setLeaving(true)
        leaveTimerRef.current = setTimeout(() => {
          if (!active || !pendingRef.current) return
          const p = pendingRef.current
          setRows(p.rows)
          setYou(p.you)
          setError(p.error)
          setLeaving(false)
          setLoading(false)
          pendingRef.current = null
        }, 200)
      } else {
        setRows(next.rows)
        setYou(next.you)
        setError(next.error)
        setLeaving(false)
        setLoading(false)
      }
    })
    return () => {
      active = false
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = 0
      }
      pendingRef.current = null
    }
  }, [game, mode, level, user?.id, reloadKey])

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

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured || !user?.id) return undefined
    fetchPlayerSnapshot({ game: 'sql', mode: null, level: null, userId: user.id, top: 1 }).then((res) => {
      if (!active) return
      const score = res.you?.score
      setBestScore({ userId: user.id, score: Number.isFinite(score) ? score : null })
    })
    return () => {
      active = false
    }
  }, [user?.id])

  // Keep the filters mirrored in the URL so a copied link or a reload restores them.
  useEffect(() => {
    const next = new URLSearchParams()
    next.set('db', game)
    if (mode) next.set('mode', mode)
    next.set('level', level)
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [game, mode, level, params, setParams])

  const modesWithData = MODES.filter((m) => m.key !== 'global').length
  const levelsCount = LEVELS.length
  const bestScoreValue = bestScore?.userId === user?.id ? bestScore?.score : null

  const [heroRef, heroIn] = useInView()
  const [tableRef, tableIn] = useInView()
  const shownModes = useInViewCount(modesWithData, heroIn)
  const shownLevels = useInViewCount(levelsCount, heroIn)
  const shownBest = useInViewCount(bestScoreValue ?? 0, heroIn)

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

  function applyFromPanel({ mode: nextMode, level: nextLevel }) {
    const needsChange = nextMode !== mode || nextLevel !== level || game !== 'sql'
    if (needsChange) {
      change({ nextGame: 'sql', nextMode, nextLevel })
    }
    const target = document.getElementById('leaderboard-table')
    if (target) {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
    setHeaderFlash((n) => n + 1)
  }

  return (
    <div className="mx-auto w-full space-y-6">
      <section className="hero-strip lb-enter-drop" ref={heroRef}>
        <div className="relative isolate overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-brand-50 via-white to-plum-50 px-4 py-7 sm:px-7 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100/60" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-4 top-12 h-28 w-28 rounded-full bg-plum-100/70" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-brand-50" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-10 right-44 h-24 w-24 rounded-full bg-plum-50" />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/3 -top-12 h-24 w-24 rounded-full bg-brand-100/40" />

          <div className="relative flex flex-col gap-5 min-[600px]:gap-6 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-5 text-center min-[600px]:flex-row min-[600px]:items-center min-[600px]:gap-7 min-[600px]:text-left">
              <div className="lb-float lb-shine flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white shadow-sm sm:h-24 sm:w-24">
                <TrophyBadgeIcon className="h-10 w-10 text-brand-600 sm:h-12 sm:w-12" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-brand-500">
                  SCOREBOARD · RANKED
                </div>
                <h1 className="mt-2 font-mono text-[clamp(1.5rem,1.1rem+2.2vw,2.25rem)] font-black tracking-tight text-ink">
                  Leaderboard &amp;{' '}
                  <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text text-transparent">
                    Progress
                  </span>
                </h1>
                <p className="mt-2 text-[clamp(0.875rem,0.8rem+0.35vw,1rem)] text-muted">
                  Track your database skills and keep improving.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 min-[380px]:gap-3 min-[1000px]:flex min-[1000px]:items-center min-[1000px]:justify-end min-[1000px]:gap-0">
              <HeroStatTile className="enter-pop" style={{ animationDelay: '140ms' }} icon={<ControllerIcon className="h-4 w-4" />} value={shownModes} label="Modes" />
              <HeroDivider />
              <HeroStatTile className="enter-pop" style={{ animationDelay: '240ms' }} icon={<LayersIcon className="h-4 w-4" />} value={shownLevels} label="Levels" />
              {bestScoreValue != null && (
                <>
                  <HeroDivider />
                  <HeroStatTile
                    className="enter-pop max-[379px]:col-span-2 max-[379px]:justify-self-center max-[379px]:w-full max-[379px]:max-w-[220px]"
                    style={{ animationDelay: '340ms' }}
                    icon={<StarIcon className="h-4 w-4" />}
                    value={shownBest}
                    suffix="pts"
                    label="Your best"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="sql-game-progress-panel" aria-label="SQL game progress">
        {user ? (
          sqlProgress ? (
            <SqlProgressPanel sqlProgress={sqlProgress} isSignedIn onApply={applyFromPanel} />
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )
        ) : (
          <SqlProgressPanel sqlProgress={{ completed: [], best: {} }} onApply={applyFromPanel} />
        )}
      </section>

      <div className="enter-rise" style={{ animationDelay: '420ms' }}>
        <LeaderboardFilters
          db={game}
          mode={mode}
          level={level}
          onChange={(next) =>
            change({
              nextGame: next.db,
              nextMode: next.mode,
              nextLevel: next.level,
            })
          }
        />
      </div>

      <section id="leaderboard-table" ref={tableRef} aria-labelledby="leaderboard-table-heading" className="leaderboard-table-card enter-rise scroll-mt-24" style={{ animationDelay: '560ms' }}>
        <h2 id="leaderboard-table-heading" className="sr-only">Leaderboard scores</h2>
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(45,0,34,0.05)]">
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent.strip} opacity-80`} />
          {game === 'mongo' ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell font-mono text-lg font-black text-muted">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-10 0 9-3 16-9 17Z" />
                  <path d="M4 21c3-6 6-9 11-11" />
                </svg>
              </div>
              <p className="mt-3 font-semibold text-ink">MongoDB boards are on the way.</p>
              <p className="mt-1 text-sm text-muted">
                There is no MongoDB data yet — every score here comes from the SQL quiz.
              </p>
              <button
                type="button"
                onClick={() => change({ nextGame: 'sql' })}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Switch to SQL
              </button>
            </div>
          ) : mode === null ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell font-mono text-lg font-black text-muted">
                ?
              </div>
              <p className="mt-3 text-muted">
                Pick a mode above — Multiple Choice, Write the Query, Fix the Bug or Global — to load the board.
              </p>
            </div>
          ) : loading && rows.length === 0 && !you ? (
            <div>
              <span className="sr-only" role="status" aria-live="polite">
                Loading leaderboard…
              </span>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full table-fixed text-left text-sm max-[699px]:block" role="table">
                  <thead className="max-[699px]:sr-only" role="rowgroup">
                    <tr className="border-b border-line/80 bg-mist/70 sticky top-0 z-10" role="row">
                      <th scope="col" role="columnheader" className="w-14 px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Rank</th>
                      <th scope="col" role="columnheader" className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Player</th>
                      <th scope="col" role="columnheader" className="w-20 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Score</th>
                      <th scope="col" role="columnheader" className="w-24 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Correct</th>
                      <th scope="col" role="columnheader" className="w-24 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Lives</th>
                      <th scope="col" role="columnheader" className="w-20 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="max-[699px]:block max-[699px]:space-y-2" role="rowgroup">
                    <SkeletonRows />
                  </tbody>
                </table>
              </div>
            </div>
          ) : error && rows.length === 0 && !you ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-danger-200 bg-danger-50 text-danger-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <p className="mt-3 font-semibold text-ink">Couldn&apos;t load this board.</p>
              <p className="mt-1 text-sm text-muted">{error.message}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Try again
              </button>
            </div>
          ) : rows.length === 0 && !you ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-shell font-mono text-lg font-black text-muted">
                {activeMode?.icon}
              </div>
              <p className="mt-3 font-semibold text-ink">No scores yet. Be the first!</p>
              <Link
                to={playHref}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Play {activeMode?.full ?? 'a quiz'}
              </Link>
              {!user && (
                <p className="mt-3 text-xs text-muted">
                  <Link to="/auth" className="text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
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
                    <span className="font-semibold text-ink">{profile?.username ?? 'you'}</span>, but you
                    have no score on this board yet.
                  </p>
                  <Link
                    to={playHref}
                    className="inline-flex min-h-[44px] shrink-0 items-center self-start rounded-full bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:self-auto"
                  >
                    Play {activeMode?.full ?? 'a quiz'}
                  </Link>
                </div>
              )}
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full table-fixed text-left text-sm max-[699px]:block" role="table">
                  <thead className="max-[699px]:sr-only" role="rowgroup">
                    <tr className={`border-b border-line/80 bg-mist/70 sticky top-0 z-10 ${headerFlash > 0 ? 'lb-header-flash' : ''}`} role="row">
                      <th scope="col" role="columnheader" className="w-14 px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Rank</th>
                      <th scope="col" role="columnheader" className="px-2 py-3 text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Player</th>
                      <th scope="col" role="columnheader" className="w-20 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Score</th>
                      <th scope="col" role="columnheader" className="w-24 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Correct</th>
                      <th scope="col" role="columnheader" className="w-24 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Lives</th>
                      <th scope="col" role="columnheader" className="w-20 px-2 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted sm:px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className={`max-[699px]:block max-[699px]:space-y-2 ${loading && !leaving ? 'lb-rows-hold' : ''}`} role="rowgroup">
                    {rows.map((row, i) => (
                      <Row
                        key={row.id ?? `${row.createdAt}-${i}`}
                        rank={i + 1}
                        row={row}
                        isYou={!!(user?.id && row.user_id === user.id)}
                        avatarUrl={user?.id && row.user_id === user.id ? profile?.avatar_url || '' : ''}
                        anim={leaving ? 'leave' : !loading ? 'in' : null}
                        active={tableIn}
                        index={i}
                      />
                    ))}
                    {you && you.rank > rows.length ? (
                      <Row
                        rank={you.rank}
                        row={you}
                        isYou
                        pinned
                        name={you.username || 'You'}
                        avatarUrl={profile?.avatar_url || ''}
                        anim={leaving ? 'leave' : !loading ? 'in' : null}
                        active={tableIn}
                        index={rows.length}
                      />
                    ) : null}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-body">
                Ranked by score, then lives, then fastest time.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}