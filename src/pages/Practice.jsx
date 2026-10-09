import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  PRACTICE_TOPICS,
  PRACTICE_DIFFICULTIES,
  PRACTICE_TYPES,
} from '../data/practice/practiceQuestions.js'
import { loadPracticeQuestions, countPracticeQuestions } from '../data/practice/practiceQuestions.js'
import { chapterSlugForQuestion } from '../data/academy/lessonFor.js'
import { CHAPTERS } from '../data/academy/book.js'
import { PracticeEngine, PRACTICE_STATUS } from '../engine/PracticeEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import QueryRunner from '../engine/QueryRunner.js'
import useQuizEngine from '../hooks/useQuizEngine.js'
import SqlEditor from '../components/quiz/SqlEditor.jsx'
import SchemaPanel from '../components/quiz/SchemaPanel.jsx'
import HintReveal from '../components/quiz/HintReveal.jsx'
import { useInView } from '../hooks/useInView.js'
import { stagger } from '../components/site/motion.js'
import { ArrowRightIcon, CodeIcon, LeafIcon } from '../components/site/icons.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))
const TYPE_LABELS = { mc: 'Multiple choice', write: 'Write a query', bug: 'Fix the bug' }
const TYPE_COLORS = {
  mc: 'bg-brand-50 text-brand-700',
  write: 'bg-leaf-50 text-leaf-700',
  bug: 'bg-amber-50 text-amber-700',
}

