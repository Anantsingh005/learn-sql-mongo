import { Link } from 'react-router-dom'

export default function Logo({ className = '', onClick = undefined }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="DBQuiz home"
      className={`group/logo enter-fade inline-flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${className}`}
      style={{ animationDelay: '40ms' }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-sm shadow-brand-600/25 transition-all duration-200 group-hover/logo:scale-105 group-hover/logo:shadow-brand-600/40">
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m8.5 8.5-4 3.5 4 3.5" />
          <path d="m15.5 8.5 4 3.5-4 3.5" />
          <path d="m13.5 5-3 14" />
        </svg>
      </span>
      <span className="text-[20px] font-bold leading-none tracking-[-0.02em]">
        <span className="text-ink">DB</span>
        <span className="text-ink transition-colors duration-200 group-hover/logo:text-brand-700">Quiz</span>
      </span>
    </Link>
  )
}