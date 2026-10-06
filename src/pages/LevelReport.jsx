import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress, levelKey, COMPLETE_THRESHOLD, isLevelUnlocked } from '../lib/progress.js'
import { fetchAttempts } from '../lib/attempts.js'
import { selectQuestions } from '../data/selectQuestions.js'

const MODE_LABELS = {
  mc: 'Multiple Choice',
  write: 'Write a Query',
  bug: 'Fix the Bug',
}

const LEVELS = {
  easy: {
    label: 'Easy',
    desc: 'Warm up',
    chip: 'bg-leaf-50 text-leaf-700',
    ring: 'border-leaf-200',
    bar: 'from-leaf-500 to-leaf-400',
    glow: 'shadow-[0_2px_10px_rgba(#3d7f55,0.22)]',
    btn: 'bg-leaf-100 text-leaf-700 hover:bg-leaf-100 hover:shadow-[0_2px_10px_rgba(#3d7f55,0.22)]',
  },
  medium: {
    label: 'Medium',
    desc: 'Getting sharp',
    chip: 'bg-amber-50 text-amber-700',
    ring: 'border-amber-200',
    bar: 'from-amber-500 to-amber-400',
    glow: 'shadow-[0_2px_10px_rgba(#a5680f,0.22)]',
    btn: 'bg-amber-50 text-amber-700 hover:bg-amber-50 hover:shadow-[0_2px_10px_rgba(#a5680f,0.22)]',
  },
  hard: {
    label: 'Hard',
    desc: 'The real boss fight',
    chip: 'bg-danger-50 text-danger-700',
    ring: 'border-danger-200',
    bar: 'from-danger-500 to-plum-400',
    glow: 'shadow-[0_2px_10px_rgba(#b03333,0.22)]',
    btn: 'bg-danger-100 text-danger-700 hover:bg-danger-100 hover:shadow-[0_2px_10px_rgba(#b03333,0.22)]',
  },
  all: {
    label: 'All Levels',
    desc: 'Every question, mixed',
    chip: 'bg-brand-50 text-brand-700',
    ring: 'border-brand-200',
    bar: 'from-brand-500 to-plum-400',
    glow: 'shadow-[0_2px_10px_rgba(#1554c7,0.22)]',
    btn: 'bg-brand-100 text-brand-700 hover:bg-brand-100 hover:shadow-[0_2px_10px_rgba(#1554c7,0.22)]',
  },
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ?? 'text-ink'}`}>{value}</div>
    </div>
  )
}

function StatusPill({ status, level }) {
  if (status === 'completed') {
    return <span className="rounded-full bg-leaf-50 px-2.5 py-0.5 text-[11px] font-bold text-leaf-700">✔ Completed</span>
  }
  if (status === 'in-progress') {
    return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${LEVELS[level].chip}`}>In progress</span>
  }
  return <span className="rounded-full bg-line px-2.5 py-0.5 text-[11px] font-bold text-muted">Not started</span>
}

function questionPreview(q) {
  return q.question.split('\n')[0]
}

