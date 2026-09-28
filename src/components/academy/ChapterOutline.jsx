import { Link } from 'react-router-dom'
import { sectionKey } from '../../data/academy/book.js'

/**
 * The sticky rail beside the paper. Every chapter is listed; the one being read
 * expands to show its numbered sections, and each section can be ticked off by
 * hand as well as automatically by scrolling.
 *
 * `self-start` is what actually makes the stick work: as a grid item the nav
 * would otherwise stretch to the full height of the row, leaving sticky no
 * travel to move through. The list scrolls inside itself so a long chapter
 * never grows taller than the viewport.
 */
export default function ChapterOutline({
  chapters,
  upcoming,
  currentSlug,
  activeId,
  isRead,
  onToggleRead,
  accent = '#38bdf8',
}) {
  return (
    <nav className="sticky top-4 self-start lg:top-6" aria-label="Chapter outline">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
        Contents
      </div>

      <div className="max-h-[38vh] overflow-y-auto overscroll-contain pr-1 sm:max-h-[45vh] lg:max-h-[calc(100vh-3rem)]">
        <ol className="space-y-0.5">
        {chapters.map((ch) => {
          const open = ch.slug === currentSlug
          const read = isRead(ch.slug, '__chapter__')

          return (
            <li key={ch.slug}>
              <Link
                to={`/academy/sql/${ch.slug}`}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                  open
                    ? 'bg-slate-800/70 text-white'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-black"
                  style={
                    open
                      ? { background: `${accent}26`, color: accent }
                      : { background: '#1e293b', color: '#94a3b8' }
                  }
                >
                  {read ? '✓' : String(ch.number).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {ch.title}
                </span>
              </Link>

              {open && (
                <ul className="mt-0.5 space-y-0.5 border-l border-slate-800 pl-3.5 ml-3">
                  {ch.sections.map((s) => {
                    const done = isRead(ch.slug, s.id)
                    const active = activeId === s.id
                    return (
                      <li key={s.id} className="flex items-center gap-1.5">
                        <a
                          href={`#${sectionKey(ch.slug, s.id)}`}
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                            active
                              ? 'bg-slate-800/70 font-semibold text-white'
                              : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: active ? accent : undefined }}
                          >
                            {s.number}
                          </span>
                          <span className="truncate">{s.title}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onToggleRead(ch.slug, s.id)}
                          aria-label={done ? `Mark ${s.number} unread` : `Mark ${s.number} as read`}
                          title={done ? 'Mark as unread' : 'Mark as read'}
                          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                            done
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        >
                          {done ? '✓' : '○'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      {upcoming.length > 0 && (
        <>
          <div className="mt-5 mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
            Still to come
          </div>
          <ul className="space-y-0.5">
            {upcoming.map((c) => (
              <li
                key={c.number}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-slate-600"
                title={c.blurb}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 font-mono text-[10px] font-black text-slate-600">
                  {String(c.number).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{c.title}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </nav>
  )
}
