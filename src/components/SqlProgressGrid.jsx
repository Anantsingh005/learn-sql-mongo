import { Link } from 'react-router-dom'
import { isLevelUnlocked } from '../lib/progress.js'

const MODES = [
  { key: 'mc', label: 'Multiple Choice' },
  { key: 'write', label: 'Write a Query' },
  { key: 'bug', label: 'Fix the Bug' },
]

const MODE_BADGE = {
  mc: 'border-brand-200 bg-brand-50 text-brand-700',
  write: 'border-plum-200 bg-plum-50 text-plum-700',
  bug: 'border-danger-200 bg-danger-50 text-danger-700',
}

const LEVELS = [
  { key: 'easy', label: 'Easy', desc: 'Warm up', short: 'E', tag: 'text-leaf-700', chip: 'bg-leaf-50 text-leaf-700', hex: '#3d7f55' },
  { key: 'medium', label: 'Medium', desc: 'Getting sharp', short: 'M', tag: 'text-amber-700', chip: 'bg-amber-50 text-amber-700', hex: '#a5680f' },
  { key: 'hard', label: 'Hard', desc: 'The real boss fight', short: 'H', tag: 'text-danger-700', chip: 'bg-danger-50 text-danger-700', hex: '#d24444' },
  { key: 'all', label: 'All Levels', desc: 'Every question, mixed', short: 'A', tag: 'text-brand-700', chip: 'bg-brand-50 text-brand-700', hex: '#8c1568' },
]

const LOCK_HINTS = {
  hard: '75% on Easy+Medium',
  all: '75% on all three',
}

function ProgressRing({ pct = 0, color = '#8c1568', locked = false, done = false, short = '', active = false, size = 52, stroke = 5 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))
  const offset = circumference * (1 - clamped / 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(45,0,34,0.10)" strokeWidth={stroke} />
        {!locked && clamped > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {locked ? (
          <span className="text-sm">🔒</span>
        ) : done ? (
          <span className="text-sm font-black text-leaf-700">✔</span>
        ) : (
          <span className={`text-xs font-black ${active ? 'text-ink' : 'text-plum-600'}`}>{short}</span>
        )}
      </div>
    </div>
  )
}

export default function SqlProgressGrid({ sqlProgress }) {
  const progress = sqlProgress ?? { completed: [], best: {} }
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {MODES.map((mode) => (
        <div
          key={mode.key}
          className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(45,0,34,0.05)] transition-shadow hover:shadow-[0_4px_14px_rgba(45,0,34,0.07)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${MODE_BADGE[mode.key]}`}>
                {mode.key.toUpperCase()}
              </span>
              <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted">{mode.label}</span>
            </div>
            <span className="text-xs text-body" aria-hidden="true">›</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {LEVELS.map((lv) => {
              const key = `${mode.key}_${lv.key}`
              const pct = progress.best[key] ?? 0
              const done = (progress.completed ?? []).includes(key)
              const active = pct > 0
              const unlocked = isLevelUnlocked(lv.key, progress, mode.key)
              const rowState = !unlocked
                ? 'border-line/70 bg-shell/60'
                : done
                  ? 'border-leaf-200/80 bg-leaf-50/50'
                  : 'border-line bg-white'
              return (
                <Link
                  key={lv.key}
                  to={`/profile/report/${mode.key}/${lv.key}`}
                  title={`View ${mode.label} · ${lv.label} report`}
                  className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-brand-200 ${rowState}`}
                >
                  <ProgressRing
                    pct={pct}
                    color={lv.hex}
                    locked={!unlocked}
                    done={done}
                    short={lv.short}
                    active={unlocked && active}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${unlocked ? 'text-ink' : 'text-muted'}`}>{lv.label}</div>
                    <div className="truncate text-[10px] text-muted">{unlocked ? lv.desc : LOCK_HINTS[lv.key] ?? 'locked'}</div>
                    <div className="mt-1 text-[10px]">
                      {done ? (
                        <span className="font-semibold text-leaf-700">✔ completed</span>
                      ) : active ? (
                        <span className={`font-mono font-bold ${lv.tag}`}>{pct}%</span>
                      ) : unlocked ? (
                        <span className="text-muted">not started</span>
                      ) : (
                        <span className="rounded-full border border-line bg-white px-1.5 py-px font-semibold text-muted">locked</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-body transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
