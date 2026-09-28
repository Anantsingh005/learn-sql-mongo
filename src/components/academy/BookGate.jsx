import { Link } from 'react-router-dom'
import { LEARNING_GAMES } from '../../data/academy/book.js'

/**
 * First stop: pick a language. Mirrors the SQL / MongoDB card pair on the
 * Practice hub, so it reads as the same app rather than a new one.
 */
export default function BookGate() {
  return (
    <div className="mx-auto max-w-4xl px-2 py-6">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Academy
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          What do you want to learn?
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Proper chapters, worked examples and reference tables — then play the game.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LEARNING_GAMES.map((g) => {
          const inner = (
            <>
              <div
                className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${g.glow} opacity-0 blur-lg transition-opacity duration-300 ${
                  g.soon ? '' : 'group-hover:opacity-100'
                }`}
              />
              <div
                className={`relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 p-6 transition-all duration-300 ${
                  g.soon ? 'cursor-default opacity-60' : 'group-hover:-translate-y-1'
                }`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${g.accent}`} />
                <div className={`absolute right-4 top-3.5 font-mono text-[10px] font-bold tracking-[0.2em] ${g.tag}`}>
                  {g.soon ? 'SOON' : 'BOOK'}
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-lg font-black ${g.badge} ${
                    g.soon ? '' : 'transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110'
                  }`}
                >
                  {g.key === 'sql' ? '{ }' : '◆'}
                </div>
                <div className="mt-4 font-mono text-lg font-bold text-white">{g.title}</div>
                <p className="mt-1 text-sm text-slate-400">{g.tagline}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">{g.desc}</p>
                <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      g.soon ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {g.soon ? 'Coming soon' : 'Start reading'}
                  </span>
                  {!g.soon && (
                    <span className={`font-bold transition-transform ${g.arrow} group-hover:translate-x-1`}>
                      Open →
                    </span>
                  )}
                </div>
              </div>
            </>
          )

          return g.soon ? (
            <div key={g.key} className="group relative rounded-2xl text-left">
              {inner}
            </div>
          ) : (
            <Link key={g.key} to={g.href} className="group relative rounded-2xl text-left outline-none">
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
