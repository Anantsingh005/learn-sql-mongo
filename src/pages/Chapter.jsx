import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BOOK, CHAPTERS, getChapter, sectionKey } from '../data/academy/book.js'
import {
  getProgress,
  loadProgress,
  markChapterRead,
  markSectionRead,
  syncChapterRead,
} from '../data/academy/progress.js'
import ChapterOutline from '../components/academy/ChapterOutline.jsx'
import ChapterRail from '../components/academy/ChapterRail.jsx'
import ScrollProgress from '../components/academy/ScrollProgress.jsx'
import SectionProgress from '../components/academy/SectionProgress.jsx'
import PaperSheet from '../components/academy/PaperSheet.jsx'
import ReadingBlock from '../components/academy/ReadingBlock.jsx'
import Cheatsheet from '../components/academy/Cheatsheet.jsx'
import Reveal from '../components/academy/Reveal.jsx'
import ChapterArt from '../components/academy/ChapterArt.jsx'
import Prose, { Inline } from '../components/academy/Prose.jsx'
import ProgressBar from '../components/academy/ProgressBar.jsx'
import SectionQuiz from '../components/academy/SectionQuiz.jsx'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { questionsForSection } from '../data/academy/questions/index.js'

const CHAPTER_DONE = '__chapter__'

const EMPTY_PROGRESS = { sections: [], chapters: [], correct: [] }

/* Loads saved progress asynchronously — the same contract the Academy landing
   page uses — so the reader can show a skeleton while it resolves and a
   retryable error panel if device storage is unavailable. Only the initial
   read is async; marking a section read stays synchronous. */
function useChapterProgress() {
  const [status, setStatus] = useState('loading')
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadProgress)
      .then((next) => {
        if (!active) return
        setProgress(next)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [attempt])

  const refresh = useCallback(() => setProgress(getProgress()), [])
  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  return { status, progress, refresh, retry }
}

const PANEL_LINK =
  'press inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 font-semibold transition-all duration-200'
const PANEL_SOLID = `${PANEL_LINK} cta-sheen relative overflow-hidden bg-brand-600 text-white shadow-[0_12px_24px_-16px_rgba(140,21,104,0.9)] hover:-translate-y-0.5 hover:bg-brand-700`
const PANEL_SOFT = `${PANEL_LINK} border border-line bg-white text-body shadow-sm hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700`

function ChapterNotFound({ slug }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div
        className="enter-rise font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient"
        style={{ animationDelay: '0ms' }}
      >
        404
      </div>
      <h1 className="enter-rise mt-3 font-serif text-3xl font-semibold text-ink" style={{ animationDelay: '80ms' }}>
        Chapter not found
      </h1>
      <p className="enter-rise mt-2 text-[16px] leading-[1.7] text-muted" style={{ animationDelay: '160ms' }}>
        Nothing has been written at <span className="font-mono text-muted">/academy/sql/{slug}</span>.
      </p>
      <div className="enter-rise mt-6" style={{ animationDelay: '240ms' }}>
        <Link to="/academy/sql" className={PANEL_SOLID}>
          Back to the Academy
        </Link>
      </div>
    </div>
  )
}

function SectionNotFound({ chapter }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div
        className="enter-rise font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient"
        style={{ animationDelay: '0ms' }}
      >
        Not found
      </div>
      <h1 className="enter-rise mt-3 font-serif text-3xl font-semibold text-ink" style={{ animationDelay: '80ms' }}>
        Section not found
      </h1>
      <p className="enter-rise mt-2 text-[16px] leading-[1.7] text-muted" style={{ animationDelay: '160ms' }}>
        We couldn&apos;t find that section in{' '}
        <span className="font-semibold text-body">{chapter.title}</span>. The link may be out of date.
      </p>
      <div
        className="enter-rise mt-6 flex flex-wrap items-center justify-center gap-3"
        style={{ animationDelay: '240ms' }}
      >
        <Link to={`/academy/sql/${chapter.slug}`} className={PANEL_SOLID}>
          Start from the first section
        </Link>
        <Link to="/academy/sql" className={PANEL_SOFT}>
          Back to the Academy
        </Link>
      </div>
    </div>
  )
}

