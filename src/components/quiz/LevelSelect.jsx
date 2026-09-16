const levels = [
  { key: 'easy', label: 'Easy', desc: 'Warm up', color: 'emerald' },
  { key: 'medium', label: 'Medium', desc: 'Getting sharp', color: 'amber' },
  { key: 'hard', label: 'Hard', desc: 'The real boss fight', color: 'rose' },
]

function LevelSelect({ mode, bank, onPick, onBack }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <div className="font-mono text-xs tracking-widest text-indigo-400">PICK YOUR LEVEL</div>
        <div className="mt-1 font-mono text-2xl font-bold text-white">
          SQL — {mode.title}
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Choose how hard you want it. Levels 3 and 4 unlock as you level up.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {levels.map((lv, i) => {
          const unlocked = i === 0 || i === 1
          const count = bank.filter((q) => q.difficulty === lv.key).length
          return (
            <div
              key={lv.key}
              className={`flex items-center justify-between rounded-xl border p-5 ${
                unlocked
                  ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  : 'border-slate-800 bg-slate-900/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${lv.color}-500/15 font-mono text-sm font-bold text-${lv.color}-300`}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">{lv.label}</div>
                  <div className="text-xs text-slate-400">{lv.desc} · {count} questions</div>
                </div>
              </div>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onPick({ difficulty: lv.key })}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {unlocked ? 'Play' : '🔒 Locked'}
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to modes
      </button>
    </div>
  )
}

export default LevelSelect
