import { useAuth } from '../../context/AuthContext.jsx'
import { multipleChoice } from '../../data/sql/multipleChoice.js'
import { writeQuery } from '../../data/sql/writeQuery.js'
import { fixBug } from '../../data/sql/fixBug.js'
import { windowCte } from '../../data/sql/windowCte.js'
import { selectQuestions, GUEST_QUESTION_LIMIT } from '../../data/selectQuestions.js'
import GuestBanner from './GuestBanner.jsx'

export const quizModes = [
  {
    key: 'mc',
    title: 'Multiple Choice',
    desc: 'Pick the right answer',
    icon: 'A',
    code: 'MC-01',
    timePerQuestion: 120,
    bank: multipleChoice.concat(windowCte.filter((q) => q.type === 'mc')),
    glow: 'from-brand-100/70 via-brand-50/60 to-transparent',
    strip: 'from-brand-500 to-brand-400',
    tag: 'text-brand-600',
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    arrow: 'text-brand-700 group-hover:text-brand-700',
  },
  {
    key: 'write',
    title: 'Write the Query',
    desc: 'Type SQL, run it, compare',
    icon: '>_',
    code: 'WQ-02',
    timePerQuestion: 120,
    extraTime: { seconds: 60, threshold: 10 },
    bank: writeQuery.concat(windowCte.filter((q) => q.type === 'write')),
    glow: 'from-leaf-100/70 via-brand-50/60 to-transparent',
    strip: 'from-leaf-500 to-leaf-400',
    tag: 'text-leaf-600',
    badge: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    arrow: 'text-leaf-700 group-hover:text-leaf-700',
  },
  {
    key: 'bug',
    title: 'Fix the Bug',
    desc: 'Spot and correct mistakes',
    icon: '!',
    code: 'FB-03',
    timePerQuestion: 120,
    extraTime: { seconds: 60, threshold: 10 },
    bank: fixBug.concat(windowCte.filter((q) => q.type === 'bug')),
    glow: 'from-danger-100/70 via-amber-50/60 to-transparent',
    strip: 'from-danger-500 to-amber-400',
    tag: 'text-danger-600',
    badge: 'border-danger-200 bg-danger-50 text-danger-700',
    arrow: 'text-danger-700 group-hover:text-amber-700',
  },
]

function ModeSelect({ onPick, isGuest }) {
  const { profile } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-2">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Step 1 of 3 · Mode
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          How do you want to play SQL?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick a mode{profile?.username ? `, ${profile.username}` : ''} — then choose your level.
        </p>
      </div>

      {isGuest && <div className="mb-6"><GuestBanner limit={GUEST_QUESTION_LIMIT} /></div>}

      <div className="grid gap-4 sm:grid-cols-3">
        {quizModes.map((m) => {
          const count = isGuest
            ? selectQuestions({ types: [m.key], limit: GUEST_QUESTION_LIMIT }).length
            : m.bank.length
          return (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(m)}
            className="group relative rounded-2xl text-left outline-none"
          >
            <div
              className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${m.glow} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all duration-300 group-hover:-translate-y-1">
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${m.strip} opacity-80`} />
              <div className={`absolute right-4 top-3.5 font-mono text-[10px] font-bold tracking-[0.2em] ${m.tag}`}>
                {m.code}
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-lg font-black ${m.badge} transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110`}
              >
                {m.icon}
              </div>
              <div className="mt-4 font-mono text-lg font-bold text-ink">{m.title}</div>
              <p className="mt-1 text-sm text-muted">{m.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span className="font-semibold">
                  {isGuest ? `${count} free / ${m.bank.length}` : `${count} questions`}
                </span>
                <span className={`font-bold transition-transform ${m.arrow} group-hover:translate-x-1`}>
                  Select →
                </span>
              </div>
            </div>
          </button>
          )
        })}
      </div>
    </div>
  )
}

export default ModeSelect