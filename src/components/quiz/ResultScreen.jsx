import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { COMPLETE_THRESHOLD, levelKey } from '../../lib/progress.js'
import { quizModes } from './ModeSelect.jsx'
import { getQuizHelp } from '../../data/quizHelp.js'
import { isNarrow } from '../../lib/viewport.js'
import { useCountUp } from '../../hooks/useCountUp.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import ResultTable from './ResultTable.jsx'
import SqlCode from '../academy/SqlCode.jsx'

const QUOTES = [
  'Small steps every day lead to big results.',
  'Progress over perfection — keep going!',
  'Every mistake is a lesson in disguise.',
  'Consistency is the key to mastering SQL.',
  'You are closer to mastery than you think.',
]

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function joinNames(names) {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function grade(percent) {
  if (percent >= 90) {
    return { letter: 'A', color: 'text-leaf-700', bg: 'bg-leaf-50', border: 'border-leaf-200', msg: 'Outstanding!' }
  }
  if (percent >= 75) {
    return { letter: 'B', color: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200', msg: 'Great job!' }
  }
  if (percent >= 60) {
    return { letter: 'C', color: 'text-brand-700', bg: 'bg-brand-50', border: 'border-brand-200', msg: 'Solid work.' }
  }
  if (percent >= 40) {
    return { letter: 'D', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', msg: 'Keep practicing.' }
  }
  return { letter: 'F', color: 'text-danger-700', bg: 'bg-danger-50', border: 'border-danger-200', msg: 'Review the explanations below.' }
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function CrossIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M4 7v1a8 8 0 0 0 16 0V7" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function HeartIcon({ className, filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.2S4 15 4 9.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8 3.2c0 5.4-8 10.6-8 10.6Z" />
    </svg>
  )
}

function StarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  )
}

function ProgressBlock({ percent, completedThisRun, difficulty, mode, progress, onGoToLevels }) {
  const completed = progress.completed ?? []
  const modeKey = mode ?? 'mc'
  const has = (level) => completed.includes(levelKey(modeKey, level))
  const hardUnlocked = has('easy') && has('medium')
  const allUnlocked = hardUnlocked && has('hard')

  let justUnlocked = null
  if (completedThisRun) {
    if ((difficulty === 'easy' || difficulty === 'medium') && hardUnlocked) {
      justUnlocked = 'Hard unlocked!'
    } else if (difficulty === 'hard' && allUnlocked) {
      justUnlocked = 'All Levels unlocked!'
    }
  }

  if (justUnlocked) {
    return (
      <div className="rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-center">
        <div className="text-sm font-semibold text-leaf-700">{justUnlocked}</div>
        <button
          type="button"
          onClick={onGoToLevels}
          className="group mt-2 inline-flex items-center gap-1 rounded-full bg-leaf-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-leaf-700 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
        >
          Go to levels
          <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    )
  }

  let requirement = null
  if (!hardUnlocked) {
    const missing = ['easy', 'medium'].filter((level) => !has(level)).map(capitalize)
    requirement = `Score ${COMPLETE_THRESHOLD}% on ${joinNames(missing)} to unlock Hard`
  } else if (!allUnlocked) {
    requirement = `Score ${COMPLETE_THRESHOLD}% on Hard to unlock All Levels`
  }

  if (!requirement) {
    return (
      <div className="rounded-xl border border-line bg-mist/60 px-4 py-3 text-center">
        <div className="text-sm font-medium text-body">Try the next level</div>
        <button
          type="button"
          onClick={onGoToLevels}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold text-body shadow-sm transition hover:bg-mist/60 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
        >
          Go to levels
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-mist/60 px-4 py-3 text-center">
      <div className="text-sm font-medium text-body">{requirement}</div>
      <div className="mt-1 text-xs text-muted">You scored {percent}% this run</div>
    </div>
  )
}

function QuoteBox() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  return (
    <blockquote className="rounded-r-xl border-l-4 border-brand-400 bg-brand-50/60 px-4 py-3">
      <p className="text-sm italic leading-relaxed text-body">“{quote}”</p>
    </blockquote>
  )
}

