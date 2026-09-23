import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearLocalProgress } from '../lib/progress.js'
import { useAuth } from '../context/AuthContext.jsx'

const games = [
  {
    key: 'sql',
    title: 'SQL',
    tagline: 'Queries, Joins &amp; Aggregations',
    description:
      'Multiple choice, write real queries against a live sample database, and fix buggy SQL.',
    href: '/quiz/sql',
    accent: 'from-indigo-500 to-purple-600',
    status: 'Play now',
    soon: false,
  },
  {
    key: 'mongo',
    title: 'MongoDB',
    tagline: 'Documents &amp; Aggregation Pipelines',
    description: 'Coming next — same quiz engine, MongoDB data pack.',
    href: '/quiz/mongo',
    accent: 'from-emerald-500 to-teal-600',
    status: 'Coming soon',
    soon: true,
  },
]

function Home() {
  const [cleared, setCleared] = useState(false)
  const { user } = useAuth()

  const handleClearLocal = () => {
    if (!window.confirm('Clear locally saved quiz progress on this browser?')) return
    clearLocalProgress()
    setCleared(true)
  }

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Test your database skills
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Build, run, and fix real SQL — then take on MongoDB. Pick a game to start.
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        {games.map((game) => (
          <Link
            key={game.key}
            to={game.href}
            className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all ${
              game.soon ? 'cursor-default opacity-60' : 'hover:-translate-y-1 hover:border-slate-600'
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent} ${
                game.soon ? '' : 'group-hover:h-2'
              } transition-all`}
            />
            <div className="font-mono text-3xl font-bold text-white">{game.title}</div>
            <div className="mt-1 text-sm font-medium text-slate-400" dangerouslySetInnerHTML={{ __html: game.tagline }} />
            <p className="mt-4 text-sm leading-relaxed text-slate-500">{game.description}</p>
            <span
              className={`mt-6 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                game.soon ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {game.status}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {cleared && <span className="text-sm text-emerald-300">Local progress cleared.</span>}
        {!user && (
          <button
            type="button"
            onClick={handleClearLocal}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-rose-600/50 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Clear your progress
          </button>
        )}
      </div>
    </div>
  )
}

export default Home