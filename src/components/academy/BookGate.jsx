import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LEARNING_GAMES } from '../../data/academy/book.js'
import { useAuth } from '../../context/AuthContext.jsx'
import ProfileSidebar from '../ProfileSidebar.jsx'
import SignInPrompt from './SignInPrompt.jsx'
import QuickStats from './QuickStats.jsx'
import { stagger } from '../site/motion.js'
import Reveal from './Reveal.jsx'

const HEADING_WORDS = ['What', 'do', 'you', 'want', 'to', 'learn?']

function AcademyHeroArt() {
  return (
    <svg
      viewBox="0 0 380 270"
      className="h-auto w-full"
      fill="none"
      aria-hidden="true"
    >
      {/* Soft washes */}
      <circle cx="190" cy="150" r="118" fill="#fdf0f8" />
      <circle cx="336" cy="48" r="28" fill="#f6f2ff" />
      <path d="M46 62v14M39 69h14" stroke="#f0a8da" strokeWidth="3" strokeLinecap="round" />
      <path d="M348 208v14M341 215h14" stroke="#d5c2f5" strokeWidth="3" strokeLinecap="round" />

      {/* Database cylinder tucked behind the book */}
      <ellipse cx="302" cy="92" rx="46" ry="15" fill="#f7d4ed" stroke="#d4349e" strokeWidth="2" />
      <path
        d="M256 92v46c0 8.3 20.6 15 46 15s46-6.7 46-15V92"
        fill="#f7d4ed"
        stroke="#d4349e"
        strokeWidth="2"
      />
      <path d="M256 116c0 8.3 20.6 15 46 15s46-6.7 46-15" stroke="#d4349e" strokeWidth="2" />

      {/* Code snippet floating above the left page */}
      <rect x="48" y="30" width="180" height="98" rx="14" fill="#ffffff" stroke="#f0a8da" strokeWidth="2" />
      <path d="M48 56h180" stroke="#f0a8da" strokeWidth="2" />
      <circle cx="66" cy="43" r="4.5" fill="#f4bcbc" />
      <circle cx="82" cy="43" r="4.5" fill="#f8d9a4" />
      <circle cx="98" cy="43" r="4.5" fill="#a9e0c6" />
      <text x="216" y="47" textAnchor="end" className="font-mono" fontSize="10" fontWeight="700" fill="#e46bbf">
        SQL
      </text>
      <text x="66" y="80" className="font-mono" fontSize="13" fontWeight="700" fill="#8c1568">
        SELECT title
      </text>
      <text x="66" y="100" className="font-mono" fontSize="13" fill="#7a4068">
        FROM chapters;
      </text>
      <rect x="66" y="108" width="8" height="14" rx="2" fill="#d4349e" />

      {/* Open book */}
      <path
        d="M190 176C162 156 118 148 74 152L74 232C118 228 162 236 190 254Z"
        fill="#ffffff"
        stroke="#f0a8da"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M190 176C218 156 262 148 306 152L306 232C262 228 218 236 190 254Z"
        fill="#fff8fc"
        stroke="#f0a8da"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M190 176V254" stroke="#d4349e" strokeWidth="2" />

      {/* Worked-example lines on the left page */}
      <rect x="96" y="170" width="64" height="7" rx="3.5" fill="#f0a8da" />
      <rect x="96" y="186" width="48" height="7" rx="3.5" fill="#f7d4ed" />
      <rect x="96" y="202" width="56" height="7" rx="3.5" fill="#f7d4ed" />
      <rect x="96" y="218" width="36" height="7" rx="3.5" fill="#e46bbf" />

      {/* Reference lines on the right page */}
      <rect x="210" y="170" width="76" height="7" rx="3.5" fill="#f7d4ed" />
      <rect x="210" y="186" width="60" height="7" rx="3.5" fill="#f0a8da" />
      <rect x="210" y="202" width="68" height="7" rx="3.5" fill="#f7d4ed" />
      <rect x="210" y="218" width="48" height="7" rx="3.5" fill="#f7d4ed" />
    </svg>
  )
}

const DECOR = [
  { key: 'braces', pos: 'left-[4%] top-[42%]', visual: 'text-xl text-brand-300', label: '{ }', dur: '7.5s' },
  { key: 'angles', pos: 'right-[5%] bottom-[14%]', visual: 'text-base text-plum-400', label: '</>', dur: '8.5s' },
  { key: 'dot-a', pos: 'left-[44%] top-[16%]', visual: 'h-2 w-2 rounded-full bg-brand-300', label: '', dur: '6.5s' },
  { key: 'dot-b', pos: 'right-[22%] bottom-[10%]', visual: 'h-1.5 w-1.5 rounded-full bg-plum-400', label: '', dur: '7s' },
]

