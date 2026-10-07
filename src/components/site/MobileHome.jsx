import { Link } from 'react-router-dom'
import { useInView } from '../../hooks/useInView.js'
import useCountUp from '../../hooks/useCountUp.js'
import WorkspaceVisual from './WorkspaceVisual.jsx'
import { ArrowRightIcon, CodeIcon, LeafIcon } from './icons.jsx'

/* -------------------------------------------------------------------------- */
/* Phone + tablet home (max-width: 1024px), built from DBQuiz's existing      */
/* light design language. Phones stack single-column; tablets (>= 768px) get  */
/* a two-column layout with the real workspace illustration.                  */
/* Desktop (>= 1024px) keeps the original hero + game cards via Home.jsx.     */
/* -------------------------------------------------------------------------- */

const CHIPS = [
  { label: 'SQL', Icon: CodeIcon, to: '/quiz/sql', active: true },
  { label: 'MongoDB', Icon: LeafIcon, to: '/quiz/mongo' },
  { label: 'Quizzes', Icon: QuizIcon, to: '/practice' },
]

const EDITOR_BULLETS = [
  {
    text: 'Instant results from a real query engine',
    color: 'bg-amber-50 text-amber-600',
    Icon: BoltIcon,
  },
  {
    text: 'Hints that teach, not just reveal the answer',
    color: 'bg-brand-50 text-brand-600',
    Icon: BulbIcon,
  },
  {
    text: 'Progress kept in sync across your devices',
    color: 'bg-leaf-50 text-leaf-600',
    Icon: SyncIcon,
  },
]

function BoltIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  )
}

function BulbIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6 6 0 0 0-4 10.4c.7.7 1 1.4 1 2.6h6c0-1.2.3-1.9 1-2.6A6 6 0 0 0 12 2z" />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function QuizIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const STATS = [
  { target: 500, suffix: '+', label: 'Questions', Icon: BookIcon, bg: 'bg-brand-50 text-brand-600' },
  { target: 2, label: 'Databases', Icon: DatabaseIcon, bg: 'bg-leaf-50 text-leaf-600' },
  { target: 10, suffix: 'K+', label: 'Learners', Icon: UsersIcon, bg: 'bg-amber-50 text-amber-600' },
]

const BARS = [
  { label: 'SQL', h: 76, color: 'bg-brand-500' },
  { label: 'Mongo', h: 46, color: 'bg-leaf-500' },
  { label: 'Quiz', h: 62, color: 'bg-amber-500' },
  { label: 'Academy', h: 88, color: 'bg-plum-400' },
]

const ky = 'text-brand-700' // keyword  · blue
const st = 'text-leaf-700' // string   · green
const nu = 'text-amber-600' // number   · orange

const EDITOR_LINES = [
  (
    <span key="line-1">
      <span className={ky}>SELECT</span> name, age
    </span>
  ),
  (
    <span key="line-2">
      <span className={ky}>FROM</span> users
    </span>
  ),
  (
    <span key="line-3">
      <span className={ky}>WHERE</span> plan = <span className={st}>'pro'</span>
    </span>
  ),
  (
    <span key="line-4">
      {'  '}
      <span className={ky}>AND</span> score &gt;= <span className={nu}>50</span>;
    </span>
  ),
]

/* Code + results workspace preview ----------------------------------------- */

const WS_TONE = {
  kw: 'text-brand-700',
  txt: 'text-body',
  str: 'text-leaf-700',
  num: 'text-amber-600',
}

const WS_CODE = [
  { parts: [['SELECT', 'kw'], [' name, score', 'txt']] },
  { parts: [['FROM', 'kw'], [' users', 'txt']] },
  { parts: [['WHERE', 'kw'], [' plan = ', 'txt'], ["'pro'", 'str']] },
  { parts: [['ORDER BY', 'kw'], [' score ', 'txt'], ['DESC', 'kw']] },
  { parts: [['LIMIT', 'kw'], [' ', 'txt'], ['3', 'num'], [';', 'txt']] },
]

const WS_ROWS = [
  ['Anna', 'pro', '92'],
  ['Ben', 'pro', '84'],
  ['Cal', 'pro', '71'],
]

function WorkspaceCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(16,42,67,0.55)]">
      <div className="flex items-center gap-1.5 border-b border-line bg-shell/70 px-4 py-2.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          query.sql
        </span>
        <span className="ml-auto rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-brand-600">
          Run
        </span>
      </div>

      <pre className="px-4 pb-3 pt-3 font-mono text-[12px] leading-[1.8] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <code>
          {WS_CODE.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="flex gap-3">
              <span className="w-3 shrink-0 select-none text-right text-slate-400">{i + 1}</span>
              <span className="whitespace-pre">
                {line.parts.map(([text, tone], j) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={j} className={WS_TONE[tone]}>
                    {text}
                  </span>
                ))}
                {i === WS_CODE.length - 1 && (
                  <span className="caret-blink ml-0.5 inline-block h-[13px] w-[6px] rounded-[1px] bg-brand-600" aria-hidden="true" />
                )}
              </span>
            </div>
          ))}
        </code>
      </pre>

      <div className="border-t border-line">
        <div className="grid grid-cols-3 gap-3 border-b border-line bg-shell/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span>name</span>
          <span>plan</span>
          <span className="text-right">score</span>
        </div>
        {WS_ROWS.map((row) => (
          <div key={row[0]} className="grid grid-cols-3 gap-3 px-4 py-1.5 font-mono text-[11.5px] text-body">
            <span>{row[0]}</span>
            <span className="text-leaf-700">{row[1]}</span>
            <span className="text-right text-amber-600">{row[2]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 border-t border-line bg-white/60 px-4 py-2">
          <span aria-hidden="true" className="badge-pulse h-2 w-2 rounded-full bg-leaf-500" />
          <span className="font-mono text-[11px] text-muted">3 rows · 4ms</span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function MobileHome() {
  return (
    <div className="min-[1024px]:hidden overflow-x-clip">
      <div className="relative isolate overflow-x-clip bg-gradient-to-b from-shell via-white to-white text-body">
        {/* Soft ambient colour — restrained, not neon */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-[-8rem] h-80 w-80 rounded-full bg-brand-100/70 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[36rem] -left-40 h-96 w-96 rounded-full bg-leaf-100/60 blur-[140px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[72rem] right-[-8rem] h-80 w-80 rounded-full bg-plum-100/70 blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
          <HeroSection />
          <ChipsRow />
          <StatsStrip />
          <EditorSection />
        </div>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="pb-2 pt-5 md:pt-12">
      <div className="md:grid md:grid-cols-[1.05fr_minmax(0,380px)] md:items-center md:gap-10 lg:grid-cols-[1.1fr_minmax(0,440px)] lg:gap-14">
        <div>
          <p
            className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600"
            style={{ animationDelay: '0ms' }}
          >
            <span aria-hidden="true" className="badge-pulse h-1.5 w-1.5 rounded-full bg-brand-500" />
            Practice · Learn · Improve
          </p>

          <h1
            className="enter-rise mt-3 font-serif text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[40px] md:text-[44px]"
            style={{ animationDelay: '90ms' }}
          >
            Master <span className="grad-text">Database Skills</span>
          </h1>

          <p
            className="enter-rise mt-3 max-w-[22rem] text-[15px] leading-relaxed text-body"
            style={{ animationDelay: '180ms' }}
          >
            Build, run, and fix real SQL and MongoDB queries from your phone or tablet — with
            instant, friendly feedback.
          </p>

          <div
            className="enter-rise mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap md:flex-col lg:flex-row"
            style={{ animationDelay: '260ms' }}
          >
            <Link
              to="/quiz/sql"
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[15px] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(21,84,199,0.85)] transition-all duration-200 active:scale-[0.98] active:bg-brand-700 sm:max-w-[220px] md:max-w-none lg:max-w-[220px]"
            >
              Start Learning
              <ArrowRightIcon size={17} strokeWidth={2.1} />
            </Link>

            <Link
              to="/leaderboard"
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-line bg-white text-[15px] font-semibold text-ink transition-all duration-200 active:scale-[0.98] active:border-brand-200 active:bg-brand-50 active:text-brand-700 sm:max-w-[230px] md:max-w-none lg:max-w-[230px]"
            >
              View Leaderboard
              <ArrowRightIcon size={17} strokeWidth={2.1} className="text-brand-500" />
            </Link>
          </div>
        </div>

        <div className="enter-rise mt-6 md:mt-0" style={{ animationDelay: '340ms' }}>
          {/* Phone visual: compact code + results card */}
          <div className="md:hidden">
            <WorkspaceCard />
          </div>
          {/* Tablet visual: the real workspace illustration */}
          <div className="hidden select-none md:block">
            <WorkspaceVisual className="mx-auto w-full max-w-[460px] drop-shadow-[0_30px_50px_-30px_rgba(16,42,67,0.45)]" />
          </div>
        </div>
      </div>
    </section>
  )
}

function ChipsRow() {
  return (
    <section className="pt-8 md:pt-10" aria-label="Choose a topic">
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center md:gap-4">
        {CHIPS.map((chip) => (
          <Link
            key={chip.label}
            to={chip.to}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] sm:px-5 sm:py-2.5 sm:text-[14px] ${
              chip.active
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-line bg-white text-slate-600 shadow-sm hover:border-brand-200 hover:text-brand-600'
            }`}
          >
            <chip.Icon />
            {chip.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

function StatCell({ stat, start }) {
  const value = useCountUp(stat.target, { start })
  return (
    <div className="flex flex-col items-center gap-2 px-1 text-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
        <stat.Icon />
      </span>
      <p className="text-[20px] font-bold leading-none text-ink sm:text-[22px]">
        {value}
        {stat.suffix}
      </p>
      <p className="text-[11.5px] font-medium leading-none text-muted">{stat.label}</p>
    </div>
  )
}

function MiniChart({ inView }) {
  return (
    <div className="border-t border-line bg-white/60 px-4 pb-2 pt-3 sm:px-6 sm:pb-3" aria-hidden="true">
      <div className="flex h-14 items-end justify-between gap-3 sm:h-16 sm:gap-5">
        {BARS.map((bar, i) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-9 w-full items-end sm:h-11">
              <div
                className={`w-full rounded-t-[4px] ${bar.color} opacity-90`}
                style={{
                  height: inView ? `${bar.h}%` : '0%',
                  transition: `height 700ms ${120 + i * 90}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              />
            </div>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted sm:text-[10px]">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsStrip() {
  const [statsRef, statsInView] = useInView({ threshold: 0.35 })
  return (
    <section className="pt-6 md:pt-10">
      <div
        ref={statsRef}
        className="mx-auto max-w-xl rounded-2xl border border-line bg-white/80 shadow-[0_20px_45px_-38px_rgba(16,42,67,0.45)] backdrop-blur-sm"
      >
        <div className="grid grid-cols-3 divide-x divide-line py-4 sm:py-5">
          {STATS.map((stat) => (
            <StatCell key={stat.label} stat={stat} start={statsInView} />
          ))}
        </div>
        <MiniChart inView={statsInView} />
      </div>
    </section>
  )
}

function EditorSection() {
  return (
    <section className="pt-12 pb-16 md:pt-16 md:pb-20">
      <div className="md:grid md:grid-cols-[0.9fr_1.15fr] md:items-center md:gap-10 lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Code editor</p>
          <h2 className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.01em] text-ink sm:text-[24px] md:text-[28px]">
            Write, run, and learn
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-body sm:text-[15px]">
            Real queries, checked automatically, with line-by-line feedback on every answer.
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {EDITOR_BULLETS.map(({ text, color, Icon }) => (
              <li key={text} className="flex items-center gap-3 text-[14px] text-body sm:text-[15px]">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-5 rounded-[24px] border border-line bg-white p-4 pb-14 shadow-[0_26px_50px_-36px_rgba(16,42,67,0.55)] md:mt-0 md:p-5 md:pb-16">
          <div
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-50/70 via-shell to-transparent px-2 py-1.5"
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="ml-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
              query.sql
            </span>
            <span className="ml-auto rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Live
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-gradient-to-br from-shell to-white">
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-[1.8] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <code>
                {EDITOR_LINES.map((line, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="flex gap-4">
                    <span className="w-4 shrink-0 select-none text-right text-slate-400">{i + 1}</span>
                    <span className="whitespace-pre text-body">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          <Link
            to="/quiz/sql"
            className="absolute -bottom-3.5 right-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-[13px] font-bold text-white shadow-[0_12px_28px_-10px_rgba(21,84,199,0.7)] transition-transform active:scale-[0.97] active:bg-brand-700"
          >
            Try it Live
            <ArrowRightIcon size={15} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  )
}