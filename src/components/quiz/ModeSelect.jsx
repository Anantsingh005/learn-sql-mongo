import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useInView } from '../../hooks/useInView.js'
import useTypeLoop from '../../hooks/useTypeLoop.js'
import { multipleChoice } from '../../data/sql/multipleChoice.js'
import { writeQuery } from '../../data/sql/writeQuery.js'
import { fixBug } from '../../data/sql/fixBug.js'
import { windowCte } from '../../data/sql/windowCte.js'
import { selectQuestions, GUEST_QUESTION_LIMIT } from '../../data/selectQuestions.js'
import GuestBanner from './GuestBanner.jsx'
import ProfileSidebar from '../ProfileSidebar.jsx'
import LeaderboardPreview from '../LeaderboardPreview.jsx'
import SqlQuizHero from './SqlQuizHero.jsx'
import SqlGameProgress from './SqlGameProgress.jsx'

export const quizModes = [
  {
    key: 'mc',
    title: 'Multiple Choice',
    desc: 'Pick the right answer',
    short: 'MC',
    icon: 'A',
    code: 'MC-01',
    timePerQuestion: 120,
    bank: multipleChoice.concat(windowCte.filter((q) => q.type === 'mc')),
    glow: 'from-brand-100/70 via-brand-50/60 to-transparent',
    strip: 'from-brand-500 to-brand-400',
    tag: 'text-brand-600',
    badge: 'border-brand-200 bg-white text-brand-700',
    cardBg: 'bg-brand-50',
    cardBorder: 'border-brand-100',
    chip: 'border-brand-200 bg-white text-brand-600',
    solid: 'bg-brand-500 shadow-[0_4px_12px_rgba(212,52,158,0.35)] group-hover:bg-brand-600',
    arrow: 'text-brand-700 group-hover:text-brand-700',
  },
  {
    key: 'write',
    title: 'Write the Query',
    desc: 'Type SQL, run it, compare',
    short: 'WR',
    icon: '>_',
    code: 'WQ-02',
    timePerQuestion: 120,
    extraTime: { seconds: 60, threshold: 10 },
    bank: writeQuery.concat(windowCte.filter((q) => q.type === 'write')),
    glow: 'from-leaf-100/70 via-brand-50/60 to-transparent',
    strip: 'from-leaf-500 to-leaf-400',
    tag: 'text-leaf-600',
    badge: 'border-leaf-200 bg-white text-leaf-700',
    cardBg: 'bg-leaf-50',
    cardBorder: 'border-leaf-200',
    chip: 'border-leaf-200 bg-white text-leaf-600',
    solid: 'bg-leaf-500 shadow-[0_4px_12px_rgba(47,122,79,0.35)] group-hover:bg-leaf-600',
    arrow: 'text-leaf-700 group-hover:text-leaf-700',
  },
  {
    key: 'bug',
    title: 'Fix the Bug',
    desc: 'Spot and correct mistakes',
    short: 'BUG',
    icon: '!',
    code: 'FB-03',
    timePerQuestion: 120,
    extraTime: { seconds: 60, threshold: 10 },
    bank: fixBug.concat(windowCte.filter((q) => q.type === 'bug')),
    glow: 'from-danger-100/70 via-amber-50/60 to-transparent',
    strip: 'from-danger-500 to-amber-400',
    tag: 'text-danger-600',
    badge: 'border-amber-200 bg-white text-amber-700',
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    chip: 'border-amber-200 bg-white text-amber-700',
    solid: 'bg-amber-500 shadow-[0_4px_12px_rgba(181,116,26,0.35)] group-hover:bg-amber-600',
    arrow: 'text-amber-700 group-hover:text-amber-700',
  },
]

const HEADING = 'How do you want to play SQL?'
const PARALLAX_MAX = 8

function QuizHeroArt() {
  return (
    <svg
      viewBox="0 0 380 270"
      className="h-auto w-full max-w-[240px] sm:max-w-[280px]"
      fill="none"
      aria-hidden="true"
    >
      {/* Soft washes */}
      <circle cx="205" cy="130" r="120" fill="#fdf0f8" />
      <circle cx="322" cy="54" r="30" fill="#f6f2ff" />
      <path d="M60 44v16M52 52h16" stroke="#f0a8da" strokeWidth="3" strokeLinecap="round" />
      <path d="M348 190v14M341 197h14" stroke="#d5c2f5" strokeWidth="3" strokeLinecap="round" />

      {/* Terminal window */}
      <rect x="96" y="40" width="264" height="170" rx="16" fill="#ffffff" stroke="#f0a8da" strokeWidth="2" />
      <path d="M96 72h264" stroke="#f0a8da" strokeWidth="2" />
      <circle cx="116" cy="56" r="5" fill="#f4bcbc" />
      <circle cx="134" cy="56" r="5" fill="#f8d9a4" />
      <circle cx="152" cy="56" r="5" fill="#a9e0c6" />
      <text x="344" y="61" textAnchor="end" className="font-mono" fontSize="11" fontWeight="700" fill="#e46bbf">
        SQL
      </text>

      <text x="116" y="104" className="font-mono" fontSize="14" fontWeight="700" fill="#8c1568">
        SELECT name, score
      </text>
      <text x="116" y="130" className="font-mono" fontSize="14" fill="#7a4068">
        FROM players
      </text>
      <text x="116" y="156" className="font-mono" fontSize="14" fill="#7a4068">
        ORDER BY score DESC;
      </text>
      <rect x="116" y="172" width="9" height="16" rx="2" fill="#d4349e" />
      <text x="133" y="185" className="font-mono" fontSize="12" fill="#e46bbf">
        3 rows · 4ms
      </text>

      {/* Database cylinder */}
      <ellipse cx="74" cy="168" rx="40" ry="14" fill="#f7d4ed" stroke="#d4349e" strokeWidth="2" />
      <path
        d="M34 168v54c0 7.7 17.9 14 40 14s40-6.3 40-14v-54"
        fill="#f7d4ed"
        stroke="#d4349e"
        strokeWidth="2"
      />
      <path d="M34 195c0 7.7 17.9 14 40 14s40-6.3 40-14" stroke="#d4349e" strokeWidth="2" />
    </svg>
  )
}

