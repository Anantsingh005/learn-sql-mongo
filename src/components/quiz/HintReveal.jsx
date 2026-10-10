import { useState } from 'react'
import { ENTER_POP } from '../site/motion.js'

function BulbIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.7 10.7c.5.4.7 1 .7 1.6V18h6v-2.7c0-.6.3-1.2.7-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function HintReveal({ hint, label = 'Show hint', openLabel = 'Hide hint' }) {
  const [open, setOpen] = useState(false)
  if (!hint) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition motion-safe:active:scale-[0.97] ${
          open
            ? 'border-brand-300 bg-brand-50 text-brand-700'
            : 'border-line bg-white text-muted hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
        }`}
      >
        <BulbIcon className="h-4 w-4" />
        {open ? openLabel : label}
        <ChevronIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <p className={`${ENTER_POP} mt-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm leading-relaxed text-brand-700`}>
          {hint}
        </p>
      )}
    </div>
  )
}

export default HintReveal