function saveMessage(status, { modeLabel, username } = {}) {
  switch (status) {
    case 'saving':
      return <span className="text-muted">Saving score…</span>
    case 'saved':
      return (
        <span className="text-leaf-700">
          Saved — you&apos;re on the {modeLabel ?? 'leaderboard'}
          {username ? (
            <>
              {' '}
              as <span className="font-semibold">{username}</span>
            </>
          ) : null}
          .
        </span>
      )
    case 'error':
      return <span className="text-danger-700">Couldn’t save score. Try again later.</span>
    case 'guest':
      return (
        <span className="text-muted">
          <Link to="/auth" className="text-brand-700 underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to save your score to the leaderboard.
        </span>
      )
    default:
      return null
  }
}

const HERO_POINTS = { easy: 100, medium: 200, hard: 300 }

function heroTitle(percent) {
  if (percent >= 90) return 'Outstanding'
  if (percent >= 70) return 'Great Job'
  if (percent >= 40) return 'Good Effort'
  return 'Keep Practicing'
}

function heroSubtitle(percent) {
  if (percent >= 90) return 'You nailed nearly every question. Masterful work!'
  if (percent >= 70) return 'Strong performance — you are well on your way to mastery.'
  if (percent >= 40) return 'Nice effort. A little more practice and you will ace it.'
  return 'Every attempt makes you sharper. Keep going!'
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds || 0))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function HeroIllustration({ className }) {
  return (
    <svg viewBox="0 0 320 260" className={className} role="img" aria-label="SQL database illustration" fill="none">
      <path d="M40 40l2.2 5.8L48 48l-5.8 2.2L40 56l-2.2-5.8L32 48l5.8-2.2z" fill="#c4b5fd" />
      <path d="M276 54l3 7.8L287 65l-8 3.2-3 7.8-3-7.8-8-3.2 8-3.2z" fill="#f0abfc" />
      <circle cx="292" cy="176" r="3.2" fill="#f0abfc" />
      <circle cx="18" cy="132" r="2.6" fill="#c4b5fd" />

      <ellipse cx="82" cy="182" rx="46" ry="17" fill="#8b5cf6" />
      <rect x="36" y="80" width="92" height="102" fill="#8b5cf6" />
      <path d="M36 118a46 17 0 0 0 92 0M36 148a46 17 0 0 0 92 0" stroke="#7c3aed" strokeWidth="3" />
      <ellipse cx="82" cy="80" rx="46" ry="17" fill="#a78bfa" />
      <ellipse cx="82" cy="80" rx="46" ry="17" stroke="#7c3aed" strokeWidth="3" />

      <rect x="26" y="198" width="54" height="11" rx="3" fill="#d97706" />
      <path d="M34 209h38l-6 37H40z" fill="#f59e0b" />
      <ellipse cx="53" cy="188" rx="12" ry="21" fill="#22c55e" />
      <ellipse cx="37" cy="193" rx="9" ry="16" fill="#16a34a" transform="rotate(-26 37 193)" />
      <ellipse cx="69" cy="193" rx="9" ry="16" fill="#16a34a" transform="rotate(26 69 193)" />

      <rect x="118" y="116" width="156" height="106" rx="14" fill="#1e293b" />
      <text x="136" y="142" fill="#c4b5fd" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700">SQL</text>
      <text x="136" y="166" fill="#93c5fd" fontFamily="ui-monospace, monospace" fontSize="9">SELECT *</text>
      <text x="136" y="181" fill="#93c5fd" fontFamily="ui-monospace, monospace" fontSize="9">FROM employees</text>
      <text x="136" y="196" fill="#86efac" fontFamily="ui-monospace, monospace" fontSize="9">WHERE dept_id = 1;</text>

      <circle cx="268" cy="122" r="19" fill="#22c55e" />
      <path className="draw-check" d="m259 122 6.5 6.5L278 115" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatTile({ icon, label, value, sub, delay = 0 }) {
  return (
    <div
      className="result-stat flex flex-col rounded-xl border border-line bg-white/95 px-4 py-3 text-left shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-ink">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  )
}

// Counts a number up from 0 to `value` over ~1s. Under reduced motion it shows
// the final value immediately (the hook is still called so hook order holds).
function CountUp({ value, reduced, format }) {
  const animated = useCountUp(value ?? 0, { duration: 1000, start: !reduced })
  const shown = reduced ? (value ?? 0) : animated
  return <>{format ? format(shown) : shown}</>
}

const CONFETTI_COLORS = ['#8c1568', '#d4349e', '#4c9a68', '#c98a2e', '#6b46c9', '#b01f82']

// One short, non-looping burst. Rendered only when accuracy >= 70% and motion
// is allowed; the parent unmounts it once the animation has finished.
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 180,
      dy: 260 + Math.random() * 210,
      rot: Math.round((Math.random() - 0.5) * 720),
      delay: Math.round(Math.random() * 180),
      w: 7 + Math.round(Math.random() * 7),
      h: 10 + Math.round(Math.random() * 8),
      round: Math.random() > 0.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    })),
  )

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0 overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="result-confetti absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: `${p.w}px`,
            height: p.round ? `${p.w}px` : `${p.h}px`,
            background: p.color,
            borderRadius: p.round ? '9999px' : '2px',
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

function DocIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  )
}

function SkipIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const LETTER_TONES = {
  correct: 'bg-leaf-100 text-leaf-700',
  wrong: 'bg-danger-100 text-danger-700',
  muted: 'bg-mist text-muted',
}

function LetterBadge({ letter, tone = 'correct' }) {
  return (
    <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-black leading-none ${LETTER_TONES[tone] ?? LETTER_TONES.muted}`}>
      {letter}
    </span>
  )
}

const REVIEW_STATUS = {
  correct: { label: 'Correct', Icon: CheckIcon, cls: 'border-leaf-200 bg-leaf-50 text-leaf-700' },
  wrong: { label: 'Wrong', Icon: CrossIcon, cls: 'border-danger-200 bg-danger-50 text-danger-700' },
  skipped: { label: 'Skipped', Icon: SkipIcon, cls: 'border-line bg-mist text-muted' },
}

function StatusPill({ status }) {
  const { label, Icon, cls } = REVIEW_STATUS[status] ?? REVIEW_STATUS.wrong
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

const REVIEW_TINTS = {
  correct: 'border-leaf-200 bg-leaf-50/40',
  wrong: 'border-danger-200 bg-danger-50/40',
  skipped: 'border-line bg-mist/40',
}

const NOTE_TONES = {
  good: 'border-leaf-200 bg-leaf-50 text-leaf-800',
  soft: 'border-brand-100 bg-brand-50/70 text-body',
  muted: 'border-line bg-mist/60 text-muted',
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => isNarrow())
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mq = window.matchMedia('(width < 40rem)')
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

function TopicChip({ section }) {
  if (!section) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-brand-700">
      <DocIcon className="h-3 w-3" />
      {section}
    </span>
  )
}

function QueryBlock({ label, sql, tone = 'neutral' }) {
  const border = tone === 'correct' ? 'border-leaf-200' : tone === 'wrong' ? 'border-danger-200' : 'border-line'
  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border ${border} bg-white`}>
      <div className="border-b border-line/80 bg-mist/70 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </div>
      <pre className="m-0 max-h-64 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">
        <SqlCode code={sql} />
      </pre>
    </div>
  )
}

function ResultCompare({ answer, question }) {
  const actual = answer.actualResult
  const expected = question?.expected
  if (!actual && !expected) return null
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {actual && (
        <div className="min-w-0">
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Your result</div>
          <ResultTable columns={actual.columns} rows={actual.rows} />
        </div>
      )}
      {expected && (
        <div className="min-w-0">
          <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Expected result</div>
          <ResultTable columns={expected.columns} rows={expected.rows} />
        </div>
      )}
    </div>
  )
}

