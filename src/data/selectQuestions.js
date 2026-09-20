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

function normalizeTypes(types) {
  if (Array.isArray(types)) return new Set(types)
  const set = new Set()
  for (const [key, enabled] of Object.entries(types ?? {})) {
    if (enabled) set.add(key)
  }
  return set
}

export function selectQuestions({ types = { mc: true, write: true, bug: true }, difficulty = 'all' } = {}) {
  const typeSet = normalizeTypes(types)
  return allSqlQuestions.filter((q) => {
    const typeOk = typeSet.has(q.type)
    const diffOk = difficulty === 'all' || q.difficulty === difficulty
    return typeOk && diffOk
  })
}

export function countByDifficulty(questions, difficulty) {
  if (difficulty === 'all') return questions.length
  return questions.filter((q) => q.difficulty === difficulty).length
}