import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHAPTERS, sectionKey } from '../../data/academy/book.js'
import { loadProgress } from '../../data/academy/progress.js'
import { stagger } from '../site/motion.js'
import useCountUp from '../../hooks/useCountUp.js'
import useReducedMotion from '../../hooks/useReducedMotion.js'
import ProgressBar from './ProgressBar.jsx'
import Reveal from './Reveal.jsx'

const pad = (n) => String(n).padStart(2, '0')

const EMPTY_PROGRESS = { sections: [], chapters: [], correct: [] }

/* Loads saved progress asynchronously so the page can show skeleton cards
   while it resolves and a retryable error state if storage is unavailable. */
function useAcademyProgress() {
  const [status, setStatus] = useState('loading')
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadProgress)
      .then((next) => {
        if (!active) return
        setProgress(next)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = () => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }

  return { status, progress, retry }
}

/* One distinct inline icon per real chapter, matched to its topic:
   reading (table), filtering (funnel), sorting (up/down), joins (two rings),
   subqueries (nested boxes), aggregation (bars), modifying (pencil),
   CTEs & windows (window). */
const CHAPTER_ICONS = {
  'reading-data': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 14h18M9 4v16" />
    </>
  ),
  filtering: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  'sorting-limiting': (
    <>
      <path d="M8 4v16" />
      <path d="M4 8l4-4 4 4" />
      <path d="M16 20V4" />
      <path d="m12 16 4 4 4-4" />
    </>
  ),
  joins: (
    <>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </>
  ),
  subqueries: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <rect x="8" y="8" width="8" height="8" rx="2" />
    </>
  ),
  aggregation: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-6" />
      <path d="M2 20h20" />
    </>
  ),
  'modify-data': (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  'ctes-windows': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M6.5 6.5h.01" />
    </>
  ),
}

function chapterStats(chapter, readSet) {
  const total = chapter.sections.length
  const read = chapter.sections.filter((s) => readSet.has(sectionKey(chapter.slug, s.id))).length
  return {
    total,
    read,
    done: total > 0 && read === total,
    started: read > 0,
    pct: total ? Math.round((read / total) * 100) : 0,
  }
}

function Icon({ className = 'h-4 w-4', children }) {
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
      {children}
    </svg>
  )
}

function BookGlyph({ className = 'h-5 w-5' }) {
  return (
    <Icon className={className}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Icon>
  )
}

/* Inline SVG hero illustration: a laptop running SQL against the real sample
   database, two stacked books, a database stack, a potted plant, sparkles and
   a handwritten tagline — all built from the Academy palette. */