function In({ size = 18, children, className = '', strokeWidth = 2, viewBox = '0 0 24 24' }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function BoltIcon(props) {
  return (
    <In {...props}>
      <path d="M13 2 4 13.5h6.5l-1 8.5L20 10.5h-6.5L13 2Z" />
    </In>
  )
}

function TargetIcon(props) {
  return (
    <In {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </In>
  )
}

function ChartIcon(props) {
  return (
    <In {...props}>
      <path d="M5 20v-6" />
      <path d="M12 20V6" />
      <path d="M19 20v-9" />
      <path d="M4 20h16" />
    </In>
  )
}

function BookIcon(props) {
  return (
    <In {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </In>
  )
}

function DocumentIcon(props) {
  return (
    <In {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </In>
  )
}

function PipelineIcon(props) {
  return (
    <In {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8.5 6H14a4 4 0 0 1 4 4v2" />
      <path d="M8.5 18H14a4 4 0 0 0 4-4v-1" />
    </In>
  )
}

function StarIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.6 6.2 20.1l1.6-6.6L2.6 9.1l6.8-.5L12 2.3Z" />
    </svg>
  )
}

function FeatureChip({ icon: Icon, label, style }) {
  return (
    <div className="enter-rise flex items-center gap-3" style={style}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="text-sm font-semibold text-body">{label}</span>
    </div>
  )
}

// Sparkle star (4-point) used across the hero scene.
const SPARK = 'M0 -13 C1.5 -4 4 -1.5 13 0 C4 1.5 1.5 4 0 13 C-1.5 4 -4 1.5 -13 0 C-4 -1.5 -1.5 -4 0 -13 Z'

function SparkleDotIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" className={className} aria-hidden="true">
      <path d={SPARK} />
    </svg>
  )
}

// Scoped to the practice hero. Every looping animation is disabled under
// prefers-reduced-motion. Only transform and opacity are animated.
const HERO_ANIM = `
@keyframes mp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes mp-spin { to { transform: rotate(360deg); } }
@keyframes mp-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes mp-scene-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
@keyframes mp-type-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes mp-blink { 0%, 55% { opacity: 1; } 60%, 100% { opacity: 0; } }
.mp-float { animation: mp-float 6s ease-in-out infinite; }
.mp-spin { animation: mp-spin 46s linear infinite; }
.mp-twinkle { animation: mp-twinkle 3.2s ease-in-out infinite; }
.mp-scene-in { animation: mp-scene-in 700ms var(--ease-out-soft) both; }
.mp-type-line { animation: mp-type-in 360ms var(--ease-out-soft) both; }
.mp-type-line-pending { opacity: 0; }
.mp-caret { animation: mp-blink 1.1s steps(1, end) infinite; }
@media (prefers-reduced-motion: reduce) {
  .mp-float, .mp-spin, .mp-twinkle { animation: none; }
  .mp-scene-in { animation: none; opacity: 1; transform: none; }
  .mp-type-line, .mp-type-line-pending { animation: none; opacity: 1; transform: none; }
  .mp-caret { animation: none; opacity: 1; }
}
`

function PracticeHeroArt() {
  return (
    <svg
      viewBox="0 0 520 480"
      className="h-auto w-full"
      role="img"
      aria-label="A magenta SQL card and a green MongoDB card with a leaf floating inside a glowing orbit ring, with a stack of pink database discs and sparkles"
    >
      <defs>
        <linearGradient id="mp-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0a8da" />
          <stop offset="50%" stopColor="#9575e0" />
          <stop offset="100%" stopColor="#6cae85" />
        </linearGradient>
        <linearGradient id="mp-sql" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4349e" />
          <stop offset="100%" stopColor="#8c1568" />
        </linearGradient>
        <linearGradient id="mp-mongo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#58a874" />
          <stop offset="100%" stopColor="#2f7a4f" />
        </linearGradient>
        <radialGradient id="mp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f7d4ed" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f7d4ed" stopOpacity="0" />
        </radialGradient>
        <filter id="mp-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <circle cx="245" cy="235" r="205" fill="url(#mp-glow)" />

      <g className="mp-spin" style={{ transformBox: 'view-box', transformOrigin: '245px 235px' }}>
        <g transform="rotate(-16 245 235)">
          <ellipse cx="245" cy="235" rx="170" ry="124" fill="none" stroke="url(#mp-ring)" strokeWidth="3" opacity="0.55" filter="url(#mp-soft)" />
          <ellipse cx="245" cy="235" rx="170" ry="124" fill="none" stroke="url(#mp-ring)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 12" opacity="0.9" />
        </g>
      </g>

      <path className="mp-twinkle" style={{ animationDelay: '0s' }} transform="translate(96 96) scale(1.1)" d={SPARK} fill="#d4349e" />
      <path className="mp-twinkle" style={{ animationDelay: '-0.8s', animationDuration: '2.6s' }} transform="translate(420 128) scale(0.9)" d={SPARK} fill="#9575e0" />
      <path className="mp-twinkle" style={{ animationDelay: '-1.6s', animationDuration: '3.6s' }} transform="translate(120 360) scale(0.8)" d={SPARK} fill="#e46bbf" />
      <path className="mp-twinkle" style={{ animationDelay: '-2.2s', animationDuration: '3s' }} transform="translate(300 66) scale(0.7)" d={SPARK} fill="#c98a2e" />
      <path className="mp-twinkle" style={{ animationDelay: '-1.1s', animationDuration: '3.4s' }} transform="translate(452 300) scale(0.85)" d={SPARK} fill="#6cae85" />

      <g className="mp-float" style={{ animationDelay: '0s' }}>
        <g transform="translate(158 152) rotate(-11)">
          <rect x="-70" y="-42" width="150" height="96" rx="18" fill="#4a0b38" opacity="0.22" transform="translate(8 10)" />
          <rect x="-75" y="-48" width="150" height="96" rx="18" fill="url(#mp-sql)" />
          <path d="M-75 -30 a18 18 0 0 1 18 -18 h114 a18 18 0 0 1 18 18 v4 h-150 z" fill="#ffffff" opacity="0.18" />
          <text x="0" y="8" textAnchor="middle" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="30" fontWeight="700" fill="#ffffff">{'</>'}</text>
          <text x="0" y="34" textAnchor="middle" fontFamily="'Inter Variable', system-ui, sans-serif" fontSize="13" fontWeight="800" letterSpacing="0.16em" fill="#ffffff" opacity="0.92">SQL</text>
        </g>
      </g>

      <g className="mp-float" style={{ animationDelay: '-3.1s', animationDuration: '7.2s' }}>
        <g transform="translate(332 292) rotate(9)">
          <rect x="-70" y="-42" width="150" height="96" rx="18" fill="#173a26" opacity="0.2" transform="translate(8 10)" />
          <rect x="-75" y="-48" width="150" height="96" rx="18" fill="url(#mp-mongo)" />
          <path d="M-75 -30 a18 18 0 0 1 18 -18 h114 a18 18 0 0 1 18 18 v4 h-150 z" fill="#ffffff" opacity="0.16" />
          <g transform="translate(-52 -30) scale(0.72)" fill="none" stroke="#eafff2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 3.5c-7 .5-11 4-12.5 8.5-1 3-.5 6 1 8" />
            <path d="M9 20c-1.5-2-2-5-1-8 1.5-4.5 5.5-7 12.5-8.5" />
            <path d="M4 21h7" />
          </g>
          <text x="12" y="12" textAnchor="middle" fontFamily="'JetBrains Mono Variable', ui-monospace, monospace" fontSize="26" fontWeight="700" fill="#ffffff">{'</>'}</text>
          <text x="0" y="38" textAnchor="middle" fontFamily="'Inter Variable', system-ui, sans-serif" fontSize="11.5" fontWeight="800" letterSpacing="0.14em" fill="#ffffff" opacity="0.92">MongoDB</text>
        </g>
      </g>

      <g transform="translate(414 372)">
        <ellipse cx="0" cy="34" rx="44" ry="9" fill="#2d0022" opacity="0.08" />
        <rect x="-32" y="-16" width="64" height="30" fill="#7a124f" />
        <ellipse cx="0" cy="14" rx="32" ry="11" fill="#6b0f50" />
        <ellipse cx="0" cy="-16" rx="32" ry="11" fill="#d4349e" />
        <rect x="-32" y="-44" width="64" height="30" fill="#8c1568" />
        <ellipse cx="0" cy="-14" rx="32" ry="11" fill="#7a124f" />
        <ellipse cx="0" cy="-44" rx="32" ry="11" fill="#e46bbf" />
        <rect x="-32" y="-72" width="64" height="30" fill="#b01f82" />
        <ellipse cx="0" cy="-42" rx="32" ry="11" fill="#8c1568" />
        <ellipse cx="0" cy="-72" rx="32" ry="11" fill="#f7d4ed" />
      </g>
    </svg>
  )
}

function SqlCardArt({ active = false, className = '' }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mp-sql-term" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38124f" />
          <stop offset="100%" stopColor="#1b0930" />
        </linearGradient>
        <filter id="mp-sql-blob" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <ellipse cx="70" cy="118" rx="98" ry="76" fill="#e9dffb" opacity="0.85" filter="url(#mp-sql-blob)" />
      <ellipse cx="250" cy="76" rx="88" ry="62" fill="#f0a8da" opacity="0.45" filter="url(#mp-sql-blob)" />
      <ellipse cx="232" cy="196" rx="94" ry="56" fill="#9575e0" opacity="0.28" filter="url(#mp-sql-blob)" />

      <g transform="translate(58 118)">
        <ellipse cx="0" cy="58" rx="46" ry="10" fill="#2d0022" opacity="0.1" />
        {[
          { y: 16, body: '#8c1568', top: '#f0a8da' },
          { y: 31, body: '#b01f82', top: '#e46bbf' },
          { y: 46, body: '#d4349e', top: '#fdf0f8' },
        ].map((d, i) => (
          <g key={i}>
            <path d={`M-34 ${d.y + 15} a34 12 0 0 0 68 0 V${d.y} h-68 Z`} fill={d.body} />
            <ellipse cx="0" cy={d.y} rx="34" ry="12" fill={d.top} />
          </g>
        ))}
      </g>

      <g transform="rotate(-6 196 128)">
        <rect x="104" y="28" width="186" height="118" rx="12" fill="#2d1042" />
        <rect x="112" y="36" width="170" height="100" rx="8" fill="url(#mp-sql-term)" />
        <rect x="112" y="36" width="170" height="26" rx="8" fill="#2a0e40" />
        <circle cx="126" cy="49" r="4" fill="#f0a8da" />
        <circle cx="138" cy="49" r="4" fill="#9575e0" />
        <circle cx="150" cy="49" r="4" fill="#6cae85" />
        <text x="164" y="53" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" fill="#cbb3dd">
          query.sql
        </text>
        <g className={active ? 'mp-type-line' : 'mp-type-line-pending'} style={{ animationDelay: '140ms' }}>
          <text x="122" y="78" fontSize="11" fontFamily="'JetBrains Mono Variable', monospace" fontWeight="700">
            <tspan fill="#f0a8da">SELECT</tspan>
            <tspan fill="#9fe8c0"> * FROM users</tspan>
          </text>
        </g>
        <g className={active ? 'mp-type-line' : 'mp-type-line-pending'} style={{ animationDelay: '320ms' }}>
          <text x="122" y="97" fontSize="11" fontFamily="'JetBrains Mono Variable', monospace" fontWeight="700">
            <tspan fill="#f0a8da">WHERE</tspan>
            <tspan fill="#9fe8c0"> id = 1;</tspan>
          </text>
        </g>
        {active && <rect className="mp-caret" x="126" y="83" width="6" height="11" rx="1" fill="#f0a8da" />}
        <path d="M96 164 l12 32 h200 l20 -32 Z" fill="#3a1554" />
        <rect x="102" y="150" width="220" height="14" rx="6" fill="#4d1c6e" />
      </g>
    </svg>
  )
}

function MongoCardArt({ className = '' }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id="mp-mongo-blob" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <ellipse cx="76" cy="116" rx="102" ry="78" fill="#c4e2d0" opacity="0.5" filter="url(#mp-mongo-blob)" />
      <ellipse cx="252" cy="90" rx="88" ry="64" fill="#e3f2e9" opacity="0.9" filter="url(#mp-mongo-blob)" />
      <ellipse cx="230" cy="196" rx="92" ry="54" fill="#6cae85" opacity="0.22" filter="url(#mp-mongo-blob)" />

      <g fill="none" stroke="#c4e2d0" strokeWidth="2" opacity="0.75">
        <path d="M262 56 c-10 -22 -28 -34 -50 -36" />
        <path d="M232 42 c20 -16 46 -8 30 26" />
        <path d="M204 72 c-12 12 -26 14 -40 6" />
      </g>

      <g transform="translate(150 132)">
        <ellipse cx="0" cy="58" rx="44" ry="10" fill="#173a24" opacity="0.1" />
        {[
          { y: 10, body: '#3d7f55', top: '#c4e2d0' },
          { y: 26, body: '#2f7a4f', top: '#8fcaa4' },
          { y: 42, body: '#4c9a68', top: '#e3f2e9' },
        ].map((d, i) => (
          <g key={i}>
            <path d={`M-34 ${d.y + 16} a34 12 0 0 0 68 0 V${d.y} h-68 Z`} fill={d.body} />
            <ellipse cx="0" cy={d.y} rx="34" ry="12" fill={d.top} />
          </g>
        ))}
      </g>

      <g>
        <path d="M150 146 C148 112 142 92 122 70" stroke="#2f7a4f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M130 82 C139 91 145 105 145 118 C129 118 120 104 130 82 Z" fill="#6cae85" />
        <path d="M134 108 C151 108 166 120 170 136 C150 139 134 128 134 108 Z" fill="#4c9a68" />
        <path d="M118 62 C114 54 116 44 124 38 C130 48 126 58 118 62 Z" fill="#8fcaa4" />
      </g>
    </svg>
  )
}

