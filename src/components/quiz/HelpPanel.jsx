import { useState } from 'react'
import { Link } from 'react-router-dom'
import HintReveal from './HintReveal.jsx'
import { feedbackMood } from './quizStats.js'

const DESKTOP_QUERY = '(min-width: 1200px)'

function defaultOpen() {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia(DESKTOP_QUERY).matches
}

function BulbIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.7 10.7c.5.4.7 1 .7 1.6V18h6v-2.7c0-.6.3-1.2.7-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

function HelpIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.2 2-2.2 3.3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Sparkle({ x, y, scale = 1, className }) {
  return (
    <path
      className={className}
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M0-6C1-1 1-1 6 0 1 1 1 1 0 6-1 1-1 1-6 0-1-1-1-1 0-6Z"
    />
  )
}

function ThinkSqlIllustration() {
  return (
    <svg viewBox="0 0 256 132" className="h-auto w-full" role="img" aria-label="Think SQL!">
      <Sparkle x={24} y={30} scale={1.15} className="fill-amber-400" />
      <Sparkle x={236} y={42} scale={0.9} className="fill-brand-300" />
      <Sparkle x={22} y={100} scale={0.8} className="fill-plum-400" />
      <Sparkle x={226} y={102} scale={1} className="fill-amber-300" />

      {/* speech bubble */}
      <rect x="126" y="24" width="120" height="60" rx="16" className="fill-white stroke-plum-200" strokeWidth="2" />
      <path d="M150 82l-14 20 30-8z" className="fill-white stroke-plum-200" strokeWidth="2" strokeLinejoin="round" />
      <text x="186" y="61" textAnchor="middle" className="fill-plum-700 font-hand" fontSize="26">
        Think SQL!
      </text>

      {/* mascot */}
      <ellipse cx="66" cy="46" rx="33" ry="12.5" className="fill-plum-200 stroke-plum-400" strokeWidth="2" />
      <path className="fill-plum-100 stroke-plum-400" strokeWidth="2" d="M33 46v52c0 7 14.8 12.5 33 12.5s33-5.5 33-12.5V46" />
      <circle cx="55" cy="70" r="4" className="fill-plum-700" />
      <circle cx="79" cy="70" r="4" className="fill-plum-700" />
      <path d="M57 82c2.8 3.4 6 5 9 5s6.2-1.6 9-5" className="stroke-plum-700" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M47 96h38M47 104h28" className="stroke-plum-200" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function CardHeader({ icon, label, tone }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className={`text-[11px] font-bold uppercase tracking-[0.16em] ${tone}`}>{label}</h3>
    </div>
  )
}

function HelpPanel({ question, isGuest, snapshot, onBackToLevels }) {
  const [open, setOpen] = useState(defaultOpen)

  const topic = question?.topic || question?.subtopic
  const info = topic || question?.explanation
  const tips = Array.isArray(question?.tips) ? question.tips.filter(Boolean) : []
  const hasHint = Boolean(question?.hint)
  const showNeedHelp = hasHint
  const livesUsed = (snapshot?.lives ?? 0) <= 0
  const mood = feedbackMood(snapshot)
  const moodClass = mood === 'happy' ? 'quiz-mood-happy' : mood === 'wobble' ? 'quiz-mood-wobble' : ''
  const moodKey = `${snapshot?.index ?? 0}-${snapshot?.status ?? ''}`

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle — only when the panel is stacked under the card (< 1200px) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-colors hover:bg-mist min-[1200px]:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-body">
          <HelpIcon className="h-4 w-4 text-brand-600" />
          Help
        </span>
        <ChevronIcon className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${open ? 'flex' : 'hidden min-[1200px]:flex'} flex-col gap-4`}>
        {/* 1. Mascot header */}
        <div className="overflow-hidden rounded-2xl border border-plum-200 bg-plum-50 p-3">
          <span className="quiz-bob block">
            <span key={moodKey} className={`block ${moodClass}`}>
              <ThinkSqlIllustration />
            </span>
          </span>
        </div>

        {/* 2. Quick Info */}
        {info && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <CardHeader icon={<BulbIcon className="h-4 w-4 text-brand-600" />} label="Quick Info" tone="text-brand-700" />
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              This question tests <span className="font-semibold">{info}</span>.
            </p>
          </div>
        )}

        {/* 3. Tips */}
        {tips.length > 0 && (
          <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
            <CardHeader icon={<CheckIcon className="h-4 w-4 text-leaf-600" />} label="Tips" tone="text-leaf-700" />
            <ul className="mt-2 flex flex-col gap-1.5">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-relaxed text-leaf-700">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-600" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Need Help? */}
        {showNeedHelp && (
          <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
            <CardHeader icon={<HelpIcon className="h-4 w-4 text-brand-600" />} label="Need Help?" tone="text-body" />
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Get hints or view the explanation.
            </p>
            {isGuest ? (
              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-mist/60 px-3.5 py-2.5">
                <LockIcon className="h-4 w-4 shrink-0 text-muted" />
                <p className="text-sm text-muted">
                  <Link to="/auth?mode=signup" className="font-semibold text-brand-700 hover:underline">
                    Create an account
                  </Link>{' '}
                  to use hints.
                </p>
              </div>
            ) : (
              <HintReveal hint={question.hint} label="View Hint" openLabel="Hide Hint" />
            )}
          </div>
        )}

        {/* 5. All lives used? — only once lives reach 0 */}
        {livesUsed && (
          <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4">
            <CardHeader icon={<HelpIcon className="h-4 w-4 text-danger-700" />} label="All lives used?" tone="text-danger-700" />
            <p className="mt-2 text-sm leading-relaxed text-danger-700">
              This quiz has ended. Head back to the level screen to try this level again.
            </p>
            <button
              type="button"
              onClick={onBackToLevels}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Back to levels
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HelpPanel