function ScrollToTop({ heroRef }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const threshold = heroRef.current?.offsetHeight ?? 360
        setShow(window.scrollY > threshold)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [heroRef])

  const handleClick = () => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll back to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white/90 text-brand-600 shadow-[0_10px_24px_-12px_rgba(16,42,67,0.45)] backdrop-blur-sm transition-[opacity,transform] duration-300 hover:-translate-y-0.5 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        show
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}

function BookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  )
}

function ClockIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function LeafIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function SqlCardArt({ className = '' }) {
  return (
    <svg viewBox="0 0 170 150" className={className} fill="none" aria-hidden="true">
      {/* Database cylinder */}
      <ellipse cx="126" cy="30" rx="30" ry="11" fill="#f7d4ed" stroke="#d4349e" strokeWidth="2" />
      <path d="M96 30v42c0 6.1 13.4 11 30 11s30-4.9 30-11V30" fill="#fff" stroke="#d4349e" strokeWidth="2" />
      <path d="M96 50c0 6.1 13.4 11 30 11s30-4.9 30-11" stroke="#d4349e" strokeWidth="2" />

      {/* Open book */}
      <path
        d="M72 92C54 78 26 74 6 78v54c20-4 48 0 66 14z"
        fill="#fff"
        stroke="#e46bbf"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M72 92c18-14 46-18 66-14v54c-20-4-48 0-66 14z"
        fill="#fdf0f8"
        stroke="#e46bbf"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M72 92v54" stroke="#d4349e" strokeWidth="2" />

      <rect x="20" y="90" width="34" height="5" rx="2.5" fill="#f0a8da" />
      <rect x="20" y="102" width="26" height="5" rx="2.5" fill="#f7d4ed" />
      <rect x="20" y="114" width="30" height="5" rx="2.5" fill="#f7d4ed" />
      <rect x="94" y="90" width="34" height="5" rx="2.5" fill="#f7d4ed" />
      <rect x="94" y="102" width="28" height="5" rx="2.5" fill="#f0a8da" />
      <rect x="94" y="114" width="32" height="5" rx="2.5" fill="#f7d4ed" />
    </svg>
  )
}

