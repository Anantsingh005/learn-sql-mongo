function Lives({ lives }) {
  const total = 3
  return (
    <div className="flex items-center gap-1.5" title={`${lives} lives left`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-3 w-3 rounded-full transition-all duration-300 ${
            i < lives
              ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
              : 'bg-slate-700'
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
            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
            : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
          : 'bg-slate-700'
        return (
          <span
            key={i}
            title={answered ? `Q${i + 1} — ${correct ? 'correct' : 'wrong'}` : `Q${i + 1} — unanswered`}
            className={`inline-block h-2.5 w-2.5 rounded-sm transition-all duration-300 ${
              isCurrent && !answered ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900' : ''
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
          ? 'animate-pulse bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
          : 'bg-slate-800 text-slate-200'
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 opacity-70" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-slate-400">
            Q <span className="font-bold text-indigo-300">{Math.min(index + 1, total)}</span>/{total}
          </span>
          <Lives lives={lives} />
        </div>
        <div className="w-full max-w-60">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-400">
            Score{' '}
            <span className="text-lg font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]">
              {score}
            </span>
          </span>
          <Timer timeLeft={timeLeft} />
        </div>
      </div>
      <div className="mt-3 border-t border-slate-800 pt-3">
        <ProgressDots snapshot={snapshot} />
      </div>
    </div>
  )
}

export default HUD
