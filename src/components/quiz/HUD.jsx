import { ENTER_POP, stagger } from '../site/motion.js'
import { livesInfo } from './quizStats.js'

function Heart({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 transition-colors duration-300 ${filled ? 'text-brand-500' : 'text-line'}`}
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

function ClockIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function ExtraTimePrompt({ timeLeft, extraTimeSeconds, onGrant, onDecline }) {
  return (
    <div className="enter-pop rounded-xl border border-amber-200 bg-amber-50 p-3.5">
      <div className="flex items-center gap-2 text-amber-700">
        <ClockIcon className="h-4 w-4" />
        <span className="text-xs font-bold">Only {timeLeft}s left</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-amber-800">
        Add {extraTimeSeconds}s more to keep working on this question?
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onGrant}
          className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600"
        >
          +{extraTimeSeconds}s
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50"
        >
          No thanks
        </button>
      </div>
    </div>
  )
}

function HUD({ snapshot, onGrantExtraTime, onDeclineExtraTime }) {
  const { index, total, timeLeft, extraTimePending, extraTimeSeconds } = snapshot

  const currentNumber = Math.min(index + 1, total)
  const { filled: filledLives, total: totalLives } = livesInfo(snapshot)
  const progressPct = total > 0 ? Math.min(1, currentNumber / total) : 0

  // Turn the pill red and pulse it softly once ten seconds or fewer remain.
  const warn = timeLeft <= 10

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
        {/* Timer + progress */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] sm:p-5">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-muted" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Question
            </span>
            <span className="ml-auto font-mono text-sm font-black tabular-nums text-ink">
              {currentNumber} / {total}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full origin-left rounded-full bg-brand-500 transition-transform duration-500"
              style={{ transform: `scaleX(${progressPct})` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Time Left</span>
            <span
              role="timer"
              className={`rounded-full px-3 py-1 font-mono text-sm font-bold tabular-nums ${
                warn
                  ? 'quiz-timer-warn bg-danger-50 text-danger-700 motion-reduce:animate-none'
                  : 'bg-brand-50 text-brand-700'
              }`}
            >
              {Math.max(0, timeLeft)}s
            </span>
          </div>
        </div>

        {/* Lives */}
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] sm:p-5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            Lives
          </span>
          <div className="mt-3 flex items-center gap-1.5" title={`${filledLives} of ${totalLives} lives left`}>
            {Array.from({ length: totalLives }).map((_, i) => {
              const on = i < filledLives
              return (
                // eslint-disable-next-line react/no-array-index-key
                <span
                  key={`${i}-${on ? 'on' : 'off'}`}
                  className={on ? ENTER_POP : 'quiz-heart-break'}
                  style={on ? stagger(i, 40) : undefined}
                >
                  <Heart filled={on} />
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {extraTimePending && (
        <ExtraTimePrompt
          timeLeft={timeLeft}
          extraTimeSeconds={extraTimeSeconds}
          onGrant={onGrantExtraTime}
          onDecline={onDeclineExtraTime}
        />
      )}
    </div>
  )
}

export default HUD