function FeatureRow({ icon: Icon, iconClass = '', label }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${iconClass}`}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="text-sm font-medium text-body">{label}</span>
    </div>
  )
}

function SqlPracticeCard({ onPick, active = false }) {
  const features = [
    { icon: BookIcon, label: 'Multiple Chapters' },
    { icon: BoltIcon, label: 'Real-time Execution' },
    { icon: ChartIcon, label: 'Track Progress' },
  ]
  return (
    <button
      type="button"
      onClick={() => onPick('sql')}
      className="group relative isolate flex h-full w-full flex-col overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-50 via-brand-100/60 to-brand-200/50 p-7 text-left shadow-sm outline-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-600/20 active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:p-8"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-200 opacity-90" />
      <div className="flex h-full w-full flex-col gap-8 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
              <CodeIcon size={28} strokeWidth={2} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              <StarIcon className="text-amber-200" />
              Popular
            </span>
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-[26px]">SQL Practice</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted sm:text-[15px]">
            Write and run real SQL queries with instant feedback.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {features.map((f) => (
              <FeatureRow key={f.label} icon={f.icon} iconClass="bg-white/80 text-brand-600" label={f.label} />
            ))}
          </div>

          <span className="mt-8 inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm shadow-brand-600/25 transition-all duration-200 group-hover:bg-brand-700 group-hover:gap-3">
            Start Practicing
            <ArrowRightIcon size={17} strokeWidth={2.4} />
          </span>
        </div>

        <div className="pointer-events-none mx-auto w-full max-w-[240px] shrink-0 lg:max-w-none lg:w-[250px]">
          <div className="mp-float" style={{ animationDelay: '0s' }}>
            <SqlCardArt active={active} className="h-auto w-full" />
          </div>
        </div>
      </div>
    </button>
  )
}

function MongoPracticeCard() {
  const features = [
    { icon: DocumentIcon, label: 'Real Documents' },
    { icon: PipelineIcon, label: 'Aggregation Pipelines' },
    { icon: ChartIcon, label: 'Track Progress' },
  ]
  return (
    <div className="group relative isolate flex h-full w-full flex-col overflow-hidden rounded-3xl border border-leaf-200/80 bg-gradient-to-br from-leaf-50 via-leaf-100/60 to-leaf-200/50 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-leaf-500/20 sm:p-8">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-leaf-500 via-leaf-400 to-leaf-200 opacity-90" />
      <div className="flex h-full w-full flex-col gap-8 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-leaf-500 to-leaf-700 text-white shadow-md shadow-leaf-600/30">
              <LeafIcon size={28} strokeWidth={2} />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              <SparkleDotIcon className="text-leaf-100" />
              Soon
            </span>
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-[26px]">MongoDB Practice</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted sm:text-[15px]">
            Work with MongoDB queries and real-time challenges.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {features.map((f) => (
              <FeatureRow key={f.label} icon={f.icon} iconClass="bg-white/80 text-leaf-600" label={f.label} />
            ))}
          </div>

          <span className="shimmer mt-8 inline-flex cursor-not-allowed items-center justify-center gap-2 self-start rounded-xl bg-line/80 px-6 py-3 font-semibold text-muted">
            Coming soon
          </span>
        </div>

        <div className="pointer-events-none mx-auto w-full max-w-[240px] shrink-0 lg:max-w-none lg:w-[250px]">
          <div className="mp-float" style={{ animationDelay: '-3.1s', animationDuration: '7.2s' }}>
            <MongoCardArt className="h-auto w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, className }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  )
}

function PracticeHUD({ snapshot }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-100 via-plum-100 to-brand-100 opacity-70" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-line px-2 py-1 font-mono text-xs text-muted">
            Q <span className="font-bold text-brand-700">{snapshot.index + 1}</span>/{snapshot.total}
          </span>
          {snapshot.pass > 0 && (
            <span className="rounded-md bg-plum-50 px-2 py-1 font-mono text-xs font-bold text-plum-700">
              pass {snapshot.pass + 1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            {snapshot.correct}
            <span className="mx-1 text-body">/</span>
            {snapshot.graded} correct
          </span>
          <span className="font-mono text-xs text-muted">{snapshot.wrong} wrong</span>
          <span className="font-mono text-xs text-muted">{snapshot.answered} practiced</span>
          <span className="font-mono text-sm text-muted">
            Score{' '}
            <span className="text-lg font-bold text-amber-700 drop-shadow-[0_0_10px_rgba(#a5680f,0.22)]">
              {snapshot.score}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

function PracticeButton({ option, label, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${
        selected
          ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
          : 'border-line bg-line/60 text-muted hover:border-line hover:bg-line'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
          selected ? 'bg-brand-600 text-white' : 'bg-line text-muted group-hover:bg-line-soft'
        }`}
      >
        {label}
      </span>
      <code className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{option}</code>
    </button>
  )
}

