import { CHAPTERS } from '../book.js'
import ch01 from './ch01-questions.js'
import ch02 from './ch02-questions.js'
import ch03 from './ch03-questions.js'
import ch04 from './ch04-questions.js'
import ch05 from './ch05-questions.js'
import ch06 from './ch06-questions.js'
import ch07 from './ch07-questions.js'
import ch08 from './ch08-questions.js'

/**
 * Questions for the end-of-section check-yourself quizzes, keyed by section id.
 *
 * A chapter with no entry here simply has no questions yet, so the book can be
 * written chapter by chapter and `questionsForSection` returns an empty list.
 * `scripts/verify-lessons.mjs` prints the coverage on every run so a chapter
 * cannot be left unwritten without it showing up.
 */
const BY_CHAPTER = {
  'reading-data': ch01,
  filtering: ch02,
  'sorting-limiting': ch03,
  joins: ch04,
  subqueries: ch05,
  aggregation: ch06,
  'modify-data': ch07,
  'ctes-windows': ch08,
}

/** Flat list of every question in the book, for id-uniqueness checks. */
export function allQuestions() {
  return Object.values(BY_CHAPTER).flatMap((bySection) => Object.values(bySection).flat())
}

export function questionsForSection(chapterSlug, sectionId) {
  return BY_CHAPTER[chapterSlug]?.[sectionId] ?? []
}

export function questionsForChapter(chapterSlug) {
  return CHAPTERS.find((c) => c.slug === chapterSlug)?.sections.map((s) => ({
    section: s,
    questions: questionsForSection(chapterSlug, s.id),
  }))
}

/** Sections that exist but have no questions written for them yet. */
export function sectionsWithoutQuestions() {
  const missing = []
  for (const chapter of CHAPTERS) {
    for (const section of chapter.sections) {
      if (questionsForSection(chapter.slug, section.id).length === 0) {
        missing.push(`${chapter.number}.${section.number.split('.')[1]} ${section.id}`)
      }
    }
  }
  return missing
}
