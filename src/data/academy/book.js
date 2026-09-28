import ch01 from './chapters/ch01-reading-data.js'
import ch02 from './chapters/ch02-filtering.js'
import ch03 from './chapters/ch03-sorting-limiting.js'
import ch04 from './chapters/ch04-joins.js'
import ch05 from './chapters/ch05-subqueries.js'
import ch06 from './chapters/ch06-aggregation.js'
import ch07 from './chapters/ch07-modifying-data.js'
import ch08 from './chapters/ch08-ctes-windows.js'

export const BOOK = {
  title: 'SQL Foundations',
  tagline: 'Read the book, then play the game.',
  blurb:
    'Every chapter explains one piece of SQL properly — the theory, a worked example you can check, the tables behind it, and the mistakes that cost marks. Written against the same SQLite database SQL Quiz uses.',
  author: 'Anant Singh',
  edition: 'Edition 1',
}

export const LEARNING_GAMES = [
  {
    key: 'sql',
    title: 'SQL Learning',
    tagline: 'Read · Practise · Master',
    desc: 'A complete book on SQL, from your first SELECT through to window functions.',
    accent: 'from-indigo-400 via-sky-400 to-cyan-400',
    glow: 'from-indigo-500/50 via-blue-500/25 to-cyan-400/50',
    strip: 'from-indigo-400 to-cyan-400',
    badge: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
    tag: 'text-indigo-400/90',
    arrow: 'text-indigo-300 group-hover:text-cyan-300',
    href: '/academy/sql',
    soon: false,
  },
  {
    key: 'mongo',
    title: 'MongoDB Learning',
    tagline: 'Documents & Pipelines',
    desc: 'Same book, same layout — built around documents and aggregation pipelines instead of tables.',
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    glow: 'from-emerald-500/50 via-teal-500/25 to-cyan-400/50',
    strip: 'from-emerald-400 to-teal-400',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    tag: 'text-emerald-400/90',
    arrow: 'text-emerald-300 group-hover:text-teal-400',
    soon: true,
  },
]

/** Chapters that are written and readable. Order is the reading order. */
export const CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08]

/**
 * Chapters that are planned but not written yet. They are kept here so the
 * numbering, the parts and the table of contents are already correct — nothing
 * links to them until there is something to read. `isUpcoming` returns false
 * for everything while this is empty, which is the state Part One of the book
 * is in now that all eight chapters exist.
 */
export const UPCOMING_CHAPTERS = []

export const PARTS = [
  { label: 'Part One', title: 'Reading, filtering, ordering and combining', numbers: [1, 2, 3, 4, 5] },
  { label: 'Part Two', title: 'Analysing, changing, and stepping back', numbers: [6, 7, 8] },
]

const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))

export function getChapter(slug) {
  return CHAPTER_BY_SLUG.get(slug) ?? null
}

/** Storage key and DOM id for one section, namespaced by its chapter. */
export function sectionKey(chapterSlug, sectionId) {
  return `${chapterSlug}--${sectionId}`
}

export function chapterNumber(slug) {
  return CHAPTER_BY_SLUG.get(slug)?.number ?? null
}

/** 0-based position in the book, or -1. Used for the prev/next footer. */
export function chapterIndex(slug) {
  return CHAPTERS.findIndex((c) => c.slug === slug)
}

export function neighbour(slug, offset) {
  const i = chapterIndex(slug) + offset
  return i >= 0 && i < CHAPTERS.length ? CHAPTERS[i] : null
}

export function totalSections() {
  return CHAPTERS.reduce((n, c) => n + c.sections.length, 0)
}

export function isUpcoming(number) {
  return UPCOMING_CHAPTERS.some((c) => c.number === number)
}
