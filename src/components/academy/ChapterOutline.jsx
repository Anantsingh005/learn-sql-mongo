import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { CHAPTERS, sectionKey } from '../../data/academy/book.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

// Position-based identity palette for the eight chapter badges (pink, purple,
// red, orange, green, blue, violet, rose). This is pure presentation, so it
// lives with the sidebar rather than in the chapter data — the reader never
// sees a chapter's colour as content.
const CHAPTER_ACCENTS = [
  '#db2777', // pink
  '#7c3aed', // purple
  '#dc2626', // red
  '#ea580c', // orange
  '#16a34a', // green
  '#2563eb', // blue
  '#8b5cf6', // violet
  '#e11d48', // rose
]

function accentFor(index) {
  const n = CHAPTER_ACCENTS.length
  return CHAPTER_ACCENTS[((index % n) + n) % n]
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

function GradCapIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6.5 11.2V15c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2v-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M21.5 9v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function StatusGlyph({ done, active, accent }) {
  if (done) {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className="block h-1.5 w-1.5 rounded-full transition-colors"
      style={{ background: active ? accent : 'var(--color-line)' }}
      aria-hidden="true"
    />
  )
}

function ContentsHeader({ onClose }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <GradCapIcon />
      </span>
      <Link
        to="/academy/sql"
        onClick={onClose}
        className="inline-flex min-h-11 items-center font-serif text-[15px] font-semibold text-ink transition-colors hover:text-brand-700 min-[900px]:min-h-0"
      >
        Academy
      </Link>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contents"
          className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-mist hover:text-body"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

function ContentsCard({
  chapters,
  currentSlug,
  activeId,
  isRead,
  openSlug,
  onToggleChapter,
  onSelectSection,
  listRef,
  activeRef,
  onListKeyDown,
  highlightRef,
  highlightStyle,
  onListTransitionEnd,
  className = '',
  scrollClassName = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white/85 shadow-[0_2px_14px_-10px_rgba(16,42,67,0.3)] backdrop-blur-sm ${className}`}
    >
      <div className="px-3.5 pb-1 pt-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
        Contents
      </div>

      <div
        ref={listRef}
        onKeyDown={onListKeyDown}
        onTransitionEnd={onListTransitionEnd}
        className={`relative overflow-y-auto overscroll-contain px-1.5 pb-2 ${scrollClassName}`}
      >
        <span
          ref={highlightRef}
          data-contents-highlight
          aria-hidden="true"
          className="pointer-events-none absolute left-1.5 right-1.5 top-0 rounded-lg"
          style={highlightStyle}
        />
        <ol className="space-y-0.5 pt-0.5">
          {chapters.map((ch, index) => {
            const accent = accentFor(index)
            const expanded = ch.slug === openSlug
            const panelId = `contents-panel-${ch.slug}`

            return (
              <li key={ch.slug}>
                <button
                  type="button"
                  data-contents-row
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => onToggleChapter(ch.slug)}
                  className="group flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-mist motion-safe:hover:-translate-y-0.5 min-[900px]:min-h-0"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-black text-white"
                    style={{ background: accent }}
                  >
                    {String(ch.number).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-body transition-colors group-hover:text-ink">
                    {ch.title}
                  </span>
                  <ChevronIcon
                    className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  id={panelId}
                  inert={!expanded}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <ul className="overflow-hidden">
                    {ch.sections.map((s) => {
                      const active = ch.slug === currentSlug && s.id === activeId
                      const done = isRead(ch.slug, s.id)

                      return (
                        <li key={s.id}>
                          <Link
                            to={`/academy/sql/${ch.slug}#${sectionKey(ch.slug, s.id)}`}
                            data-contents-row
                            aria-current={active ? 'page' : undefined}
                            title={s.title}
                            ref={active ? activeRef : undefined}
                            onClick={() => onSelectSection(ch.slug, s.id)}
                            className={`relative flex min-h-11 items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-[12px] transition motion-safe:hover:-translate-y-0.5 min-[900px]:min-h-0 ${
                              active
                                ? 'font-semibold text-brand-700'
                                : 'text-muted hover:bg-mist hover:text-body'
                            }`}
                          >
                            {active && (
                              <span
                                className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                                style={{ background: accent }}
                                aria-hidden="true"
                              />
                            )}
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                              <StatusGlyph done={done} active={active} accent={accent} />
                            </span>
                            <span
                              className="shrink-0 font-mono text-[10px]"
                              style={{ color: active ? accent : undefined }}
                            >
                              {s.number}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{s.title}</span>
                            <DocIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

/**
 * The chapter reading screen's "Contents" sidebar.
 *
 * ≥900px: a sticky card below the nav that scrolls inside itself and keeps the
 * active section in view. <900px: a sticky top bar (Contents button + current
 * section + mini progress) that opens the same list as a slide-over drawer.
 *
 * No chapter or section is ever locked — every row navigates.
 */
export default function ChapterOutline({
  chapters = CHAPTERS,
  currentSlug,
  activeId,
  isRead = () => false,
  className = '',
}) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 900px)')

  const [openSlug, setOpenSlug] = useState(currentSlug)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const listRef = useRef(null)
  const activeRef = useRef(null)
  const panelRef = useRef(null)
  const highlightRef = useRef(null)

  // Geometry of the single sliding highlight that sits behind the active
  // section row (top/height measured against the scroll container, which is
  // the row's offset parent — so the sidebar's own scroll logic keeps working).
  const [spot, setSpot] = useState(null)

  // The chapter holding the current section is the one that starts expanded;
  // navigating to another chapter re-opens on that chapter.
  useEffect(() => {
    setOpenSlug(currentSlug)
  }, [currentSlug])

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false)
  }, [isDesktop])

  // Keep the active row in view inside the sidebar's own scroll container,
  // without ever scrolling the page (manual scroll, not scrollIntoView).
  useEffect(() => {
    const el = activeRef.current
    const container = listRef.current
    if (!el || !container || el.closest('[inert]')) return

    const behavior = reduced ? 'auto' : 'smooth'
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight

    if (top < viewTop) container.scrollTo({ top: Math.max(top - 8, 0), behavior })
    else if (bottom > viewBottom) {
      container.scrollTo({ top: bottom - container.clientHeight + 8, behavior })
    }
  }, [activeId, currentSlug, openSlug, isDesktop, reduced])

  // Keep the highlight glued to the active row as it moves (active change, a
  // panel opening, a resize, or the row itself growing).
  const measureSpot = useCallback(() => {
    const el = activeRef.current
    if (!el || el.closest('[inert]')) {
      setSpot((prev) => (prev?.hidden ? prev : { hidden: true, top: 0, height: 0 }))
      return
    }
    const top = el.offsetTop
    const height = el.offsetHeight
    setSpot((prev) =>
      prev && !prev.hidden && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { hidden: false, top, height },
    )
  }, [])

  useLayoutEffect(() => {
    measureSpot()
    const raf = requestAnimationFrame(measureSpot)
    return () => cancelAnimationFrame(raf)
  }, [activeId, currentSlug, openSlug, isDesktop, drawerOpen, measureSpot])

  const handleToggleChapter = useCallback(
    (slug) => {
      if (slug === currentSlug) {
        setOpenSlug((prev) => (prev === slug ? null : slug))
      } else {
        setDrawerOpen(false)
        navigate(`/academy/sql/${slug}`)
      }
    },
    [currentSlug, navigate],
  )

  const handleSelectSection = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleListKeyDown = useCallback((event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const rows = Array.from(event.currentTarget.querySelectorAll('[data-contents-row]')).filter(
      (el) => !el.closest('[inert]') && el.offsetParent !== null,
    )
    if (rows.length === 0) return

    const current = rows.indexOf(document.activeElement)
    let next = null
    if (event.key === 'ArrowDown') next = rows[current < 0 ? 0 : Math.min(current + 1, rows.length - 1)]
    else if (event.key === 'ArrowUp') next = rows[current <= 0 ? 0 : current - 1]
    else if (event.key === 'Home') next = rows[0]
    else next = rows[rows.length - 1]

    if (next) {
      event.preventDefault()
      next.focus()
    }
  }, [])

  // Drawer: trap focus while open, close on Escape, and restore focus after.
  useEffect(() => {
    if (!drawerOpen) return undefined
    const panel = panelRef.current
    if (!panel) return undefined

    const previouslyFocused = document.activeElement
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null && !el.closest('[inert]'))

    getFocusable()[0]?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawerOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (!items.includes(active)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [drawerOpen])

  const currentChapter = chapters.find((c) => c.slug === currentSlug) ?? null
  const sections = currentChapter?.sections ?? []
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0] ?? null
  const readCount = currentChapter
    ? sections.filter((s) => isRead(currentChapter.slug, s.id)).length
    : 0
  const progress = sections.length ? Math.round((readCount / sections.length) * 100) : 0
  const currentAccent = accentFor(chapters.findIndex((c) => c.slug === currentSlug))

  const highlightStyle = {
    height: spot && !spot.hidden ? spot.height : 0,
    transform: `translateY(${spot?.top ?? 0}px)`,
    opacity: spot && !spot.hidden ? 1 : 0,
    background: spot && !spot.hidden ? `${currentAccent}1f` : 'transparent',
    transition: reduced
      ? 'none'
      : 'transform 300ms var(--ease-out-soft), height 300ms var(--ease-out-soft), opacity 200ms ease',
  }

  const cardProps = {
    chapters,
    currentSlug,
    activeId,
    isRead,
    openSlug,
    onToggleChapter: handleToggleChapter,
    onSelectSection: handleSelectSection,
    activeRef,
    onListKeyDown: handleListKeyDown,
    highlightRef,
    highlightStyle,
    onListTransitionEnd: measureSpot,
  }

  if (isDesktop) {
    return (
      <div className={className}>
        <nav
          aria-label="Contents"
          className="enter-rise min-[900px]:sticky min-[900px]:top-24"
          style={{ animationDelay: '120ms' }}
        >
          <div className="px-1.5">
            <ContentsHeader />
          </div>
          <ContentsCard
            {...cardProps}
            listRef={listRef}
            className="mt-3 max-h-[calc(100vh-9rem)]"
            scrollClassName="max-h-[calc(100vh-13rem)]"
          />
        </nav>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="sticky top-[70px] z-30 rounded-2xl border border-line bg-white/90 px-3 py-2 shadow-[0_2px_14px_-10px_rgba(16,42,67,0.3)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-semibold text-body transition-colors hover:bg-mist"
          >
            <MenuIcon className="h-4 w-4" />
            Contents
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-body">
              {activeSection?.title ?? ''}
            </div>
            <div
              className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line-soft"
              role="progressbar"
              aria-label="Chapter progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-valuetext={`${readCount} of ${sections.length} sections read`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%`, background: currentAccent }}
              />
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <div
          className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!drawerOpen}
        >
          <button
            type="button"
            aria-label="Close contents"
            tabIndex={drawerOpen ? 0 : -1}
            onClick={() => setDrawerOpen(false)}
            className={`absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Contents"
            inert={!drawerOpen}
            className={`absolute inset-y-0 left-0 flex w-[min(86vw,340px)] max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="px-3 pt-3">
              <ContentsHeader onClose={() => setDrawerOpen(false)} />
            </div>
            <ContentsCard
              {...cardProps}
              listRef={listRef}
              className="mx-3 mb-3 mt-3 flex min-h-0 flex-1 flex-col"
              scrollClassName="min-h-0 flex-1"
            />
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
