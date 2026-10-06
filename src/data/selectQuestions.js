import { allSqlQuestions } from '../data/sql/index.js'

export const GUEST_QUESTION_LIMIT = 10

function normalizeTypes(types) {
  if (Array.isArray(types)) return new Set(types)
  const set = new Set()
  for (const [key, enabled] of Object.entries(types ?? {})) {
    if (enabled) set.add(key)
  }
  return set
}

export function selectQuestions({ types = { mc: true, write: true, bug: true }, difficulty = 'all', limit } = {}) {
  const typeSet = normalizeTypes(types)
  const questions = allSqlQuestions.filter((q) => {
    const typeOk = typeSet.has(q.type)
    const diffOk = difficulty === 'all' || q.difficulty === difficulty
    return typeOk && diffOk
  })
  if (Number.isFinite(limit) && limit > 0) return questions.slice(0, limit)
  return questions
}