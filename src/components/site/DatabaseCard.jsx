import { Link } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { ArrowRightIcon } from './icons.jsx'

const TONES = {
  sql: {
    card: 'border-brand-100 bg-brand-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(21,84,199,0.28)]',
    hover:
      'hover:border-brand-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(21,84,199,0.45)]',
    icon: 'bg-brand-100 text-brand-600',
    arrow: 'bg-brand-100 text-brand-600 group-hover:bg-brand-200',
  },
  mongo: {
    card: 'border-leaf-100 bg-leaf-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(76,154,104,0.28)]',
    hover:
      'hover:border-leaf-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(76,154,104,0.42)]',
    icon: 'bg-leaf-100 text-leaf-600',
    arrow: 'bg-leaf-100 text-leaf-600 group-hover:bg-leaf-200',
  },
  academy: {
    card: 'border-plum-100 bg-plum-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(#6b46c9,0.22)]',
    hover:
      'hover:border-plum-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(#6b46c9,0.22)]',
    icon: 'bg-plum-100 text-plum-600',
    arrow: 'bg-plum-100 text-plum-600 group-hover:bg-plum-200',
  },
  progress: {
    card: 'border-amber-100 bg-amber-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(207,133,36,0.28)]',
    hover:
      'hover:border-amber-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(207,133,36,0.42)]',
    icon: 'bg-amber-100 text-amber-600',
    arrow: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
  },
}

export default function DatabaseCard({
  to,
  tone = 'sql',
  Icon,
  title,
  description,
  action,
  comingSoon = false,
  baseDelay = 0,
}) {
  const t = TONES[tone]

  const [isPressed, setIsPressed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsPressed(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsPressed(false)
  }, [])

  const handleClick = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300)
  }, [])

  return (
<Link
      to={to}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className={`group isolate relative flex h-full flex-col gap-6 rounded-[20px] border p-7 sm:p-8 outline-none transition-all duration-300 hover:-translate-y-1 ${t.card} ${t.rest} ${t.hover} focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isPressed ? 'scale-[0.98]' : ''} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      style={{
        transform: isPressed 
          ? 'scale(0.98)' 
          : ''
      }}
    >
      {comingSoon && (
        <span
          className="card-part absolute right-8 top-8 rounded-full bg-leaf-100 px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.1em] text-leaf-700"
          style={{ animationDelay: `${baseDelay}ms` }}
        >
          Soon
        </span>
      )}

      <span
        className={`card-icon card-part relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] transition-transform duration-300 ${t.icon}`}
        style={{ animationDelay: `${baseDelay}ms` }}
      >
        <Icon 
          size={32} 
          strokeWidth={1.75} 
          className={`transition-all duration-300 ${tone === 'sql' && 'group-hover:rotate-6' || tone === 'mongo' && 'group-hover:scale-110' || tone === 'academy' && 'group-hover:rotate-3' || tone === 'progress' && 'group-hover:scale-110 translate-y-[-2px]'}`}
        />
      </span>

      <h3
        className="card-part font-sans text-[22px] font-bold leading-tight tracking-[-0.01em] text-ink"
        style={{ animationDelay: `${baseDelay + 70}ms` }}
      >
        {title}
      </h3>

      <p
        className="card-part text-[16px] leading-[1.6] text-body"
        style={{ animationDelay: `${baseDelay + 140}ms` }}
      >
        {description}
      </p>

      <span
        className={`card-part mt-auto flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full transition-all duration-300 group-hover:translate-x-1 ${t.arrow}`}
        style={{ animationDelay: `${baseDelay + 210}ms` }}
      >
        <ArrowRightIcon size={20} strokeWidth={2.2} className="text-body" />
        {/* The click's meaning, kept for anyone who cannot see the circle. */}
        <span className="sr-only">{action}</span>
      </span>
    </Link>
  )
}
