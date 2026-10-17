import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COMPLETE_THRESHOLD, isLevelUnlocked, levelKey } from '../lib/progress.js'
import { useInView } from '../hooks/useInView.js'
import { useInViewCount } from '../hooks/useInViewCount.js'

const SQL_MODES = [
  {
    key: 'mc',
    title: 'Multiple Choice',
    desc: 'Choose the correct answer from options.',
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    bar: 'from-brand-500 to-brand-400',
  },
  {
    key: 'write',
    title: 'Write a Query',
    desc: 'Write SQL queries to solve the problem.',
    badge: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    bar: 'from-leaf-500 to-leaf-400',
  },
  {
    key: 'bug',
    title: 'Fix the Bug',
    desc: 'Find and fix the error in the SQL query.',
    badge: 'border-danger-200 bg-danger-50 text-danger-700',
    bar: 'from-danger-500 to-plum-400',
  },
]

const SQL_LEVELS = [
  { key: 'easy', label: 'Easy', short: 'E', chip: 'border-leaf-200 bg-leaf-50 text-leaf-700' },
  { key: 'medium', label: 'Medium', short: 'M', chip: 'border-amber-200 bg-amber-50 text-amber-700' },
  { key: 'hard', label: 'Hard', short: 'H', chip: 'border-danger-200 bg-danger-50 text-danger-700' },
  { key: 'all', label: 'All Levels', short: 'A', chip: 'border-brand-200 bg-brand-50 text-brand-700' },
]

const LOCK_LINES = {
  hard: `Unlock by scoring ${COMPLETE_THRESHOLD}% on Easy and Medium`,
  all: `Unlock by scoring ${COMPLETE_THRESHOLD}% on Easy, Medium and Hard`,
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8 6-6 6 6 6" />
      <path d="m16 6 6 6-6 6" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 7 5 5-5 5" />
      <path d="M12 19h7" />
    </svg>
  )
}

function BugIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M6 17c-1.5 1.2-2.4 3-2.5 5" />
      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
      <path d="M18 13h4" />
      <path d="M18 17c1.5 1.2 2.4 3 2.5 5" />
    </svg>
  )
}

