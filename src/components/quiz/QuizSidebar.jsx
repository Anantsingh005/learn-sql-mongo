import { useEffect, useRef } from 'react'
import { livesInfo, feedbackMood } from './quizStats.js'
import { getQuizHelp, SECTION_ORDER } from '../../data/quizHelp.js'

const LEVEL_TONE = {
  easy: 'border-leaf-200 bg-leaf-50 text-leaf-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  hard: 'border-danger-200 bg-danger-50 text-danger-700',
  all: 'border-brand-200 bg-brand-50 text-brand-700',
}

const LEVEL_LABEL = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  all: 'All levels',
}

function ProgressRing({ value, size = 88, stroke = 8, children }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * Math.min(1, Math.max(0, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="text-brand-500 transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function Heart({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 transition-colors duration-300 ${filled ? 'text-brand-500' : 'text-line'}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.2S4 15 4 9.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8 3.2c0 5.4-8 10.6-8 10.6Z" />
    </svg>
  )
}

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4.5a2.5 2.5 0 0 0 2.5 4M17 5h2.5a2.5 2.5 0 0 1-2.5 4" />
      <path d="M12 13v4M8.5 21h7M10 21v-2h4v2" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

function LayersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
    </svg>
  )
}

function GaugeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 15V9M9.5 15V6M14 15v-5M18.5 15v-9" />
    </svg>
  )
}

function TableIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  )
}

function FunnelIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
    </svg>
  )
}

function SortIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 20V5M7 5 4 8M7 5l3 3" />
      <path d="M17 4v15M17 19l-3-3M17 19l3-3" />
    </svg>
  )
}

function LinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12h6" />
      <path d="M10.5 8H8a4 4 0 0 0 0 8h2.5M13.5 8H16a4 4 0 0 1 0 8h-2.5" />
    </svg>
  )
}

function SigmaIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 5H7l6 7-6 7h10" />
    </svg>
  )
}

function NestedIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6-3 6 3 6M15 6l3 6-3 6" />
    </svg>
  )
}

function PencilIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m14 6 4 4" />
    </svg>
  )
}

function DatabaseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </svg>
  )
}

const SECTION_ICONS = {
  'Reading Data': TableIcon,
  'Filtering Data': FunnelIcon,
  'Sorting Data': SortIcon,
  'Joins & Relationships': LinkIcon,
  Aggregation: SigmaIcon,
  'Subqueries & Advanced': NestedIcon,
  'Changing Data': PencilIcon,
  'Database Concepts': DatabaseIcon,
}

function Mascot({ className, mood }) {
  const happy = mood === 'happy'
  const upset = mood === 'wobble'
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path className="fill-plum-100 stroke-plum-400" strokeWidth="2" d="M12 17v28c0 4.4 8.9 7.5 20 7.5s20-3.1 20-7.5V17" />
      <ellipse className="fill-plum-200 stroke-plum-400" strokeWidth="2" cx="32" cy="17" rx="20" ry="7.5" />
      {happy && (
        <g>
          <g transform="translate(54 12) scale(0.8)">
            <path className="quiz-sparkle-burst fill-amber-400" d="M0-6C1-1 1-1 6 0 1 1 1 1 0 6-1 1-1 1-6 0-1-1-1-1 0-6Z" />
          </g>
          <g transform="translate(10 20) scale(0.6)">
            <path className="quiz-sparkle-burst fill-brand-300" style={{ animationDelay: '80ms' }} d="M0-6C1-1 1-1 6 0 1 1 1 1 0 6-1 1-1 1-6 0-1-1-1-1 0-6Z" />
          </g>
        </g>
      )}
      <circle className="fill-plum-700" cx="25" cy="27" r="2.4" />
      <circle className="fill-plum-700" cx="39" cy="27" r="2.4" />
      <path
        className="stroke-plum-700"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        d={
          upset
            ? 'M26 35c1.8-2.2 3.7-3.3 6-3.3s4.2 1.1 6 3.3'
            : happy
              ? 'M24 32c2 2.6 4.6 3.9 8 3.9s6-1.3 8-3.9'
              : 'M26 33c1.8 2 4 3 6 3s4.2-1 6-3'
        }
      />
      <path className="stroke-plum-200" strokeWidth="2" strokeLinecap="round" fill="none" d="M20 42h24M20 48h17" />
      <circle className="fill-plum-200" cx="20" cy="12" r="2" />
      <circle className="fill-plum-200" cx="46" cy="10" r="1.6" />
    </svg>
  )
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mist text-brand-600">
        {icon}
      </span>
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="ml-auto text-right">{value}</span>
    </div>
  )
}