function QuestionView({ question, selected, onSelect, isFeedback }) {
  const diffColor =
    question.difficulty === 'easy'
      ? 'bg-line text-muted'
      : question.difficulty === 'medium'
        ? 'bg-brand-50 text-brand-700'
        : 'bg-danger-50 text-danger-700'
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  return (
    <article className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Chip className={TYPE_COLORS[question.type] ?? 'bg-brand-50 text-brand-700'}>
          {TYPE_LABELS[question.type] ?? 'Multiple choice'}
        </Chip>
        <Chip className={diffColor}>{question.difficulty}</Chip>
        <span className="text-muted">{question.subtopic}</span>
        {chapter && (
          <Link
            to={`/academy/sql/${chapter.slug}`}
            className="rounded-full border border-line px-2.5 py-0.5 text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            📖 Ch {chapter.number} · {chapter.title}
          </Link>
        )}
      </div>

      <h2 className="mt-3 whitespace-pre-wrap font-mono text-lg font-medium leading-relaxed text-body">
        {question.question}
      </h2>

      {question.type === 'bug' && question.buggyQuery && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-muted">Buggy query — find the bug:</div>
          <pre className="overflow-x-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-amber-700">
            {question.buggyQuery}
          </pre>
        </div>
      )}

      {(question.type === 'write' || question.type === 'bug') && <SchemaPanel schema={question.schema} />}

      {question.type === 'mc' && question.schema && <SchemaPanel schema={question.schema} />}

      {question.type === 'mc' && (
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <PracticeButton
              key={i}
              label={OPTION_LABELS[i]}
              option={opt}
              selected={selected === opt}
              onSelect={() => onSelect(opt)}
              disabled={isFeedback}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function QuerySection({ question, onSubmit, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      {!disabled && <HintReveal hint={question.hint} />}
      <SqlEditor key={question.id} question={question} onSubmit={onSubmit} disabled={disabled} />
    </div>
  )
}

function Feedback({ answer, onNext }) {
  if (!answer) return null
  const correct = answer.correct
  const isQuery = answer.type === 'write' || answer.type === 'bug'
  return (
    <div className="rounded-2xl border p-6">
      <div
        className={`mb-4 flex items-center gap-3 rounded-lg px-4 py-3 ${
          correct ? 'border border-leaf-200 bg-leaf-50' : 'border border-danger-200 bg-danger-50'
        }`}
      >
        <span className={`text-xl font-black ${correct ? 'text-leaf-700' : 'text-danger-700'}`}>
          {answer.skipped ? 'Skipped' : correct ? 'Correct!' : 'Incorrect'}
        </span>
        {answer.reason && <span className="text-sm text-muted">{answer.reason}</span>}
      </div>

      {isQuery && answer.answer != null && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-muted">Your query:</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] text-leaf-700">
            {answer.answer}
          </pre>
        </div>
      )}

      {isQuery && answer.actual && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-muted">Actual result (rows returned: {answer.actual.rows?.length ?? 0}):</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] text-muted">
            {JSON.stringify(answer.actual, null, 2)}
          </pre>
        </div>
      )}

      {isQuery && !answer.skipped && answer.question.fixedQuery && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-leaf-700">Fixed query:</p>
          <pre className="overflow-x-auto rounded-lg border border-leaf-200 bg-leaf-50 px-3 py-2 font-mono text-[13px] text-leaf-700">
            {answer.question.fixedQuery}
          </pre>
        </div>
      )}

      {answer.question.explanation && (
        <div className="mt-3 rounded-lg border border-line bg-line/50 px-4 py-3">
          <div className="text-sm font-semibold text-muted">Why</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{answer.question.explanation}</p>
        </div>
      )}
      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Next question
        </button>
      </div>
    </div>
  )
}

