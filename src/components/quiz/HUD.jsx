function Lives({ lives }) {
  const total = 3
  return (
    <div className="flex items-center gap-1.5" title={`${lives} lives left`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-3 w-3 rounded-full transition-all duration-300 ${
            i < lives
              ? 'bg-danger-100 shadow-[0_0_10px_rgba(#b03333,0.22)]'
              : 'bg-line'
          }`}
        />
      ))}
    </div>
  )
}

function ProgressDots({ snapshot }) {
  const { index, total, answers } = snapshot
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const answered = i < answers.length
        const correct = answered && answers[i].correct
        const isCurrent = i === index
        const cls = answered
          ? correct
            ? 'bg-leaf-100 shadow-[0_0_8px_rgba(#3d7f55,0.22)]'
            : 'bg-danger-100 shadow-[0_0_8px_rgba(#b03333,0.22)]'
          : 'bg-line'
        return (
          <span
            key={i}
            title={answered ? `Q${i + 1} — ${correct ? 'correct' : 'wrong'}` : `Q${i + 1} — unanswered`}
            className={`inline-block h-2.5 w-2.5 rounded-sm transition-all duration-300 ${
              isCurrent && !answered ? 'ring-2 ring-brand-600 ring-offset-1 ring-offset-white' : ''
            } ${cls}`}
          />
        )
      })}
    </div>
  )
}

function Timer({ timeLeft }) {
  const danger = timeLeft <= 5
  return (
    <span
      className={`rounded-md px-2 py-1 font-mono text-sm font-bold tabular-nums ${
        danger
          ? 'animate-pulse bg-danger-100 text-danger-700 shadow-[0_0_12px_rgba(#b03333,0.22)]'
          : 'bg-line text-body'
      }`}
    >
      {timeLeft}s
    </span>
  )
}

function HUD({ snapshot }) {
  const { index, total, score, lives, timeLeft } = snapshot
  const pct = total > 0 ? Math.round((index / total) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-100 via-plum-100 to-brand-100 opacity-70" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-muted">
            Q <span className="font-bold text-brand-700">{Math.min(index + 1, total)}</span>/{total}
          </span>
          <Lives lives={lives} />
        </div>
        <div className="w-full max-w-60">
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-100 via-plum-100 to-brand-100 shadow-[0_0_10px_rgba(#d4349e,0.22)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted">
            Score{' '}
            <span className="text-lg font-bold text-amber-700 drop-shadow-[0_0_10px_rgba(#a5680f,0.22)]">
              {score}
            </span>
          </span>
          <Timer timeLeft={timeLeft} />
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <ProgressDots snapshot={snapshot} />
      </div>
    </div>
  )
}

export default HUD
