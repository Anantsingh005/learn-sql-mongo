import { useState } from 'react'
import { Link } from 'react-router-dom'
import HintReveal from './HintReveal.jsx'
import { feedbackMood, streakInfo } from './quizStats.js'
import { getQuizHelp } from '../../data/quizHelp.js'

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

function FlameIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3c.5 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.5-2-.5-2 2 1.3 3.5 3.2 3.5 5.5A6 6 0 0 1 6 14.5C6 9.5 12 9 12 3Z" />
    </svg>
  )
}

function KeyboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M18 13.5h.01M8 13.5h8" />
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

const BURST = 'M0-6C1-1 1-1 6 0 1 1 1 1 0 6-1 1-1 1-6 0-1-1-1-1 0-6Z'

function ThinkSqlIllustration({ mood }) {
  const happy = mood === 'happy'
  const upset = mood === 'wobble'
  return (
    <svg viewBox="0 0 256 132" className="h-auto w-full" role="img" aria-label="Think SQL!">
      <Sparkle x={24} y={30} scale={1.15} className="fill-amber-400" />
      <Sparkle x={236} y={42} scale={0.9} className="fill-brand-300" />
      <Sparkle x={22} y={100} scale={0.8} className="fill-plum-400" />
      <Sparkle x={226} y={102} scale={1} className="fill-amber-300" />

      {happy && (
        <g>
          <g transform="translate(30 24) scale(1.25)">
            <path className="quiz-sparkle-burst fill-amber-400" d={BURST} />
          </g>
          <g transform="translate(104 30) scale(1)">
            <path className="quiz-sparkle-burst fill-brand-300" style={{ animationDelay: '70ms' }} d={BURST} />
          </g>
          <g transform="translate(24 92) scale(0.9)">
            <path className="quiz-sparkle-burst fill-plum-400" style={{ animationDelay: '140ms' }} d={BURST} />
          </g>
          <g transform="translate(108 96) scale(1.1)">
            <path className="quiz-sparkle-burst fill-amber-300" style={{ animationDelay: '210ms' }} d={BURST} />
          </g>
        </g>
      )}

      <rect x="126" y="24" width="120" height="60" rx="16" className="fill-white stroke-plum-200" strokeWidth="2" />
      <path d="M150 82l-14 20 30-8z" className="fill-white stroke-plum-200" strokeWidth="2" strokeLinejoin="round" />
      {upset ? (
        <>
          <text x="186" y="49" textAnchor="middle" className="fill-plum-700 font-hand" fontSize="15">
            Almost!
          </text>
          <text x="186" y="65" textAnchor="middle" className="fill-plum-700 font-hand" fontSize="15">
            Check the
          </text>
          <text x="186" y="81" textAnchor="middle" className="fill-plum-700 font-hand" fontSize="15">
            explanation.
          </text>
        </>
      ) : (
        <text x="186" y="61" textAnchor="middle" className="fill-plum-700 font-hand" fontSize="26">
          Think SQL!
        </text>
      )}

      <ellipse cx="66" cy="46" rx="33" ry="12.5" className="fill-plum-200 stroke-plum-400" strokeWidth="2" />
      <path className="fill-plum-100 stroke-plum-400" strokeWidth="2" d="M33 46v52c0 7 14.8 12.5 33 12.5s33-5.5 33-12.5V46" />
      <circle cx="55" cy="70" r="4" className="fill-plum-700" />
      <circle cx="79" cy="70" r="4" className="fill-plum-700" />
      <path
        d={
          upset
            ? 'M57 87c2.8-3.6 5.8-5.4 9-5.4s6.2 1.8 9 5.4'
            : happy
              ? 'M54 80c3.8 5.2 8 7.8 12 7.8s8.2-2.6 12-7.8'
              : 'M57 82c2.8 3.4 6 5 9 5s6.2-1.6 9-5'
        }
        className="stroke-plum-700"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
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

function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line bg-white px-1.5 font-mono text-[11px] font-semibold text-body shadow-[0_1px_0_rgba(16,42,67,0.12)]">
      {children}
    </kbd>
  )
}

