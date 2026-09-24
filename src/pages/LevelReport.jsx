import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getProgress, levelKey, COMPLETE_THRESHOLD } from '../lib/progress.js'
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
    chip: 'bg-emerald-500/15 text-emerald-300',
    ring: 'border-emerald-500/50',
    bar: 'from-emerald-400 to-teal-400',
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.25)]',
    btn: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(16,185,129,0.5)]',
  },
  medium: {
    label: 'Medium',
    desc: 'Getting sharp',
    chip: 'bg-amber-500/15 text-amber-300',
    ring: 'border-amber-500/50',
    bar: 'from-amber-400 to-orange-400',
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.25)]',
    btn: 'bg-amber-500 text-amber-950 hover:bg-amber-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.5)]',
  },
  hard: {
    label: 'Hard',
    desc: 'The real boss fight',
    chip: 'bg-rose-500/15 text-rose-300',
    ring: 'border-rose-500/50',
    bar: 'from-rose-400 to-pink-400',
    glow: 'shadow-[0_0_18px_rgba(244,63,94,0.25)]',
    btn: 'bg-rose-500 text-rose-950 hover:bg-rose-400 hover:shadow-[0_0_28px_rgba(244,63,94,0.5)]',
  },
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

function StatusPill({ status, level }) {
  if (status === 'completed') {
    return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">✔ Completed</span>
  }
  if (status === 'in-progress') {
    return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${LEVELS[level].chip}`}>In progress</span>
  }
  return <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">Not started</span>
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
        <h1 className="text-2xl font-bold text-white">Unknown level</h1>
        <p className="mt-3 text-sm text-slate-400">That report doesn’t exist.</p>
        <Link to="/profile" className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
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
    level === 'hard'
      ? isCompleted
        ? 'Hard complete — all levels cleared!'
        : `Complete Easy and Medium with at least ${COMPLETE_THRESHOLD}% to unlock Hard.`
      : level === 'medium'
        ? 'Score at least 75% here to help unlock Hard.'
        : level === 'easy'
          ? 'Score at least 75% to complete Easy and move up.'
          : ''

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/profile" className="group inline-flex items-center text-sm text-slate-400 transition-colors hover:text-slate-200">
        <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span> Back to profile
      </Link>

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900">
        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full border border-indigo-500/20" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full border border-fuchsia-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full border border-cyan-500/10" />

        <div className="relative px-6 py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-300">
              {MODE_LABELS[mode]}
            </span>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${levelMeta.chip} ${levelMeta.ring} ${levelMeta.glow}`}>
              {levelMeta.label}
            </span>
            <StatusPill status={status} level={level} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{levelMeta.desc} · {questions.length} questions · {unlockHint}</p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="w-40">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">best</span>
                <span className={`font-mono text-sm font-bold ${levelMeta.chip.split(' ')[1]}`}>{bestPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${levelMeta.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(bestPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            {!user ? (
              <Link to="/auth" className="inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                Sign in to track per-question results
              </Link>
            ) : (
              <Link
                to={`/quiz/sql?mode=${mode}&level=${level}`}
                className={`inline-block rounded-full px-5 py-2 text-sm font-bold transition-all ${levelMeta.btn}`}
              >
                ▶ Play this level
              </Link>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Loading report…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Questions" value={String(questions.length)} />
            <Stat label="Attempted" value={attemptedCount > 0 ? `${attemptedCount} / ${questions.length}` : '—'} />
            <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} accent={accuracy === null ? undefined : 'text-indigo-300'} />
            <Stat label="Mastered" value={mastered > 0 ? `${mastered} / ${questions.length}` : '—'} accent="text-emerald-300" />
          </div>

          {hasAnyAttempt || bestPct > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <h3 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">Question breakdown</h3>
              {!hasAnyAttempt && bestPct > 0 && (
                <p className="border-b border-slate-800 px-4 py-3 text-xs text-slate-500">
                  You’ve cleared runs before per-question tracking existed — your best score above is from those. New attempts will list here.
                </p>
              )}
              <ul className="divide-y divide-slate-800/60">
                {questions.map((q) => {
                  const agg = byQuestion.get(q.id)
                  return (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{q.topic}</div>
                          <div className="mt-0.5 truncate text-sm text-slate-300">{questionPreview(q)}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {agg ? (
                            <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${agg.lastCorrect ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                              {agg.lastCorrect ? '✓' : '✗'}
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">○</span>
                          )}
                          <span className="w-24 text-right font-mono text-xs text-slate-500">
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">
              No progress recorded for this level yet.
              {!user ? (
                <> <Link to="/auth" className="text-indigo-300 hover:text-indigo-200">Sign in</Link> to track your answers.</>
              ) : (
                <>
                  {' '}
                  <Link to={`/quiz/sql?mode=${mode}&level=${level}`} className="text-indigo-300 hover:text-indigo-200">Play it now</Link>
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