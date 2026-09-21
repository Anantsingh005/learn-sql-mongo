import { useAuth } from '../../context/AuthContext.jsx'
import { multipleChoice } from '../../data/sql/multipleChoice.js'
import { writeQuery } from '../../data/sql/writeQuery.js'
import { fixBug } from '../../data/sql/fixBug.js'
import { windowCte } from '../../data/sql/windowCte.js'

const modes = [
  {
    key: 'mc',
    title: 'Multiple Choice',
    desc: 'Pick the right answer',
    icon: 'A',
    code: 'MC-01',
    timePerQuestion: 120,
    bank: multipleChoice.concat(windowCte.filter((q) => q.type === 'mc')),
    glow: 'from-indigo-500/50 via-blue-500/25 to-cyan-400/50',
    strip: 'from-indigo-400 to-cyan-400',
    tag: 'text-indigo-400/90',
    badge: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    arrow: 'text-indigo-300 group-hover:text-cyan-300',
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
    glow: 'from-emerald-500/50 via-teal-500/25 to-cyan-400/50',
    strip: 'from-emerald-400 to-teal-400',
    tag: 'text-emerald-400/90',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    arrow: 'text-emerald-300 group-hover:text-teal-300',
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
    glow: 'from-rose-500/50 via-orange-500/25 to-amber-400/50',
    strip: 'from-rose-400 to-orange-400',
    tag: 'text-rose-400/90',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    arrow: 'text-rose-300 group-hover:text-orange-300',
  },
]

function ModeSelect({ onPick }) {
  const { profile } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-2">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Step 1 of 3 · Mode
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          How do you want to play SQL?
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Pick a mode{profile?.username ? `, ${profile.username}` : ''} — then choose your level.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(m)}
            className="group relative rounded-2xl text-left outline-none"
          >
            <div
              className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${m.glow} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 p-6 transition-all duration-300 group-hover:-translate-y-1">
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${m.strip} opacity-80`} />
              <div className={`absolute right-4 top-3.5 font-mono text-[10px] font-bold tracking-[0.2em] ${m.tag}`}>
                {m.code}
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-lg font-black ${m.badge} transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110`}
              >
                {m.icon}
              </div>
              <div className="mt-4 font-mono text-lg font-bold text-white">{m.title}</div>
              <p className="mt-1 text-sm text-slate-400">{m.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">{m.bank.length} questions</span>
                <span className={`font-bold transition-transform ${m.arrow} group-hover:translate-x-1`}>
                  Select →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModeSelect