import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHAPTERS, academyStats, sectionKey } from '../../data/academy/book.js'
import { getProgress } from '../../data/academy/progress.js'

function Icon({ className = 'h-5 w-5', children }) {
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

const STAT_ICONS = {
  chapters: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  examples: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  referenceTables: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </>
  ),
}

function nextUp(progress) {
  const read = new Set(progress.sections)
  const started = progress.sections.length > 0
  if (!started) return { label: 'Start SQL Quiz', href: '/quiz/sql', cta: 'Start the SQL Quiz' }
  const chapter =
    CHAPTERS.find((c) => c.sections.some((s) => !read.has(sectionKey(c.slug, s.id)))) ??
    CHAPTERS[CHAPTERS.length - 1]
  return {
    label: `Continue Chapter ${chapter.number}`,
    href: `/academy/sql/${chapter.slug}`,
    cta: `Continue Chapter ${chapter.number}`,
  }
}

export default function QuickStats() {
  const [progress] = useState(getProgress)
  const stats = academyStats()
  const next = nextUp(progress)

  const items = [
    { key: 'chapters', label: 'Chapters', value: stats.chapters },
    { key: 'examples', label: 'Examples', value: stats.examples },
    { key: 'referenceTables', label: 'Reference Tables', value: stats.referenceTables },
  ]

  return (
    <section className="mt-6 rounded-[24px] border border-plum-200/70 bg-gradient-to-br from-plum-50 via-white to-brand-50 p-5 shadow-[0_18px_40px_-32px_rgba(87,52,153,0.5)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        {/* Label */}
        <div className="flex items-center gap-3 lg:w-52 lg:shrink-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-plum-100 text-plum-700">
            <Icon className="h-5 w-5">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </Icon>
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-plum-700">
              Quick Stats
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted">Your learning journey at a glance.</p>
          </div>
        </div>

        {/* The three counts */}
        <div className="flex flex-1 items-center justify-between gap-1 sm:gap-4 lg:justify-around">
          {items.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && <span className="h-10 w-px shrink-0 bg-plum-200/80" aria-hidden="true" />}
              <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm ring-1 ring-plum-200/60">
                  <Icon className="h-4 w-4">{STAT_ICONS[s.key]}</Icon>
                </span>
                <div>
                  <div className="text-xl font-extrabold leading-none text-ink sm:text-2xl">{s.value}</div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {s.label}
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>

        {/* Next up */}
        <div className="flex items-center gap-3 rounded-2xl border border-plum-200/70 bg-white/80 p-3 lg:w-64 lg:shrink-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-4 w-4">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </Icon>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-plum-700">
              Next Up
            </p>
            <p className="truncate text-sm font-bold text-ink">{next.label}</p>
          </div>
          <Link
            to={next.href}
            aria-label={next.cta}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_10px_22px_-12px_rgba(140,21,104,0.9)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Icon className="h-4 w-4">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </Icon>
          </Link>
        </div>
      </div>
    </section>
  )
}