export default function LevelReport() {
  const { mode, level } = useParams()
  const { user } = useAuth()
  const [progress, setProgress] = useState({ completed: [], best: {} })
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  const validMode = MODE_LABELS[mode]
  const levelMeta = LEVELS[level]

  useEffect(() => {
    let active = true
    if (!validMode || !levelMeta) {
      setLoading(false)
      return undefined
    }
    Promise.all([getProgress('sql', user?.id), fetchAttempts(user?.id, { game: 'sql', mode, difficulty: level })])
      .then(([prog, rows]) => {
        if (!active) return
        setProgress(prog ?? { completed: [], best: {} })
        setAttempts(rows ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [mode, level, user?.id, validMode, levelMeta])

  if (!validMode || !levelMeta) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Unknown level</h1>
        <p className="mt-3 text-sm text-muted">That report doesn’t exist.</p>
        <Link to="/profile" className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Back to profile
        </Link>
      </div>
    )
  }

  const questions = selectQuestions({ types: [mode], difficulty: level })
  const key = levelKey(mode, level)
  const bestPct = progress.best?.[key] ?? 0
  const isCompleted = (progress.completed ?? []).includes(key)
  const hasAnyAttempt = attempts.length > 0
  const status = isCompleted ? 'completed' : bestPct > 0 || hasAnyAttempt ? 'in-progress' : 'not-started'

  const byQuestion = new Map()
  for (const row of attempts) {
    const agg = byQuestion.get(row.question_id) ?? { tries: 0, corrects: 0, lastCorrect: false, lastAt: null }
    agg.tries += 1
    agg.corrects += row.correct ? 1 : 0
    agg.lastCorrect = row.correct
    agg.lastAt = row.created_at
    byQuestion.set(row.question_id, agg)
  }

  const attemptedCount = byQuestion.size
  const totalCorrect = [...byQuestion.values()].reduce((sum, a) => sum + a.corrects, 0)
  const totalTries = [...byQuestion.values()].reduce((sum, a) => sum + a.tries, 0)
  const accuracy = totalTries > 0 ? Math.round((totalCorrect / totalTries) * 100) : null
  const mastered = questions.filter((q) => byQuestion.get(q.id)?.lastCorrect).length

  const unlockHint =
    level === 'all'
      ? isCompleted
        ? 'All Levels complete — every question cleared!'
        : `Complete Easy, Medium and Hard with at least ${COMPLETE_THRESHOLD}% to unlock All Levels.`
      : level === 'hard'
        ? isCompleted
          ? 'Hard complete — all levels cleared!'
          : `Complete Easy and Medium with at least ${COMPLETE_THRESHOLD}% to unlock Hard.`
        : level === 'medium'
          ? 'Score at least 75% here to help unlock Hard.'
          : level === 'easy'
            ? 'Score at least 75% to complete Easy and move up.'
            : ''

  const ruleDescription =
    level === 'hard'
      ? `Complete Easy and Medium with at least ${COMPLETE_THRESHOLD}% to unlock Hard.`
      : level === 'all'
        ? `Complete Easy, Medium and Hard with at least ${COMPLETE_THRESHOLD}% to unlock All Levels.`
        : ''
  const unlocked = user ? isLevelUnlocked(level, progress, mode) : false

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/profile" className="group inline-flex items-center text-sm text-muted transition-colors hover:text-body">
        <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span> Back to profile
      </Link>

      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full border border-brand-200" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full border border-plum-200" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border border-brand-200" />

        <div className="relative px-6 py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
              {MODE_LABELS[mode]}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${levelMeta.chip} ${levelMeta.ring} ${levelMeta.glow}`}>
              {levelMeta.label}
            </span>
            <StatusPill status={status} level={level} />
          </div>
          <p className="mt-2 text-xs text-muted">{levelMeta.desc} · {questions.length} questions · {unlockHint}</p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="w-40">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">best</span>
                <span className={`font-mono text-sm font-bold ${levelMeta.chip.split(' ')[1]}`}>{bestPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${levelMeta.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(bestPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            {!user ? (
              <Link to="/auth" className="inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Sign in to track per-question results
              </Link>
            ) : unlocked ? (
              <Link
                to={`/quiz/sql?mode=${mode}&level=${level}`}
                className={`inline-block rounded-full px-5 py-2 text-sm font-bold transition-all ${levelMeta.btn}`}
              >
                ▶ Play this level
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-line/60 px-5 py-2 text-sm font-semibold text-muted">
                🔒 Locked — {ruleDescription || 'complete earlier levels first'}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted">Loading report…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Questions" value={String(questions.length)} />
            <Stat label="Attempted" value={attemptedCount > 0 ? `${attemptedCount} / ${questions.length}` : '—'} />
            <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} accent={accuracy === null ? undefined : 'text-brand-700'} />
            <Stat label="Mastered" value={mastered > 0 ? `${mastered} / ${questions.length}` : '—'} accent="text-leaf-700" />
          </div>

          {hasAnyAttempt || bestPct > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Question breakdown</h3>
              {!hasAnyAttempt && bestPct > 0 && (
                <p className="border-b border-line px-4 py-3 text-xs text-muted">
                  You’ve cleared runs before per-question tracking existed — your best score above is from those. New attempts will list here.
                </p>
              )}
              <ul className="divide-y divide-line/60">
                {questions.map((q) => {
                  const agg = byQuestion.get(q.id)
                  return (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{q.topic}</div>
                          <div className="mt-0.5 truncate text-sm text-muted">{questionPreview(q)}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {agg ? (
                            <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${agg.lastCorrect ? 'bg-leaf-50 text-leaf-700' : 'bg-danger-50 text-danger-700'}`}>
                              {agg.lastCorrect ? '✓' : '✗'}
                            </span>
                          ) : (
                            <span className="rounded-md bg-line px-2 py-0.5 font-mono text-xs font-bold text-body">○</span>
                          )}
                          <span className="w-24 text-right font-mono text-xs text-muted">
                            {agg
                              ? `${agg.corrects}/${agg.tries} · ${formatDate(agg.lastAt)}`
                              : 'not attempted'}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">
              No progress recorded for this level yet.
              {!user ? (
                <> <Link to="/auth" className="text-brand-700 hover:text-brand-700">Sign in</Link> to track your answers.</>
              ) : (
                <>
                  {' '}
                  <Link to={`/quiz/sql?mode=${mode}&level=${level}`} className="text-brand-700 hover:text-brand-700">Play it now</Link>
                  .
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}