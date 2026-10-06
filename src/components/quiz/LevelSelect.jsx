import { isLevelUnlocked, levelKey, COMPLETE_THRESHOLD } from '../../lib/progress.js'
import { GUEST_QUESTION_LIMIT } from '../../data/selectQuestions.js'
import GuestBanner from './GuestBanner.jsx'

const levels = [
  { key: 'easy', label: 'Easy', desc: 'Warm up', code: 'LVL-01' },
  { key: 'medium', label: 'Medium', desc: 'Getting sharp', code: 'LVL-02' },
  { key: 'hard', label: 'Hard', desc: 'The real boss fight', code: 'LVL-03' },
  { key: 'all', label: 'All Levels', desc: 'Every question, mixed', code: 'LVL-ALL' },
]

const accents = {
  all: {
    glow: 'from-brand-100/70 via-plum-50/60 to-transparent',
    strip: 'from-brand-500 to-plum-400',
    tag: 'text-brand-600',
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    bar: 'from-brand-500 to-plum-400',
    barGlow: 'shadow-[0_0_10px_rgba(#1554c7,0.22)]',
    btn: 'bg-brand-100 text-brand-700 hover:bg-brand-100 hover:shadow-[0_2px_10px_rgba(#1554c7,0.22)] shadow-[0_2px_10px_rgba(#1554c7,0.22)]',
  },
  easy: {
    glow: 'from-leaf-100/70 via-leaf-50/60 to-transparent',
    strip: 'from-leaf-500 to-leaf-400',
    tag: 'text-leaf-600',
    badge: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    bar: 'from-leaf-500 to-leaf-400',
    barGlow: 'shadow-[0_0_10px_rgba(#3d7f55,0.22)]',
    btn: 'bg-leaf-100 text-leaf-700 hover:bg-leaf-100 hover:shadow-[0_2px_10px_rgba(#3d7f55,0.22)] shadow-[0_2px_10px_rgba(#3d7f55,0.22)]',
  },
  medium: {
    glow: 'from-amber-100/70 via-amber-50/60 to-transparent',
    strip: 'from-amber-500 to-amber-400',
    tag: 'text-amber-700',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    bar: 'from-amber-500 to-amber-400',
    barGlow: 'shadow-[0_0_10px_rgba(#a5680f,0.22)]',
    btn: 'bg-amber-50 text-amber-700 hover:bg-amber-50 hover:shadow-[0_2px_10px_rgba(#a5680f,0.22)] shadow-[0_2px_10px_rgba(#a5680f,0.22)]',
  },
  hard: {
    glow: 'from-danger-100/70 via-plum-50/60 to-transparent',
    strip: 'from-danger-500 to-plum-400',
    tag: 'text-danger-600',
    badge: 'border-danger-200 bg-danger-50 text-danger-700',
    bar: 'from-danger-500 to-plum-400',
    barGlow: 'shadow-[0_0_10px_rgba(#b03333,0.22)]',
    btn: 'bg-danger-100 text-danger-700 hover:bg-danger-100 hover:shadow-[0_2px_10px_rgba(#b03333,0.22)] shadow-[0_2px_10px_rgba(#b03333,0.22)]',
  },
}

function LevelCard({ mode, lv, index, bank, progress, onPick, isGuest }) {
  const authLocked = isGuest && lv.key !== 'easy'
  const unlocked = !authLocked && isLevelUnlocked(lv.key, progress, mode.key)
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
          unlocked ? 'border-line bg-white group-hover:-translate-y-1' : 'border-line bg-white/60'
        } ${isCompleted ? 'shadow-[0_2px_10px_rgba(#3d7f55,0.15)]' : ''}`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.strip} opacity-80`} />
        <div
          className={`absolute right-4 top-3.5 font-mono text-[10px] font-bold tracking-[0.2em] ${
            unlocked ? a.tag : 'text-body'
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
                  : 'border-line bg-line text-body'
              }`}
            >
              {index + 1}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-tight text-ink">{lv.label}</span>
                {isCompleted && (
                  <span className="rounded-full bg-leaf-100 px-2.5 py-0.5 text-[11px] font-bold text-leaf-700 shadow-[0_0_12px_rgba(#3d7f55,0.22)]">
                    ✔ {best[levelKey(mode.key, lv.key)] ?? 100}%
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">{lv.desc}</div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:ml-auto sm:items-end">
            {unlocked && (
              <div className="flex w-full items-center gap-2 sm:w-36">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">best</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
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
                  : 'cursor-not-allowed border border-line bg-line/60 text-muted'
              }`}
            >
              {isCompleted ? 'Replay' : unlocked ? 'Play' : authLocked ? '🔒 Sign in' : '🔒 Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LevelSelect({ mode, bank, progress = { completed: [], best: {} }, onPick, onBack, isGuest }) {
  return (
    <div className="mx-auto max-w-3xl px-2">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Pick your level
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          {mode.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Finish{' '}
          <span className="font-semibold text-leaf-700">Easy</span> and{' '}
          <span className="font-semibold text-amber-700">Medium</span> with at least{' '}
          <span className="font-semibold text-danger-700">{COMPLETE_THRESHOLD}%</span> to unlock{' '}
          <span className="font-semibold text-danger-700">Hard</span> — then complete all three to unlock{' '}
          <span className="font-semibold text-brand-700">All Levels</span>.
        </p>
      </div>

      {isGuest && <div className="mb-6"><GuestBanner limit={GUEST_QUESTION_LIMIT} /></div>}

      <div className="flex flex-col gap-4">
        {levels.map((lv, i) => (
          <LevelCard
            key={lv.key}
            mode={mode}
            lv={lv}
            index={i}
            bank={bank}
            progress={progress}
            isGuest={isGuest}
            onPick={onPick}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="group mt-6 text-sm text-muted transition-colors hover:text-body"
      >
        <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span> Back to modes
      </button>
    </div>
  )
}

export default LevelSelect