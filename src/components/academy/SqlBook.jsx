import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BOOK,
  CHAPTERS,
  PARTS,
  UPCOMING_CHAPTERS,
  sectionKey,
  totalSections,
} from '../../data/academy/book.js'
import { getProgress } from '../../data/academy/progress.js'
import Byline from './Byline.jsx'
import ProgressBar from './ProgressBar.jsx'

function ChapterCard({ chapter, readSections, done }) {
  const pct = Math.round((readSections / chapter.sections.length) * 100)

  return (
    <Link
      to={`/academy/sql/${chapter.slug}`}
      className="group relative block rounded-2xl text-left outline-none"
    >
      <div
        className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(120deg, ${chapter.accent}55, transparent 70%)` }}
      />
      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-900/95 p-5 transition-all duration-300 group-hover:-translate-y-1 ${
          done ? 'border-slate-700' : 'border-slate-700/80 group-hover:border-slate-600'
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
              color: chapter.accent,
            }}
          >
            {chapter.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div
              className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: chapter.accent }}
            >
              Chapter {String(chapter.number).padStart(2, '0')}
            </div>
            <h3 className="mt-0.5 font-serif text-xl font-semibold tracking-tight text-white">
              {chapter.title}
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-400">{chapter.subtitle}</p>
          </div>

          {done && (
            <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              ✓ Read
            </span>
          )}
        </div>

        <ul className="mt-4 space-y-1 border-t border-slate-800 pt-3">
          {chapter.sections.map((s) => (
            <li key={s.id} className="flex items-baseline gap-2 text-[12px] text-slate-500">
              <span
                className="w-8 shrink-0 font-mono text-[10px]"
                style={{ color: `${chapter.accent}bb` }}
              >
                {s.number}
              </span>
              <span className="truncate">{s.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center gap-3">
          <ProgressBar
            pct={pct}
            gradient={`linear-gradient(90deg, ${chapter.accent}, ${chapter.accent}66)`}
            className="flex-1"
          />
          <span className="shrink-0 font-mono text-[10px] text-slate-500">
            {readSections}/{chapter.sections.length} sections
          </span>
          <span
            className="shrink-0 text-[11px] font-bold transition-transform group-hover:translate-x-1"
            style={{ color: chapter.accent }}
          >
            Read →
          </span>
        </div>
      </div>
    </Link>
  )
}

/** The SQL book: cover, contents, and one card per written chapter. */
export default function SqlBook() {
  // Read once on mount: returning from a chapter remounts this page, so the
  // latest progress is picked up without an effect.
  const [progress] = useState(getProgress)

  const sections = totalSections()
  const read = progress.sections.length
  const chaptersDone = CHAPTERS.filter((c) => progress.chapters.includes(c.slug)).length

  // Where the reader should actually land. Deliberately the first chapter with
  // an unread *section*, not the first unfinished chapter: a reader who marked
  // a chapter done but added a new section to it should come back to it, and
  // this also means a reader who has finished everything is sent to the last
  // chapter rather than being dumped at the start of the book.
  const resume =
    CHAPTERS.find((c) => c.sections.some((s) => !progress.sections.includes(sectionKey(c.slug, s.id)))) ??
    CHAPTERS[CHAPTERS.length - 1]

  return (
    <div className="mx-auto max-w-4xl px-2 pb-6">
      <div className="mb-8 text-center">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-gradient">
          Academy
        </div>
        <h1 className="mt-2 bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          {BOOK.title}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{BOOK.tagline}</p>
        <div className="mt-4 flex justify-center">
          <Byline />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-sm leading-relaxed text-slate-400">{BOOK.blurb}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ProgressBar
            pct={sections ? Math.round((read / sections) * 100) : 0}
            gradient="linear-gradient(90deg, #34d399, #22d3ee)"
            className="min-w-32 flex-1"
          />
          <span className="font-mono text-[11px] text-slate-500">
            {read}/{sections} sections · {chaptersDone}/{CHAPTERS.length} chapters
          </span>
          <Link
            to={`/academy/sql/${resume.slug}`}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white outline-none transition-colors hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {read === 0 ? 'Start reading' : 'Continue'}
          </Link>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {PARTS.map((part) => {
          const partChapters = CHAPTERS.filter((c) => part.numbers.includes(c.number))
          if (partChapters.length === 0) return null
          return (
            <section key={part.label}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                  {part.label}
                </span>
                <span className="text-[13px] text-slate-500">{part.title}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {partChapters.map((c) => (
                  <ChapterCard
                    key={c.slug}
                    chapter={c}
                    readSections={
                      c.sections.filter((s) => progress.sections.includes(sectionKey(c.slug, s.id))).length
                    }
                    done={progress.chapters.includes(c.slug)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {UPCOMING_CHAPTERS.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
              Coming next
            </span>
            <span className="text-[13px] text-slate-600">
              The numbering is already in place — these chapters are just not written yet.
            </span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {UPCOMING_CHAPTERS.map((c) => (
              <li
                key={c.number}
                className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono text-[10px] font-black text-slate-600">
                  {String(c.number).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-slate-400">{c.title}</div>
                  <div className="truncate text-[11px] text-slate-600">{c.blurb}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
