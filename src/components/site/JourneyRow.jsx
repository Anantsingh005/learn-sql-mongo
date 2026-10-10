import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { fetchUserScores } from '../../lib/profile.js'
import { useInView } from '../../hooks/useInView.js'
import { useCountUp } from '../../hooks/useCountUp.js'
import { CodeIcon, ArrowRightIcon } from './icons.jsx'
import { TrophyArt } from './CardArt.jsx'
import { QUICK_STATS } from './homeStats.js'

/* ------------------------------------------------------------------ *
 * Scoped animations for the row. Only transform/opacity are animated.
 * Every looping animation is disabled under prefers-reduced-motion.
 * ------------------------------------------------------------------ */
const ROW_ANIM = `
@keyframes jp-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.jp-bob { animation: jp-bob 4.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

@keyframes jp-arrow { 0%, 100% { opacity: 0.35; transform: translateX(0); } 50% { opacity: 1; transform: translateX(3px); } }
.jp-arrow { animation: jp-arrow 1.8s ease-in-out infinite; }

@keyframes jp-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
.jp-twinkle { animation: jp-twinkle 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .jp-bob, .jp-arrow, .jp-twinkle { animation: none; }
}
`

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// Counts up from 0 the first time the card scrolls into view.
function StatNumber({ value, start, suffix = '' }) {
  const reduce = prefersReducedMotion()
  const animated = useCountUp(value ?? 0, { start: start && !reduce })
  return (
    <>
      {reduce ? (value ?? 0) : animated}
      {suffix}
    </>
  )
}

const ICON_WRAP =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-[0_2px_10px_-6px_rgba(45,0,34,0.25)]'