function LevelChip({ level }) {
  const key = LEVEL_TONE[level] ? level : 'all'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_TONE[key]}`}
    >
      {LEVEL_LABEL[key]}
    </span>
  )
}

function buildSections(questions, answeredIds, currentSection) {
  const map = new Map()
  questions.forEach((q) => {
    const { section } = getQuizHelp(q)
    if (!map.has(section)) map.set(section, { name: section, total: 0, done: 0, current: false })
    const entry = map.get(section)
    entry.total += 1
    if (answeredIds.has(q.id)) entry.done += 1
  })
  const names = [...SECTION_ORDER, ...map.keys()].filter(
    (name, i, all) => map.has(name) && all.indexOf(name) === i,
  )
  return names.map((name) => {
    const entry = map.get(name)
    entry.current = name === currentSection
    return entry
  })
}

function QuizSidebar({ variant = 'full', snapshot, questions = [], level, help }) {
  const { index = 0, total = 0, score = 0, timeLeft = 0, answers = [] } = snapshot ?? {}
  const currentNumber = total > 0 ? Math.min(index + 1, total) : 0
  const progress = total > 0 ? currentNumber / total : 0
  const { filled: filledLives, total: totalLives } = livesInfo(snapshot)
  const currentQuestion = questions[index]
  const currentHelp = help ?? (currentQuestion ? getQuizHelp(currentQuestion) : null)
  const currentSection = currentHelp?.section ?? null
  const listRef = useRef(null)
  const activeRef = useRef(null)
  const highlightRef = useRef(null)

  useEffect(() => {
    const list = listRef.current
    const active = activeRef.current
    const highlight = highlightRef.current
    if (active && highlight) {
      highlight.style.height = `${active.offsetHeight}px`
      highlight.style.transform = `translateY(${active.offsetTop}px)`
    }
    if (!list || !active) return
    if (list.scrollHeight <= list.clientHeight + 1) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    active.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
  }, [currentSection])

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
        <ProgressRing value={progress} size={46} stroke={5}>
          <span className="font-mono text-[10px] font-black tabular-nums text-ink">
            {currentNumber}/{total}
          </span>
        </ProgressRing>
        <div className="h-9 w-px bg-line" aria-hidden="true" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Score</div>
          <div className="font-mono text-lg font-black tabular-nums text-ink">{score}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Lives</div>
          <div className="font-mono text-lg font-black tabular-nums text-ink">
            {filledLives}/{totalLives}
          </div>
        </div>
      </div>
    )
  }

  const answeredIds = new Set(answers.map((a) => a.question?.id).filter(Boolean))
  const sections = buildSections(questions, answeredIds, currentSection)
  const sectionsScroll = sections.length > 5
  const mood = feedbackMood(snapshot)
  const moodClass = mood === 'happy' ? 'quiz-mood-happy' : mood === 'wobble' ? 'quiz-mood-wobble' : ''
  const moodKey = `${snapshot?.index ?? 0}-${snapshot?.status ?? ''}`
  const sectionLabel = currentHelp?.section || (currentQuestion && (currentQuestion.topic || currentQuestion.subtopic)) || null

  return (
    <div className="flex flex-col gap-4">
      <div className="quiz-slide-left rounded-2xl border border-line bg-gradient-to-b from-white to-mist/40 p-5 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '0ms' }}>
        <div className="flex items-center gap-4">
          <ProgressRing value={progress}>
            <span className="font-mono text-sm font-black tabular-nums text-ink">
              {currentNumber}/{total}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="font-mono text-2xl font-black leading-none tabular-nums text-ink">
              {currentNumber} / {total}
            </div>
            <div className="mt-1 text-sm text-muted">Questions</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const state = i < index ? 'done' : i === index ? 'current' : 'upcoming'
            return (
              <span
                key={q.id ?? i}
                className={`enter-pop h-2 w-2 rounded-full transition-all duration-500 ${
                  state === 'current'
                    ? 'scale-125 bg-brand-500 ring-2 ring-brand-200'
                    : state === 'done'
                      ? 'bg-brand-200'
                      : 'bg-line'
                }`}
                style={{ animationDelay: state === 'current' ? '0ms' : `${Math.min(i, 20) * 10}ms` }}
              />
            )
          })}
        </div>
      </div>

      <div className="quiz-slide-left divide-y divide-line rounded-2xl border border-line bg-white py-1 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '100ms' }}>
        <StatRow
          icon={<TrophyIcon className="h-4 w-4" />}
          label="Score"
          value={<span className="font-mono text-sm font-bold tabular-nums text-ink">{score}</span>}
        />
        <StatRow
          icon={<ClockIcon className="h-4 w-4" />}
          label="Time Left"
          value={<span className="font-mono text-sm font-bold tabular-nums text-ink">{Math.max(0, timeLeft)}s</span>}
        />
        <StatRow
          icon={<GaugeIcon className="h-4 w-4" />}
          label="Level"
          value={<LevelChip level={level} />}
        />
      </div>

      {(sections.length > 0 || sectionLabel) && (
        <div className="quiz-slide-left rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4 text-brand-600" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-body">Question Sections</h3>
          </div>
          {sectionLabel && (
            <p className="mt-2 text-sm font-medium text-brand-700">{sectionLabel}</p>
          )}
          {sections.length > 0 && (
            <ul
              ref={listRef}
              className={`relative mt-2.5 flex flex-col gap-1 ${
                sectionsScroll ? 'max-h-[7.5rem] overflow-y-auto pr-1 [scrollbar-width:thin]' : ''
              }`}
            >
              <li
                ref={highlightRef}
                aria-hidden="true"
                className="quiz-section-highlight pointer-events-none absolute left-0 top-0 w-full rounded-lg bg-brand-50 ring-1 ring-brand-200"
              />
              {sections.map((section) => {
                const SectionIcon = SECTION_ICONS[section.name] ?? LayersIcon
                return (
                  <li
                    key={section.name}
                    ref={section.current ? activeRef : null}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        section.current ? 'bg-brand-100 text-brand-700' : 'bg-mist text-muted'
                      }`}
                    >
                      <SectionIcon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        section.current ? 'font-semibold text-brand-700' : 'text-body'
                      }`}
                    >
                      {section.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                      ({section.done}/{section.total})
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <div className="quiz-slide-left rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-body">Lives Remaining</span>
          <span className="font-mono text-xs font-bold tabular-nums text-muted">
            {filledLives} / {totalLives}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5" title={`${filledLives} of ${totalLives} lives left`}>
          {Array.from({ length: totalLives }).map((_, i) => {
            const on = i < filledLives
            return (
              // eslint-disable-next-line react/no-array-index-key
              <span key={`${i}-${on ? 'on' : 'off'}`} className={on ? 'quiz-opt-pop' : 'quiz-heart-break'} style={on ? { animationDelay: `${i * 40}ms` } : undefined}>
                <Heart filled={on} />
              </span>
            )
          })}
        </div>
      </div>

      <div className="quiz-slide-left flex items-center gap-3 rounded-2xl border border-plum-200 bg-plum-50 p-4" style={{ animationDelay: '400ms' }}>
        <span className="quiz-bob inline-block">
          <span key={moodKey} className={`inline-block ${moodClass}`}>
            <Mascot className="h-12 w-12 shrink-0" mood={mood} />
          </span>
        </span>
        <p className="font-hand text-lg leading-snug text-plum-700">
          You got this! Small steps make big progress!
        </p>
      </div>
    </div>
  )
}

export default QuizSidebar