const MODE_ICONS = { mc: <CodeIcon />, write: <TerminalIcon />, bug: <BugIcon /> }

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function PartialRing({ pct }) {
  const radius = 7
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = circumference * (1 - clamped / 100)
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90 shrink-0" aria-hidden="true">
      <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(45,0,34,0.12)" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="#a5680f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

function LevelRow({ lv, mode, progress, signedIn, onApply, active = false }) {
  const [showHint, setShowHint] = useState(false)
  const [shake, setShake] = useState(0)
  const key = levelKey(mode.key, lv.key)
  const pct = progress.best?.[key] ?? 0
  const completed = (progress.completed ?? []).includes(key)
  const unlocked = isLevelUnlocked(lv.key, progress, mode.key)
  const inProgress = !completed && pct > 0

  let badge = null
  let statusLine = null
  let statusText = 'locked'

  if (!signedIn) {
    badge = (
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-black ${lv.chip}`}>
        {lv.short}
      </span>
    )
    statusLine = <span className="text-muted">Sign in to play</span>
    statusText = 'sign in to play'
  } else if (completed) {
    badge = (
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-leaf-200 bg-leaf-50 text-leaf-700 ${active ? 'lb-check-pop' : ''}`}>
        <CheckIcon />
      </span>
    )
    statusLine = <span className="font-semibold text-leaf-700">Completed · {pct}%</span>
    statusText = `completed, ${pct}%`
  } else if (inProgress) {
    badge = <PartialRing pct={pct} />
    statusLine = <span className="font-semibold text-amber-700">In progress · {pct}%</span>
    statusText = `in progress, ${pct}%`
  } else if (!unlocked) {
    badge = (
      <span
        key={shake}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-shell text-muted ${shake ? 'lb-shake' : ''}`}
      >
        <LockIcon />
      </span>
    )
    statusLine = <span className="text-muted">{LOCK_LINES[lv.key] ?? 'Locked'}</span>
    statusText = 'locked'
  } else {
    badge = (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-black text-muted border-line bg-white">
        {lv.short}
      </span>
    )
    statusLine = <span className="text-muted">Not started</span>
    statusText = 'not started'
  }

  const rowLabel = `${mode.title}, ${lv.label}, ${statusText}`

  const hint = !signedIn
    ? 'Sign in to track your progress and play this level.'
    : LOCK_LINES[lv.key] ?? 'Locked'

  if (!signedIn || !unlocked) {
    return (
      <div className="relative">
        <button
          type="button"
          aria-label={rowLabel}
          aria-describedby={showHint ? `hint-${mode.key}-${lv.key}` : undefined}
          onClick={() => {
            setShowHint((v) => !v)
            if (!unlocked) setShake((s) => s + 1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowHint(false)
          }}
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
          onFocus={() => setShowHint(true)}
          onBlur={() => setShowHint(false)}
          className="flex min-h-[44px] w-full cursor-not-allowed items-center gap-3 rounded-xl border border-line/70 bg-shell/60 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
        >
          {badge}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-muted">{lv.label}</span>
            <span className="block truncate text-[11px] leading-4 text-muted">{statusLine}</span>
          </span>
        </button>
        {showHint && (
          <div
            id={`hint-${mode.key}-${lv.key}`}
            role="tooltip"
            className="pointer-events-none absolute left-3 top-full z-20 mt-1 w-[calc(100%-1.5rem)] rounded-lg border border-line bg-ink px-3 py-1.5 text-[11px] leading-4 text-white shadow-lg"
          >
            {hint}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={rowLabel}
        onClick={() => onApply({ mode: mode.key, level: lv.key })}
        className="group flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
      >
        {badge}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{lv.label}</span>
          <span className="block truncate text-[11px] leading-4 text-muted">{statusLine}</span>
        </span>
        <span className="shrink-0 text-body transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>
      <Link
        to={`/quiz/sql?mode=${mode.key}&level=${lv.key}`}
        aria-label={`Play ${lv.label} in ${mode.title}`}
        title={`Play ${lv.label} in ${mode.title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-body transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600"
      >
        <PlayIcon />
      </Link>
    </div>
  )
}

function ModeCard({ mode, progress, isSignedIn, active, index, onApply }) {
  const doneCount = SQL_LEVELS.filter((lv) =>
    (progress.completed ?? []).includes(levelKey(mode.key, lv.key))
  ).length
  const barWidth = (doneCount / SQL_LEVELS.length) * 100
  const shownCount = useInViewCount(doneCount, active)

  return (
    <div
      className={`card-part rounded-2xl border border-line p-4 shadow-[0_1px_3px_rgba(45,0,34,0.05)] ${active ? 'lb-in' : ''}`}
      style={{ animationDelay: `${60 + index * 120}ms` }}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${mode.badge}`}
        >
          {MODE_ICONS[mode.key]}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black uppercase tracking-wide text-ink">
            {mode.title}
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-muted">{mode.desc}</span>
        </span>
      </div>

      {isSignedIn && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Completed
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-ink">
              {shownCount}/{SQL_LEVELS.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`${mode.title} levels completed`}
            aria-valuemin={0}
            aria-valuemax={SQL_LEVELS.length}
            aria-valuenow={doneCount}
            aria-valuetext={`${doneCount} of ${SQL_LEVELS.length} levels completed`}
            className="h-2 overflow-hidden rounded-full bg-line"
          >
            <div
              className={`lb-bar h-full rounded-full bg-gradient-to-r ${mode.bar}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {SQL_LEVELS.map((lv) => (
          <LevelRow
            key={lv.key}
            lv={lv}
            mode={mode}
            progress={progress}
            signedIn={isSignedIn}
            onApply={onApply}
            active={active}
          />
        ))}
      </div>
    </div>
  )
}

export default function SqlProgressPanel({ sqlProgress, isSignedIn = false, onApply }) {
  const progress = sqlProgress ?? { completed: [], best: {} }
  const [panelRef, inView] = useInView()

  return (
    <div
      ref={panelRef}
      className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(45,0,34,0.05)] sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-brand-600">
          SQL Game Progress
        </h2>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          {SQL_MODES.length} Modes · {SQL_LEVELS.length} Levels
        </span>
      </div>

      {!isSignedIn && (
        <div className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-700">Sign in to track your progress.</p>
          <Link
            to="/auth"
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="grid gap-6 min-[900px]:grid-cols-3">
        {SQL_MODES.map((mode, i) => (
          <ModeCard
            key={mode.key}
            mode={mode}
            progress={progress}
            isSignedIn={isSignedIn}
            active={inView}
            index={i}
            onApply={onApply}
          />
        ))}
      </div>
    </div>
  )
}