function MongoCardArt({ className = '' }) {
  return (
    <svg viewBox="0 0 170 150" className={className} fill="none" aria-hidden="true">
      {/* Database cylinder */}
      <ellipse cx="80" cy="34" rx="40" ry="14" fill="#e3f2e9" stroke="#3d7f55" strokeWidth="2" />
      <path d="M40 34v68c0 7.7 17.9 14 40 14s40-6.3 40-14V34" fill="#fff" stroke="#3d7f55" strokeWidth="2" />
      <path d="M40 56c0 7.7 17.9 14 40 14s40-6.3 40-14" stroke="#3d7f55" strokeWidth="2" />
      <path d="M40 80c0 7.7 17.9 14 40 14s40-6.3 40-14" stroke="#3d7f55" strokeWidth="2" />

      {/* Leaf accent */}
      <path
        d="M128 16c8-6 20-8 30-6-2 12-6 22-16 26-8 3-16 0-18-8-2-6 0-9 4-12z"
        fill="#6cae85"
        stroke="#2f7a4f"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M150 12c-6 8-12 16-22 22" stroke="#f3faf5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SqlLearningCard({ game }) {
  return (
    <Link
      to={game.href}
      aria-label="Start reading the SQL Learning book"
      className="group/card block h-full rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-[24px] border border-brand-200/70 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 shadow-[0_18px_40px_-30px_rgba(140,21,104,0.55)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_54px_-30px_rgba(140,21,104,0.6)] sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl" />

        <div className="relative flex flex-1 items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 font-mono text-lg font-black text-white shadow-sm shadow-brand-600/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              {'{ }'}
            </div>
            <h3 className="mt-4 font-serif text-xl font-extrabold tracking-[-0.01em] text-ink">{game.title}</h3>
            <p className="mt-1 text-sm font-semibold text-brand-600">{game.tagline}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{game.desc}</p>
            <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700">
              Start reading <span aria-hidden="true">→</span>
            </span>
          </div>

          <SqlCardArt className="@min-[700px]:block hidden h-auto w-32 shrink-0 self-start sm:w-36" />
        </div>

        <span className="absolute bottom-5 right-6 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
          <BookIcon className="h-4 w-4" /> Book
        </span>
      </article>
    </Link>
  )
}

function MongoLearningCard({ game }) {
  return (
    <article
      aria-disabled="true"
      className="relative flex h-full cursor-default flex-col overflow-hidden rounded-[24px] border border-leaf-200/80 bg-gradient-to-br from-leaf-50 via-white to-leaf-100 p-6 shadow-[0_18px_40px_-32px_rgba(49,102,68,0.5)] sm:p-7"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-leaf-100/70 blur-2xl" />

      <div className="relative flex flex-1 items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-600 text-white shadow-sm shadow-leaf-600/30">
            <LeafIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-serif text-xl font-extrabold tracking-[-0.01em] text-ink">{game.title}</h3>
          <p className="mt-1 text-sm font-semibold text-leaf-600">{game.tagline}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{game.desc}</p>
          <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-leaf-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-leaf-700">
            <ClockIcon /> Coming soon
          </span>
        </div>

        <MongoCardArt className="@min-[700px]:block hidden h-auto w-32 shrink-0 self-start sm:w-36" />
      </div>
    </article>
  )
}

export default function BookGate() {
  const heroRef = useRef(null)
  const { user } = useAuth()

  return (
    <div className="relative isolate">
      {/* Very subtle animated gradient blobs behind the whole page area,
          so the empty space between the banner and the cards feels less flat. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="blob-drift absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(247,212,237,0.55),rgba(247,212,237,0)_65%)]" />
        <div className="blob-drift-b absolute -right-40 top-1/3 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(213,194,245,0.5),rgba(213,194,245,0)_65%)]" />
        <div className="blob-drift absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(253,240,248,0.9),rgba(253,240,248,0)_70%)]" />
      </div>

      {/* Full-bleed hero banner below the nav, same treatment as the SQL Quiz hero */}
      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-line bg-gradient-to-br from-brand-50 via-white to-plum-50"
      >
        <div className="pointer-events-none absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[rgba(247,212,237,0.6)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-[rgba(213,194,245,0.7)] blur-3xl" />

        <div className="relative mx-auto grid max-w-[1200px] gap-6 px-5 py-7 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:gap-10 md:py-8">
          {/* Drifting decorative shapes (paused under prefers-reduced-motion) */}
          {DECOR.map((d, i) => (
            <span
              key={d.key}
              aria-hidden="true"
              className={`enter-fade pointer-events-none absolute select-none ${d.pos}`}
              style={stagger(i, 90, 520)}
            >
              <span
                className={`drift-slow block font-mono font-black ${d.visual}`}
                style={{ animationDuration: d.dur }}
              >
                {d.label}
              </span>
            </span>
          ))}

          <div className="text-center md:text-left">
            <p
              className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 py-1 pl-3 pr-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient"
              style={{ animationDelay: '0ms' }}
            >
              <span aria-hidden="true" className="badge-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Academy
            </p>

            <h1 className="mt-3 font-serif text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[2.75rem]">
              {HEADING_WORDS.map((word, i) => (
                <Fragment key={word}>
                  {i > 0 && ' '}
                  <span className="enter-rise inline-block" style={stagger(i, 70, 120)}>
                    {word === 'learn?' ? (
                      <>
                        <span className="text-brand-500">learn</span>?
                      </>
                    ) : (
                      word
                    )}
                  </span>
                </Fragment>
              ))}
            </h1>

            <p
              className="enter-rise mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[15px] md:mx-0"
              style={{ animationDelay: '560ms' }}
            >
              Proper chapters, worked examples and reference tables — then play the game.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div
              className="enter-rise w-full max-w-[250px] sm:max-w-[290px]"
              style={{ animationDelay: '400ms' }}
            >
              <div className="float-soft">
                <AcademyHeroArt />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-[300px_1fr]">
          {/* Left rail: the shared profile sidebar (also used by the quiz pages),
              or a sign-in prompt in the same slot so the grid never shifts. */}
          <div className="min-w-0">
            {user ? <ProfileSidebar /> : <SignInPrompt />}
          </div>

          {/* Right rail: headline row + the two learning-mode cards */}
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <BookIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-extrabold tracking-[-0.01em] text-ink sm:text-2xl">
                    SQL &amp; NoSQL Learning
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">Choose a mode and start your learning journey.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-body shadow-sm">
                  3 Modes · 4 Levels
                </span>
                <Link
                  to="/academy/sql"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  View all <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="@container grid gap-5 sm:grid-cols-2">
              {LEARNING_GAMES.map((g, i) => (
                <Reveal key={g.key} delay={i * 90} className="group h-full">
                  {g.key === 'sql' ? <SqlLearningCard game={g} /> : <MongoLearningCard game={g} />}
                </Reveal>
              ))}
            </div>

            <QuickStats />
          </div>
        </div>
      </div>

      <ScrollToTop heroRef={heroRef} />
    </div>
  )
}
