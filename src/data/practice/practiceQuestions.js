import bundled from './practice-questions.json'

export const PRACTICE_TOPICS = {
  'table-query': 'Table Query',
  joins: 'Joins',
  aggregation: 'Aggregation',
}

export const PRACTICE_DIFFICULTIES = {
  all: 'All levels',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const PRACTICE_TYPES = {
  all: 'All types',
  mc: 'Multiple choice',
  write: 'Write a query',
  bug: 'Fix the bug',
}

export const PRACTICE_POINTS = { easy: 10, medium: 20, hard: 30 }

let loaded = null

export const allPracticeQuestions = bundled

export function loadPracticeQuestions() {
  if (!loaded) loaded = bundled
  return Promise.resolve(loaded)
}

export function selectPracticeQuestions({ questions = [], topic = 'all', difficulty = 'all', types = 'all' } = {}) {
  return questions.filter((q) => {
    const topicOk = topic === 'all' || q.topic === topic
    const difficultyOk = difficulty === 'all' || q.difficulty === difficulty
    const typesOk = types === 'all' || q.type === types
    return topicOk && difficultyOk && typesOk
  })
}

export function countPracticeQuestions(questions, topic = 'all', difficulty = 'all', types = 'all') {
  if (topic === 'all' && difficulty === 'all' && types === 'all') return questions.length
  return selectPracticeQuestions({ questions, topic, difficulty, types }).length
}