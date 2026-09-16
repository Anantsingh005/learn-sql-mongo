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
    bank: multipleChoice.concat(windowCte.filter((q) => q.type === 'mc')),
    accent: 'from-indigo-500 to-blue-600',
  },
  {
    key: 'write',
    title: 'Write the Query',
    desc: 'Type SQL, run it, compare',
    icon: '>_',
    bank: writeQuery.concat(windowCte.filter((q) => q.type === 'write')),
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'bug',
    title: 'Fix the Bug',
    desc: 'Spot and correct mistakes',
    icon: '!',
    bank: fixBug.concat(windowCte.filter((q) => q.type === 'bug')),
    accent: 'from-rose-500 to-orange-600',
  },
]

function ModeSelect({ onPick }) {
  const { profile } = useAuth()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <div className="font-mono text-xs tracking-widest text-indigo-400">STEP 1 OF 3 · MODE</div>
        <div className="mt-1 text-2xl font-bold text-white">How do you want to play SQL?</div>
        <div className="mt-1 text-sm text-slate-400">
          Pick a mode{profile?.username ? `, ${profile.username}` : ''} — then choose your level.
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(m.key)}
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition-all hover:-translate-y-1 hover:border-slate-600"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.accent}`} />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 font-mono text-lg font-bold text-white">
              {m.icon}
            </div>
            <div className="mt-4 font-mono text-lg font-bold text-white">{m.title}</div>
            <p className="mt-1 text-sm text-slate-400">{m.desc}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{m.bank.length} questions</span>
              <span className="font-semibold text-indigo-400 group-hover:text-indigo-300">Select →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ModeSelect
