import { BOOK } from '../../data/academy/book.js'

export default function Byline({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-plum-100 font-mono text-[12px] font-black text-brand-700 ring-1 ring-brand-200/60">
        {BOOK.author.charAt(0)}
      </span>
      <span className="text-left text-[13px] leading-tight text-body">
        Written by <span className="font-semibold text-ink">{BOOK.author}</span>
      </span>
    </div>
  )
}
