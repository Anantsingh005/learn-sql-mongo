import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BOOK,
  CHAPTERS,
  UPCOMING_CHAPTERS,
  getChapter,
  neighbour,
  sectionKey,
} from '../data/academy/book.js'
import {
  getProgress,
  markChapterRead,
  markSectionRead,
  syncChapterRead,
} from '../data/academy/progress.js'
import ChapterOutline from '../components/academy/ChapterOutline.jsx'
import ScrollProgress from '../components/academy/ScrollProgress.jsx'
import PaperSheet from '../components/academy/PaperSheet.jsx'
import ReadingBlock from '../components/academy/ReadingBlock.jsx'
import Cheatsheet from '../components/academy/Cheatsheet.jsx'
import { Inline } from '../components/academy/Prose.jsx'
import ProgressBar from '../components/academy/ProgressBar.jsx'
import SectionQuiz from '../components/academy/SectionQuiz.jsx'
import { questionsForSection } from '../data/academy/questions/index.js'

const CHAPTER_DONE = '__chapter__'

function Objectives({ items, accent }) {
  if (!items?.length) return null
  return (
    <div
      className="mb-8 rounded-xl border border-slate-900/10 bg-slate-900/[0.04] p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
        In this chapter
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((o, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-700">
            <span className="font-mono text-[11px]" style={{ color: accent }}>
              ▸
            </span>
            <span>{o}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Mistakes({ items }) {
  if (!items?.length) return null
  return (
    <section className="mt-9">
      <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rose-600">
        Common mistakes
      </div>
      <h3 className="font-serif text-xl font-semibold tracking-tight text-slate-900">
        What trips people up
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((m, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-lg border border-rose-300/70 bg-rose-50/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-rose-900/85"
          >
            <span className="font-mono text-[12px] font-black text-rose-500">✗</span>
            <Inline
              text={m}
              codeClass="rounded bg-rose-900/[0.08] px-1.5 py-0.5 font-mono text-[0.82em] text-rose-900 ring-1 ring-rose-900/10"
              strongClass="font-semibold text-rose-900"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChapterNav({ chapter }) {
  const prev = neighbour(chapter.slug, -1)
  const next = neighbour(chapter.slug, 1)

  const link = (target, dir) =>
    target ? (
      <Link
        to={`/academy/sql/${target.slug}`}
        className="group flex-1 rounded-xl border border-slate-900/10 bg-white/70 px-4 py-3 transition-colors hover:border-slate-900/25 hover:bg-white"
      >
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          {dir === 'prev' ? '← Previous' : 'Next →'}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">
          {target.title}
        </div>
      </Link>
    ) : (
      <span className="flex-1" />
    )

  return (
    <div className="mt-8 flex gap-3 border-t border-slate-900/10 pt-6">
      {link(prev, 'prev')}
      {link(next, 'next')}
    </div>
  )
}

function ChapterFooter({ chapter, readSections, chapterDone, onToggleRead, onPractise }) {
  const pct = Math.round((readSections / chapter.sections.length) * 100)
  const next = neighbour(chapter.slug, 1)

  return (
    <div className="mt-10 rounded-xl border border-slate-900/10 bg-slate-900/[0.04] p-5">
      <div className="flex items-center gap-3">
        <ProgressBar
          pct={pct}
          gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
          className="flex-1"
        />
        <span className="font-mono text-[10px] text-slate-600">
          {readSections}/{chapter.sections.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onToggleRead}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            chapterDone
              ? 'border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border border-slate-900/15 bg-white text-slate-700 hover:border-slate-900/30 hover:bg-slate-900/[0.04] hover:text-slate-900'
          }`}
        >
          {chapterDone ? '✓ Chapter read' : 'Mark chapter as read'}
        </button>

        <button
          type="button"
          onClick={onPractise}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:brightness-110"
          style={{ background: chapter.accent }}
        >
          Practise this chapter →
        </button>

        {next ? (
          <Link
            to={`/academy/sql/${next.slug}`}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:brightness-110"
            style={{ background: chapter.accent }}
          >
            Next chapter →
          </Link>
        ) : (
          <Link
            to="/academy/sql"
            className="rounded-lg border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-900/30 hover:bg-slate-900/[0.04] hover:text-slate-900"
          >
            ← Back to contents
          </Link>
        )}
      </div>
    </div>
  )
}

export default function Chapter() {
  const { chapterSlug } = useParams()
  const navigate = useNavigate()
  const chapter = useMemo(() => getChapter(chapterSlug), [chapterSlug])

  const [progress, setProgress] = useState(() => getProgress())
  const [activeId, setActiveId] = useState(null)
  // The scroll spy takes over as soon as it reports; until then the outline
  // highlights the opening section, which is what the reader is looking at.
  const activeSectionId = activeId ?? chapter?.sections[0]?.id ?? null

  const refresh = useCallback(() => setProgress(getProgress()), [])

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
        const next = !getProgress().chapters.includes(slug)
        markChapterRead(slug, next)
        target.sections.forEach((s) => markSectionRead(sectionKey(slug, s.id), next))
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

  useEffect(() => {
    if (!chapter) return

    const nodes = chapter.sections
      .map((s) => document.getElementById(sectionKey(chapter.slug, s.id)))
      .filter(Boolean)
    if (nodes.length === 0) return

    // A band near the top of the viewport decides which section is "current".
    const spy = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (hit[0]?.target.dataset.section) setActiveId(hit[0].target.dataset.section)
      },
      { rootMargin: '-15% 0px -75% 0px' },
    )

    // A section counts as read once most of it has been on screen.
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

    nodes.forEach((n) => {
      spy.observe(n)
      reader.observe(n)
    })
    return () => {
      spy.disconnect()
      reader.disconnect()
    }
  }, [chapter, refresh])

  if (!chapter) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          404
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-white">Chapter not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          Nothing has been written at <span className="font-mono text-slate-300">/academy/sql/{chapterSlug}</span>.
        </p>
        <Link
          to="/academy/sql"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Back to the book
        </Link>
      </div>
    )
  }

  const readSections = chapter.sections.filter((s) =>
    progress.sections.includes(sectionKey(chapter.slug, s.id)),
  ).length
  const chapterDone = progress.chapters.includes(chapter.slug)

  return (
    <div>
      <ScrollProgress accent={chapter.accent} />

      <div className="mx-auto max-w-5xl px-2 pb-10">
        <Link
          to="/academy/sql"
          className="group inline-flex items-center text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span>
          All chapters
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[186px_minmax(0,1fr)]">
          <ChapterOutline
            chapters={CHAPTERS}
            upcoming={UPCOMING_CHAPTERS}
            currentSlug={chapter.slug}
            activeId={activeSectionId}
            isRead={isRead}
            onToggleRead={toggleRead}
            accent={chapter.accent}
          />

          <PaperSheet accent={chapter.accent}>
            <header>
              <div
                className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                style={{ color: chapter.accent }}
              >
                Chapter {String(chapter.number).padStart(2, '0')}
              </div>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900">
                {chapter.title}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{chapter.subtitle}</p>

              <div className="mt-5 flex items-center gap-3 border-t border-slate-900/10 pt-4">
                <ProgressBar
                  pct={Math.round((readSections / chapter.sections.length) * 100)}
                  gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
                  className="flex-1"
                />
                <span className="font-mono text-[10px] text-slate-500">
                  {readSections}/{chapter.sections.length} read
                </span>
              </div>
            </header>

            <Objectives items={chapter.objectives} accent={chapter.accent} />

            {chapter.sections.map((section) => {
              const key = sectionKey(chapter.slug, section.id)
              const done = progress.sections.includes(key)
              return (
                <section
                  key={section.id}
                  id={key}
                  data-section={section.id}
                  className="scroll-mt-24 border-t border-slate-900/10 pt-8 mt-8 first:border-t-0"
                >
                  <div className="mb-3 flex items-baseline gap-3">
                    <span
                      className="font-mono text-sm font-black"
                      style={{ color: chapter.accent }}
                    >
                      {section.number}
                    </span>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
                      {section.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => toggleRead(chapter.slug, section.id)}
                      aria-label={done ? `Mark ${section.number} unread` : `Mark ${section.number} as read`}
                      title={done ? 'Mark as unread' : 'Mark as read'}
                      className={`ml-auto shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        done
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'text-slate-400 hover:bg-slate-900/[0.06] hover:text-slate-700'
                      }`}
                    >
                      {done ? '✓ read' : '○ mark read'}
                    </button>
                  </div>

                  <div className="space-y-5">
                    {section.blocks.map((block, i) => (
                      <ReadingBlock key={i} block={block} accent={chapter.accent} />
                    ))}
                  </div>

                  <SectionQuiz
                    questions={questionsForSection(chapter.slug, section.id)}
                    accent={chapter.accent}
                  />
                </section>
              )
            })}

            <Mistakes items={chapter.commonMistakes} />
            <Cheatsheet cheatsheet={chapter.cheatsheet} accent={chapter.accent} />

            <ChapterFooter
              chapter={chapter}
              readSections={readSections}
              chapterDone={chapterDone}
              onToggleRead={() => toggleRead(chapter.slug, CHAPTER_DONE)}
              onPractise={() => navigate(`/practice?topic=${chapter.practiceTopic}`)}
            />

            <ChapterNav chapter={chapter} />
          </PaperSheet>
        </div>
      </div>
    </div>
  )
}
