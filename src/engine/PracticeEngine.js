import { checkPracticeAnswer } from './practiceChecker.js'
import { selectPracticeQuestions, PRACTICE_POINTS } from '../data/practice/practiceQuestions.js'

export const PRACTICE_STATUS = {
  READY: 'ready',
  QUESTION: 'question',
  FEEDBACK: 'feedback',
  FINISHED: 'finished',
}

const TOPIC_ORDER = { 'table-query': 0, joins: 1, aggregation: 2 }

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function shuffleQuestionOptions(question) {
  if (!Array.isArray(question.options) || question.options.length === 0) return question
  return { ...question, options: shuffle(question.options) }
}

export class PracticeEngine {
  constructor(questions, callbacks = {}) {
    this.pool = questions
    this.callbacks = callbacks
    this.listeners = new Set()
    this.topic = 'all'
    this.difficulty = 'all'
    this.types = 'all'
    this.status = PRACTICE_STATUS.READY
    this.sequence = []
    this.index = 0
    this.pass = 0
    this.score = 0
    this.answers = []
    this.runningAnswer = false
    this.startedAt = null
    this.elapsedSeconds = 0
    this._snapshot = null
  }

  subscribe(listener) {
    listener(this.snapshot())
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  get current() {
    return this.sequence[this.index] ?? null
  }

  get total() {
    return this.sequence.length
  }

  _buildDeck() {
    const matched = selectPracticeQuestions({
      questions: this.pool,
      topic: this.topic,
      difficulty: this.difficulty,
      types: this.types,
    })
    const groups = new Map()
    for (const q of matched) {
      const key = q.topic ?? 'undefined'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(q)
    }
    return [...groups.entries()]
      .sort((a, b) => (TOPIC_ORDER[a[0]] ?? 99) - (TOPIC_ORDER[b[0]] ?? 99))
      .flatMap(([, group]) => shuffle(group.map(shuffleQuestionOptions)))
  }

  start({ topic = 'all', difficulty = 'all', types = 'all' } = {}) {
    this.topic = topic
    this.difficulty = difficulty
    this.types = types
    this.sequence = this._buildDeck()
    this.index = 0
    this.pass = 0
    this.score = 0
    this.answers = []
    this.runningAnswer = false
    this.startedAt = Date.now()
    this.elapsedSeconds = 0
    this.status = PRACTICE_STATUS.QUESTION
    this._emit()
    return this.sequence.length
  }

  submit(selected) {
    if (this.status !== PRACTICE_STATUS.QUESTION || selected == null) return
    const question = this.current
    const check = checkPracticeAnswer(question, selected)
    this.answers.push({
      question,
      type: question.type,
      answer: check.selected,
      selected: check.selected,
      correct: check.correct,
      skipped: false,
      reason: check.correct
        ? undefined
        : `You chose "${check.selected}". The correct answer is "${check.correctAnswer}".`,
    })
    if (check.correct) {
      this.score += PRACTICE_POINTS[question.difficulty] ?? 10
    }
    this.status = PRACTICE_STATUS.FEEDBACK
    this._emit()
  }

  async submitQuery(sql) {
    if (this.status !== PRACTICE_STATUS.QUESTION || !sql?.trim()) return
    const question = this.current
    this.runningAnswer = true
    this._emit()
    const checkQuery =
      this.callbacks.checkQuery ??
      (async () => ({ correct: false, reason: 'Query checking is not available.' }))
    try {
      const result = await checkQuery(question, sql)
      this.answers.push({
        question,
        type: question.type,
        answer: sql,
        selected: null,
        correct: result.correct,
        skipped: false,
        actual: result.actual,
        reason: result.reason,
      })
      if (result.correct) {
        this.score += PRACTICE_POINTS[question.difficulty] ?? 10
      }
    } catch (e) {
      this.answers.push({
        question,
        type: question.type,
        answer: sql,
        selected: null,
        correct: false,
        skipped: false,
        actual: null,
        reason: e.message || 'Query failed.',
      })
    } finally {
      this.runningAnswer = false
      this.status = PRACTICE_STATUS.FEEDBACK
      this._emit()
    }
  }

  skip() {
    if (this.status !== PRACTICE_STATUS.QUESTION || this.runningAnswer) return
    const question = this.current
    this.answers.push({
      question,
      type: question.type,
      answer: null,
      selected: null,
      correct: false,
      skipped: true,
      actual: null,
      reason: 'Skipped.',
    })
    this.status = PRACTICE_STATUS.FEEDBACK
    this._emit()
  }

  next() {
    if (this.status !== PRACTICE_STATUS.FEEDBACK) return
    this.index += 1
    if (this.index >= this.sequence.length) {
      this.sequence = this._buildDeck()
      this.index = 0
      this.pass += 1
    }
    this.status = PRACTICE_STATUS.QUESTION
    this._emit()
  }

  end() {
    if (this.status === PRACTICE_STATUS.FINISHED) return
    this.status = PRACTICE_STATUS.FINISHED
    this.elapsedSeconds = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : this.elapsedSeconds
    this._emit()
  }

  reset() {
    this.status = PRACTICE_STATUS.READY
    this.sequence = []
    this.index = 0
    this.pass = 0
    this.score = 0
    this.answers = []
    this.runningAnswer = false
    this.elapsedSeconds = 0
    this._emit()
  }

  destroy() {
    this.elapsedSeconds = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : this.elapsedSeconds
    this.listeners.clear()
    this.callbacks = {}
  }

  _emit() {
    for (const listener of this.listeners) listener(this.snapshot())
    if (typeof this.callbacks.onState === 'function') this.callbacks.onState(this.snapshot())
  }

  snapshot() {
    if (this.startedAt && this.status !== PRACTICE_STATUS.FINISHED) {
      this.elapsedSeconds = Math.round((Date.now() - this.startedAt) / 1000)
    }
    const correct = this.answers.filter((a) => !a.skipped && a.correct).length
    const skipped = this.answers.filter((a) => a.skipped).length
    const wrong = this.answers.filter((a) => !a.skipped && !a.correct).length
    this._snapshot = {
      status: this.status,
      index: this.index,
      total: this.total,
      pass: this.pass,
      score: this.score,
      topic: this.topic,
      difficulty: this.difficulty,
      types: this.types,
      current: this.current,
      answers: [...this.answers],
      correct,
      wrong,
      graded: correct + wrong,
      skipped,
      answered: this.answers.length,
      runningAnswer: this.runningAnswer,
      finished: this.status === PRACTICE_STATUS.FINISHED,
      elapsedSeconds: this.elapsedSeconds,
    }
    return this._snapshot
  }
}

export default PracticeEngine