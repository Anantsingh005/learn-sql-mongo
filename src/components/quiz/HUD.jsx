function Lives({ lives }) {
  const total = 3
  return (
    <div className="flex items-center gap-1.5" title={`${lives} lives left`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-3 w-3 rounded-full ${
            i < lives ? 'bg-rose-500' : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

function Timer({ timeLeft }) {
  const danger = timeLeft <= 5
  return (
    <span
      className={`rounded-md px-2 py-1 font-mono text-sm font-bold tabular-nums ${
        danger ? 'animate-pulse bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-200'
      }`}
    >
      {timeLeft}s
    </span>
  )
}

function HUD({ snapshot }) {
  const { index, total, score, lives, timeLeft } = snapshot
  const pct = total > 0 ? Math.round(((index) / total) * 100) : 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-slate-400">
            Q <span className="text-white">{Math.min(index + 1, total)}</span>/{total}
          </span>
          <Lives lives={lives} />
        </div>
        <div className="w-full max-w-60">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-400">
            Score <span className="text-lg font-bold text-indigo-300">{score}</span>
          </span>
          <Timer timeLeft={timeLeft} />
        </div>
      </div>
    </div>
  )
}

export default HUD