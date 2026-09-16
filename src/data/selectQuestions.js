import { allSqlQuestions } from '../data/sql/index.js'

export const DIFFICULTY_LEVELS = {
  all: 'All levels',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const QUESTION_TYPE_LABELS = {
  mc: 'Multiple choice',
  write: 'Write a query',
  bug: 'Fix the bug',
}

export function selectQuestions({ types = { mc: true, write: true, bug: true }, difficulty = 'all' } = {}) {
  return allSqlQuestions.filter((q) => {
    const typeOk = types[q.type]
    const diffOk = difficulty === 'all' || q.difficulty === difficulty
    return typeOk && diffOk
  })
}

export function countByDifficulty(questions, difficulty) {
  if (difficulty === 'all') return questions.length
  return questions.filter((q) => q.difficulty === difficulty).length
}