function ModeSelect({ onPick, isGuest }) {
  const { profile } = useAuth()
  const firstName = (profile?.name || profile?.username || '').trim().split(/\s+/)[0]
  const typed = useTypeLoop(HEADING)
  const [cardsRef, cardsInView] = useInView()
  const sceneRef = useRef(null)

  // Pointer parallax on the illustration, same behaviour as the home hero.
  useEffect(() => {
    const node = sceneRef.current
    if (!node) return undefined

    const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    const stillOk = window.matchMedia?.('(prefers-reduced-motion: no-preference)')
    if (canHover?.matches === false || stillOk?.matches === false) return undefined

    let frame = 0
    let dx = 0
    let dy = 0

    const paint = () => {
      frame = 0
      node.style.transform = `translate3d(${dx * PARALLAX_MAX}px, ${dy * PARALLAX_MAX}px, 0)`
    }

    const onMove = (event) => {
      dx = (event.clientX / window.innerWidth) * 2 - 1
      dy = (event.clientY / window.innerHeight) * 2 - 1
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    const onLeave = () => {
      dx = 0
      dy = 0
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div>
      {/* Full-bleed hero banner below the nav */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-brand-50 via-white to-plum-50">
        <div className="pointer-events-none absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[rgba(247,212,237,0.6)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full bg-[rgba(213,194,245,0.7)] blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-4 px-5 py-6 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:gap-10 md:py-7">
          <div className="text-center md:text-left">
            <p
              className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 py-1 pl-3 pr-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient"
              style={{ animationDelay: '0ms' }}
            >
              <span aria-hidden="true" className="badge-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Step 1 of 3 · Mode
            </p>

            <h1
              className="enter-rise mt-3 bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
              style={{ animationDelay: '120ms' }}
            >
              {/* eslint-disable-next-line react/no-array-index-key */}
              {[...HEADING].map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="type-char"
                  style={{ visibility: i < typed ? 'visible' : 'hidden' }}
                >
                  {char}
                </span>
              ))}
            </h1>

            <p
              className="enter-rise mx-auto mt-3 max-w-md text-sm text-muted sm:text-base md:mx-0"
              style={{ animationDelay: '430ms' }}
            >
              Pick a mode{firstName ? `, ${firstName}` : ''} — then choose your level.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="parallax-scene w-full max-w-[240px] sm:max-w-[280px]">
              <div ref={sceneRef} className="enter-rise" style={{ animationDelay: '330ms' }}>
                <QuizHeroArt />
              </div>
            </div>
            <span
              className="enter-fade relative -mt-2 -rotate-2 self-end pr-1 font-hand text-2xl font-semibold text-brand-600 sm:text-3xl"
              style={{ animationDelay: '640ms' }}
            >
              Better Queries. Bigger Skills.
              <svg
                className="absolute -bottom-1 left-0 h-2.5 w-full"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7c30-4 65-6 100-4 33 2 63 5 94 2"
                  stroke="#e46bbf"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {isGuest && (
          <div className="enter-rise mb-6" style={{ animationDelay: '520ms' }}>
            <GuestBanner limit={GUEST_QUESTION_LIMIT} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="order-2 lg:order-1">
            <ProfileSidebar />
          </div>

          <div className="order-1 lg:order-2">
          <div ref={cardsRef} className="grid gap-4 sm:grid-cols-3">
          {quizModes.map((m, i) => {
            const count = isGuest
              ? selectQuestions({ types: [m.key], limit: GUEST_QUESTION_LIMIT }).length
              : m.bank.length
            return (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(m)}
            className={`group relative rounded-2xl text-left outline-none reveal ${cardsInView ? 'is-in' : ''}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div
              className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${m.glow} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div
              className={`relative flex h-full flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 group-hover:-translate-y-1 ${m.cardBorder} ${m.cardBg}`}
            >
              <span
                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] ${m.chip}`}
              >
                {m.short}
              </span>

              <div
                className={`mt-4 flex h-12 w-12 items-center justify-center rounded-full border font-mono text-lg font-black transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110 ${m.badge}`}
              >
                {m.icon}
              </div>

              <div className="mt-3.5 font-mono text-lg font-bold text-ink">{m.title}</div>
              <p className="mt-1 text-sm text-muted">{m.desc}</p>

              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="group/q flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-black leading-none opacity-70"
                    title={`${count} questions in this mode`}
                  >
                    ?
                  </span>
                  {isGuest ? `${count} free / ${m.bank.length}` : `${count} questions`}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black text-white transition-all duration-300 group-hover:scale-110 ${m.solid}`}
                >
                  →
                </span>
              </div>
            </div>
          </button>
          )
        })}
          </div>

          <div className="mt-6">
            <LeaderboardPreview />
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModeSelect
