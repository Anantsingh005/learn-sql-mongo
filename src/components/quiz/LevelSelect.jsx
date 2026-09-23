import { isLevelUnlocked, levelKey, COMPLETE_THRESHOLD } from '../../lib/progress.js'

const levels = [
  { key: 'easy', label: 'Easy', desc: 'Warm up', code: 'LVL-01' },
  { key: 'medium', label: 'Medium', desc: 'Getting sharp', code: 'LVL-02' },
  { key: 'hard', label: 'Hard', desc: 'The real boss fight', code: 'LVL-03' },
  { key: 'all', label: 'All Levels', desc: 'Every question, mixed', code: 'LVL-ALL' },
]

const accents = {
  all: {
    glow: 'from-cyan-500/50 via-fuchsia-400/25 to-indigo-400/50',
    strip: 'from-cyan-400 to-fuchsia-400',
    tag: 'text-cyan-400/90',
    badge: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    bar: 'from-cyan-400 to-fuchsia-400',
    barGlow: 'shadow-[0_0_10px_rgba(34,211,238,0.7)]',
    btn: 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400 hover:shadow-[0_0_28px_rgba(34,211,238,0.6)] shadow-[0_0_14px_rgba(34,211,238,0.35)]',
  },
  easy: {
    glow: 'from-emerald-500/50 via-emerald-400/25 to-teal-400/50',
    strip: 'from-emerald-400 to-teal-400',
    tag: 'text-emerald-400/90',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    bar: 'from-emerald-400 to-teal-400',
    barGlow: 'shadow-[0_0_10px_rgba(16,185,129,0.7)]',
    btn: 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(16,185,129,0.6)] shadow-[0_0_14px_rgba(16,185,129,0.35)]',
  },
  medium: {
    glow: 'from-amber-500/50 via-amber-400/25 to-orange-400/50',
    strip: 'from-amber-400 to-orange-400',
    tag: 'text-amber-400/90',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    bar: 'from-amber-400 to-orange-400',
    barGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.7)]',
    btn: 'bg-amber-500 text-amber-950 hover:bg-amber-400 hover:shadow-[0_0_28px_rgba(245,158,11,0.6)] shadow-[0_0_14px_rgba(245,158,11,0.35)]',
  },
  hard: {
    glow: 'from-rose-500/50 via-rose-400/25 to-pink-500/50',
    strip: 'from-rose-400 to-pink-400',
    tag: 'text-rose-400/90',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    bar: 'from-rose-400 to-pink-400',
    barGlow: 'shadow-[0_0_10px_rgba(244,63,94,0.7)]',
    btn: 'bg-rose-500 text-rose-950 hover:bg-rose-400 hover:shadow-[0_0_28px_rgba(244,63,94,0.6)] shadow-[0_0_14px_rgba(244,63,94,0.35)]',
  },
}

function LevelCard({ mode, lv, index, bank, progress, onPick }) {
  const unlocked = isLevelUnlocked(lv.key, progress, mode.key)
  const isCompleted = (progress.completed ?? []).includes(levelKey(mode.key, lv.key))
  const best = progress.best ?? {}
  const count = lv.key === 'all' ? bank.length : bank.filter((q) => q.difficulty === lv.key).length
  const a = accents[lv.key]
  const pct = isCompleted ? 100 : Math.min(best[levelKey(mode.key, lv.key)] ?? 0, 100)

  return (
    <div key={lv.key} className="group relative">
      <div
        className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${a.glow} opacity-0 blur-lg transition-opacity duration-300 ${
          unlocked ? 'group-hover:opacity-100 group-focus-within:opacity-100' : ''
        }`}
      />
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
          unlocked ? 'border-slate-700 bg-slate-900/95 group-hover:-translate-y-1' : 'border-slate-800 bg-slate-900/60'
        } ${isCompleted ? 'shadow-[0_0_24px_rgba(16,185,129,0.15)]' : ''}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.strip} opacity-80`} />
        <div
          className={`absolute right-4 top-3.5 font-mono text-[10px] font-bold tracking-[0.2em] ${
            unlocked ? a.tag : 'text-slate-600'
          }`}
        >
          {lv.code} · {count}Q
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-mono text-lg font-black transition-transform duration-300 ease-out ${
                unlocked
                  ? `${a.badge} group-hover:rotate-12 group-hover:scale-110`
                  : 'border-slate-700 bg-slate-800 text-slate-600'
              }`}
            >
              {index + 1}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-tight text-white">{lv.label}</span>
                {isCompleted && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                    ✔ {best[levelKey(mode.key, lv.key)] ?? 100}%
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{lv.desc}</div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:ml-auto sm:items-end">
            {unlocked && (
              <div className="flex w-full items-center gap-2 sm:w-36">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">best</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${a.bar} ${a.barGlow} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`w-8 text-right font-mono text-[10px] ${a.tag}`}>{pct}%</span>
              </div>
            )}
            <button
              type="button"
              disabled={!unlocked}
              onClick={() => onPick({ difficulty: lv.key })}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition-all ${
                unlocked
                  ? a.btn
                  : 'cursor-not-allowed border border-slate-700 bg-slate-800/60 text-slate-500'
              }`}
            >
              {isCompleted ? 'Replay' : unlocked ? 'Play' : '🔒 Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LevelSelect({ mode, bank, progress = { completed: [], best: {} }, onPick, onBack }) {
  return (
    <div className="mx-auto max-w-3xl px-2">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Pick your level
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          {mode.title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Finish{' '}
          <span className="font-semibold text-emerald-300">Easy</span> and{' '}
          <span className="font-semibold text-amber-300">Medium</span> with at least{' '}
          <span className="font-semibold text-rose-300">{COMPLETE_THRESHOLD}%</span> to unlock{' '}
          <span className="font-semibold text-rose-300">Hard</span> — then complete all three to unlock{' '}
          <span className="font-semibold text-cyan-300">All Levels</span>.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {levels.map((lv, i) => (
          <LevelCard
            key={lv.key}
            mode={mode}
            lv={lv}
            index={i}
            bank={bank}
            progress={progress}
            onPick={onPick}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="group mt-6 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span> Back to modes
      </button>
    </div>
  )
}

export default LevelSelect