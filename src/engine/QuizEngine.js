import { checkMultipleChoice } from './AnswerChecker.js'
import { shuffleOptions } from './shuffleOptions.js'

export const STATUS = {
  READY: 'ready',
  QUESTION: 'question',
  FEEDBACK: 'feedback',
  FINISHED: 'finished',
}

const POINTS = { easy: 100, medium: 200, hard: 300 }
const DEFAULT_LIVES = 3
const DEFAULT_TIME_PER_QUESTION = 30
const DEFAULT_EXTRA_TIME_SECONDS = 60
const DEFAULT_EXTRA_TIME_THRESHOLD = 10

export class QuizEngine {
  constructor(questions, callbacks = {}, options = {}) {
    this.allQuestions = questions
    this.callbacks = callbacks
    this.listeners = new Set()
    this.sequence = []
    this.status = STATUS.READY
    this.index = 0
    this.score = 0
    this.lives = DEFAULT_LIVES
    this.timePerQuestion = options.timePerQuestion ?? DEFAULT_TIME_PER_QUESTION
    this.timeLeft = this.timePerQuestion
    this.extraTimeEnabled = Boolean(options.extraTime)
    this.extraTimeSeconds = options.extraTime?.seconds ?? DEFAULT_EXTRA_TIME_SECONDS
    this.extraTimeThreshold = options.extraTime?.threshold ?? DEFAULT_EXTRA_TIME_THRESHOLD
    this.extraTimePending = false
    this.extraTimeArmed = true
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
    const types = new Set(
      Array.isArray(mix)
        ? mix
        : Object.entries(mix).filter(([, enabled]) => enabled).map(([key]) => key),
    )
    this.sequence = this.allQuestions.filter((q) => types.has(q.type))
    if (this.sequence.length === 0) this.sequence = [...this.allQuestions]
    this.sequence = this.sequence.map(shuffleOptions)
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
    this.timeLeft = this.timePerQuestion
    this.extraTimePending = false
    this.extraTimeArmed = true
    this._stopTimer()
    this.timer = setInterval(() => {
      if (this.extraTimePending) return
      this.timeLeft -= 1
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        this._handleTimeout()
      }
      if (this.extraTimeEnabled && this.timeLeft >= this.extraTimeThreshold) {
        this.extraTimeArmed = true
      }
      if (
        this.extraTimeEnabled &&
        this.extraTimeArmed &&
        this.timeLeft > 0 &&
        this.timeLeft < this.extraTimeThreshold
      ) {
        this.extraTimeArmed = false
        this.extraTimePending = true
      }
      this._emit()
    }, 1000)
  }

  grantExtraTime() {
    if (!this.extraTimePending) return
    this.timeLeft += this.extraTimeSeconds
    this.extraTimePending = false
    if (this.timeLeft >= this.extraTimeThreshold) this.extraTimeArmed = true
    this._emit()
  }

  declineExtraTime() {
    if (!this.extraTimePending) return
    this.extraTimePending = false
    this._emit()
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
    this.timeLeft = this.timePerQuestion
    this.extraTimePending = false
    this.extraTimeArmed = true
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
      extraTimePending: this.extraTimePending,
      extraTimeSeconds: this.extraTimeSeconds,
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