function HelpPanel({ question, isGuest, snapshot, onBackToLevels, help }) {
  const [open, setOpen] = useState(defaultOpen)

  const helpInfo = help ?? (question ? getQuizHelp(question) : null)
  const info = question?.explanation || helpInfo?.quickInfo
  const tips = Array.isArray(helpInfo?.tips) ? helpInfo.tips.filter(Boolean) : Array.isArray(question?.tips) ? question.tips.filter(Boolean) : []
  const hasHint = Boolean(question?.hint)
  const showNeedHelp = hasHint
  const livesUsed = (snapshot?.lives ?? 0) <= 0
  const streak = streakInfo(snapshot)
  const isMc = question?.type === 'mc'
  const isSql = question?.type === 'write' || question?.type === 'bug'
  const shortcuts = []
  if (isMc) {
    shortcuts.push({ keys: ['A', 'B', 'C', 'D'], label: 'Choose an answer' })
    shortcuts.push({ keys: ['Enter'], label: 'Submit answer' })
  }
  if (isSql) {
    shortcuts.push({ keys: ['Ctrl', 'Enter'], label: 'Submit in the SQL editor' })
  }
  const mood = feedbackMood(snapshot)
  const moodClass = mood === 'happy' ? 'quiz-mood-happy' : mood === 'wobble' ? 'quiz-mood-wobble' : ''
  const moodKey = `${snapshot?.index ?? 0}-${snapshot?.status ?? ''}`
  const answers = snapshot?.answers ?? []
  const lastAnswerCorrect = answers.length > 0 && answers[answers.length - 1]?.correct === true
  const flameScale = 1 + Math.min(streak.current, 6) * 0.07
  const swapKey = question?.id ?? 'q'

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle — only when the panel is stacked under the card (< 1200px) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-mist motion-reduce:transform-none motion-reduce:transition-none min-[1200px]:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-body">
          <HelpIcon className="h-4 w-4 text-brand-600" />
          Help
        </span>
        <ChevronIcon className={`h-4 w-4 text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${open ? 'flex' : 'hidden min-[1200px]:flex'} flex-col gap-4`}>
        <div className="quiz-slide-right overflow-hidden rounded-2xl border border-plum-200 bg-gradient-to-b from-plum-50 to-white p-3 shadow-sm" style={{ animationDelay: '0ms' }}>
          <span className="quiz-bob block">
            <span key={moodKey} className={`block ${moodClass}`}>
              <ThinkSqlIllustration mood={mood} />
            </span>
          </span>
        </div>

        {info && (
          <div className="quiz-slide-right rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '100ms' }}>
            <CardHeader icon={<BulbIcon className="h-4 w-4 text-brand-600" />} label="Quick Info" tone="text-brand-700" />
            <p key={swapKey} className="quiz-fade-swap mt-2 min-h-[2.75rem] text-sm leading-relaxed text-brand-700">
              {info}
            </p>
          </div>
        )}

        {tips.length > 0 && (
          <div className="quiz-slide-right rounded-2xl border border-leaf-200 bg-gradient-to-br from-leaf-50 to-white p-4 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '200ms' }}>
            <CardHeader icon={<CheckIcon className="h-4 w-4 text-leaf-600" />} label="Tips" tone="text-leaf-700" />
            <ul key={swapKey} className="mt-2 flex flex-col gap-1.5">
              {tips.map((tip, i) => (
                <li
                  key={tip}
                  className="enter-pop flex gap-2 text-sm leading-relaxed text-leaf-700"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-600" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {streak.answered > 0 && (
          <div className="quiz-slide-right rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '0ms' }}>
            <CardHeader
              icon={
                <span className="inline-flex transition-transform duration-500 motion-reduce:transition-none" style={{ transform: `scale(${flameScale})` }}>
                  <FlameIcon className="h-4 w-4 text-amber-600" />
                </span>
              }
              label="Your Streak"
              tone="text-amber-700"
            />
            <div className="mt-2 flex items-end gap-4">
              <div>
                <div
                  key={`streak-${answers.length}`}
                  className={`font-mono text-2xl font-black leading-none tabular-nums text-amber-700 ${lastAnswerCorrect ? 'quiz-streak-pop' : ''}`}
                >
                  {streak.current}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-700/80">
                  Current
                </div>
              </div>
              <div className="h-8 w-px bg-amber-200" aria-hidden="true" />
              <div>
                <div className="font-mono text-2xl font-black leading-none tabular-nums text-amber-700">
                  {streak.best}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-700/80">
                  Best this session
                </div>
              </div>
            </div>
          </div>
        )}

        {shortcuts.length > 0 && (
          <div className="quiz-slide-right rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '300ms' }}>
            <CardHeader icon={<KeyboardIcon className="h-4 w-4 text-brand-600" />} label="Shortcuts" tone="text-body" />
            <ul className="mt-3 flex flex-col gap-2.5">
              {shortcuts.map((shortcut) => (
                <li key={shortcut.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{shortcut.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showNeedHelp && (
          <div className="quiz-slide-right rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '400ms' }}>
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
          <div className="quiz-slide-right rounded-2xl border border-danger-200 bg-gradient-to-br from-danger-50 to-white p-4 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '0ms' }}>
            <CardHeader icon={<HelpIcon className="h-4 w-4 text-danger-700" />} label="All lives used?" tone="text-danger-700" />
            <p className="mt-2 text-sm leading-relaxed text-danger-700">
              This quiz has ended. Head back to the level screen to try this level again.
            </p>
            <button
              type="button"
              onClick={onBackToLevels}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-all duration-300 hover:bg-brand-700 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
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
