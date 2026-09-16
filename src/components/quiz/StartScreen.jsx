import { useEffect, useState } from 'react'
import { DIFFICULTY_LEVELS } from '../../data/selectQuestions.js'
import { allSqlQuestions } from '../../data/sql/index.js'

const typeOptions = [
  { key: 'mc', label: 'Multiple Choice', desc: 'Pick the right answer' },
  { key: 'write', label: 'Write the Query', desc: 'Type SQL, run it, compare' },
  { key: 'bug', label: 'Fix the Bug', desc: 'Spot and correct mistakes' },
]

function Toggle({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
      } ${className}`}
    >
      {children}
    </button>
  )
}

function StartScreen({ onStart }) {
  const [mix, setMix] = useState({ mc: true, write: true, bug: true })
  const [difficulty, setDifficulty] = useState('all')

  const enabled = [mix.mc, mix.write, mix.bug].some(Boolean)

  useEffect(() => {
    document.title = 'SQL Quiz — DBQuiz'
  }, [])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="font-mono text-3xl font-bold text-white">SQL Quiz</h1>
        <p className="mt-2 text-sm text-slate-400">
          Run real SQL against a live in-browser SQLite database. Select what you want to train on.
        </p>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-300">Question types</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {typeOptions.map((opt) => {
              const active = mix[opt.key]
              return (
                <Toggle
                  key={opt.key}
                  active={active}
                  onClick={() => setMix((m) => ({ ...m, [opt.key]: !active }))}
                >
                  <span className="block">{opt.label}</span>
                  <span className="mt-1 block text-xs font-normal text-slate-500">{opt.desc}</span>
                </Toggle>
              )
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-300">Difficulty</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(DIFFICULTY_LEVELS).map(([key, label]) => (
              <Toggle key={key} active={difficulty === key} onClick={() => setDifficulty(key)}>
                {label} ({allSqlQuestions.filter((q) => key === 'all' || q.difficulty === key).length})
              </Toggle>
            ))}
          </div>
        </section>

        {!enabled && <p className="mt-4 text-sm text-red-400">Select at least one question type.</p>}

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            disabled={!enabled}
            onClick={() => onStart({ types: mix, difficulty })}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Quiz
          </button>
          <p className="text-xs text-slate-500">
            {allSqlQuestions.filter((q) => mix[q.type] && (difficulty === 'all' || q.difficulty === difficulty)).length}{' '}
            questions · 3 lives · 30s each
          </p>
        </div>
      </div>
    </div>
  )
}

export default StartScreen