function SqlBookHeroArt() {
  return (
    <svg viewBox="0 0 560 440" className="h-auto w-full" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hero-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d0022" />
          <stop offset="100%" stopColor="#4a0b38" />
        </linearGradient>
        <linearGradient id="hero-laptop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#573499" />
          <stop offset="100%" stopColor="#6b46c9" />
        </linearGradient>
        <linearGradient id="hero-db" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9dffb" />
          <stop offset="100%" stopColor="#d5c2f5" />
        </linearGradient>
      </defs>

      {/* Soft blobs */}
      <circle cx="278" cy="226" r="182" fill="#fdf0f8" />
      <circle cx="454" cy="118" r="94" fill="#f6f2ff" />
      <circle cx="120" cy="366" r="74" fill="#fef5fb" />

      {/* Sparkles */}
      <path d="M118 126v18M109 135h18" stroke="#e46bbf" strokeWidth="3" strokeLinecap="round" />
      <path d="M472 248v14M465 255h14" stroke="#d5c2f5" strokeWidth="3" strokeLinecap="round" />
      <path d="M356 76v12M350 82h12" stroke="#f0a8da" strokeWidth="2.6" strokeLinecap="round" />

      {/* Database stack */}
      <ellipse cx="458" cy="118" rx="46" ry="14" fill="url(#hero-db)" stroke="#6b46c9" strokeWidth="2.5" />
      <path d="M412 118v58c0 7.7 20.6 14 46 14s46-6.3 46-14v-58" fill="url(#hero-db)" stroke="#6b46c9" strokeWidth="2.5" />
      <path d="M412 146c0 7.7 20.6 14 46 14s46-6.3 46-14" stroke="#6b46c9" strokeWidth="2.5" />

      {/* Laptop */}
      <rect x="168" y="150" width="252" height="164" rx="14" fill="url(#hero-laptop)" />
      <rect x="182" y="166" width="224" height="132" rx="8" fill="url(#hero-screen)" />
      <circle cx="198" cy="182" r="3.5" fill="#f0a8da" />
      <circle cx="210" cy="182" r="3.5" fill="#f8d9a4" />
      <circle cx="222" cy="182" r="3.5" fill="#a9e0c6" />
      {/* Each query line types itself out left-to-right, once, in sequence. */}
      <g className="sb-code-line" style={{ animationDelay: '260ms' }}>
        <text x="196" y="212" className="font-mono" fontSize="13" fontWeight="700" fill="#f0a8da">
          SELECT
        </text>
        <text x="262" y="212" className="font-mono" fontSize="13" fill="#7fd6e0">
          name, city
        </text>
      </g>
      <g className="sb-code-line" style={{ animationDelay: '460ms' }}>
        <text x="196" y="234" className="font-mono" fontSize="13" fontWeight="700" fill="#f0a8da">
          FROM
        </text>
        <text x="244" y="234" className="font-mono" fontSize="13" fill="#7fd6e0">
          customers
        </text>
      </g>
      <g className="sb-code-line" style={{ animationDelay: '680ms' }}>
        <text x="196" y="256" className="font-mono" fontSize="13" fontWeight="700" fill="#f0a8da">
          WHERE
        </text>
        <text x="256" y="256" className="font-mono" fontSize="13" fill="#7fd6e0">
          city =
        </text>
        <text x="314" y="256" className="font-mono" fontSize="13" fill="#f8d9a4">
          'Delhi'
        </text>
        <text x="366" y="256" className="font-mono" fontSize="13" fill="#7a4068">
          ;
        </text>
      </g>
      <path d="M140 314h308l22 26H118z" fill="#4a0b38" />
      <path d="M214 327h160" stroke="#6b46c9" strokeWidth="3" strokeLinecap="round" />

      {/* Stacked books — two slow, offset float loops. */}
      <g className="sb-float" style={{ animationDelay: '-1.6s' }}>
        <rect x="46" y="352" width="132" height="34" rx="7" fill="#b01f82" />
        <rect x="46" y="352" width="14" height="34" rx="7" fill="#8c1568" />
        <text x="72" y="374" className="font-mono" fontSize="14" fontWeight="700" fill="#ffffff">
          SQL
        </text>
      </g>
      <g className="sb-float" style={{ animationDelay: '-3.4s' }}>
        <rect x="58" y="322" width="120" height="32" rx="6" fill="#6b46c9" />
        <rect x="58" y="322" width="13" height="32" rx="6" fill="#573499" />
        <text x="80" y="343" className="font-mono" fontSize="12" fontWeight="700" fill="#ffffff">
          Database
        </text>
      </g>

      {/* Potted plant — sways gently from its base. */}
      <g className="sb-sway">
        <path d="M474 352h64l-8 46h-48z" fill="#c98a2e" />
        <rect x="468" y="342" width="76" height="14" rx="4" fill="#b5741a" />
        <path
          d="M506 342c-2-26-20-34-30-46 16 4 26 16 30 30 6-20 20-28 36-32-14 12-26 24-28 48z"
          fill="#4c9a68"
        />
        <path d="M506 300v42" stroke="#2f7a4f" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Handwritten tagline + crown doodle (the crown bobs). */}
      <g className="sb-bob">
        <path
          d="M96 60l10-16 10 12 12-18 10 22z"
          fill="#f8d9a4"
          stroke="#c98a2e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
      <text x="88" y="98" className="font-hand" fontSize="30" fontWeight="700" fill="#8c1568">
        Better Queries
      </text>
      <text x="120" y="130" className="font-hand" fontSize="30" fontWeight="700" fill="#6b46c9">
        Bigger Dreams
      </text>
    </svg>
  )
}