function ReviewRow({ index, answer, open, onToggle, delay = 0 }) {
  const question = answer.question
  const isMc = question?.type === 'mc'
  const isSql = question?.type === 'write' || question?.type === 'bug'
  const status = answer.timedOut ? 'skipped' : answer.correct ? 'correct' : 'wrong'
  const questionText = (question?.question ?? '').split('\n')[0]
  const regionId = `review-detail-${index}`
  const section = question ? getQuizHelp(question).section : null

  const given = answer.answer
  const givenLetter = typeof given === 'number' ? OPTION_LETTERS[given] ?? String(given + 1) : null
  const correctIndex = question?.answerIndex
  const correctLetter = correctIndex != null ? OPTION_LETTERS[correctIndex] ?? String(correctIndex + 1) : null

  const playerSql = typeof given === 'string' ? given : null
  const solutionSql = question?.type === 'bug' ? question.fixedQuery : question?.explanation
  const errorText = answer.error || answer.errorMessage || null

  return (
    <div
      className={`result-row overflow-hidden rounded-xl border shadow-sm ${REVIEW_TINTS[status]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={regionId}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-white/60 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
      >
        <span className="col-start-1 row-start-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-white font-mono text-xs font-bold text-muted">
          Q{index + 1}
        </span>

        <span className="col-start-2 row-start-1 min-w-0 text-sm leading-relaxed text-body [overflow-wrap:anywhere]">
          {questionText}
        </span>

        {isMc && (
          <div className="col-span-3 row-start-2 flex flex-col gap-1 sm:col-span-1 sm:col-start-3 sm:row-start-1">
            {status !== 'skipped' && (
              <span className="flex items-center gap-2 text-xs text-muted">
                <span className="shrink-0">Your answer:</span>
                <LetterBadge letter={givenLetter} tone={status === 'correct' ? 'correct' : 'wrong'} />
                <span className={`min-w-0 [overflow-wrap:anywhere] ${status === 'correct' ? 'text-leaf-700' : 'text-danger-700'}`}>
                  {question.options[given]}
                </span>
              </span>
            )}
            {status !== 'correct' && (
              <span className="flex items-center gap-2 text-xs text-muted">
                <span className="shrink-0">Correct answer:</span>
                <LetterBadge letter={correctLetter} />
                <span className="min-w-0 text-leaf-700 [overflow-wrap:anywhere]">{question.options[correctIndex]}</span>
              </span>
            )}
          </div>
        )}

        <span className="col-start-3 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-4 sm:row-start-1">
          <StatusPill status={status} />
          <ChevronIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <div id={regionId} role="region" aria-hidden={!open} className={`result-expand ${open ? 'is-open' : ''}`}>
        <div className="min-w-0 space-y-3 border-t border-line/70 bg-white/70 px-4 py-3.5 text-body">
          {isMc && (
            <>
              {section && <TopicChip section={section} />}
              <ul className="flex flex-col gap-1.5">
                {question.options.map((opt, i) => {
                  const isCorrect = i === correctIndex
                  const picked = i === given
                  const tone = isCorrect ? 'correct' : picked ? 'wrong' : 'muted'
                  const rowTone = isCorrect
                    ? 'border-leaf-200 bg-leaf-50/70'
                    : picked
                      ? 'border-danger-200 bg-danger-50/70'
                      : 'border-line bg-white'
                  return (
                    <li key={i} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${rowTone}`}>
                      <LetterBadge letter={OPTION_LETTERS[i] ?? String(i + 1)} tone={tone} />
                      <span className="min-w-0 flex-1 leading-relaxed text-body [overflow-wrap:anywhere]">{opt}</span>
                      {picked && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isCorrect ? 'bg-leaf-100 text-leaf-700' : 'bg-danger-100 text-danger-700'}`}>
                          Your pick
                        </span>
                      )}
                      {isCorrect && !picked && (
                        <span className="shrink-0 rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-leaf-700">
                          Answer
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
              {question.explanation && (
                <p className="text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">{question.explanation}</p>
              )}
            </>
          )}

          {isSql && (
            <div className="min-w-0 space-y-3">
              {errorText && (
                <div className="rounded-lg border border-danger-200 bg-danger-50/70 px-3 py-2 text-xs text-danger-800 [overflow-wrap:anywhere]">
                  <span className="font-semibold">Your query raised an error. </span>
                  {errorText}
                </div>
              )}

              {playerSql ? (
                <QueryBlock label="Your query" sql={playerSql} tone={answer.correct ? 'correct' : 'wrong'} />
              ) : (
                status === 'skipped' && (
                  <p className="text-xs leading-relaxed text-muted">You ran out of time before submitting a query.</p>
                )
              )}

              {solutionSql && <QueryBlock label="Solution query" sql={solutionSql} tone="correct" />}

              <ResultCompare answer={answer} question={question} />

              {!answer.correct && !errorText && answer.reason && (
                <p className="text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">{answer.reason}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultScreen({ snapshot, saveStatus = 'idle', onReplay, onBackToLevels, difficulty, mode, progress = {}, username }) {
  const answers = snapshot.answers
  const correct = answers.filter((a) => a.correct).length
  const total = answers.length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const g = grade(percent)
  const sideTitle = percent >= 70 ? 'Nice Work!' : 'Keep Going!'
  const sideMessage =
    percent >= 90
      ? 'Almost perfect — that is mastery.'
      : percent >= 70
        ? 'Strong run. You are on the right track.'
        : percent >= 40
          ? 'Good effort — review the misses below.'
          : 'Every attempt builds your SQL skills.'
  const completedThisRun = percent >= COMPLETE_THRESHOLD
  const reduced = useReducedMotion()

  const modeTitle = quizModes.find((m) => m.key === mode)?.title
  const boardLabel = modeTitle ? `${modeTitle}${difficulty ? ` · ${difficulty}` : ''}` : null

  const firstName = username ? username.trim().split(/\s+/)[0] : ''
  const outOfLives = snapshot.lives <= 0
  const endLabel = outOfLives ? 'Out of Lives' : 'Quiz Completed'
  const title = heroTitle(percent)
  const subtitle = heroSubtitle(percent)
  const livesUsed = Math.max(0, 3 - snapshot.lives)
  const maxScore = answers.reduce((sum, a) => sum + (HERO_POINTS[a.question.difficulty] ?? 100), 0)
  const livesCaption =
    livesUsed === 0 ? 'No lives lost' : outOfLives ? 'Out of lives' : `${livesUsed} ${livesUsed === 1 ? 'life' : 'lives'} lost`
  const timeCaption = saveStatus === 'saved' ? 'Saved to leaderboard' : 'Not saved'

  const [reviewFilter, setReviewFilter] = useState('all')
  const [displayFilter, setDisplayFilter] = useState('all')
  const [fading, setFading] = useState(false)
  const [confettiDone, setConfettiDone] = useState(false)
  const swapTimer = useRef(null)
  const [openRows, setOpenRows] = useState([])
  const isMobile = useIsMobile()

  const showConfetti = percent >= 70 && !reduced && !confettiDone
  useEffect(() => {
    if (!showConfetti) return undefined
    const t = setTimeout(() => setConfettiDone(true), 1700)
    return () => clearTimeout(t)
  }, [showConfetti])

  const changeFilter = (key) => {
    if (key === reviewFilter) return
    setReviewFilter(key)
    if (reduced) {
      setDisplayFilter(key)
      return
    }
    setFading(true)
    if (swapTimer.current) clearTimeout(swapTimer.current)
    swapTimer.current = setTimeout(() => {
      setDisplayFilter(key)
      setFading(false)
    }, 140)
  }

  useEffect(() => () => {
    if (swapTimer.current) clearTimeout(swapTimer.current)
  }, [])
  const skippedCount = answers.filter((a) => a.timedOut).length
  const wrongCount = answers.filter((a) => !a.correct && !a.timedOut).length
  const unreached = Math.max(0, (snapshot.total ?? total) - total)
  const activeMode = quizModes.find((m) => m.key === mode)
  const canSkip = Boolean(activeMode?.timePerQuestion)
  const perfect = total > 0 && correct === total
  const zeroCorrect = total > 0 && correct === 0
  const filterCounts = { all: total, correct, wrong: wrongCount, skipped: skippedCount }
  const reviewFilters = [
    { key: 'all', label: 'All' },
    { key: 'correct', label: 'Correct' },
    { key: 'wrong', label: 'Wrong' },
    ...(canSkip ? [{ key: 'skipped', label: 'Skipped' }] : []),
  ].filter((f) => f.key === 'all' || filterCounts[f.key] > 0)
  const visibleAnswers = answers
    .map((answer, index) => ({ answer, index }))
    .filter(({ answer }) => {
      if (displayFilter === 'correct') return answer.correct
      if (displayFilter === 'wrong') return !answer.correct && !answer.timedOut
      if (displayFilter === 'skipped') return Boolean(answer.timedOut)
      return true
    })
  const REVIEW_EMPTY = {
    all: 'No answers to review yet.',
    correct: 'No correct answers yet. Keep practicing!',
    wrong: 'No wrong answers. Perfect run!',
    skipped: 'No skipped questions. Nice pacing!',
  }
  const reviewNotes = []
  if (perfect) {
    reviewNotes.push({ tone: 'good', text: 'A perfect run — every answer correct. Outstanding!' })
  } else if (zeroCorrect) {
    reviewNotes.push({ tone: 'soft', text: 'No correct answers yet, and that is okay — every attempt is progress. Read the explanations and run it back.' })
  }
  if (unreached > 0) {
    reviewNotes.push({
      tone: 'muted',
      text: `${unreached} ${unreached === 1 ? 'question was' : 'questions were'} not reached.`,
    })
  }
  if (saveStatus === 'guest') {
    reviewNotes.push({ tone: 'muted', text: 'Guest mode: this review is available for this session only.' })
  }

  const toggleRow = (i) => {
    setOpenRows((prev) => {
      const isOpen = prev.includes(i)
      if (isMobile) return isOpen ? [] : [i]
      return isOpen ? prev.filter((x) => x !== i) : [...prev, i]
    })
  }

  return (
    <div className="relative mx-auto max-w-[1280px] px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute -left-24 -top-20 -z-10 h-72 w-72 rounded-full bg-[rgba(247,212,237,0.45)] blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 -z-10 h-80 w-80 rounded-full bg-[rgba(213,194,245,0.4)] blur-3xl" aria-hidden="true" />

      {showConfetti && <Confetti />}

      <div className="grid grid-cols-1 gap-6 max-[1000px]:gap-4 min-[1000px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`result-hero col-span-1 min-[1000px]:col-span-1 min-[1000px]:col-start-1 min-[1000px]:row-start-1 overflow-hidden rounded-2xl border ${g.border} bg-gradient-to-b from-white via-white to-mist/30 shadow-[0_1px_2px_rgba(16,42,67,0.05)]`}>
          <div className="grid grid-cols-1 items-center gap-6 p-6 sm:p-8 min-[1000px]:grid-cols-[280px_minmax(0,1fr)]">
            <div className="result-float mx-auto w-full max-w-[240px] min-[1000px]:max-w-none">
              <HeroIllustration className="h-auto w-full" />
            </div>

            <div className="text-center min-[1000px]:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700">
                <CheckIcon className="h-3.5 w-3.5" />
                {endLabel}
              </div>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {title}
                {firstName ? (
                  <>
                    ,{' '}
                    <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                      {firstName}
                    </span>
                    !
                  </>
                ) : (
                  '!'
                )}
              </h2>

              <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 min-[1200px]:grid-cols-4">
                <StatTile
                  icon={<TrophyIcon className={`h-3.5 w-3.5 ${g.color}`} />}
                  label="Score"
                  value={<CountUp value={snapshot.score} reduced={reduced} />}
                  sub={maxScore > 0 ? `out of ${maxScore}` : null}
                  delay={300}
                />
                <StatTile
                  icon={<CheckIcon className="h-3.5 w-3.5 text-leaf-600" />}
                  label="Correct"
                  value={
                    <>
                      <CountUp value={correct} reduced={reduced} /> / {total}
                    </>
                  }
                  sub={
                    <>
                      <CountUp value={percent} reduced={reduced} />% accuracy
                    </>
                  }
                  delay={390}
                />
                <StatTile
                  icon={
                    <HeartIcon
                      className={`h-3.5 w-3.5 ${outOfLives ? 'text-danger-600' : 'text-brand-500'}`}
                      filled={!outOfLives}
                    />
                  }
                  label="Lives Used"
                  value={
                    <>
                      <CountUp value={livesUsed} reduced={reduced} /> / 3
                    </>
                  }
                  sub={livesCaption}
                  delay={480}
                />
                <StatTile
                  icon={<ClockIcon className="h-3.5 w-3.5 text-muted" />}
                  label="Time Taken"
                  value={<CountUp value={snapshot.elapsedSeconds ?? 0} reduced={reduced} format={formatTime} />}
                  sub={timeCaption}
                  delay={570}
                />
              </div>

              {saveStatus !== 'guest' && saveStatus !== 'idle' && (
                <div className="mt-4 text-xs text-muted">
                  {saveMessage(saveStatus, { modeLabel: boardLabel, username })}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 min-[1000px]:justify-start">
                <button
                  type="button"
                  onClick={onReplay}
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
                >
                  Play Again
                  <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToLevels}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-2.5 font-semibold text-body shadow-sm transition hover:bg-mist/60 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
                >
                  Back to Levels
                </button>
              </div>

              {saveStatus === 'guest' && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center min-[1000px]:justify-between min-[1000px]:text-left">
                  <span className="text-sm text-body">Sign in to save this score to the leaderboard.</span>
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside
          className="result-side col-span-1 order-2 min-[1000px]:order-none min-[1000px]:col-start-2 min-[1000px]:row-start-1 rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]"
          style={{ animationDelay: '120ms' }}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <StarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-base font-semibold text-body">{sideTitle}</div>
                <div className="text-xs text-muted">{sideMessage}</div>
              </div>
            </div>

            <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted">Your progress</div>
            <div className="mt-2">
              <ProgressBlock
                percent={percent}
                completedThisRun={completedThisRun}
                difficulty={difficulty}
                mode={mode}
                progress={progress}
                onGoToLevels={onBackToLevels}
              />
            </div>

            <div className="mt-4">
              <QuoteBox />
            </div>
          </div>
        </aside>

        <section
          className="result-review col-span-1 order-3 min-[1000px]:col-span-2 min-[1000px]:col-start-1 min-[1000px]:row-start-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex flex-col gap-4 border-b border-line px-6 py-5 sm:px-8 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <DocIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Answer <span className="text-brand-600">Review</span>
                </h2>
                <p className="text-sm text-muted">Here&apos;s how you performed on each question.</p>
              </div>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {reviewFilters.map((f) => {
                const active = reviewFilter === f.key
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => changeFilter(f.key)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                        : 'border border-line bg-white text-body hover:bg-mist/60'
                    }`}
                  >
                    {f.label} ({filterCounts[f.key]})
                  </button>
                )
              })}
            </div>
          </div>

          {reviewNotes.length > 0 && (
            <div className="flex flex-col gap-2 border-b border-line px-6 py-4 sm:px-8">
              {reviewNotes.map((note, i) => (
                <p
                  key={i}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium leading-relaxed [overflow-wrap:anywhere] ${NOTE_TONES[note.tone] ?? NOTE_TONES.muted}`}
                >
                  {note.text}
                </p>
              ))}
            </div>
          )}

          {visibleAnswers.length > 0 ? (
            <div className={`flex flex-col gap-2.5 px-6 py-6 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'} sm:px-8`}>
              {visibleAnswers.map(({ answer, index }, rowIdx) => (
                <ReviewRow
                  key={`${displayFilter}-${index}`}
                  index={index}
                  answer={answer}
                  open={openRows.includes(index)}
                  onToggle={() => toggleRow(index)}
                  delay={rowIdx * 60}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center px-6 py-8 text-center">
              <p className="text-sm text-muted">{REVIEW_EMPTY[displayFilter]}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ResultScreen
