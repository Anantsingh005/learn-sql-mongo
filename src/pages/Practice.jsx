import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  PRACTICE_TOPICS,
  PRACTICE_DIFFICULTIES,
  PRACTICE_TYPES,
  practiceTopicOf,
} from '../data/practice/practiceQuestions.js'
import { loadPracticeQuestions, countPracticeQuestions } from '../data/practice/practiceQuestions.js'
import { chapterSlugForQuestion } from '../data/academy/lessonFor.js'
import { CHAPTERS } from '../data/academy/book.js'
import { getQuizHelp } from '../data/quizHelp.js'
import { useAuth } from '../context/AuthContext.jsx'
import { openFeedbackForm, FEEDBACK_CONTACT_HREF } from '../lib/feedback.js'
import { PracticeEngine, PRACTICE_STATUS } from '../engine/PracticeEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import QueryRunner from '../engine/QueryRunner.js'
import useQuizEngine from '../hooks/useQuizEngine.js'
import SqlEditor from '../components/quiz/SqlEditor.jsx'
import { OptionButton } from '../components/quiz/QuestionCard.jsx'
import SchemaPanel from '../components/quiz/SchemaPanel.jsx'
import HintReveal from '../components/quiz/HintReveal.jsx'
import SqlCode from '../components/academy/SqlCode.jsx'
import CopyButton from '../components/academy/CopyButton.jsx'
import { useInView } from '../hooks/useInView.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { useCountUp } from '../hooks/useCountUp.js'
import { stagger } from '../components/site/motion.js'
import { ArrowRightIcon, CodeIcon, LeafIcon } from '../components/site/icons.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))

// Chips that describe the current question. `practice` is the current dataset's
// type for a multiple-choice item; `mc` is kept for the legacy bank. Icons are
// function declarations, so referencing them here is safe (hoisted).
const TYPE_META = {
  practice: { label: 'Multiple Choice', tone: 'border-brand-200 bg-brand-50 text-brand-700', Icon: ListIcon },
  mc: { label: 'Multiple Choice', tone: 'border-brand-200 bg-brand-50 text-brand-700', Icon: ListIcon },
  write: { label: 'Write a Query', tone: 'border-leaf-200 bg-leaf-50 text-leaf-700', Icon: CodeIcon },
  bug: { label: 'Fix the Bug', tone: 'border-amber-200 bg-amber-50 text-amber-700', Icon: BugIcon },
}