function ChapterError({ onRetry }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center" role="alert">
      <div
        className="enter-rise font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient"
        style={{ animationDelay: '0ms' }}
      >
        Error
      </div>
      <h1 className="enter-rise mt-3 font-serif text-3xl font-semibold text-ink" style={{ animationDelay: '80ms' }}>
        We couldn&apos;t load this chapter
      </h1>
      <p className="enter-rise mt-2 text-[16px] leading-[1.7] text-muted" style={{ animationDelay: '160ms' }}>
        Something went wrong reading your saved progress on this device. Nothing has been lost.
      </p>
      <div
        className="enter-rise mt-6 flex flex-wrap items-center justify-center gap-3"
        style={{ animationDelay: '240ms' }}
      >
        <button type="button" onClick={onRetry} className={PANEL_SOLID}>
          Try again
        </button>
        <Link to="/academy/sql" className={PANEL_SOFT}>
          Back to the Academy
        </Link>
      </div>
    </div>
  )
}

function Bar({ className = '' }) {
  return <span className={`skeleton-pulse block rounded-full bg-line-soft ${className}`} aria-hidden="true" />
}

function ChapterSkeleton() {
  return (
    <div className="overflow-x-clip">
      <div className="[margin-inline:calc(50%_-_50vw)]">
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-10 sm:px-8">
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading chapter…</span>
            <div aria-hidden="true">
              <Bar className="mt-1 h-4 w-28" />

              <div className="mt-4 grid grid-cols-1 gap-6 min-[900px]:grid-cols-[300px_minmax(0,1fr)] min-[1280px]:grid-cols-[240px_minmax(0,1fr)_240px]">
                <div className="hidden rounded-2xl border border-line bg-white/85 p-4 min-[900px]:block">
                  <Bar className="h-4 w-24" />
                  <div className="mt-4 space-y-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Bar key={i} className={`h-8 w-full ${i % 2 ? 'opacity-70' : ''}`} />
                    ))}
                  </div>
                </div>

                <div className="min-w-0 rounded-[20px] border border-line bg-[#fdfcf9] p-7 shadow-[0_28px_60px_-32px_rgba(16,42,67,0.35)] sm:p-11">
                  <Bar className="h-6 w-40" />
                  <Bar className="mt-6 h-9 w-3/4" />
                  <div className="mt-7 space-y-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Bar key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                    ))}
                  </div>
                  <Bar className="mt-8 h-24 w-full rounded-2xl" />
                </div>

                <div className="hidden rounded-2xl border border-line bg-white/85 p-4 min-[1280px]:block">
                  <Bar className="mx-auto h-24 w-24 rounded-full" />
                  <Bar className="mx-auto mt-4 h-4 w-24" />
                  <div className="mt-5 space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Bar key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function Objectives({ items, accent, ink = accent }) {
  if (!items?.length) return null
  return (
    <Reveal
      delay={0}
      className="mt-5 rounded-2xl border border-line bg-mist p-4 shadow-[0_2px_12px_-8px_rgba(16,42,67,0.2)] sm:p-5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
        In this chapter
      </div>
      <ul className="mt-2.5 space-y-1.5 sm:space-y-2">
        {items.map((o, i) => (
          <li
            key={i}
            className="kp-item flex gap-2 text-[13px] leading-snug text-body sm:text-[13.5px]"
            style={{ animationDelay: `${i * 130}ms` }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            >
              <path
                className="kp-check"
                d="m5 13 4 4L19 7"
                stroke={ink}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animationDelay: `${180 + i * 130}ms` }}
              />
            </svg>
            <span>{o}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

function Mistakes({ items }) {
  if (!items?.length) return null
  return (
    <Reveal as="section" delay={0} className="mt-10">
      <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-danger-700">
        Common mistakes
      </div>
      <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">
        What trips people up
      </h2>
      <ul className="mt-3 space-y-2 sm:space-y-2.5">
        {items.map((m, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-xl border border-danger-200 bg-danger-100 px-3.5 py-2.5 text-[16px] leading-[1.7] text-danger-700/85 shadow-[0_2px_10px_-8px_rgba(176,51,51,0.35)] sm:px-4"
          >
            <span className="font-mono text-[12px] font-black text-danger-600">✗</span>
            <Inline
              text={m}
              codeClass="rounded bg-mist px-1.5 py-0.5 font-mono text-[0.82em] text-danger-700 ring-1 ring-brand-200"
              strongClass="font-semibold text-danger-700"
            />
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

// Renders one section's reader content (heading, optional intro, blocks, quiz).
// Shared by the live section and the outgoing crossfade copy; `decorative`
// keeps the fading copy out of the heading hierarchy and focus order.
function SectionBody({ chapter, section, chapterIndex, headingRef, decorative = false }) {
  const firstBlock = section.blocks[0]
  const intro = firstBlock?.type === 'theory' ? firstBlock.body : null
  const blocks = intro ? section.blocks.slice(1) : section.blocks
  const Title = decorative ? 'div' : 'h1'

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div
            className={`${decorative ? '' : 'lesson-head '}flex flex-wrap items-baseline gap-x-3 gap-y-1`}
          >
            <span className="font-mono text-sm font-black text-brand-600">{section.number}</span>
            <Title
              ref={decorative ? undefined : headingRef}
              tabIndex={decorative ? undefined : -1}
              className="min-w-0 scroll-mt-24 font-serif text-3xl font-semibold leading-[1.1] tracking-tight text-ink outline-none sm:text-4xl"
            >
              {section.title}
            </Title>
          </div>
        </div>

        <div className="hidden shrink-0 min-[700px]:block" aria-hidden="true">
          <ChapterArt
            index={chapterIndex < 0 ? 0 : chapterIndex}
            accent={chapter.accent}
            className={`${decorative ? '' : 'float-soft '}h-28 w-auto`}
          />
        </div>
      </div>

      {intro && (
        <div
          className={`${decorative ? '' : 'lesson-intro '}mt-4 space-y-3`}
          style={decorative ? undefined : { animationDelay: '130ms' }}
        >
          {intro.map((para, i) => (
            <Prose
              key={i}
              text={para}
              className="max-w-[70ch] text-[16px] leading-[1.7] text-body"
            />
          ))}
        </div>
      )}

      <div className="mt-8 space-y-5">
        {blocks.map((block, i) =>
          decorative ? (
            <ReadingBlock
              key={i}
              block={block}
              accent={chapter.accent}
              ink={chapter.accentInk}
            />
          ) : (
            <Reveal key={i} delay={Math.min(i, 6) * 70}>
              <ReadingBlock block={block} accent={chapter.accent} ink={chapter.accentInk} />
            </Reveal>
          ),
        )}
      </div>

      <SectionQuiz
        questions={questionsForSection(chapter.slug, section.id)}
        accent={chapter.accent}
        ink={chapter.accentInk}
      />
    </>
  )
}

function ChapterFooter({ chapter, readSections, chapterDone, onToggleRead, onPractise }) {
  const pct = Math.round((readSections / chapter.sections.length) * 100)

  return (
    <Reveal delay={0} className="mt-10 rounded-2xl border border-line bg-mist p-4 shadow-[0_2px_14px_-10px_rgba(16,42,67,0.25)] sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex-1">
          <ProgressBar
            pct={pct}
            gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
          />
        </span>
        <span className="font-mono text-[10px] text-body">
          {readSections} of {chapter.sections.length} read
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onToggleRead}
          className={`press min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            chapterDone
              ? 'border border-leaf-200 bg-leaf-50 text-leaf-700 hover:bg-leaf-50'
              : 'border border-line bg-white text-body shadow-sm hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700 hover:shadow-[0_10px_20px_-14px_rgba(16,42,67,0.4)]'
          }`}
        >
          {chapterDone ? '✓ Chapter read' : 'Mark chapter as read'}
        </button>

        <button
          type="button"
          onClick={onPractise}
          className="press cta-sheen relative min-h-11 overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-14px_rgba(16,42,67,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          style={{ background: chapter.accent }}
        >
          Practise this chapter →
        </button>
      </div>
    </Reveal>
  )
}

function BookMarkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 4.8A2.8 2.8 0 0 1 6.8 2H19a1 1 0 0 1 1 1v16.2a1 1 0 0 1-1 1H6.8A2.8 2.8 0 0 0 4 22.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M4 4.8v18M8 6h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function CheckMark({ className = 'h-3 w-3' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChapterHeaderRow({ chapter, readSections }) {
  const total = chapter.sections.length
  const done = readSections === total

  return (
    <div className="enter-rise flex flex-wrap items-center gap-x-3 gap-y-2" style={{ animationDelay: '0ms' }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <BookMarkIcon />
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-brand-600 sm:text-xl">
        {chapter.title}
      </span>
      <span className="h-1 w-1 rounded-full bg-line" aria-hidden="true" />
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        Chapter {chapter.number}
      </span>
      <span
        className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold ${
          done ? 'border-leaf-200 bg-leaf-50 text-leaf-700' : 'border-brand-200 bg-brand-50 text-brand-700'
        }`}
      >
        {done && <CheckMark />}
        {readSections}/{total} read
      </span>
    </div>
  )
}

function sectionHref(target) {
  return `/academy/sql/${target.slug}#${sectionKey(target.slug, target.section.id)}`
}

function SectionNav({ previous, next, currentSlug }) {
  const nextChapter = next && next.slug !== currentSlug ? CHAPTERS.find((c) => c.slug === next.slug) : null

  const solid =
    'press group cta-sheen relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_-14px_rgba(16,42,67,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700'

  return (
    <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6">
      {previous ? (
        <Link
          to={sectionHref(previous)}
          className="press group inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-body shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700"
        >
          <span className="arrow-prev" aria-hidden="true">
            ←
          </span>{' '}
          Previous
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-11 cursor-not-allowed items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-body opacity-45"
        >
          <span aria-hidden="true">←</span> Previous
        </button>
      )}

      {next ? (
        <Link to={sectionHref(next)} className={`${solid} max-w-[68%]`}>
          <span className="shrink-0">{nextChapter ? 'Next chapter:' : 'Next:'}</span>
          <span className="min-w-0 truncate">{nextChapter ? nextChapter.title : next.section.title}</span>
          <span className="arrow-next shrink-0" aria-hidden="true">
            →
          </span>
        </Link>
      ) : (
        <Link to="/practice" className={solid}>
          Finish: try More Practice
          <span className="arrow-next" aria-hidden="true">
            →
          </span>
        </Link>
      )}
    </div>
  )
}

export default function Chapter() {
  const { chapterSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const reduced = useReducedMotion()
  const chapter = useMemo(() => getChapter(chapterSlug), [chapterSlug])
  const chapterIndex = useMemo(
    () => (chapter ? CHAPTERS.findIndex((c) => c.slug === chapter.slug) : -1),
    [chapter],
  )

  const { status, progress, refresh, retry } = useChapterProgress()

  const flat = useMemo(
    () => CHAPTERS.flatMap((c) => c.sections.map((section) => ({ slug: c.slug, section }))),
    [],
  )

  const hash = location.hash.replace(/^#/, '')
  const matchedSection = useMemo(
    () =>
      chapter
        ? chapter.sections.find((s) => sectionKey(chapter.slug, s.id) === hash) ?? null
        : null,
    [chapter, hash],
  )
  const sectionMissing = Boolean(chapter) && Boolean(hash) && !matchedSection
  const currentSection = matchedSection ?? (chapter && !hash ? chapter.sections[0] : null)

  const currentKey = chapter && currentSection ? sectionKey(chapter.slug, currentSection.id) : null
  const activeSectionId = currentSection?.id ?? null
  const currentIndex = currentSection
    ? flat.findIndex((x) => x.slug === chapter.slug && x.section.id === currentSection.id)
    : -1
  const previous = currentIndex > 0 ? flat[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null

  const topRef = useRef(null)
  const headingRef = useRef(null)
  const navigatedRef = useRef(false)

  const isRead = useCallback(
    (slug, sectionId) =>
      sectionId === CHAPTER_DONE
        ? progress.chapters.includes(slug)
        : progress.sections.includes(sectionKey(slug, sectionId)),
    [progress],
  )

  const toggleRead = useCallback(
    (slug, sectionId) => {
      const target = getChapter(slug)
      if (!target) return

      if (sectionId === CHAPTER_DONE) {
        const nextRead = !getProgress().chapters.includes(slug)
        markChapterRead(slug, nextRead)
        target.sections.forEach((s) => markSectionRead(sectionKey(slug, s.id), nextRead))
      } else {
        const key = sectionKey(slug, sectionId)
        markSectionRead(key, !getProgress().sections.includes(key))
        syncChapterRead(target)
      }
      refresh()
    },
    [refresh],
  )

  useEffect(() => {
    if (!chapter) return
    document.title = `Ch ${chapter.number} · ${chapter.title} — ${BOOK.title}`
  }, [chapter])

  // Mark the section read using exactly the same visibility rule as before —
  // but now only the current section is in the document, so re-attach whenever
  // it changes.
  useEffect(() => {
    if (!chapter || !currentKey) return
    const node = document.getElementById(currentKey)
    if (!node) return

    const reader = new IntersectionObserver(
      (entries) => {
        let changed = false
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const key = e.target.id
          if (getProgress().sections.includes(key)) continue
          markSectionRead(key, true)
          changed = true
        }
        if (changed) {
          syncChapterRead(chapter)
          refresh()
        }
      },
      { threshold: 0.6 },
    )

    reader.observe(node)
    return () => reader.disconnect()
  }, [chapter, currentKey, refresh])

  // Navigating between sections (not the initial mount) scrolls the lesson back
  // to its top and moves focus to the heading for screen readers.
  useEffect(() => {
    if (!currentKey) return
    if (!navigatedRef.current) {
      navigatedRef.current = true
      return
    }

    const top = topRef.current
    if (top) {
      const y = top.getBoundingClientRect().top + window.scrollY - 84
      window.scrollTo({ top: Math.max(y, 0), behavior: reduced ? 'auto' : 'smooth' })
    }
    headingRef.current?.focus({ preventScroll: true })
  }, [currentKey, reduced])

  // Crossfade: hold the previous section in the DOM for a beat so it can fade
  // out while the new one rises in. Skipped entirely under reduced motion.
  const lastRenderRef = useRef(null)
  const [leaving, setLeaving] = useState(null)

  useEffect(() => {
    if (!chapter || !currentSection) return undefined
    const next = { key: currentKey, chapter, section: currentSection, chapterIndex }
    const prev = lastRenderRef.current
    lastRenderRef.current = next
    if (!prev || prev.key === next.key || reduced) return undefined

    setLeaving(prev)
    const timer = setTimeout(() => setLeaving(null), 300)
    return () => clearTimeout(timer)
  }, [currentKey, chapter, currentSection, chapterIndex, reduced])

  if (!chapter) return <ChapterNotFound slug={chapterSlug} />
  if (status === 'loading') return <ChapterSkeleton />
  if (status === 'error') return <ChapterError onRetry={retry} />
  if (sectionMissing) return <SectionNotFound chapter={chapter} />

  const readSections = chapter.sections.filter((s) =>
    progress.sections.includes(sectionKey(chapter.slug, s.id)),
  ).length
  const chapterDone = progress.chapters.includes(chapter.slug)

  const isFirst = currentSection.id === chapter.sections[0].id
  const isLast = currentSection.id === chapter.sections[chapter.sections.length - 1].id

  return (
    <div className="w-full min-w-0">
      <ScrollProgress accent={chapter.accent} />

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-8">
        <Link
          to="/academy/sql"
          className="enter-rise group inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-body"
          style={{ animationDelay: '0ms' }}
        >
          <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span>
          All chapters
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-6 min-[900px]:grid-cols-[280px_minmax(0,1fr)] min-[1280px]:grid-cols-[240px_minmax(0,1fr)_240px]">
          <ChapterOutline
            className="min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:row-span-2 min-[1280px]:row-span-1"
            chapters={CHAPTERS}
            currentSlug={chapter.slug}
            activeId={activeSectionId}
            isRead={isRead}
          />

          <div className="min-[900px]:col-start-2 min-[900px]:row-start-1 min-w-0">
            <SectionProgress targetId={currentKey} accent={chapter.accent} />
            <PaperSheet accent={chapter.accent}>
              <header ref={topRef} className="scroll-mt-24">
                <ChapterHeaderRow chapter={chapter} readSections={readSections} />
                {isFirst && (
                  <Objectives items={chapter.objectives} accent={chapter.accent} ink={chapter.accentInk} />
                )}
              </header>

              <div className="relative mt-6">
                {leaving && (
                  <div
                    className="lesson-leaving pointer-events-none absolute inset-x-0 top-0 z-0 max-h-screen overflow-hidden"
                    aria-hidden="true"
                    inert
                  >
                    <SectionBody
                      chapter={leaving.chapter}
                      section={leaving.section}
                      chapterIndex={leaving.chapterIndex}
                      decorative
                    />
                  </div>
                )}

                <section
                  key={currentKey}
                  id={currentKey}
                  data-section={currentSection.id}
                  className="min-w-0"
                >
                  <SectionBody
                    chapter={chapter}
                    section={currentSection}
                    chapterIndex={chapterIndex}
                    headingRef={headingRef}
                  />
                </section>
              </div>

              {isLast && (
                <>
                  <Mistakes items={chapter.commonMistakes} />
                  <Cheatsheet
                    cheatsheet={chapter.cheatsheet}
                    accent={chapter.accent}
                    ink={chapter.accentInk}
                  />
                  <ChapterFooter
                    chapter={chapter}
                    readSections={readSections}
                    chapterDone={chapterDone}
                    onToggleRead={() => toggleRead(chapter.slug, CHAPTER_DONE)}
                    onPractise={() => navigate(`/practice?topic=${chapter.practiceTopic}`)}
                  />
                </>
              )}

              <SectionNav previous={previous} next={next} currentSlug={chapter.slug} />
            </PaperSheet>
          </div>

          <ChapterRail
            chapter={chapter}
            readSections={readSections}
            isRead={isRead}
            activeId={activeSectionId}
          />
        </div>
      </div>
    </div>
  )
}
