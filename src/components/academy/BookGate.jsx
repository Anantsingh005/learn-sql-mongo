import { Link } from 'react-router-dom'
import { LEARNING_GAMES } from '../../data/academy/book.js'
import Reveal from './Reveal.jsx'

export default function BookGate() {
  return (
    <div className="mx-auto max-w-4xl px-1 py-4 sm:px-2 sm:py-6">
      <div className="mb-8 text-center sm:mb-10">
        <div
          className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 shadow-xs backdrop-blur-sm"
          style={{ animationDelay: '0ms' }}
        >
          <span className="badge-pulse h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          Academy
        </div>
        <h1
          className="enter-rise grad-text mt-4 font-serif text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[2.75rem]"
          style={{ animationDelay: '80ms' }}
        >
          What do you want to learn?
        </h1>
        <p
          className="enter-rise mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-[15px]"
          style={{ animationDelay: '160ms' }}
        >
          Proper chapters, worked examples and reference tables — then play the game.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {LEARNING_GAMES.map((g, i) => {
          const inner = (
            <>
              <div
                className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${g.glow} opacity-0 blur-lg transition-opacity duration-300 ${
                  g.soon ? '' : 'group-hover:opacity-100'
                }`}
              />
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white p-5 shadow-[0_2px_10px_-6px_rgba(16,42,67,0.18)] transition-all duration-300 sm:p-6 ${
                  g.soon
                    ? 'cursor-default grayscale'
                    : 'group-hover:-translate-y-1 group-hover:shadow-[0_26px_50px_-32px_rgba(16,42,67,0.4)] group-focus-visible:ring-2 group-focus-visible:ring-brand-600'
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
                <div className="mt-4 font-mono text-lg font-bold text-ink">{g.title}</div>
                <p className="mt-1 text-sm text-muted">{g.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4">{g.desc}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted sm:pt-6">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      g.soon ? 'bg-line text-body' : 'bg-brand-100 text-brand-700'
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

          return (
            <Reveal
              key={g.key}
              delay={i * 80}
              className="group relative rounded-[20px] text-left outline-none"
            >
              {g.soon ? (
                inner
              ) : (
                <Link
                  to={g.href}
                  className="block h-full rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  {inner}
                </Link>
              )}
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