const DIFFICULTY_META = {
  easy: { label: 'Easy', tone: 'border-leaf-200 bg-leaf-50 text-leaf-700' },
  medium: { label: 'Medium', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  hard: { label: 'Hard', tone: 'border-danger-200 bg-danger-50 text-danger-700' },
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

function XIcon(props) {
  return (
    <In {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </In>
  )
}

function BookmarkIcon(props) {
  return (
    <In {...props}>
      <path d="M6 4h12v16l-6-4-6 4V4Z" />
    </In>
  )
}

function StopIcon(props) {
  return (
    <In {...props}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />
    </In>
  )
}

function SlidersIcon(props) {
  return (
    <In {...props}>
      <path d="M4 7h8" />
      <path d="M16 7h4" />
      <circle cx="14" cy="7" r="2" />
      <path d="M4 17h8" />
      <path d="M16 17h4" />
      <circle cx="14" cy="17" r="2" />
    </In>
  )
}

function ListIcon(props) {
  return (
    <In {...props}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </In>
  )
}

function BugIcon(props) {
  return (
    <In {...props}>
      <path d="M8 9a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0V9Z" />
      <path d="M12 5v2M8.5 7.5 6.8 5.8M15.5 7.5l1.7-1.7" />
      <path d="M4.5 12H8M16 12h3.5M5 16l2.6-1.2M19 16l-2.6-1.2M6.5 20l2.3-2.4M17.5 20l-2.3-2.4" />
    </In>
  )
}

function DifficultyIcon(props) {
  return (
    <In {...props}>
      <path d="M6 19v-4" />
      <path d="M12 19v-8" />
      <path d="M18 19V7" />
    </In>
  )
}

function ChevronIcon(props) {
  return (
    <In {...props}>
      <path d="m6 9 6 6 6-6" />
    </In>
  )
}

function HelpIcon(props) {
  return (
    <In {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.1-2.5 3.7" />
      <path d="M12 17h.01" />
    </In>
  )
}

function LockIcon(props) {
  return (
    <In {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </In>
  )
}

function StarIcon({ size = 12, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
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

function StatTile({ icon: Icon, iconClass, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon size={15} strokeWidth={2.6} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span key={value} className="pop-in font-mono text-sm font-bold text-ink">
          {value}
        </span>
        <span className="text-[11px] text-muted">{label}</span>
      </span>
    </div>
  )
}

function PracticeStats({ snapshot, total }) {
  const frac = total > 0 ? Math.min((snapshot.index + 1) / total, 1) : 0
  return (
    <div className="grid grid-cols-2 items-center gap-3 min-[700px]:flex min-[700px]:gap-5">
      <div className="col-span-2 flex min-w-0 flex-col gap-1.5 min-[700px]:col-auto min-[700px]:flex-1">
        <span className="font-mono text-xs text-muted">
          Question <span className="font-bold text-ink">{snapshot.index + 1}</span> / {total}
        </span>
        <div
          role="progressbar"
          aria-label="Question progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={snapshot.index + 1}
          aria-valuetext={`Question ${snapshot.index + 1} of ${total}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-line/70"
        >
          <div
            className="h-full w-full origin-left rounded-full bg-brand-500 transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${frac})` }}
          />
        </div>
      </div>

      <StatTile icon={CheckIcon} iconClass="bg-success-50 text-success" value={snapshot.correct} label="Correct" />
      <StatTile icon={XIcon} iconClass="bg-danger-50 text-danger-700" value={snapshot.wrong} label="Wrong" />
      <StatTile icon={BookmarkIcon} iconClass="bg-brand-50 text-brand-600" value={snapshot.answered} label="Practiced" />

      <div className="hidden h-9 w-px shrink-0 bg-line min-[700px]:block" aria-hidden="true" />

      <StatTile icon={StarIcon} iconClass="bg-amber-50 text-amber-600" value={snapshot.score} label="Score" />
    </div>
  )
}

// A question prompt is stored as "<sql block>\n\n<sentence>" when it carries
// SQL, or as a plain sentence otherwise. Split it so the SQL and the question
// sentence can be shown in their own surfaces.
function splitQuestion(text) {
  if (typeof text !== 'string') return { sql: null, sentence: '' }
  const splitAt = text.indexOf('\n\n')
  if (splitAt === -1) return { sql: null, sentence: text }
  return { sql: text.slice(0, splitAt).trimEnd(), sentence: text.slice(splitAt + 2).trim() }
}

// Legacy questions sometimes embed a "(pass 3)" marker in the prompt text. The
// session's pass cycle is not surfaced to the player, so strip it from display.
function stripPassMarkers(text) {
  return String(text ?? '')
    .replace(/\(\s*pass\s+\d+\s*\)/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// Small keycap used by the desktop keyboard-shortcut hint line. Decorative —
// the shortcuts themselves are described in the surrounding sentence text.
function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-mist px-1 font-mono text-[10px] font-bold text-body">
      {children}
    </kbd>
  )
}

// Desktop-only hint describing the session keyboard shortcuts. Rendered under
// the actions; hidden on touch-first widths where there is no physical keyboard.
function KeyboardHint({ children }) {
  return (
    <p className="hidden flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted min-[1024px]:flex">
      {children}
    </p>
  )
}

function MetaChip({ tone, icon: Icon, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {Icon && <Icon size={13} strokeWidth={2.2} />}
      {children}
    </span>
  )
}

function QuestionMeta({ question }) {
  const type = TYPE_META[question.type] ?? TYPE_META.practice
  const diff = DIFFICULTY_META[question.difficulty]
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  return (
    <div className="quiz-fade-swap flex flex-wrap items-center gap-2">
      <MetaChip tone={type.tone} icon={type.Icon}>
        {type.label}
      </MetaChip>
      {diff && (
        <MetaChip tone={diff.tone} icon={DifficultyIcon}>
          {diff.label}
        </MetaChip>
      )}
      {question.subtopic && (
        <MetaChip tone="border-line bg-mist/60 text-body">{question.subtopic}</MetaChip>
      )}
      {chapter && (
        <Link
          to={`/academy/sql/${chapter.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-muted outline-none transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <BookIcon size={13} strokeWidth={2} />
          Ch {chapter.number} · {chapter.title}
        </Link>
      )}
    </div>
  )
}

// Dark "SQL Query" card. Each line gets its own number gutter and is tokenised
// by the shared academy highlighter, so the colours match the rest of the app.
function SqlCard({ sql }) {
  if (!sql) return null
  const lines = sql.replace(/\n$/, '').split('\n')
  return (
    <div className="quiz-card-swap overflow-hidden rounded-2xl border border-brand-800 bg-ink shadow-[0_1px_2px_rgba(45,0,34,0.3)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-leaf-400/70" />
          </span>
          <span className="font-mono text-xs font-semibold tracking-wide text-paper/80">SQL Query</span>
        </div>
        <CopyButton text={sql} tone="dark" />
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <span key={i} className="flex">
            <span className="mr-4 w-6 shrink-0 select-none text-right text-paper/30" aria-hidden="true">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre">
              <SqlCode code={line || ' '} tone="dark" keepWhitespace />
            </span>
          </span>
        ))}
      </pre>
    </div>
  )
}

// The question itself, on a soft lavender band beneath the code card.
function AskBand({ text }) {
  if (!text) return null
  return (
    <div className="quiz-card-swap rounded-xl border border-plum-100 bg-plum-50 px-4 py-3">
      <p className="text-sm font-medium leading-relaxed text-body">{text}</p>
    </div>
  )
}

function VerdictBlock({ answer, explanation, onNext }) {
  if (!answer) return null
  const skipped = answer.skipped
  const correct = answer.correct
  const tone = skipped
    ? { box: 'border-line bg-mist/60', text: 'text-muted' }
    : correct
      ? { box: 'border-leaf-200 bg-leaf-50', text: 'text-leaf-700' }
      : { box: 'border-danger-200 bg-danger-50', text: 'text-danger-700' }
  const badge = skipped ? 'bg-muted' : correct ? 'bg-leaf-500' : 'bg-danger-500'
  const detail = explanation || answer.reason
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${tone.box}`}>
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${badge}`}>
          {skipped ? (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          ) : correct ? (
            <CheckIcon size={12} strokeWidth={3} />
          ) : (
            <XIcon size={12} strokeWidth={3} />
          )}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${tone.text}`}>
            {skipped ? 'Skipped' : correct ? 'Correct!' : 'Not quite'}
          </p>
          {detail && <p className="mt-1 text-sm leading-relaxed text-body">{detail}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 font-semibold text-white shadow-sm shadow-brand-600/20 outline-none transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-safe:active:scale-[0.97]"
        >
          Next question
          <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </div>
  )
}

function MultipleChoiceArea({ question, selected, onSelect, isFeedback, answer, onSubmit, onSkip, onNext }) {
  const chosen = isFeedback ? answer?.selected : selected
  const correctText = question.correctAnswer
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Answer choices" className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          let state = 'default'
          if (isFeedback) {
            if (opt === correctText) state = 'correct'
            else if (opt === chosen) state = 'wrong'
            else state = 'muted'
          } else if (opt === selected) {
            state = 'selected'
          }
          return (
            <OptionButton
              key={i}
              index={i}
              label={OPTION_LABELS[i] ?? String(i + 1)}
              text={opt}
              state={state}
              radio
              animate
              checked={opt === chosen}
              onSelect={() => onSelect(opt)}
              disabled={isFeedback}
            />
          )
        })}
      </div>

      {isFeedback ? (
        <VerdictBlock answer={answer} explanation={question.explanation} onNext={onNext} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="press inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={selected === null}
              onClick={() => onSubmit(selected)}
              className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 font-semibold text-white shadow-sm shadow-brand-600/20 outline-none transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:enabled:active:scale-[0.97]"
            >
              Submit
              <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
            </button>
          </div>

          <KeyboardHint>
            <Kbd>A</Kbd>–<Kbd>D</Kbd> choose an option
            <span aria-hidden="true" className="text-line">·</span>
            <Kbd>Enter</Kbd> submit
            <span aria-hidden="true" className="text-line">·</span>
            <Kbd>S</Kbd> skip
          </KeyboardHint>
        </>
      )}
    </div>
  )
}

function QuerySection({ question, onSubmit, disabled, isFeedback, snapshot, answer, onNext, onSkip }) {
  // Practice answers store the run under `actual`; the shared editor expects
  // `actualResult`. Map it across without touching how the query is checked.
  const editorAnswer = answer ? { ...answer, actualResult: answer.actual } : null
  return (
    <div className="quiz-fade-swap flex flex-col gap-3">
      <SqlEditor
        key={question.id}
        question={question}
        onSubmit={onSubmit}
        disabled={disabled}
        isFeedback={isFeedback}
        snapshot={snapshot}
        answer={editorAnswer}
        nextLabel="Next question"
        onNext={onNext}
        onSkip={onSkip}
        showShortcutHint={false}
      />
      {!isFeedback && (
        <KeyboardHint>
          <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> run your query
          <span aria-hidden="true" className="text-line">·</span>
          <Kbd>S</Kbd> skip
        </KeyboardHint>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session rail
//
// The right-hand column of the practice screen. Everything here reads from the
// live snapshot / current question; no card hard-codes text that depends on the
// session, and a card whose data is missing simply renders nothing.
// ---------------------------------------------------------------------------

// The rail's two data cards start expanded on desktop and collapsed on phones,
// mirroring the schema panel's mobile behaviour.
const RAIL_OPEN_QUERY = '(min-width: 700px)'
const RAIL_TOPIC_ORDER = ['table-query', 'joins', 'aggregation']

function railDefaultOpen() {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia(RAIL_OPEN_QUERY).matches
}

function RailCard({ icon, label, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
      <div className="flex items-center gap-2 text-brand-600">
        {icon}
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-body">{label}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function CollapsibleRailCard({ icon, label, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left outline-none transition-colors hover:bg-mist/50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset"
      >
        <span className="flex items-center gap-2 text-brand-600">
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-body">{label}</span>
        </span>
        <ChevronIcon
          size={15}
          strokeWidth={2.4}
          className={`shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="border-t border-line px-4 py-3">{children}</div>}
    </section>
  )
}

function AccuracyRing({ pct, size = 92, stroke = 9 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))
  // Hold the arc empty for the first frame, then release it so the dashoffset
  // transition sweeps round to the live value. With reduced motion the
  // transition is switched off, so the ring simply lands on its value.
  const [primed, setPrimed] = useState(true)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPrimed(false))
    return () => cancelAnimationFrame(frame)
  }, [])
  const offset = primed ? circumference : circumference * (1 - clamped / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-brand-500 transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  )
}

function SessionCard({ snapshot }) {
  const answered = snapshot.graded
  const skipped = snapshot.skipped
  const accuracy = answered > 0 ? Math.round((snapshot.correct / answered) * 100) : 0
  const shown = useCountUp(accuracy, 700)
  const caption = answered === 0 ? 'Answer a question to start.' : "Keep going! You're doing great!"
  return (
    <RailCard icon={<TargetIcon size={15} strokeWidth={2.4} />} label="Your Session">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 92, height: 92 }}>
          <AccuracyRing pct={accuracy} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-black tabular-nums text-ink">{shown}%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {answered} answered, {skipped} skipped
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{caption}</p>
        </div>
      </div>
    </RailCard>
  )
}

function ByTopicCard({ snapshot }) {
  const stats = new Map()
  for (const answer of snapshot.answers) {
    if (answer.skipped) continue
    const topic = practiceTopicOf(answer.question) ?? 'other'
    const current = stats.get(topic) ?? { correct: 0, answered: 0 }
    current.answered += 1
    if (answer.correct) current.correct += 1
    stats.set(topic, current)
  }
  const rows = [...stats.entries()]
    .filter(([, value]) => value.answered > 0)
    .sort((a, b) => {
      const ai = RAIL_TOPIC_ORDER.indexOf(a[0])
      const bi = RAIL_TOPIC_ORDER.indexOf(b[0])
      return (ai === -1 ? RAIL_TOPIC_ORDER.length : ai) - (bi === -1 ? RAIL_TOPIC_ORDER.length : bi)
    })
  if (rows.length === 0) return null
  return (
    <CollapsibleRailCard
      icon={<ChartIcon size={15} strokeWidth={2.4} />}
      label="By Topic"
      defaultOpen={railDefaultOpen()}
    >
      <div className="flex flex-col gap-3">
        {rows.map(([topic, value]) => {
          const pct = Math.round((value.correct / value.answered) * 100)
          return (
            <div key={topic}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-body">{PRACTICE_TOPICS[topic] ?? topic}</span>
                <span className="font-mono text-[11px] text-muted">
                  {value.correct}/{value.answered}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line/70">
                <div
                  className="bar-grow h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </CollapsibleRailCard>
  )
}

function LearnTopicCard({ question }) {
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  if (!chapter) return null
  return (
    <RailCard icon={<BookIcon size={15} strokeWidth={2.4} />} label="Learn This Topic">
      <p className="text-sm font-bold text-ink">
        Ch {chapter.number} · {chapter.title}
      </p>
      <Link
        to={`/academy/sql/${chapter.slug}`}
        className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-brand-700 outline-none transition-colors hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Read the lesson
        <ArrowRightIcon size={14} strokeWidth={2.4} />
      </Link>
    </RailCard>
  )
}

function QuickTipsCard({ question }) {
  const tips = (getQuizHelp(question)?.tips ?? []).filter(Boolean)
  if (tips.length === 0) return null
  return (
    <CollapsibleRailCard
      icon={<LeafIcon size={15} strokeWidth={1.9} />}
      label="Quick Tips"
      defaultOpen={railDefaultOpen()}
    >
      <ul className="flex flex-col gap-2">
        {tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm leading-relaxed text-body">
            <CheckIcon size={14} strokeWidth={2.6} className="mt-0.5 shrink-0 text-leaf-600" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </CollapsibleRailCard>
  )
}

function NeedHelpCard({ question, isGuest }) {
  const help = getQuizHelp(question)
  const isQuery = question.type === 'write' || question.type === 'bug'
  const hasHint = isQuery && Boolean(question.hint)
  const feedbackClass =
    'mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-body outline-none transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'
  return (
    <RailCard icon={<HelpIcon size={15} strokeWidth={2.4} />} label="Need Help?">
      {hasHint ? (
        isGuest ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-mist/60 px-3.5 py-2.5">
            <LockIcon size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-sm leading-relaxed text-muted">
              <Link to="/auth?mode=signup" className="font-semibold text-brand-700 hover:underline">
                Create an account
              </Link>{' '}
              to use hints.
            </p>
          </div>
        ) : (
          <HintReveal hint={question.hint} label="View Hint" openLabel="Hide Hint" />
        )
      ) : help?.quickInfo ? (
        <p className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white px-3.5 py-2.5 text-sm leading-relaxed text-brand-700">
          {help.quickInfo}
        </p>
      ) : null}

      {isGuest ? (
        <a href={FEEDBACK_CONTACT_HREF} target="_blank" rel="noopener noreferrer" className={feedbackClass}>
          Send Feedback
          <ArrowRightIcon size={14} strokeWidth={2.4} />
        </a>
      ) : (
        <button type="button" onClick={openFeedbackForm} className={feedbackClass}>
          Send Feedback
          <ArrowRightIcon size={14} strokeWidth={2.4} />
        </button>
      )}
    </RailCard>
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
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-danger-700 px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-danger-700/90 focus-visible:ring-2 focus-visible:ring-danger-700 focus-visible:ring-offset-2"
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

// Shimmering placeholder block used by the loading skeleton.
function Skel({ className = '' }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md bg-line ${className}`} />
}

// Shown while the first question of a session is being prepared. Mirrors the
// session layout so the page does not jump when the real question arrives.
function SessionSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]"
    >
      <span className="sr-only">Loading question…</span>
      <div className="min-w-0">
        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skel className="h-8 w-52 rounded-full" />
              <Skel className="h-11 w-32 rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              <Skel className="h-4 w-40" />
              <Skel className="h-1.5 w-full rounded-full" />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-2">
              <Skel className="h-7 w-28 rounded-full" />
              <Skel className="h-7 w-20 rounded-full" />
              <Skel className="h-7 w-24 rounded-full" />
            </div>
            <Skel className="h-40 w-full rounded-2xl" />
            <Skel className="h-12 w-full rounded-xl" />
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Skel key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden min-w-0 flex-col gap-4 min-[1100px]:flex">
        <Skel className="h-40 w-full rounded-2xl" />
        <Skel className="h-28 w-full rounded-2xl" />
        <Skel className="h-28 w-full rounded-2xl" />
      </div>
    </div>
  )
}

// Friendly dead-end when the filters chosen on the setup screen match no
// questions. The button returns to the setup screen with the filters cleared.
function EmptyState({ onBack }) {
  return (
    <div className="mx-auto mt-6 max-w-lg text-center sm:mt-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <TargetIcon size={30} strokeWidth={2} />
      </span>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-ink">
        No questions match those filters
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Every combination has a gap now and then. Head back and try another topic, level, or
        question type — there is plenty to practice.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white shadow-sm shadow-brand-600/25 outline-none transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Back to setup
        <ArrowRightIcon size={16} strokeWidth={2.4} />
      </button>
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
  const { user, configured } = useAuth()
  const isGuest = configured && !user

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

  // Session keyboard shortcuts. A–D pick an option, Enter submits, S skips.
  // Everything is ignored while focus is inside a form control (so typing in
  // the SQL editor and pressing Enter/S never triggers these), and Ctrl/Cmd and
  // Alt are reserved for the editor's own shortcuts (e.g. Ctrl+Enter to run).
  useEffect(() => {
    if (!engine || !snapshot) return undefined
    const status = snapshot.status
    if (status !== PRACTICE_STATUS.QUESTION && status !== PRACTICE_STATUS.FEEDBACK) return undefined

    const isEditable = (node) =>
      node instanceof Element && node.closest('input, textarea, select, [contenteditable="true"]')
    const isInteractive = (node) => node instanceof Element && node.closest('button, a')

    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isEditable(event.target)) return

      const key = event.key.toLowerCase()
      const current = snapshot.current
      const isChoice = Array.isArray(current?.options) && current.options.length > 0

      if (status === PRACTICE_STATUS.FEEDBACK) {
        if (key === 'enter' && !isInteractive(event.target)) {
          event.preventDefault()
          setSelected(null)
          engine.next()
        }
        return
      }

      // In-progress question: ignore while a query answer is still running.
      if (snapshot.runningAnswer) return

      if (key === 'enter') {
        if (isChoice && selected != null && !isInteractive(event.target)) {
          event.preventDefault()
          engine.submit(selected)
        }
        return
      }

      if (key === 's') {
        // Both multiple-choice and query questions offer a Skip affordance.
        event.preventDefault()
        engine.skip()
        return
      }

      if (!isChoice) return
      const index = ['a', 'b', 'c', 'd'].indexOf(key)
      if (index !== -1 && index < current.options.length) {
        event.preventDefault()
        setSelected(current.options[index])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [engine, snapshot, selected])

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
    const available = loading || loadError ? null : countPracticeQuestions(bank ?? [], topic, difficulty, types)
    if (available === 0) {
      return <EmptyState onBack={() => setParams(new URLSearchParams())} />
    }
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

  if (!snapshot || snapshot.status === PRACTICE_STATUS.READY) return <SessionSkeleton />

  const question = snapshot.current
  const isFeedback = snapshot.status === PRACTICE_STATUS.FEEDBACK
  const lastAnswer = snapshot.answers[snapshot.answers.length - 1]
  const isChoice = Array.isArray(question.options) && question.options.length > 0
  const summary = [
    PRACTICE_TYPES[snapshot.types] ?? snapshot.types,
    snapshot.topic !== 'all' ? PRACTICE_TOPICS[snapshot.topic] : 'All topics',
    snapshot.difficulty !== 'all' ? PRACTICE_DIFFICULTIES[snapshot.difficulty] : 'All levels',
  ]
    .filter(Boolean)
    .join(' · ')

  const hasSchema = Boolean(question.schema)
  // Same source of truth as the setup screen's "N questions available": both go
  // through countPracticeQuestions -> selectPracticeQuestions, so the deck size
  // and the picker count can never disagree.
  const total = countPracticeQuestions(bank ?? [], snapshot.topic, snapshot.difficulty, snapshot.types)

  // Announced to screen readers whenever feedback appears. Kept as one always-
  // mounted polite region so the message is reliably read out.
  const liveMessage = (() => {
    if (!isFeedback || !lastAnswer) return ''
    if (lastAnswer.skipped) return 'Question skipped.'
    if (lastAnswer.correct) return 'Correct.'
    const answer = question.options?.[question.correctAnswer]
    return answer ? `Not quite. The correct answer is ${answer}.` : 'Not quite.'
  })()

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
        <article className="enter-rise rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-line pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-mist/60 px-3 py-1.5 text-xs font-medium text-muted">
                <SlidersIcon size={14} strokeWidth={2} />
                {summary}
              </span>
              <button
                type="button"
                onClick={() => engine.end()}
                className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-danger-200 px-4 text-sm font-semibold text-danger-700 outline-none transition-colors hover:bg-danger-50 focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2"
              >
                <StopIcon size={13} strokeWidth={2} />
                End practice
              </button>
            </div>

            <PracticeStats snapshot={snapshot} total={total} />
          </div>

          <div
            key={question.id}
            className={`mt-6 grid grid-cols-1 items-start gap-6 ${
              hasSchema ? 'min-[1300px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : ''
            }`}
          >
            <div className="flex min-w-0 flex-col gap-4">
              <QuestionMeta question={question} />

              <SqlCard sql={question.sql ?? splitQuestion(question.question).sql} />

              <AskBand
                text={stripPassMarkers(question.ask ?? splitQuestion(question.question).sentence)}
              />

              {isChoice ? (
                <MultipleChoiceArea
                  question={question}
                  selected={selected}
                  onSelect={(opt) => !isFeedback && setSelected(opt)}
                  isFeedback={isFeedback}
                  answer={lastAnswer}
                  onSubmit={(opt) => engine.submit(opt)}
                  onSkip={() => engine.skip()}
                  onNext={() => {
                    setSelected(null)
                    engine.next()
                  }}
                />
              ) : (
                <QuerySection
                  question={question}
                  onSubmit={(sql) => engine.submitQuery(sql)}
                  disabled={snapshot.runningAnswer}
                  isFeedback={isFeedback}
                  snapshot={snapshot}
                  answer={lastAnswer}
                  onSkip={() => engine.skip()}
                  onNext={() => {
                    setSelected(null)
                    engine.next()
                  }}
                />
              )}
            </div>

            {hasSchema && (
              <div className="min-w-0 min-[1300px]:sticky min-[1300px]:top-[86px]">
                <SchemaPanel schema={question.schema} cascade className="" />
              </div>
            )}
          </div>
        </article>
      </div>

      <aside className="rail-enter flex min-w-0 flex-col gap-4 min-[1100px]:sticky min-[1100px]:top-[86px]">
        <SessionCard snapshot={snapshot} />
        <ByTopicCard snapshot={snapshot} />
        <LearnTopicCard question={question} />
        <QuickTipsCard question={question} />
        <NeedHelpCard question={question} isGuest={isGuest} />
      </aside>
      </div>
    </div>
  )
}

export default Practice