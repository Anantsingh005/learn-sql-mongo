import { useEffect, useRef, useState } from 'react'
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
import { useReducedMotion } from '../hooks/useReducedMotion.js'
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

function ChoiceIcon(props) {
  return (
    <In {...props}>
      <path d="M4 7h9" />
      <path d="M4 12h6" />
      <path d="M4 17h9" />
      <path d="m15 15 2.2 2.2L21.5 12" />
    </In>
  )
}

function TableIcon(props) {
  return (
    <In {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M3 15h18" />
      <path d="M9.5 9.5V20" />
    </In>
  )
}

function GaugeIcon(props) {
  return (
    <In {...props}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="m12 14 4-4" />
    </In>
  )
}

function CheckIcon(props) {
  return (
    <In {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
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

function CrownIcon({ size = 18, strokeWidth = 2, className = '' }) {
  return (
    <In size={size} strokeWidth={strokeWidth} className={className}>
      <path d="M3 7.5 6 16h12l3-8.5-4.6 3L12 4.5 7.6 10.5 3 7.5Z" />
      <path d="M6.5 19h11" />
    </In>
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
.mp-float { animation: mp-float 6s ease-in-out infinite; }
.mp-spin { animation: mp-spin 46s linear infinite; }
.mp-twinkle { animation: mp-twinkle 3.2s ease-in-out infinite; }
.mp-scene-in { animation: mp-scene-in 700ms var(--ease-out-soft) both; }
.mp-type-line { animation: mp-type-in 360ms var(--ease-out-soft) both; }
.mp-type-line-pending { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .mp-float, .mp-spin, .mp-twinkle { animation: none; }
  .mp-scene-in { animation: none; opacity: 1; transform: none; }
  .mp-type-line, .mp-type-line-pending { animation: none; opacity: 1; transform: none; }
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

// Accent surfaces for the filter option cards. Each accent pairs the icon
// tile with the selected-state border/fill, so a filter group reads as one
// colour family. Brand is the fallback for any unknown key.
const TYPE_URL = { mc: 'mcq', write: 'write', bug: 'bug' }
const TYPE_FROM_URL = { mcq: 'mc', write: 'write', bug: 'bug' }
const LEVEL_VALUES = ['easy', 'medium', 'hard']

// Read `?type= / ?topic= / ?level=` into the internal filter keys, ignoring any
// value that is not recognised and falling back to "all".
function parseFilterParams(params) {
  const typeParam = params.get('type')
  const topic = Object.prototype.hasOwnProperty.call(PRACTICE_TOPICS, params.get('topic') ?? '')
    ? params.get('topic')
    : 'all'
  return {
    type: TYPE_FROM_URL[typeParam] ?? 'all',
    topic,
    level: LEVEL_VALUES.includes(params.get('level')) ? params.get('level') : 'all',
  }
}

// Short eased tween between successive counts so the total rolls rather than
// jumps. Skipped entirely (instant) when motion is reduced or still loading.
function useRollingCount(target, loading, reduced) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const instant = loading || reduced

  if (instant && value !== target) setValue(target)

  useEffect(() => {
    if (instant) {
      fromRef.current = target
      return undefined
    }
    const from = fromRef.current
    if (from === target) return undefined

    let raf = 0
    const duration = 480
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    fromRef.current = target
    return () => cancelAnimationFrame(raf)
  }, [target, instant])

  return instant ? target : value
}

function OptionChip({ label, selected, disabled, onSelect, tabIndex, buttonRef, onKeyDown }) {
  const [pop, setPop] = useState(null)
  const [wasSelected, setWasSelected] = useState(selected)
  if (wasSelected !== selected) {
    setWasSelected(selected)
    setPop(selected ? 'in' : 'out')
  }

  const base =
    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-[transform,color,background-color,border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
  const state = selected
    ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
    : disabled
      ? 'border-line bg-white text-body'
      : 'border-line bg-white text-body hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-sm'
  const popClass = pop === 'in' ? 'picker-chip-pop' : pop === 'out' ? 'picker-chip-pop-out' : ''

  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={onKeyDown}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPop(null)
      }}
      title={disabled ? 'No questions for this combination yet' : undefined}
      className={`${base} ${state} ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${popClass}`}
    >
      {selected && <CheckIcon size={14} strokeWidth={3} className="picker-check" />}
      {label}
      {disabled && <span className="sr-only"> — no questions available</span>}
    </button>
  )
}

function FilterRow({ id, title, hint, icon: Icon, options, value, onSelect, counts, loading, inView, rowIndex }) {
  const chipRefs = useRef([])
  const titleId = `practice-filter-${id}-label`

  const isDisabled = (key) => !loading && (counts[key] ?? 0) === 0
  const enabledIndexes = options.reduce((acc, [key], i) => (isDisabled(key) ? acc : [...acc, i]), [])
  const selectedIndex = options.findIndex(([key]) => key === value)
  const rovingIndex = selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? 0)

  const focusChip = (index) => chipRefs.current[index]?.focus()

  const moveFocus = (from, dir) => {
    const count = options.length
    for (let step = 1; step <= count; step += 1) {
      const next = (from + dir * step + count) % count
      if (enabledIndexes.includes(next)) {
        focusChip(next)
        return
      }
    }
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index, 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index, -1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      if (enabledIndexes.length) focusChip(enabledIndexes[0])
    } else if (event.key === 'End') {
      event.preventDefault()
      if (enabledIndexes.length) focusChip(enabledIndexes[enabledIndexes.length - 1])
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 py-5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:gap-5 ${inView ? 'picker-row' : ''}`}
      style={inView ? { animationDelay: `${rowIndex * 100}ms` } : undefined}
    >
      <div className="group/row flex items-center gap-3 min-[700px]:shrink-0">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover/row:-rotate-6">
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="min-[700px]:w-40">
          <div id={titleId} className="text-sm font-bold tracking-tight text-ink">
            {title}
          </div>
          <p className="mt-0.5 text-xs text-muted">{hint}</p>
        </div>
      </div>
      <div role="radiogroup" aria-labelledby={titleId} className="flex flex-wrap gap-2">
        {options.map(([key, label], index) => (
          <span
            key={key}
            className={`inline-flex ${inView ? 'picker-chip' : ''}`}
            style={inView ? { animationDelay: `${rowIndex * 100 + 90 + index * 55}ms` } : undefined}
          >
            <OptionChip
              label={label}
              selected={value === key}
              disabled={isDisabled(key)}
              tabIndex={index === rovingIndex ? 0 : -1}
              onSelect={() => onSelect(key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              buttonRef={(el) => {
                chipRefs.current[index] = el
              }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

// Hero animation for the practice picker. Only transform and opacity are
// animated in the entrance; loops and the one-shot reveals are switched off
// under prefers-reduced-motion.
const PICKER_HERO_ANIM = `
@keyframes ph-art-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes ph-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes ph-sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes ph-curtain { from { transform: translateX(-210px); } to { transform: translateX(0); } }
@keyframes ph-draw { from { stroke-dashoffset: 240; } to { stroke-dashoffset: 0; } }
.ph-art-in { animation: ph-art-in 700ms var(--ease-out-soft) 120ms both; }
.ph-float { animation: ph-float 6.5s ease-in-out infinite; }
.ph-sway { animation: ph-sway 5.5s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
.ph-curtain { animation: ph-curtain 620ms steps(18) both; }
.ph-underline { stroke-dasharray: 240; animation: ph-draw 700ms var(--ease-out-soft) 700ms both; }
@media (prefers-reduced-motion: reduce) {
  .ph-art-in { animation: none; }
  .ph-float { animation: none; }
  .ph-sway { animation: none; }
  .ph-curtain { animation: none; transform: none; }
  .ph-underline { animation: none; stroke-dashoffset: 0; }
}
`

// Handwritten tagline floating at the top-right of the hero: a crown doodle,
// the phrase in the script face, and an underline that draws itself once.
function PracticeTagline() {
  return (
    <div className="pointer-events-none absolute right-1 top-1 z-10 hidden rotate-[-7deg] text-right min-[700px]:block">
      <CrownIcon size={26} strokeWidth={2} className="ml-auto text-amber-400" />
      <div className="font-hand text-[26px] font-bold leading-none text-brand-600">
        Practice Learn Grow
      </div>
      <svg viewBox="0 0 200 12" className="ml-auto mt-1 h-3 w-[190px]" fill="none" aria-hidden="true">
        <path
          className="ph-underline"
          d="M3 8C40 2 78 11 116 5S168 1 197 7"
          stroke="#d4349e"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

// Inline hero art for the practice picker: a purple database stack and a potted
// plant beside a dark window of SQL with a magenta "SQL" tile and a green
// "MongoDB · Soon" teaser tile.
function PickerHeroArt() {
  return (
    <svg
      viewBox="0 0 440 380"
      className="h-auto w-full"
      fill="none"
      role="img"
      aria-label="A purple database stack and a potted plant beside a window of SQL code, with SQL and MongoDB tiles"
    >
      <defs>
        <linearGradient id="phDb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9575e0" />
          <stop offset="1" stopColor="#6b46c9" />
        </linearGradient>
        <linearGradient id="phMag" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4349e" />
          <stop offset="1" stopColor="#8c1568" />
        </linearGradient>
        <clipPath id="phWin">
          <rect x="190" y="54" width="220" height="150" rx="16" />
        </clipPath>
      </defs>

      <circle cx="214" cy="196" r="150" fill="#fdf0f8" />
      <circle cx="392" cy="58" r="26" fill="#f6f2ff" />
      <path d="M46 40v16M38 48h16" stroke="#f0a8da" strokeWidth="3" strokeLinecap="round" />
      <path d="M404 300v14M397 307h14" stroke="#d5c2f5" strokeWidth="3" strokeLinecap="round" />

      {/* Potted plant — leaves sway slowly; sits behind the database stack. */}
      <g transform="translate(60 268)">
        <path d="M-24 -6h48l-7 30h-34z" fill="#573499" />
        <rect x="-26" y="-12" width="52" height="9" rx="4" fill="#6b46c9" />
        <g className="ph-sway">
          <path d="M0 -12C-1 -26-8 -34-18 -40" stroke="#2f6b45" strokeWidth="2.5" fill="none" />
          <ellipse cx="-22" cy="-44" rx="9" ry="15" transform="rotate(-32 -22 -44)" fill="#4c9a68" />
          <path d="M0 -12C1 -30 2 -40 6 -52" stroke="#2f6b45" strokeWidth="2.5" fill="none" />
          <ellipse cx="7" cy="-56" rx="9" ry="16" transform="rotate(6 7 -56)" fill="#5aa978" />
          <path d="M0 -12C4 -24 14 -30 24 -34" stroke="#2f6b45" strokeWidth="2.5" fill="none" />
          <ellipse cx="27" cy="-37" rx="9" ry="14" transform="rotate(34 27 -37)" fill="#4c9a68" />
        </g>
      </g>

      {/* Database stack — floats slowly. */}
      <g transform="translate(126 132)">
        <g className="ph-float">
          <path d="M-58 20V64a58 18 0 0 0 116 0V20" fill="url(#phDb)" />
          <ellipse cx="0" cy="20" rx="58" ry="18" fill="#b79cf0" />
          <path d="M-58 34a58 18 0 0 0 116 0" stroke="#7d5fd0" strokeWidth="2" />
          <path d="M-58 50a58 18 0 0 0 116 0" stroke="#7d5fd0" strokeWidth="2" />
        </g>
      </g>

      {/* Dark code window — the query types out line by line. */}
      <g clipPath="url(#phWin)">
        <rect x="190" y="54" width="220" height="150" fill="#2c1c3f" />
        <rect x="190" y="54" width="220" height="30" fill="#3a2755" />
        <circle cx="208" cy="69" r="4" fill="#f4a8a8" />
        <circle cx="224" cy="69" r="4" fill="#f8d9a4" />
        <circle cx="240" cy="69" r="4" fill="#a9e0c6" />
        <text x="396" y="73" textAnchor="end" fontFamily="'JetBrains Mono Variable', monospace" fontSize="9" fontWeight="700" fill="#b9a7e0">
          query.sql
        </text>

        <g fontFamily="'JetBrains Mono Variable', monospace" fontSize="11">
          <text x="204" y="106">
            <tspan fill="#ff7ac2" fontWeight="700">SELECT</tspan>
            <tspan fill="#c6b6f7"> * </tspan>
            <tspan fill="#ff7ac2" fontWeight="700">FROM</tspan>
            <tspan fill="#c6b6f7"> employees</tspan>
          </text>
          <text x="204" y="130">
            <tspan fill="#ff7ac2" fontWeight="700">WHERE</tspan>
            <tspan fill="#c6b6f7"> dept = </tspan>
            <tspan fill="#7fd6a6">'Sales'</tspan>
          </text>
          <text x="204" y="154">
            <tspan fill="#ff7ac2" fontWeight="700">ORDER BY</tspan>
            <tspan fill="#c6b6f7"> salary </tspan>
            <tspan fill="#ff7ac2" fontWeight="700">DESC</tspan>
            <tspan fill="#c6b6f7">;</tspan>
          </text>
        </g>

        {/* Curtains retract to type each line once. At rest (no CSS applied)
            they sit off the right edge, so the code stays visible either way. */}
        <rect className="ph-curtain" x="414" y="96" width="210" height="16" fill="#2c1c3f" />
        <rect className="ph-curtain" x="414" y="120" width="210" height="16" fill="#2c1c3f" style={{ animationDelay: '500ms' }} />
        <rect className="ph-curtain" x="414" y="144" width="210" height="16" fill="#2c1c3f" style={{ animationDelay: '1000ms' }} />
      </g>

      {/* Magenta SQL tile */}
      <g transform="translate(322 250)">
        <rect x="0" y="0" width="78" height="78" rx="20" fill="url(#phMag)" />
        <text x="39" y="40" textAnchor="middle" fontFamily="'JetBrains Mono Variable', monospace" fontSize="22" fontWeight="700" fill="#ffffff">
          &lt;/&gt;
        </text>
        <text x="39" y="60" textAnchor="middle" fontFamily="'JetBrains Mono Variable', monospace" fontSize="12" fontWeight="700" fill="#ffd6ef">
          SQL
        </text>
      </g>

      {/* MongoDB teaser tile */}
      <g transform="translate(168 258)">
        <rect x="0" y="0" width="140" height="58" rx="16" fill="#ffffff" stroke="#a9e0c6" strokeWidth="2" />
        <circle cx="30" cy="29" r="13" fill="#f3faf5" stroke="#7fc9a3" strokeWidth="2" />
        <path d="M30 18c5 6 5 13 0 22-5-9-5-16 0-22Z" fill="#4c9a68" />
        <text x="54" y="34" fontFamily="'JetBrains Mono Variable', monospace" fontSize="13" fontWeight="700" fill="#2f6b45">
          MongoDB
        </text>
        <rect x="98" y="36" width="34" height="16" rx="8" fill="#fff8ec" stroke="#f0c27a" />
        <text x="115" y="48" textAnchor="middle" fontFamily="'JetBrains Mono Variable', monospace" fontSize="9" fontWeight="700" fill="#b5761f">
          Soon
        </text>
      </g>
    </svg>
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

function Picker({ topic, difficulty, types, onTopic, onDifficulty, onTypes, bank, onStart, onBack, loading, error, onRetry }) {
  const [groupsRef, groupsInView] = useInView()
  const footerRef = useRef(null)
  const [pinned, setPinned] = useState(false)
  const reduced = useReducedMotion()
  const available = countPracticeQuestions(bank, topic, difficulty, types)
  const shown = useRollingCount(available, loading, reduced)
  const ctaEnabled = !loading && available > 0
  const [shake, setShake] = useState(false)
  const prevAvailable = useRef(available)

  // Shake the total once the moment a combination drops to zero, to draw the
  // eye to the now-disabled Start button. Never under reduced motion.
  useEffect(() => {
    if (!reduced && prevAvailable.current > 0 && available === 0) setShake(true)
    prevAvailable.current = available
  }, [available, reduced])

  // Keep the mobile footer pinned to the viewport bottom only once the card has
  // scrolled far enough up; otherwise a sticky last child clamps onto the card
  // header as the card enters the viewport.
  useEffect(() => {
    const card = groupsRef.current
    const footer = footerRef.current
    if (!card || !footer) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      setPinned(card.getBoundingClientRect().top < window.innerHeight - footer.offsetHeight)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [groupsRef, loading, error])

  const typeOptions = Object.entries(PRACTICE_TYPES)
  const topicOptions = [['all', 'All topics'], ...Object.entries(PRACTICE_TOPICS)]
  const levelOptions = Object.entries(PRACTICE_DIFFICULTIES)

  // Every count is derived from the real bank: each option previews how many
  // questions it would leave under the other two current filters.
  const countByType = Object.fromEntries(
    typeOptions.map(([key]) => [key, countPracticeQuestions(bank, topic, difficulty, key)]),
  )
  const countByTopic = Object.fromEntries(
    topicOptions.map(([key]) => [key, countPracticeQuestions(bank, key, difficulty, types)]),
  )
  const countByLevel = Object.fromEntries(
    levelOptions.map(([key]) => [key, countPracticeQuestions(bank, topic, key, types)]),
  )

  const groups = [
    {
      key: 'type',
      title: 'Question type',
      hint: 'What kind of questions?',
      icon: ChoiceIcon,
      options: typeOptions,
      value: types,
      onSelect: onTypes,
      counts: countByType,
    },
    {
      key: 'topic',
      title: 'Topic',
      hint: 'Choose a specific topic.',
      icon: TableIcon,
      options: topicOptions,
      value: topic,
      onSelect: onTopic,
      counts: countByTopic,
    },
    {
      key: 'level',
      title: 'Level',
      hint: 'Select the difficulty level.',
      icon: GaugeIcon,
      options: levelOptions,
      value: difficulty,
      onSelect: onDifficulty,
      counts: countByLevel,
    },
  ]

  return (
    <div className="relative isolate">
      <style>{PICKER_HERO_ANIM}</style>

      {/* Soft pink blobs drifting slowly behind the hero. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl blob-drift" />
        <div className="absolute right-0 top-6 h-80 w-80 rounded-full bg-plum-100/70 blur-3xl blob-drift-b" />
        <div className="absolute bottom-[-5rem] left-1/3 h-64 w-64 rounded-full bg-brand-50 blur-3xl blob-drift" />
      </div>

      <div className="grid gap-8 min-[1100px]:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] min-[1100px]:grid-rows-[auto_1fr]">
        {/* Hero text — left column, first row. */}
        <div className="min-[1100px]:col-start-1 min-[1100px]:row-start-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="enter-rise mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-200 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              ← Back to practice modes
            </button>
          )}

          <p
            className="enter-rise font-mono text-[11px] font-bold uppercase tracking-[0.42em] text-brand-600"
            style={stagger(0, 100, 80)}
          >
            More practice · SQL
          </p>

          <h1
            className="enter-rise mt-3 text-3xl font-black leading-[1.08] tracking-[-0.02em] text-ink sm:text-4xl"
            style={stagger(1, 100, 80)}
          >
            Choose Your <span className="text-gradient">Practice</span>
          </h1>

          <p
            className="enter-rise mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]"
            style={stagger(2, 100, 80)}
          >
            Select a question type, topic, and difficulty level to start practicing.
            Build your skills and get better, one question at a time.
          </p>
        </div>

        {/* Illustration — right column spanning both rows on desktop; under the
            hero text on smaller screens, scaled down. */}
        <div className="relative mx-auto w-full max-w-[380px] min-[1100px]:col-start-2 min-[1100px]:row-span-2 min-[1100px]:row-start-1 min-[1100px]:max-w-none">
          <PracticeTagline />
          <div className="ph-art-in">
            <PickerHeroArt />
          </div>
        </div>

      {/* Picker card — left column, second row. */}
      <div className="min-[1100px]:col-start-1 min-[1100px]:row-start-2">
        <div
          ref={groupsRef}
          className={`reveal group/card relative ${groupsInView ? 'is-in' : ''} flex flex-col rounded-3xl border border-line bg-white shadow-sm`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 shadow-[0_24px_60px_-28px_rgba(140,21,104,0.5)] transition-opacity duration-300 group-hover/card:opacity-100"
          />
          <div className="p-6 pb-0 sm:p-7 sm:pb-0">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-600/30 transition-transform duration-300 group-hover/card:-translate-y-0.5 group-hover/card:rotate-3">
                <TargetIcon size={22} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-ink">Pick Your Practice</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Choose the question type, topic, and level you want to drill.
                </p>
              </div>
            </div>

            {error ? (
              <div className="my-6 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-4">
                <p className="text-sm font-bold text-danger-700">Couldn't load practice questions.</p>
                <p className="mt-1 text-sm text-danger-700/80">Check your connection, then try again.</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-danger-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700/90 focus-visible:ring-2 focus-visible:ring-danger-700 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="mt-2 divide-y divide-line">
                {groups.map(({ key: groupKey, ...rest }, index) => (
                  <FilterRow
                    key={groupKey}
                    id={groupKey}
                    {...rest}
                    loading={loading}
                    inView={groupsInView}
                    rowIndex={index}
                  />
                ))}
              </div>
            )}
          </div>

          {!error && (
            <div
              ref={footerRef}
              className={`${pinned ? 'sticky bottom-0 z-10' : 'relative'} rounded-b-3xl border-t border-line bg-white p-6 pt-5 shadow-[0_-10px_24px_-20px_rgba(45,0,34,0.45)] sm:p-7 sm:pt-5 min-[700px]:static min-[700px]:shadow-none`}
            >
              <div className="flex flex-col gap-4 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex min-h-6 items-center gap-2 text-sm font-semibold text-body"
                >
                  <DocumentIcon size={17} strokeWidth={2} className="shrink-0 text-brand-500" />
                  {loading ? (
                    <>
                      <span className="sr-only">Loading questions…</span>
                      <span aria-hidden="true" className="shimmer block h-4 w-40 rounded-full bg-line" />
                    </>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 ${shake ? 'picker-count-shake' : ''}`}
                      onAnimationEnd={(event) => {
                        if (event.target === event.currentTarget) setShake(false)
                      }}
                    >
                      {shown} {shown === 1 ? 'question' : 'questions'} available
                    </span>
                  )}
                </div>
                <span className={`inline-flex w-full min-[700px]:w-auto ${ctaEnabled ? 'picker-cta-pulse' : ''}`}>
                  <button
                    type="button"
                    onClick={onStart}
                    disabled={loading || available === 0}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm shadow-brand-600/25 transition-[transform,background-color,opacity] duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-brand-600 min-[700px]:w-auto"
                  >
                    Start Practicing
                    <ArrowRightIcon
                      size={17}
                      strokeWidth={2.4}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </button>
                </span>
              </div>
              {!loading && available === 0 && (
                <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                  No questions here yet. Try another topic or level.
                </p>
              )}
            </div>
          )}
        </div>
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
  const [params, setParams] = useSearchParams()
  const { type: types, topic, level: difficulty } = parseFilterParams(params)
  const hasDeepLink = params.has('type') || params.has('topic') || params.has('level')

  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [game, setGame] = useState(() => (hasDeepLink ? 'sql' : null))
  const [engine, setEngine] = useState(null)
  const [selected, setSelected] = useState(null)
  const snapshot = useQuizEngine(engine)

  // Selecting a chip rewrites the matching query param, so the choice is
  // shareable, survives reload, and is restored on back/forward navigation.
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }
  const setTypes = (value) => setFilter('type', value === 'all' ? null : TYPE_URL[value])
  const setTopic = (value) => setFilter('topic', value === 'all' ? null : value)
  const setDifficulty = (value) => setFilter('level', value === 'all' ? null : value)

  useEffect(() => {
    let active = true
    loadPracticeQuestions()
      .then((questions) => {
        if (!active) return
        setBank(questions)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoadError(true)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const retryLoad = () => {
    setLoading(true)
    setLoadError(false)
    setReloadKey((key) => key + 1)
  }

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
        bank={bank ?? []}
        loading={loading}
        error={loadError}
        onRetry={retryLoad}
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