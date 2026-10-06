import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BOOK,
  CHAPTERS,
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

function Objectives({ items, accent, ink = accent }) {
  if (!items?.length) return null
  return (
    <div
      className="mb-8 rounded-xl border border-line bg-mist p-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
        In this chapter
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((o, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-body">
            <span className="font-mono text-[11px]" style={{ color: ink }}>
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
      <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-danger-700">
        Common mistakes
      </div>
      <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
        What trips people up
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((m, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-lg border border-danger-200 bg-danger-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-danger-700/85"
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
        className="group flex-1 rounded-xl border border-line bg-mist px-4 py-3 transition-colors hover:border-brand-600 hover:bg-white"
      >
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {dir === 'prev' ? '← Previous' : 'Next →'}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-semibold text-ink group-hover:text-ink">
          {target.title}
        </div>
      </Link>
    ) : (
      <span className="flex-1" />
    )

  return (
    <div className="mt-8 flex gap-3 border-t border-line pt-6">
      {link(prev, 'prev')}
      {link(next, 'next')}
    </div>
  )
}

function ChapterFooter({ chapter, readSections, chapterDone, onToggleRead, onPractise }) {
  const pct = Math.round((readSections / chapter.sections.length) * 100)
  const next = neighbour(chapter.slug, 1)

  return (
    <div className="mt-10 rounded-xl border border-line bg-mist p-5">
      <div className="flex items-center gap-3">
        <ProgressBar
          pct={pct}
          gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
          className="flex-1"
        />
        <span className="font-mono text-[10px] text-body">
          {readSections}/{chapter.sections.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onToggleRead}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            chapterDone
              ? 'border border-leaf-200 bg-leaf-50 text-leaf-700 hover:bg-leaf-50'
              : 'border border-line bg-white text-body hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700'
          }`}
        >
          {chapterDone ? '✓ Chapter read' : 'Mark chapter as read'}
        </button>

        <button
          type="button"
          onClick={onPractise}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:brightness-110"
          style={{ background: chapter.accent }}
        >
          Practise this chapter →
        </button>

        {next ? (
          <Link
            to={`/academy/sql/${next.slug}`}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:brightness-110"
            style={{ background: chapter.accent }}
          >
            Next chapter →
          </Link>
        ) : (
          <Link
            to="/academy/sql"
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-body transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700"
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

    const spy = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (hit[0]?.target.dataset.section) setActiveId(hit[0].target.dataset.section)
      },
      { rootMargin: '-15% 0px -75% 0px' },
    )

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
        <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">Chapter not found</h1>
        <p className="mt-2 text-sm text-muted">
          Nothing has been written at <span className="font-mono text-muted">/academy/sql/{chapterSlug}</span>.
        </p>
        <Link
          to="/academy/sql"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
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
          className="group inline-flex items-center text-sm text-muted transition-colors hover:text-body"
        >
          <span className="mr-1 inline-block transition-transform group-hover:-translate-x-1">←</span>
          All chapters
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[186px_minmax(0,1fr)]">
          <ChapterOutline
            chapters={CHAPTERS}
            currentSlug={chapter.slug}
            activeId={activeSectionId}
            isRead={isRead}
            onToggleRead={toggleRead}
            accent={chapter.accent}
            ink={chapter.accentInk}
          />

          <PaperSheet accent={chapter.accent}>
            <header>
              <div
                className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                style={{ color: chapter.accentInk }}
              >
                Chapter {String(chapter.number).padStart(2, '0')}
              </div>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-ink">
                {chapter.title}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-body">{chapter.subtitle}</p>

              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <ProgressBar
                  pct={Math.round((readSections / chapter.sections.length) * 100)}
                  gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
                  className="flex-1"
                />
                <span className="font-mono text-[10px] text-muted">
                  {readSections}/{chapter.sections.length} read
                </span>
              </div>
            </header>

            <Objectives items={chapter.objectives} accent={chapter.accent} ink={chapter.accentInk} />

            {chapter.sections.map((section) => {
              const key = sectionKey(chapter.slug, section.id)
              const done = progress.sections.includes(key)
              return (
                <section
                  key={section.id}
                  id={key}
                  data-section={section.id}
                  className="scroll-mt-24 border-t border-line pt-8 mt-8 first:border-t-0"
                >
                  <div className="mb-3 flex items-baseline gap-3">
                    <span
                      className="font-mono text-sm font-black"
                      style={{ color: chapter.accentInk }}
                    >
                      {section.number}
                    </span>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                      {section.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => toggleRead(chapter.slug, section.id)}
                      aria-label={done ? `Mark ${section.number} unread` : `Mark ${section.number} as read`}
                      title={done ? 'Mark as unread' : 'Mark as read'}
                      className={`ml-auto shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        done
                          ? 'bg-leaf-50 text-leaf-700'
                          : 'text-muted hover:bg-mist hover:text-body'
                      }`}
                    >
                      {done ? '✓ read' : '○ mark read'}
                    </button>
                  </div>

                  <div className="space-y-5">
                    {section.blocks.map((block, i) => (
                      <ReadingBlock key={i} block={block} accent={chapter.accent} ink={chapter.accentInk} />
                    ))}
                  </div>

                  <SectionQuiz
                    questions={questionsForSection(chapter.slug, section.id)}
                    accent={chapter.accent}
                    ink={chapter.accentInk}
                  />
                </section>
              )
            })}

            <Mistakes items={chapter.commonMistakes} />
            <Cheatsheet cheatsheet={chapter.cheatsheet} accent={chapter.accent} ink={chapter.accentInk} />

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
