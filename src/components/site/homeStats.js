import { allSqlQuestions } from '../../data/sql/index.js'
import { CHAPTERS } from '../../data/academy/book.js'
import practiceBank from '../../data/practice/practice-questions.json'

const practiceQuestions = Array.isArray(practiceBank) ? practiceBank : []

// Every number the landing page shows is derived here from the real question
// banks and book data — never a literal — so the home page cannot drift from
// what the games actually ship with.
export const HOME_STATS = [
  { key: 'quiz', label: 'Quiz questions', value: allSqlQuestions.length },
  { key: 'practice', label: 'Practice problems', value: practiceQuestions.length },
  { key: 'chapters', label: 'Book chapters', value: CHAPTERS.length },
]

// Featured SQL card badges, also drawn from the live quiz bank: the number of
// distinct difficulty tiers present and the total question count.
export const SQL_CARD_STATS = {
  levels: new Set(allSqlQuestions.map((question) => question.difficulty)).size,
  questions: allSqlQuestions.length,
}

// The "Quick Stats" card's non-personal tiles. `questions` sums every real
// question bank that ships with the app — the SQL quiz bank and the practice
// bank — so it can never drift from what the games actually ship with.
export const QUICK_STATS = {
  chapters: CHAPTERS.length,
  questions: allSqlQuestions.length + practiceQuestions.length,
}