/* Circular ring for the hero progress card: completed chapters out of total.
   The arc draws itself and the number counts up from zero on load; both are
   driven by the same frame-by-frame value so they stay in step. Under
   prefers-reduced-motion the ring lands on its final state instantly. */
function HeroRing({ done, total, size = 72, stroke = 7 }) {
  const reduced = useReducedMotion()
  const counted = useCountUp(done, { duration: 900, start: !reduced })
  const shown = reduced ? done : counted
  const pct = total ? shown / total : 0
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - pct * circumference

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${done} of ${total} chapters completed`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#hero-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="hero-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4349e" />
            <stop offset="100%" stopColor="#6b46c9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[15px] font-black leading-none text-ink">
          {shown}
          <span className="text-muted">/{total}</span>
        </span>
      </div>
    </div>
  )
}

function StatusPill({ state }) {
  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-2.5 py-1 text-[10px] font-bold text-leaf-700 ring-1 ring-leaf-200">
        <Icon className="sb-check-pop h-3.5 w-3.5">
          <path d="M20 6 9 17l-5-5" />
        </Icon>
        Completed
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-plum-50 px-2.5 py-1 text-[10px] font-bold text-plum-700 ring-1 ring-plum-200">
        <Icon className="sb-ring-spin h-3.5 w-3.5">
          <circle cx="12" cy="12" r="9" opacity="0.3" />
          <path d="M12 3a9 9 0 0 1 7.79 4.5" />
        </Icon>
        In Progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[10px] font-bold text-muted ring-1 ring-line">
      <Icon className="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="9" />
      </Icon>
      Not started
    </span>
  )
}

function StarIcon({ className = 'h-5 w-5', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.2l2.6 5.32 5.87.85-4.25 4.14 1.01 5.85L12 16.58l-5.23 2.78 1-5.85-4.24-4.14 5.86-.85z" />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col rounded-[22px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-plum-50 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="skeleton-pulse h-9 w-9 shrink-0 rounded-xl bg-line-soft" />
        <span className="skeleton-pulse h-10 w-10 shrink-0 rounded-full bg-line-soft" />
        <span className="skeleton-pulse ml-auto h-11 w-11 shrink-0 rounded-full bg-line-soft" />
      </div>
      <div className="skeleton-pulse mt-4 h-5 w-2/3 rounded-full bg-line-soft" />
      <div className="skeleton-pulse mt-2 h-3 w-full rounded-full bg-line-soft" />
      <div className="skeleton-pulse mt-1.5 h-3 w-4/5 rounded-full bg-line-soft" />
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <span className="skeleton-pulse h-6 w-24 rounded-full bg-line-soft" />
        <span className="skeleton-pulse h-4 w-10 rounded-full bg-line-soft" />
      </div>
    </div>
  )
}

function HeroCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[22px] border border-line bg-white/95 p-4 shadow-[0_26px_54px_-30px_rgba(45,0,34,0.55)] backdrop-blur-sm"
    >
      <div className="flex items-center gap-3.5">
        <span className="skeleton-pulse h-[72px] w-[72px] shrink-0 rounded-full bg-line-soft" />
        <div className="min-w-0 flex-1">
          <span className="skeleton-pulse block h-3 w-32 rounded-full bg-line-soft" />
          <span className="skeleton-pulse mt-2.5 block h-3 w-full rounded-full bg-line-soft" />
        </div>
      </div>
      <span className="skeleton-pulse mt-4 block h-1.5 w-full rounded-full bg-line-soft" />
    </div>
  )
}

function ErrorPanel({ onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-[22px] border border-rose-200 bg-rose-50 p-7 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-600 shadow-xs ring-1 ring-rose-200">
        <Icon className="h-6 w-6">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </Icon>
      </span>
      <div>
        <p className="font-serif text-lg font-bold text-ink">We couldn&apos;t load your progress</p>
        <p className="mt-1 text-[13px] text-muted">
          Something went wrong reading your saved progress on this device.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="cta-sheen relative mt-1 inline-flex min-h-11 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_-16px_rgba(140,21,104,0.95)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Try again
        <Icon className="h-4 w-4">
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </Icon>
      </button>
    </div>
  )
}


function ChapterCard({ chapter, stats, done }) {
  const state = done ? 'done' : stats.started ? 'active' : 'idle'
  const stateLabel = done ? 'completed' : stats.started ? 'in progress' : 'not started'
  const magenta = chapter.number % 2 === 1

  return (
    <Link
      to={`/academy/sql/${chapter.slug}`}
      aria-label={`Chapter ${chapter.number}: ${chapter.title}, ${stateLabel}, ${stats.read} of ${stats.total} sections`}
      className="group relative block h-full rounded-[22px] outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99]"
    >
      <article className="relative flex h-full flex-col rounded-[22px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-plum-50 p-5 shadow-[0_10px_30px_-24px_rgba(87,52,153,0.6)] transition-all duration-300 motion-safe:group-hover:-translate-y-1.5 group-hover:shadow-[0_30px_60px_-26px_rgba(212,52,158,0.42)]">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-[13px] font-black text-white shadow-sm ${
              magenta
                ? 'bg-gradient-to-br from-brand-400 to-brand-600'
                : 'bg-gradient-to-br from-plum-400 to-plum-600'
            }`}
          >
            {pad(chapter.number)}
          </span>

          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${
              magenta ? 'bg-brand-100 text-brand-600' : 'bg-plum-100 text-plum-700'
            }`}
          >
            <Icon className="h-5 w-5">{CHAPTER_ICONS[chapter.slug]}</Icon>
          </span>

          <span
            aria-hidden="true"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-xs transition-all duration-300 motion-safe:group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white"
          >
            <Icon className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </Icon>
          </span>
        </div>

        <h3 className="mt-4 font-serif text-lg font-bold tracking-tight text-ink">
          {chapter.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">
          {chapter.subtitle}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <StatusPill state={state} />
          <span className="shrink-0 font-mono text-[11px] font-bold text-body">
            {stats.read}/{stats.total}
          </span>
        </div>
      </article>
    </Link>
  )
}

export default function SqlBook() {
  const { status, progress, retry } = useAcademyProgress()

  const readSet = new Set(progress.sections)
  const chapterDone = new Set(progress.chapters)
  const read = progress.sections.length

  const isChapterDone = (chapter) =>
    chapterDone.has(chapter.slug) || chapterStats(chapter, readSet).done
  const completedChapters = CHAPTERS.filter(isChapterDone).length
  const chapterPct = CHAPTERS.length ? Math.round((completedChapters / CHAPTERS.length) * 100) : 0
  const reduced = useReducedMotion()
  const countedBar = useCountUp(chapterPct, { duration: 900, start: !reduced })
  const hasProgress = read > 0
  const progressCaption =
    completedChapters === 0
      ? 'Pick any chapter to begin.'
      : completedChapters >= CHAPTERS.length
        ? 'You finished the whole book!'
        : "Keep going! You're doing great!"

  const resume =
    CHAPTERS.find((c) => c.sections.some((s) => !readSet.has(sectionKey(c.slug, s.id)))) ??
    CHAPTERS[CHAPTERS.length - 1]

  const features = [
    {
      title: `${CHAPTERS.length} Chapters`,
      sub: 'Complete learning path',
      icon: <BookGlyph className="h-5 w-5" />,
    },
    {
      title: 'Hands-on Practice',
      sub: 'Real-world examples',
      icon: (
        <Icon className="h-5 w-5">
          <path d="m8 6-6 6 6 6" />
          <path d="m16 6 6 6-6 6" />
        </Icon>
      ),
    },
    {
      title: 'Track Progress',
      sub: 'Build your skills',
      icon: (
        <Icon className="h-5 w-5">
          <path d="M3 3v18h18" />
          <path d="m7 14 3-3 4 4 5-6" />
        </Icon>
      ),
    },
  ]

  return (
    <div className="sqlbook-page relative">
      {/* Full-bleed hero, broken out of the shared max-w-6xl main column.
          `-mt-8/-mt-10` cancels the main's top padding so the banner sits flush
          under the sticky nav, the same treatment as the Academy gate hero. */}
      <section
        aria-labelledby="sqlbook-hero-title"
        className="relative isolate -mt-8 overflow-hidden border-b border-line bg-gradient-to-br from-brand-50 via-white to-plum-50 sm:-mt-10 [margin-inline:calc(50%_-_50vw)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="blob-drift absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(247,212,237,0.55),rgba(247,212,237,0)_65%)]" />
          <div className="blob-drift-b absolute -right-32 top-1/4 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(213,194,245,0.5),rgba(213,194,245,0)_65%)]" />
        </div>

        <div className="relative mx-auto grid max-w-[1360px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 min-[1000px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] min-[1000px]:gap-14">
          <div className="text-center min-[1000px]:text-left">
            <p
              className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 py-1 pl-3 pr-2.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.3em] text-gradient"
              style={stagger(0, 100)}
            >
              <span aria-hidden="true" className="badge-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Learn · Practice · Grow
            </p>

            <h1
              id="sqlbook-hero-title"
              className="enter-rise mt-4 font-sans text-[2.2rem] font-black leading-[1.04] tracking-[-0.02em] text-ink sm:text-[3rem] min-[1000px]:text-[3.35rem]"
              style={stagger(1, 100)}
            >
              SQL Learning <span className="grad-text">Academy</span>
            </h1>

            <p
              className="enter-rise mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px] min-[1000px]:mx-0"
              style={stagger(2, 100)}
            >
              Master SQL from basics to advanced concepts with structured chapters, real examples,
              and hands-on practice. Build your skills step by step and become a confident
              database developer.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[900px]:grid-cols-3">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="enter-rise flex items-start gap-3 rounded-2xl border border-brand-100 bg-white/70 p-3 text-left shadow-xs backdrop-blur-sm"
                  style={stagger(3 + i, 100)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    {feature.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-ink">{feature.title}</div>
                    <div className="text-[11px] leading-snug text-muted">{feature.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full">
            {/* Progress card. Stacked (<1000px) it flows between the copy and the
                illustration; at >=1000px it floats over the art's bottom-left
                corner, so it can never overlap the text column. */}
            <div
              className="enter-rise mx-auto mb-6 w-full max-w-[380px] min-[1000px]:absolute min-[1000px]:bottom-2 min-[1000px]:left-0 min-[1000px]:z-20 min-[1000px]:mb-0 min-[1000px]:w-[292px]"
              style={stagger(6, 100)}
            >
              {status === 'ready' ? (
                <div className="rounded-[22px] border border-line bg-white/95 p-4 shadow-[0_26px_54px_-30px_rgba(45,0,34,0.55)] backdrop-blur-sm">
                  <div className="flex items-center gap-3.5">
                    <HeroRing done={completedChapters} total={CHAPTERS.length} />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-600">
                        Chapters Completed
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-body">{progressCaption}</p>
                    </div>
                  </div>
                  <ProgressBar
                    pct={reduced ? chapterPct : countedBar}
                    gradient="linear-gradient(90deg,#d4349e,#6b46c9)"
                    className="mt-4"
                    animate={!reduced}
                  />
                  {hasProgress && (
                    <Link
                      to={`/academy/sql/${resume.slug}`}
                      className="cta-sheen relative mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(140,21,104,0.95)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      Continue Chapter {resume.number} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              ) : status === 'loading' ? (
                <HeroCardSkeleton />
              ) : null}
            </div>

            <div className="flex justify-center min-[1000px]:justify-end">
              <div
                className="sb-art-in w-full max-w-[300px] sm:max-w-[380px] min-[1000px]:max-w-[440px]"
                style={stagger(5, 100)}
              >
                <SqlBookHeroArt />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The hero and this column share the same ~1360px inner width. Break out
          of the shared max-w-6xl main so the 4-up grid has room to breathe. */}
      <div className="[margin-inline:calc(50%_-_50vw)]">
        <div className="mx-auto w-full max-w-[1360px] px-5 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12">
          <section aria-labelledby="all-chapters" className="mt-2">
            <Reveal delay={0}>
              <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white text-brand-600 shadow-xs">
                    <BookGlyph className="sb-icon-wiggle h-5 w-5" />
                  </span>
                  <div>
                    <h2
                      id="all-chapters"
                      className="font-serif text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]"
                    >
                      All Chapters
                    </h2>
                    <p className="mt-0.5 text-[13px] text-muted">
                      Explore all {CHAPTERS.length} chapters and start learning at your own pace.
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700 sm:self-auto">
                  {CHAPTERS.length} Chapters
                  <span aria-hidden="true" className="text-brand-300">
                    ·
                  </span>
                  From Basics to Advanced
                </span>
              </div>
            </Reveal>

            {status === 'loading' ? (
              <div className="mt-6 grid grid-cols-1 items-stretch gap-6 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-4">
                {CHAPTERS.map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : status === 'error' ? (
              <ErrorPanel onRetry={retry} className="mt-6" />
            ) : (
              <div className="mt-6 grid grid-cols-1 items-stretch gap-6 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-4">
                {CHAPTERS.map((chapter, i) => (
                  <Reveal key={chapter.slug} delay={(i % 4) * 80} className="h-full">
                    <ChapterCard
                      chapter={chapter}
                      stats={chapterStats(chapter, readSet)}
                      done={isChapterDone(chapter)}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Slim closing strip: a soft gradient wave behind a centered tagline with
          a star on each side. This is NOT a footer — it is the last element of
          the page, sitting directly above the shared footer. Full-bleed like the
          hero. */}
      <section
        aria-labelledby="sqlbook-tagline"
        className="relative -mb-8 sm:-mb-10 [margin-inline:calc(50%_-_50vw)]"
      >
        <div className="relative isolate overflow-hidden bg-[linear-gradient(90deg,#f7d4ed,#e9dffb)] py-8 sm:py-10">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="sqlbook-wave" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#eec4e8" />
                <stop offset="100%" stopColor="#d7c6f7" />
              </linearGradient>
            </defs>
            <path
              className="sb-wave"
              fill="url(#sqlbook-wave)"
              d="M-60 58L0 58C180 18 360 18 540 46C720 74 900 92 1080 70C1230 52 1350 42 1440 54L1500 54V120L-60 120Z"
            />
          </svg>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_120%_at_50%_120%,rgba(255,255,255,0.5),transparent_72%)]"
          />
          <div className="relative mx-auto flex max-w-[1200px] items-center justify-center gap-3 px-5 sm:gap-4">
            <StarIcon className="sb-twinkle h-5 w-5 shrink-0 text-brand-500 sm:h-6 sm:w-6" />
            <p
              id="sqlbook-tagline"
              className="font-serif text-2xl font-extrabold tracking-tight text-ink sm:text-2xl"
            >
              Small Steps
              <span aria-hidden="true" className="sb-arrow mx-2 align-middle text-brand-600">
                →
              </span>
              Big Database Skills
            </p>
            <StarIcon
              className="sb-twinkle h-5 w-5 shrink-0 text-brand-500 sm:h-6 sm:w-6"
              style={{ animationDelay: '-1.7s' }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
