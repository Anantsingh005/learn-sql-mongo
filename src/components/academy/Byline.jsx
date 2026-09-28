import { BOOK } from '../../data/academy/book.js'

export default function Byline({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 font-mono text-[12px] font-black text-white">
        {BOOK.author.charAt(0)}
      </span>
      <span className="text-[13px] leading-tight text-slate-600">
        Written by <span className="font-semibold text-slate-900">{BOOK.author}</span>
      </span>
    </div>
  )
}