function TargetIcon({ size = 24, strokeWidth = 1.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChartIcon({ size = 24, strokeWidth = 1.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M3 20h18" />
    </svg>
  )
}

function BookIcon({ size = 22, strokeWidth = 1.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </svg>
  )
}

function TrendIcon({ size = 22, strokeWidth = 1.9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  )
}

function ArrowIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

const CARD_SHELL =
  'flex h-full flex-col rounded-3xl p-6 shadow-[0_2px_12px_-8px_rgba(45,0,34,0.2)] transition-[transform,box-shadow] duration-300 sm:p-7'

const CARD_LIFT = 'motion-safe:hover:-translate-y-1.5'
const GLOW_PLUM = 'hover:shadow-[0_32px_56px_-38px_rgba(107,70,201,0.65)]'
const GLOW_BRAND = 'hover:shadow-[0_32px_56px_-38px_rgba(140,21,104,0.6)]'

const JOURNEY_STEPS = [
  { key: 'learn', label: 'Learn', to: '/academy', Icon: BookIcon, tone: 'bg-plum-100 text-plum-600' },
  { key: 'practice', label: 'Practice', to: '/practice', Icon: CodeIcon, tone: 'bg-brand-100 text-brand-600' },
  { key: 'improve', label: 'Improve', to: '/leaderboard', Icon: TrendIcon, tone: 'bg-leaf-100 text-leaf-600' },
]

function LearningJourneyCard() {
  return (
    <div className={`${CARD_SHELL} ${CARD_LIFT} ${GLOW_PLUM} bg-white ring-1 ring-inset ring-white/70`}>
      <span className={`${ICON_WRAP} bg-plum-100 text-plum-600`}>
        <TargetIcon />
      </span>
      <h3 className="mt-4 font-sans text-lg font-black tracking-tight text-ink">Your Learning Journey</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
        Start small, think big. Every question brings you closer to mastery.
      </p>

      <div className="mt-auto flex items-start justify-between gap-1 pt-6">
        {JOURNEY_STEPS.map(({ key, label, to, Icon, tone }, i) => (
          <Fragment key={key}>
            <Link
              to={to}
              className="group flex flex-1 flex-col items-center gap-2 rounded-xl px-1 py-2 outline-none transition-colors hover:bg-plum-50/80 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-safe:active:scale-95"
            >
              <span className={`${ICON_WRAP} h-12 w-12 transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:scale-105 ${tone}`}>
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <span className="text-[13px] font-bold text-body transition-colors group-hover:text-plum-700">{label}</span>
            </Link>
            {i < JOURNEY_STEPS.length - 1 && (
              <span className="jp-arrow mt-3 text-plum-300" style={{ animationDelay: `${i * 0.45}s` }} aria-hidden="true">
                <ArrowIcon className="h-4 w-4" />
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function QuickStatTile({ label, value, suffix = '', personal = false, signedIn, loading, start }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-mist/70 px-2 py-3.5 text-center ring-1 ring-inset ring-white/70">
      <span className="font-sans text-xl font-black leading-none tabular-nums text-ink">
        {!personal || signedIn ? (
          loading ? (
            <span className="mx-auto block h-5 w-8 rounded-full bg-slate-200 motion-safe:animate-pulse" />
          ) : (
            <StatNumber value={value} start={start} suffix={suffix} />
          )
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </span>
      <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  )
}

function QuickStatsCard({ start }) {
  const { user } = useAuth()
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true
    fetchUserScores(user.id).then((res) => {
      if (active) setResult({ userId: user.id, stats: res?.stats ?? null })
    })
    return () => {
      active = false
    }
  }, [user?.id])

  // Only trust a result that belongs to the current user, so switching accounts
  // never shows the previous user's numbers.
  const stats = result && result.userId === user?.id ? result.stats : null
  const signedIn = Boolean(user?.id)
  const loading = signedIn && !stats

  const tiles = [
    { key: 'quizzes', label: 'Total Quizzes', value: stats?.sessions ?? 0, personal: true },
    { key: 'chapters', label: 'Chapters', value: QUICK_STATS.chapters },
    { key: 'questions', label: 'Questions', value: QUICK_STATS.questions },
    { key: 'avg', label: 'Avg. Score', value: stats?.averageScore ?? 0, suffix: '%', personal: true },
  ]

  return (
    <div className={`${CARD_SHELL} ${CARD_LIFT} ${GLOW_BRAND} bg-white ring-1 ring-inset ring-white/70`}>
      <span className={`${ICON_WRAP} bg-brand-100 text-brand-600`}>
        <ChartIcon />
      </span>
      <h3 className="mt-4 font-sans text-lg font-black tracking-tight text-ink">Quick Stats</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">See how you&rsquo;re doing on your journey.</p>

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
        {tiles.map((tile) => (
          <QuickStatTile
            key={tile.key}
            label={tile.label}
            value={tile.value}
            suffix={tile.suffix}
            personal={tile.personal}
            signedIn={signedIn}
            loading={loading}
            start={start}
          />
        ))}
      </div>

      {!signedIn && (
        <Link
          to="/auth"
          className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-[13px] font-bold text-brand-700 transition-[background-color,transform] duration-200 hover:bg-brand-100 motion-safe:active:scale-95"
        >
          Sign in to see your stats
          <ArrowRightIcon size={15} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}

function ProgressCard() {
  return (
    <div className={`${CARD_SHELL} ${CARD_LIFT} ${GLOW_PLUM} bg-gradient-to-br from-plum-100 via-white to-plum-50 ring-1 ring-inset ring-white/70`}>
      <div className="mx-auto w-full max-w-[190px]">
        <TrophyArt />
      </div>
      <h3 className="mt-4 font-sans text-lg font-black tracking-tight text-ink">Small Steps, Big Progress</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">Keep learning, keep growing!</p>
      <Link
        to="/leaderboard"
        className="group mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_16px_28px_-16px_rgba(140,21,104,0.95)] outline-none transition-[background-color,transform] duration-200 hover:bg-brand-700 motion-safe:active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        View Leaderboard
        <ArrowRightIcon size={16} strokeWidth={2.2} className="transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  )
}

export default function JourneyRow() {
  const [ref, inView] = useInView()

  const cards = [LearningJourneyCard, QuickStatsCard, ProgressCard]

  return (
    <>
      <style>{ROW_ANIM}</style>
      <div ref={ref} className="mt-6 grid gap-6 md:grid-cols-3">
        {cards.map((Card, i) => (
          <div
            key={i}
            className={`reveal h-full ${inView ? 'is-in' : ''}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <Card start={inView} />
          </div>
        ))}
      </div>
    </>
  )
}