function ChoiceGroup({ label, options, value, onSelect }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([key, optionLabel]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`relative rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              value === key
                ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
                : 'border-line bg-line/60 text-muted hover:border-line hover:bg-line'
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

function GameSelect({ onPick }) {
  const [cardsRef, cardsInView] = useInView()
  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span
            className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-700"
            style={stagger(0, 100)}
          >
            <StarIcon className="text-brand-500" />
            Practice · Improve · Grow
          </span>

          <h1
            className="enter-rise mt-5 font-sans text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl"
            style={stagger(1, 100)}
          >
            More <span className="text-brand-600">Practice</span>
          </h1>

          <p className="enter-rise mt-4 max-w-xl text-base leading-relaxed text-muted" style={stagger(2, 100)}>
            Sharpen your skills with hands-on practice. Explore SQL and MongoDB exercises, work on
            real-world problems, and build confidence.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-4">
            <FeatureChip icon={BoltIcon} label="Real Practice" style={stagger(3, 100)} />
            <FeatureChip icon={TargetIcon} label="Build Confidence" style={stagger(4, 100)} />
            <FeatureChip icon={ChartIcon} label="Track Progress" style={stagger(5, 100)} />
          </div>
        </div>

        <div className="relative mx-auto mt-4 w-full max-w-[360px] sm:max-w-[440px] lg:mt-0 lg:max-w-[520px]">
          <style>{HERO_ANIM}</style>
          <div className="mp-scene-in">
            <PracticeHeroArt />
          </div>
          <span className="pointer-events-none absolute right-0 top-[22%] rotate-[-8deg] font-hand text-2xl font-bold leading-[1.05] text-brand-600 sm:text-3xl">
            Practice Today
            <br />
            Build Tomorrow
          </span>
        </div>
      </section>

      <div ref={cardsRef} className="mt-12 grid gap-5 sm:grid-cols-2">
        <div className={`reveal h-full ${cardsInView ? 'is-in' : ''}`} style={{ transitionDelay: '0ms' }}>
          <SqlPracticeCard onPick={onPick} active={cardsInView} />
        </div>
        <div className={`reveal h-full ${cardsInView ? 'is-in' : ''}`} style={{ transitionDelay: '150ms' }}>
          <MongoPracticeCard />
        </div>
      </div>
    </div>
  )
}

function MongoComingSoon({ onBack }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <div className="font-mono text-2xl font-bold text-ink">MongoDB Practice</div>
        <p className="mt-4 text-muted">
          MongoDB practice is coming soon. The same engine already powers SQL practice.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-lg border border-line px-5 py-2 text-sm font-semibold text-body transition-colors hover:bg-line"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

function Picker({ topic, difficulty, types, onTopic, onDifficulty, onTypes, bank, onStart, onBack }) {
  const available = countPracticeQuestions(bank, topic, difficulty, types)
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">More Practice · SQL</div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-medium text-muted transition-colors hover:text-body"
          >
            ← SQL / MongoDB
          </button>
        )}
        <h1 className="text-lg font-bold text-ink">Pick your practice</h1>
        <p className="mt-1 text-sm text-muted">
          Choose the question type, topic, and level you want to drill.
        </p>

        <ChoiceGroup label="Question type" options={PRACTICE_TYPES} value={types} onSelect={onTypes} />
        <ChoiceGroup label="Topic" options={{ all: 'All topics', ...PRACTICE_TOPICS }} value={topic} onSelect={onTopic} />
        <ChoiceGroup label="Level" options={PRACTICE_DIFFICULTIES} value={difficulty} onSelect={onDifficulty} />

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-muted">{available} questions available</span>
          <button
            type="button"
            onClick={onStart}
            disabled={available === 0}
            className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start practicing
          </button>
        </div>
      </div>
    </div>
  )
}

function Results({ snapshot, onReplay, onChangeSettings }) {
  const percent = snapshot.graded > 0 ? Math.round((snapshot.correct / snapshot.graded) * 100) : 0
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">Practice session</div>
        <div className="mt-2 text-5xl font-black text-ink">{percent}%</div>
        <div className="mt-2 text-sm text-muted">
          You practiced{' '}
          <span className="font-bold text-ink">
            {snapshot.answered} {snapshot.answered === 1 ? 'question' : 'questions'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 font-mono text-sm text-muted">
          <span>
            <span className="font-bold text-leaf-700">{snapshot.correct}</span> correct
          </span>
          <span className="text-body">·</span>
          <span>
            <span className="font-bold text-danger-700">{snapshot.wrong}</span> wrong
          </span>
          {snapshot.skipped > 0 && (
            <>
              <span className="text-body">·</span>
              <span>
                <span className="font-bold text-body">{snapshot.skipped}</span> skipped
              </span>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 font-mono text-sm text-muted">
          <span>
            Score <span className="text-lg font-bold text-brand-700">{snapshot.score}</span>
          </span>
          <span className="font-sans text-xs">{snapshot.elapsedSeconds}s</span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Practice again
          </button>
          <button
            type="button"
            onClick={onChangeSettings}
            className="rounded-lg border border-line px-5 py-2 font-semibold text-body transition-colors hover:bg-line"
          >
            Change settings
          </button>
          <Link
            to="/"
            className="rounded-lg border border-line px-5 py-2 font-semibold text-body transition-colors hover:bg-line"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function Practice() {
  const [params] = useSearchParams()
  const topicParam = params.get('topic')
  const prefilled =
    topicParam && Object.prototype.hasOwnProperty.call(PRACTICE_TOPICS, topicParam) ? topicParam : null

  const [bank, setBank] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [game, setGame] = useState(() => (prefilled ? 'sql' : null))
  const [topic, setTopic] = useState(prefilled ?? 'all')
  const [difficulty, setDifficulty] = useState('all')
  const [types, setTypes] = useState('all')
  const [engine, setEngine] = useState(null)
  const [selected, setSelected] = useState(null)
  const snapshot = useQuizEngine(engine)

  useEffect(() => {
    let active = true
    loadPracticeQuestions()
      .then((questions) => {
        if (active) setBank(questions)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => engine?.destroy()
  }, [engine])

  const handleStart = (startOptions = { topic, difficulty, types }) => {
    const nextEngine = new PracticeEngine(bank, { checkQuery: buildCheckQuery(QueryRunner) })
    setEngine((prev) => {
      prev?.destroy()
      return nextEngine
    })
    setSelected(null)
    const count = nextEngine.start(startOptions)
    if (count === 0) {
      setEngine((prev) => {
        prev?.destroy()
        return null
      })
    }
  }

  const handleChangeSettings = () => {
    setEngine((prev) => {
      prev?.destroy()
      return null
    })
    setSelected(null)
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-700">
          Couldn't load practice questions. Please try again later.
        </div>
      </div>
    )
  }

  if (!bank) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
          Loading practice questions…
        </div>
      </div>
    )
  }

  if (!engine) {
    if (!game) return <GameSelect onPick={setGame} />
    if (game === 'mongo') return <MongoComingSoon onBack={() => setGame(null)} />
    return (
      <Picker
        topic={topic}
        difficulty={difficulty}
        types={types}
        onTopic={setTopic}
        onDifficulty={setDifficulty}
        onTypes={setTypes}
        bank={bank}
        onStart={() => handleStart()}
        onBack={() => setGame(null)}
      />
    )
  }

  if (snapshot?.status === PRACTICE_STATUS.FINISHED) {
    return <Results snapshot={snapshot} onReplay={() => handleStart({ topic, difficulty, types })} onChangeSettings={handleChangeSettings} />
  }

  if (!snapshot || snapshot.status === PRACTICE_STATUS.READY) return null

  const question = snapshot.current
  const isFeedback = snapshot.status === PRACTICE_STATUS.FEEDBACK
  const lastAnswer = snapshot.answers[snapshot.answers.length - 1]
  const isMc = question.type === 'mc'
  const summary = [
    PRACTICE_TYPES[snapshot.types] ?? snapshot.types,
    snapshot.topic !== 'all' ? PRACTICE_TOPICS[snapshot.topic] : 'All topics',
    snapshot.difficulty !== 'all' ? PRACTICE_DIFFICULTIES[snapshot.difficulty] : 'All levels',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">{summary}</span>
        <button
          type="button"
          onClick={() => engine.end()}
          className="rounded-lg border border-danger-200 px-4 py-1.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50"
        >
          End practice
        </button>
      </div>

      <PracticeHUD snapshot={snapshot} />

      <QuestionView
        key={question.id + String(isFeedback)}
        question={question}
        selected={selected}
        onSelect={(opt) => !isFeedback && setSelected(opt)}
        isFeedback={isFeedback}
      />

      {!isMc && !isFeedback && (
        <QuerySection
          question={question}
          onSubmit={(sql) => engine.submitQuery(sql)}
          disabled={snapshot.runningAnswer}
        />
      )}

      {!isFeedback && (
        isMc ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">
              {selected === null ? 'Select an answer above' : 'Ready to submit'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => engine.skip()}
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-line"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={selected === null}
                onClick={() => engine.submit(selected)}
                className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Run your query above, then check it</span>
            <button
              type="button"
              onClick={() => engine.skip()}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-line"
            >
              Skip
            </button>
          </div>
        )
      )}

      {isFeedback && (
        <Feedback
          answer={lastAnswer}
          onNext={() => {
            setSelected(null)
            engine.next()
          }}
        />
      )}
    </div>
  )
}

export default Practice