import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BOOK,
  CHAPTERS,
  PARTS,
  sectionKey,
  totalSections,
} from '../../data/academy/book.js'
import { getProgress } from '../../data/academy/progress.js'
import Byline from './Byline.jsx'
import ProgressBar from './ProgressBar.jsx'
import Reveal from './Reveal.jsx'

function ChapterCard({ chapter, readSections, done }) {
  const pct = Math.round((readSections / chapter.sections.length) * 100)

  return (
    <Link
      to={`/academy/sql/${chapter.slug}`}
      className="group relative block h-full rounded-[20px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <div
        className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(120deg, ${chapter.accent}55, transparent 70%)` }}
      />
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border bg-white p-4 shadow-[0_2px_10px_-6px_rgba(16,42,67,0.16)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_26px_50px_-30px_rgba(16,42,67,0.4)] sm:p-5 ${
          done ? 'border-line' : 'border-line/80 group-hover:border-line'
        }`}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${chapter.accent}, transparent)` }}
        />

        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-black transition-transform duration-300 group-hover:scale-110"
            style={{
              borderColor: `${chapter.accent}55`,
              background: `${chapter.accent}1a`,
              color: chapter.accentInk,
            }}
          >
            {chapter.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div
              className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: chapter.accentInk }}
            >
              Chapter {String(chapter.number).padStart(2, '0')}
            </div>
            <h3 className="mt-0.5 font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {chapter.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-muted">{chapter.subtitle}</p>
          </div>

          {done && (
            <span className="shrink-0 rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-bold text-leaf-700">
              ✓ Read
            </span>
          )}
        </div>

        <ul className="mt-4 space-y-1 border-t border-line pt-3">
          {chapter.sections.map((s) => (
            <li key={s.id} className="flex items-baseline gap-2 text-[12px] text-muted">
              <span
                className="w-8 shrink-0 font-mono text-[10px]"
                style={{ color: chapter.accentInk }}
              >
                {s.number}
              </span>
              <span className="truncate">{s.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-3 pt-4">
          <ProgressBar
            pct={pct}
            gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
            className="min-w-16 flex-1"
          />
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {readSections}/{chapter.sections.length}
          </span>
          <span
            className="shrink-0 text-[11px] font-bold transition-transform group-hover:translate-x-1"
            style={{ color: chapter.accentInk }}
          >
            Read →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function SqlBook() {
  const [progress] = useState(getProgress)

  const sections = totalSections()
  const read = progress.sections.length
  const chaptersDone = CHAPTERS.filter((c) => progress.chapters.includes(c.slug)).length

  const resume =
    CHAPTERS.find((c) => c.sections.some((s) => !progress.sections.includes(sectionKey(c.slug, s.id)))) ??
    CHAPTERS[CHAPTERS.length - 1]

  return (
    <div className="mx-auto max-w-4xl px-1 pb-6 sm:px-2">
      <div className="mb-8 text-center sm:mb-10">
        <div
          className="enter-rise inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 shadow-xs backdrop-blur-sm"
          style={{ animationDelay: '0ms' }}
        >
          <span className="badge-pulse h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
          Academy
        </div>
        <h1
          className="enter-rise grad-text mt-4 font-serif text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[2.75rem]"
          style={{ animationDelay: '80ms' }}
        >
          {BOOK.title}
        </h1>
        <p
          className="enter-rise mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted"
          style={{ animationDelay: '160ms' }}
        >
          {BOOK.tagline}
        </p>
        <div className="enter-rise mt-4 flex justify-center" style={{ animationDelay: '240ms' }}>
          <Byline />
        </div>
      </div>

      <Reveal
        delay={0}
        className="rounded-[20px] border border-line bg-white p-4 shadow-[0_2px_12px_-8px_rgba(16,42,67,0.2)] sm:p-5"
      >
        <p className="text-sm leading-relaxed text-muted">{BOOK.blurb}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <ProgressBar
            pct={sections ? Math.round((read / sections) * 100) : 0}
            gradient="linear-gradient(90deg, #3d7f55, #1554c7)"
            className="min-w-32 flex-1"
          />
          <span className="font-mono text-[11px] text-muted">
            {read}/{sections} sections · {chaptersDone}/{CHAPTERS.length} chapters
          </span>
          <Link
            to={`/academy/sql/${resume.slug}`}
            className="cta-sheen relative shrink-0 overflow-hidden rounded-xl bg-brand-600 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_20px_-14px_rgba(21,84,199,0.9)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-[0_16px_26px_-14px_rgba(21,84,199,0.95)] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:self-start"
          >
            {read === 0 ? 'Start reading' : 'Continue'}
          </Link>
        </div>
      </Reveal>

      <div className="mt-10 space-y-10">
        {PARTS.map((part) => {
          const partChapters = CHAPTERS.filter((c) => part.numbers.includes(c.number))
          if (partChapters.length === 0) return null
          return (
            <section key={part.label}>
              <Reveal delay={0} className="mb-3 sm:mb-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                    {part.label}
                  </span>
                  <span className="text-[13px] text-muted">{part.title}</span>
                </div>
              </Reveal>
              <div className="grid gap-4 sm:grid-cols-2">
                {partChapters.map((c, i) => (
                  <Reveal key={c.slug} delay={i * 80} className="h-full">
                    <ChapterCard
                      chapter={c}
                      readSections={
                        c.sections.filter((s) => progress.sections.includes(sectionKey(c.slug, s.id))).length
                      }
                      done={progress.chapters.includes(c.slug)}
                    />
                  </Reveal>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
