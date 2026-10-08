import { Link } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { ArrowRightIcon } from './icons.jsx'

const TONES = {
  sql: {
    card: 'tint-blush border-slate-200/60 bg-white',
    rest: 'shadow-sm',
    hover: 'hover:border-brand-200/70 hover:shadow-md',
    icon: 'bg-brand-600 text-white shadow-md shadow-brand-600/20',
    link: 'text-brand-600 group-hover:text-brand-700',
    arrow: 'bg-brand-100 text-brand-600 group-hover:bg-brand-200',
  },
  mongo: {
    card: 'tint-leaf border-slate-200/60 bg-white',
    rest: 'shadow-sm',
    hover: 'hover:border-leaf-200 hover:shadow-md',
    icon: 'bg-leaf-600 text-white shadow-md shadow-leaf-600/20',
    link: 'text-leaf-600 group-hover:text-leaf-700',
    arrow: 'bg-leaf-100 text-leaf-600 group-hover:bg-leaf-200',
  },
  academy: {
    card: 'border-plum-100 bg-plum-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(#6b46c9,0.22)]',
    hover:
      'hover:border-plum-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(#6b46c9,0.22)]',
    icon: 'bg-plum-100 text-plum-600',
    arrow: 'bg-plum-100 text-plum-600 group-hover:bg-plum-200',
    link: 'text-plum-600',
  },
  progress: {
    card: 'border-amber-100 bg-amber-50',
    rest: 'shadow-[0_2px_10px_-6px_rgba(207,133,36,0.28)]',
    hover:
      'hover:border-amber-200 hover:bg-white hover:shadow-[0_26px_50px_-32px_rgba(207,133,36,0.42)]',
    icon: 'bg-amber-100 text-amber-600',
    arrow: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
    link: 'text-amber-600',
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
      className={`group isolate relative flex h-full flex-col gap-5 rounded-2xl border p-7 sm:p-8 outline-none transition-all duration-200 hover:-translate-y-0.5 ${t.card} ${t.rest} ${t.hover} focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isPressed ? 'scale-[0.98]' : ''} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
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
        className={`card-icon card-part relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${t.icon}`}
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
        className="card-part text-[15.5px] leading-[1.6] text-muted"
        style={{ animationDelay: `${baseDelay + 140}ms` }}
      >
        {description}
      </p>

      <span
        className={`card-part mt-auto inline-flex items-center gap-1.5 self-start text-[15px] font-semibold transition-all duration-200 group-hover:gap-2.5 ${t.link}`}
        style={{ animationDelay: `${baseDelay + 210}ms` }}
      >
        {action}
        <ArrowRightIcon size={16} strokeWidth={2.2} />
      </span>
    </Link>
  )
}
