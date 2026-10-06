import { Link } from 'react-router-dom'
import { sectionKey } from '../../data/academy/book.js'

export default function ChapterOutline({
  chapters,
  currentSlug,
  activeId,
  isRead,
  onToggleRead,
  accent = '#1554c7',
  ink = accent,
}) {
  return (
    <nav className="sticky top-4 self-start lg:top-6" aria-label="Chapter outline">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
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
                    ? 'bg-line/70 text-ink'
                    : 'text-muted hover:bg-line/40 hover:text-body'
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-black"
                  style={
                    open
                      ? { background: '#fff', color: ink, boxShadow: `inset 0 0 0 1px ${accent}66` }
                      : { background: '#eef2f7', color: '#4a6178' }
                  }
                >
                  {read ? '✓' : String(ch.number).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {ch.title}
                </span>
              </Link>

              {open && (
                <ul className="mt-0.5 space-y-0.5 border-l border-line pl-3.5 ml-3">
                  {ch.sections.map((s) => {
                    const done = isRead(ch.slug, s.id)
                    const active = activeId === s.id
                    return (
                      <li key={s.id} className="flex items-center gap-1.5">
                        <a
                          href={`#${sectionKey(ch.slug, s.id)}`}
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                            active
                              ? 'bg-line/70 font-semibold text-ink'
                              : 'text-muted hover:bg-line/40 hover:text-body'
                          }`}
                        >
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: active ? ink : undefined }}
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
                              ? 'text-leaf-600 hover:text-leaf-700'
                              : 'text-body hover:text-muted'
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
      </div>
    </nav>
  )
}
