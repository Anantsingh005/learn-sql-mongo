import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sectionKey } from '../../data/academy/book.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { useInView } from '../../hooks/useInView.js'
import { useCountUp } from '../../hooks/useCountUp.js'
import Reveal from './Reveal.jsx'
import ProgressBar from './ProgressBar.jsx'
import { CheckIcon } from './BlockIcons.jsx'

// The lesson's right column: three small cards below the nav on wide screens,
// dropping under the lesson once there is no room beside it. Purely a reading
// aid — it starts nothing and changes no lesson state, except that its rows
// navigate to a section, exactly like the Contents sidebar.

const CARD =
  'rounded-2xl border border-line bg-white/85 p-4 shadow-[0_2px_14px_-10px_rgba(16,42,67,0.3)] backdrop-blur-sm'

function BarChartIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 20V11M12 20V4M19 20v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function CompassIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.4 8.6-1.9 4.9-4.9 1.9 1.9-4.9 4.9-1.9Z" fill="currentColor" />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon({ accent, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" stroke={accent} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.4" stroke={accent} strokeWidth="1.8" opacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill={accent} />
    </svg>
  )
}

function PlantArt({ accent, className = 'h-14 w-14' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M32 41c0-9-6-14-15-14 0 9 6 14 15 14Z" fill="#6cae85" />
      <path d="M32 41c0-11 7-17 17-17 0 11-7 17-17 17Z" fill="#2f7a4f" />
      <path d="M32 41V17" stroke="#2f7a4f" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M21 43h22l-2.6 13.6a3 3 0 0 1-3 2.4H26.6a3 3 0 0 1-3-2.4Z"
        fill={accent}
        fillOpacity="0.14"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M18.5 43h27" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M25 48h14" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function CardHead({ icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        {icon}
      </span>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</span>
    </div>
  )
}

function ProgressRing({ done, total, accent, reduced, drawn, display }) {
  const r = 42
  const sw = 9
  const c = 2 * Math.PI * r
  const frac = total ? done / total : 0
  // Start empty and fill once the ring scrolls in (drawn), so it "draws itself".
  const shown = reduced || drawn ? frac : 0

  return (
    <div className="relative mx-auto h-24 w-24">
      <svg
        viewBox="0 0 104 104"
        className="h-full w-full -rotate-90"
        role="progressbar"
        aria-label="Sections read in this chapter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} sections read`}
      >
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--color-line)" strokeWidth={sw} />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{
            transition: reduced ? undefined : 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-black leading-none text-ink">
          {display}
          <span className="text-muted">/{total}</span>
        </span>
        <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted">read</span>
      </div>
    </div>
  )
}

function ChapterProgressCard({ chapter, readSections, accent, reduced, className = '' }) {
  const total = chapter.sections.length
  const pct = total ? Math.round((readSections / total) * 100) : 0
  const [ringRef, ringInView] = useInView({ threshold: 0.25 })
  const [drawn, setDrawn] = useState(false)
  const display = useCountUp(readSections)

  // Wait until the card is on screen before the ring draws itself in.
  useEffect(() => {
    if (!ringInView || reduced) return undefined
    const raf = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(raf)
  }, [ringInView, reduced])

  const caption =
    readSections === 0
      ? 'Start with the first section.'
      : readSections >= total
        ? 'Chapter complete!'
        : "Keep going! You're doing great!"

  return (
    <Reveal as="section" aria-label="Chapter progress" className={`${CARD} hidden min-[900px]:block ${className}`}>
      <CardHead icon={<BarChartIcon />} label="Chapter Progress" />

      <div ref={ringRef} className="mt-4">
        <ProgressRing
          done={readSections}
          total={total}
          accent={accent}
          reduced={reduced}
          drawn={drawn}
          display={display}
        />
      </div>

      <div className="mt-4 text-center">
        <div className="font-serif text-[15px] font-semibold tracking-tight text-ink">{chapter.title}</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{caption}</p>
      </div>

      <div className="mt-4" aria-hidden="true">
        <ProgressBar
          pct={reduced || drawn ? pct : 0}
          gradient={`linear-gradient(90deg, ${accent}, ${accent}66)`}
        />
      </div>
    </Reveal>
  )
}

function QuickNavCard({ chapter, activeId, accent, isRead, className = '' }) {
  return (
    <Reveal as="section" aria-label="Quick navigation" className={`${CARD} ${className}`}>
      <CardHead icon={<CompassIcon />} label="Quick Navigation" />

      <ol className="mt-3 space-y-1">
        {chapter.sections.map((s, i) => {
          const active = s.id === activeId
          const done = isRead(chapter.slug, s.id)

          return (
            <li key={s.id} className="qnav-row" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                to={`/academy/sql/${chapter.slug}#${sectionKey(chapter.slug, s.id)}`}
                aria-current={active ? 'page' : undefined}
                title={s.title}
                className={`group flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors ${
                  active ? 'bg-brand-50' : 'hover:bg-mist'
                }`}
              >
                <span
                  className="flex h-6 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-black"
                  style={
                    active
                      ? { background: accent, color: '#fff' }
                      : { background: 'var(--color-line)', color: 'var(--color-body)' }
                  }
                >
                  {s.number}
                </span>

                <span
                  className={`min-w-0 flex-1 truncate text-[13px] ${
                    active ? 'font-semibold text-brand-700' : 'text-body'
                  }`}
                >
                  {s.title}
                </span>

                {done && (
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-600"
                    aria-label="Read"
                  >
                    <CheckIcon className="h-2.5 w-2.5" />
                  </span>
                )}

                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          )
        })}
      </ol>
    </Reveal>
  )
}

function MotivationCard({ accent, className = '' }) {
  return (
    <Reveal as="section" aria-label="Encouragement" className={`${CARD} ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
        <TargetIcon accent={accent} />
      </span>

      <div className="mt-3 flex items-end gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-[16px] font-semibold leading-snug tracking-tight text-ink">
            Small steps. Big progress.
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">A few minutes a day adds up.</p>
        </div>
        <PlantArt accent={accent} className="sb-sway h-14 w-14 shrink-0" />
      </div>
    </Reveal>
  )
}

export default function ChapterRail({ chapter, readSections, isRead, activeId }) {
  const reduced = useReducedMotion()
  const accent = chapter.accent

  return (
    <aside
      aria-label="Chapter tools"
      className="self-start min-[900px]:col-start-2 min-[900px]:row-start-2 min-[1280px]:col-start-3 min-[1280px]:row-start-1 min-[1280px]:sticky min-[1280px]:top-24 min-[1280px]:max-h-[calc(100vh-7rem)] min-[1280px]:overflow-y-auto min-[1280px]:pr-1"
    >
      <div className="grid grid-cols-1 items-start gap-4 min-[900px]:grid-cols-3 min-[1280px]:grid-cols-1">
        <ChapterProgressCard
          chapter={chapter}
          readSections={readSections}
          accent={accent}
          reduced={reduced}
        />
        <QuickNavCard chapter={chapter} activeId={activeId} accent={accent} isRead={isRead} />
        <MotivationCard accent={accent} />
      </div>
    </aside>
  )
}
