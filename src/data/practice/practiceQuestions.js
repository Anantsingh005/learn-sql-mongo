import bundled from './practice-questions.json'
import { getQuizHelp } from '../quizHelp.js'

const SECTION_TO_TOPIC = {
  'Reading Data': 'table-query',
  'Filtering Data': 'table-query',
  'Sorting Data': 'table-query',
  'Joins & Relationships': 'joins',
  Aggregation: 'aggregation',
}

const practiceTopicCache = new WeakMap()

export function practiceTopicOf(question) {
  if (practiceTopicCache.has(question)) return practiceTopicCache.get(question)
  const mapped = SECTION_TO_TOPIC[getQuizHelp(question).section]
  const topic = mapped ?? question.topic
  practiceTopicCache.set(question, topic)
  return topic
}

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

export function loadPracticeQuestions() {
  if (!loaded) loaded = bundled
  return Promise.resolve(loaded)
}

export function selectPracticeQuestions({ questions = [], topic = 'all', difficulty = 'all', types = 'all' } = {}) {
  return questions.filter((q) => {
    const topicOk = topic === 'all' || practiceTopicOf(q) === topic
    const difficultyOk = difficulty === 'all' || q.difficulty === difficulty
    const typesOk = types === 'all' || q.type === types
    return topicOk && difficultyOk && typesOk
  })
}

export function countPracticeQuestions(questions, topic = 'all', difficulty = 'all', types = 'all') {
  if (topic === 'all' && difficulty === 'all' && types === 'all') return questions.length
  return selectPracticeQuestions({ questions, topic, difficulty, types }).length
}