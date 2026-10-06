import { CHAPTERS } from '../book.js'
import ch01 from './ch01-questions.js'
import ch02 from './ch02-questions.js'
import ch03 from './ch03-questions.js'
import ch04 from './ch04-questions.js'
import ch05 from './ch05-questions.js'
import ch06 from './ch06-questions.js'
import ch07 from './ch07-questions.js'
import ch08 from './ch08-questions.js'

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

export function questionsForSection(chapterSlug, sectionId) {
  return BY_CHAPTER[chapterSlug]?.[sectionId] ?? []
}

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
