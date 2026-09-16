import { checkMultipleChoice } from './AnswerChecker.js'

export const STATUS = {
  READY: 'ready',
  QUESTION: 'question',
  FEEDBACK: 'feedback',
  FINISHED: 'finished',
}

const POINTS = { easy: 100, medium: 200, hard: 300 }
const DEFAULT_LIVES = 3
const DEFAULT_TIME_PER_QUESTION = 30

export class QuizEngine {
  constructor(questions, callbacks = {}) {
    this.allQuestions = questions
    this.callbacks = callbacks
    this.listeners = new Set()
    this.sequence = []
    this.status = STATUS.READY
    this.index = 0
    this.score = 0
    this.lives = DEFAULT_LIVES
    this.timeLeft = DEFAULT_TIME_PER_QUESTION
    this.timer = null
    this.answers = []
    this.runningAnswer = false
    this.currentError = null
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

  start(mix = { mc: true, write: true, bug: true }) {
    this.sequence = this.allQuestions.filter((q) => mix[q.type])
    if (this.sequence.length === 0) this.sequence = [...this.allQuestions]
    this.status = STATUS.QUESTION
    this.index = 0
    this.score = 0
    this.lives = DEFAULT_LIVES
    this.answers = []
    this.runningAnswer = false
    this.currentError = null
    this.startedAt = Date.now()
    this.elapsedSeconds = 0
    this._startTimer('ready')
    this._emit()
  }

  _startTimer() {
    this.timeLeft = DEFAULT_TIME_PER_QUESTION
    this._stopTimer()
    this.timer = setInterval(() => {
      this.timeLeft -= 1
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        this._handleTimeout()
      }
      this._emit()
    }, 1000)
  }

  _stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  _handleTimeout() {
    if (this.status !== STATUS.QUESTION) return
    this._finishQuestion({
      correct: false,
      reason: 'Time ran out.',
      timedOut: true,
      answer: null,
    })
  }

  submitMultipleChoice(selectedIndex) {
    if (this.status !== STATUS.QUESTION) return
    const question = this.current
    const check = checkMultipleChoice(question, selectedIndex)
    this._finishQuestion({
      correct: check.correct,
      reason: check.correct
        ? undefined
        : `You chose "${question.options[selectedIndex]}". The correct answer is "${question.options[question.answerIndex]}".`,
      answer: selectedIndex,
    })
  }

  async submitQuery(sql) {
    if (this.status !== STATUS.QUESTION) return
    const question = this.current
    this.runningAnswer = true
    this.currentError = null
    this._emit()
    try {
      const result = await this.callbacks.checkQuery(question, sql)
      this._finishQuestion({
        correct: result.correct,
        reason: result.reason,
        answer: sql,
        actualResult: result.actual,
      })
    } catch (error) {
      this.currentError = error.message || String(error)
    } finally {
      this.runningAnswer = false
    }
    if (this.status === STATUS.QUESTION) this._emit()
  }

  _finishQuestion(record) {
    this._stopTimer()
    const question = this.current
    this.answers.push({ question, ...record })
    if (record.correct) {
      this.score += POINTS[question.difficulty] ?? 100
    } else {
      this.lives -= 1
    }
    this.status = STATUS.FEEDBACK
    this._emit()
  }

  next() {
    if (this.status !== STATUS.FEEDBACK) return
    this.index += 1
    if (this.index >= this.sequence.length || this.lives <= 0) {
      this.status = STATUS.FINISHED
      this._emit()
      return
    }
    this.status = STATUS.QUESTION
    this._startTimer()
    this._emit()
  }

  reset() {
    this._stopTimer()
    this.status = STATUS.READY
    this.index = 0
    this.score = 0
    this.lives = DEFAULT_LIVES
    this.answer = null
    this.answers = []
    this.runningAnswer = false
    this.currentError = null
    this._emit()
  }

  destroy() {
    this._stopTimer()
    this.elapsedSeconds = this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : this.elapsedSeconds
    this.listeners.clear()
    this.callbacks = {}
  }

  _emit() {
    for (const listener of this.listeners) listener(this.snapshot())
    if (typeof this.callbacks.onState === 'function') {
      this.callbacks.onState(this.snapshot())
    }
  }

  snapshot() {
    if (this.startedAt) {
      this.elapsedSeconds = Math.round((Date.now() - this.startedAt) / 1000)
    }
    this._snapshot = {
      status: this.status,
      index: this.index,
      total: this.total,
      score: this.score,
      lives: this.lives,
      timeLeft: this.timeLeft,
      current: this.current,
      runningAnswer: this.runningAnswer,
      currentError: this.currentError,
      answers: [...this.answers],
      finished: this.status === STATUS.FINISHED,
      elapsedSeconds: this.elapsedSeconds,
    }
    return this._snapshot
  }
}

export default QuizEngine