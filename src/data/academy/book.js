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
}

export const LEARNING_GAMES = [
  {
    key: 'sql',
    title: 'SQL Learning',
    tagline: 'Read · Practise · Master',
    desc: 'A complete book on SQL, from your first SELECT through to window functions.',
    accent: 'from-brand-100 via-brand-50 to-brand-100',
    glow: 'from-brand-100/70 via-brand-50/60 to-transparent',
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    tag: 'text-brand-600',
    arrow: 'text-brand-700 group-hover:text-brand-700',
    href: '/academy/sql',
    soon: false,
  },
  {
    key: 'mongo',
    title: 'MongoDB Learning',
    tagline: 'Documents & Pipelines',
    desc: 'Same book, same layout — built around documents and aggregation pipelines instead of tables.',
    accent: 'from-leaf-100 via-brand-50 to-brand-100',
    glow: 'from-leaf-100/70 via-brand-50/60 to-transparent',
    badge: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    tag: 'text-leaf-600',
    arrow: 'text-leaf-700 group-hover:text-leaf-600',
    soon: true,
  },
]

export const CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08]

export const PARTS = [
  { label: 'Part One', title: 'Reading, filtering, ordering and combining', numbers: [1, 2, 3, 4, 5] },
  { label: 'Part Two', title: 'Analysing, changing, and stepping back', numbers: [6, 7, 8] },
]

const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))

export function getChapter(slug) {
  return CHAPTER_BY_SLUG.get(slug) ?? null
}

export function sectionKey(chapterSlug, sectionId) {
  return `${chapterSlug}--${sectionId}`
}

function chapterIndex(slug) {
  return CHAPTERS.findIndex((c) => c.slug === slug)
}

export function neighbour(slug, offset) {
  const i = chapterIndex(slug) + offset
  return i >= 0 && i < CHAPTERS.length ? CHAPTERS[i] : null
}

export function totalSections() {
  return CHAPTERS.reduce((n, c) => n + c.sections.length, 0)
}

// Counts for the Academy "Quick Stats" strip. Everything is derived from the
// registered chapters (never a literal), so the strip cannot drift from the book:
// - chapters: every registered chapter (one chapter file each)
// - examples: runnable worked examples — `code` consoles plus `dml` statements,
//   the same two block types scripts/verify-lessons.mjs executes
// - referenceTables: the static `result` tables the reader inspects
export function academyStats() {
  let examples = 0
  let referenceTables = 0
  for (const chapter of CHAPTERS) {
    for (const section of chapter.sections) {
      for (const block of section.blocks) {
        if (block.type === 'code' || block.type === 'dml') examples += 1
        else if (block.type === 'result') referenceTables += 1
      }
    }
  }
  return {
    chapters: CHAPTERS.length,
    sections: totalSections(),
    examples,
    referenceTables,
  }
}
