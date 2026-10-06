import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  PRACTICE_TOPICS,
  PRACTICE_DIFFICULTIES,
  PRACTICE_TYPES,
} from '../data/practice/practiceQuestions.js'
import { loadPracticeQuestions, countPracticeQuestions } from '../data/practice/practiceQuestions.js'
import { chapterSlugForQuestion } from '../data/academy/lessonFor.js'
import { CHAPTERS } from '../data/academy/book.js'
import { PracticeEngine, PRACTICE_STATUS } from '../engine/PracticeEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import QueryRunner from '../engine/QueryRunner.js'
import useQuizEngine from '../hooks/useQuizEngine.js'
import SqlEditor from '../components/quiz/SqlEditor.jsx'
import SchemaPanel from '../components/quiz/SchemaPanel.jsx'
import HintReveal from '../components/quiz/HintReveal.jsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))
const TYPE_LABELS = { mc: 'Multiple choice', write: 'Write a query', bug: 'Fix the bug' }
const TYPE_COLORS = {
  mc: 'bg-brand-50 text-brand-700',
  write: 'bg-leaf-50 text-leaf-700',
  bug: 'bg-amber-50 text-amber-700',
}

const GAMES = [
  {
    key: 'sql',
    title: 'SQL',
    tagline: 'Queries, joins & aggregations',
    desc: 'Practice multiple choice, write real queries, and fix buggy SQL against a live in-browser database.',
    icon: '{ }',
    accent: 'from-brand-100 via-brand-50 to-brand-100',
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    hover: 'hover:border-brand-200',
  },
  {
    key: 'mongo',
    title: 'MongoDB',
    tagline: 'Documents & aggregation pipelines',
    desc: 'MongoDB practice is coming soon.',
    icon: 'DB',
    accent: 'from-leaf-100 via-brand-50 to-brand-100',
    badge: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    hover: 'hover:border-leaf-200',
    comingSoon: true,
  },
]

function Chip({ children, className }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  )
}

function PracticeHUD({ snapshot }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-100 via-plum-100 to-brand-100 opacity-70" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-line px-2 py-1 font-mono text-xs text-muted">
            Q <span className="font-bold text-brand-700">{snapshot.index + 1}</span>/{snapshot.total}
          </span>
          {snapshot.pass > 0 && (
            <span className="rounded-md bg-plum-50 px-2 py-1 font-mono text-xs font-bold text-plum-700">
              pass {snapshot.pass + 1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            {snapshot.correct}
            <span className="mx-1 text-body">/</span>
            {snapshot.graded} correct
          </span>
          <span className="font-mono text-xs text-muted">{snapshot.wrong} wrong</span>
          <span className="font-mono text-xs text-muted">{snapshot.answered} practiced</span>
          <span className="font-mono text-sm text-muted">
            Score{' '}
            <span className="text-lg font-bold text-amber-700 drop-shadow-[0_0_10px_rgba(#a5680f,0.22)]">
              {snapshot.score}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

function PracticeButton({ option, label, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed ${
        selected
          ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
          : 'border-line bg-line/60 text-muted hover:border-line hover:bg-line'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
          selected ? 'bg-brand-600 text-white' : 'bg-line text-muted group-hover:bg-line-soft'
        }`}
      >
        {label}
      </span>
      <code className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{option}</code>
    </button>
  )
}

function QuestionView({ question, selected, onSelect, isFeedback }) {
  const diffColor =
    question.difficulty === 'easy'
      ? 'bg-line text-muted'
      : question.difficulty === 'medium'
        ? 'bg-brand-50 text-brand-700'
        : 'bg-danger-50 text-danger-700'
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  return (
    <article className="rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Chip className={TYPE_COLORS[question.type] ?? 'bg-brand-50 text-brand-700'}>
          {TYPE_LABELS[question.type] ?? 'Multiple choice'}
        </Chip>
        <Chip className={diffColor}>{question.difficulty}</Chip>
        <span className="text-muted">{question.subtopic}</span>
        {chapter && (
          <Link
            to={`/academy/sql/${chapter.slug}`}
            className="rounded-full border border-line px-2.5 py-0.5 text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            📖 Ch {chapter.number} · {chapter.title}
          </Link>
        )}
      </div>

      <h2 className="mt-3 whitespace-pre-wrap font-mono text-lg font-medium leading-relaxed text-body">
        {question.question}
      </h2>

      {question.type === 'bug' && question.buggyQuery && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-muted">Buggy query — find the bug:</div>
          <pre className="overflow-x-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-amber-700">
            {question.buggyQuery}
          </pre>
        </div>
      )}

      {(question.type === 'write' || question.type === 'bug') && <SchemaPanel schema={question.schema} />}

      {question.type === 'mc' && question.schema && <SchemaPanel schema={question.schema} />}

      {question.type === 'mc' && (
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((opt, i) => (
            <PracticeButton
              key={i}
              label={OPTION_LABELS[i]}
              option={opt}
              selected={selected === opt}
              onSelect={() => onSelect(opt)}
              disabled={isFeedback}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function QuerySection({ question, onSubmit, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      {!disabled && <HintReveal hint={question.hint} />}
      <SqlEditor key={question.id} question={question} onSubmit={onSubmit} disabled={disabled} />
    </div>
  )
}

function Feedback({ answer, onNext }) {
  if (!answer) return null
  const correct = answer.correct
  const isQuery = answer.type === 'write' || answer.type === 'bug'
  return (
    <div className="rounded-2xl border p-6">
      <div
        className={`mb-4 flex items-center gap-3 rounded-lg px-4 py-3 ${
          correct ? 'border border-leaf-200 bg-leaf-50' : 'border border-danger-200 bg-danger-50'
        }`}
      >
        <span className={`text-xl font-black ${correct ? 'text-leaf-700' : 'text-danger-700'}`}>
          {answer.skipped ? 'Skipped' : correct ? 'Correct!' : 'Incorrect'}
        </span>
        {answer.reason && <span className="text-sm text-muted">{answer.reason}</span>}
      </div>

      {isQuery && answer.answer != null && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-muted">Your query:</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] text-leaf-700">
            {answer.answer}
          </pre>
        </div>
      )}

      {isQuery && answer.actual && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-muted">Actual result (rows returned: {answer.actual.rows?.length ?? 0}):</p>
          <pre className="overflow-x-auto rounded-lg border border-line bg-white px-3 py-2 font-mono text-[13px] text-muted">
            {JSON.stringify(answer.actual, null, 2)}
          </pre>
        </div>
      )}

      {isQuery && !answer.skipped && answer.question.fixedQuery && (
        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-leaf-700">Fixed query:</p>
          <pre className="overflow-x-auto rounded-lg border border-leaf-200 bg-leaf-50 px-3 py-2 font-mono text-[13px] text-leaf-700">
            {answer.question.fixedQuery}
          </pre>
        </div>
      )}

      {answer.question.explanation && (
        <div className="mt-3 rounded-lg border border-line bg-line/50 px-4 py-3">
          <div className="text-sm font-semibold text-muted">Why</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{answer.question.explanation}</p>
        </div>
      )}
      <div className="mt-5 flex items-center justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Next question
        </button>
      </div>
    </div>
  )
}

function ChoiceGroup({ label, options, value, onSelect }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([key, optionLabel]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`relative rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              value === key
                ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
                : 'border-line bg-line/60 text-muted hover:border-line hover:bg-line'
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

function GameSelect({ onPick }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-brand-700 via-brand-600 to-plum-600 bg-clip-text font-mono text-3xl font-black tracking-tight text-transparent">
          More Practice
        </h1>
        <p className="mt-2 text-sm text-muted">Unlimited practice, no lives, no timer. Pick a database to start.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => !g.comingSoon && onPick(g.key)}
            className="group relative rounded-2xl text-left outline-none"
          >
            <div
              className={`pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r ${g.accent} opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div
              className={`relative overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 ${
                g.comingSoon ? 'border-line grayscale' : `${g.hover} group-hover:-translate-y-1`
              }`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${g.accent} opacity-80`} />
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-lg font-black ${g.badge}`}
              >
                {g.icon}
              </div>
              <div className="mt-4 font-mono text-lg font-bold text-ink">{g.title}</div>
              <div className="mt-1 text-sm font-medium text-muted">{g.tagline}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{g.desc}</p>
              {g.comingSoon ? (
                <span className="mt-5 inline-block rounded-full bg-line px-3 py-1 text-xs font-semibold text-body">
                  Coming soon
                </span>
              ) : (
                <span className="mt-5 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                  Select →
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MongoComingSoon({ onBack }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <div className="font-mono text-2xl font-bold text-ink">MongoDB Practice</div>
        <p className="mt-4 text-muted">
          MongoDB practice is coming soon. The same engine already powers SQL practice.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-lg border border-line px-5 py-2 text-sm font-semibold text-body transition-colors hover:bg-line"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}

function Picker({ topic, difficulty, types, onTopic, onDifficulty, onTypes, bank, onStart, onBack }) {
  const available = countPracticeQuestions(bank, topic, difficulty, types)
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">More Practice · SQL</div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-medium text-muted transition-colors hover:text-body"
          >
            ← SQL / MongoDB
          </button>
        )}
        <h1 className="text-lg font-bold text-ink">Pick your practice</h1>
        <p className="mt-1 text-sm text-muted">
          Choose the question type, topic, and level you want to drill.
        </p>

        <ChoiceGroup label="Question type" options={PRACTICE_TYPES} value={types} onSelect={onTypes} />
        <ChoiceGroup label="Topic" options={{ all: 'All topics', ...PRACTICE_TOPICS }} value={topic} onSelect={onTopic} />
        <ChoiceGroup label="Level" options={PRACTICE_DIFFICULTIES} value={difficulty} onSelect={onDifficulty} />

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-muted">{available} questions available</span>
          <button
            type="button"
            onClick={onStart}
            disabled={available === 0}
            className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start practicing
          </button>
        </div>
      </div>
    </div>
  )
}

function Results({ snapshot, onReplay, onChangeSettings }) {
  const percent = snapshot.graded > 0 ? Math.round((snapshot.correct / snapshot.graded) * 100) : 0
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted">Practice session</div>
        <div className="mt-2 text-5xl font-black text-ink">{percent}%</div>
        <div className="mt-2 text-sm text-muted">
          You practiced{' '}
          <span className="font-bold text-ink">
            {snapshot.answered} {snapshot.answered === 1 ? 'question' : 'questions'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 font-mono text-sm text-muted">
          <span>
            <span className="font-bold text-leaf-700">{snapshot.correct}</span> correct
          </span>
          <span className="text-body">·</span>
          <span>
            <span className="font-bold text-danger-700">{snapshot.wrong}</span> wrong
          </span>
          {snapshot.skipped > 0 && (
            <>
              <span className="text-body">·</span>
              <span>
                <span className="font-bold text-body">{snapshot.skipped}</span> skipped
              </span>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 font-mono text-sm text-muted">
          <span>
            Score <span className="text-lg font-bold text-brand-700">{snapshot.score}</span>
          </span>
          <span className="font-sans text-xs">{snapshot.elapsedSeconds}s</span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Practice again
          </button>
          <button
            type="button"
            onClick={onChangeSettings}
            className="rounded-lg border border-line px-5 py-2 font-semibold text-body transition-colors hover:bg-line"
          >
            Change settings
          </button>
          <Link
            to="/"
            className="rounded-lg border border-line px-5 py-2 font-semibold text-body transition-colors hover:bg-line"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function Practice() {
  const [params] = useSearchParams()
  const topicParam = params.get('topic')
  const prefilled =
    topicParam && Object.prototype.hasOwnProperty.call(PRACTICE_TOPICS, topicParam) ? topicParam : null

  const [bank, setBank] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [game, setGame] = useState(() => (prefilled ? 'sql' : null))
  const [topic, setTopic] = useState(prefilled ?? 'all')
  const [difficulty, setDifficulty] = useState('all')
  const [types, setTypes] = useState('all')
  const [engine, setEngine] = useState(null)
  const [selected, setSelected] = useState(null)
  const snapshot = useQuizEngine(engine)

  useEffect(() => {
    let active = true
    loadPracticeQuestions()
      .then((questions) => {
        if (active) setBank(questions)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => engine?.destroy()
  }, [engine])

  const handleStart = (startOptions = { topic, difficulty, types }) => {
    const nextEngine = new PracticeEngine(bank, { checkQuery: buildCheckQuery(QueryRunner) })
    setEngine((prev) => {
      prev?.destroy()
      return nextEngine
    })
    setSelected(null)
    const count = nextEngine.start(startOptions)
    if (count === 0) {
      setEngine((prev) => {
        prev?.destroy()
        return null
      })
    }
  }

  const handleChangeSettings = () => {
    setEngine((prev) => {
      prev?.destroy()
      return null
    })
    setSelected(null)
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-700">
          Couldn't load practice questions. Please try again later.
        </div>
      </div>
    )
  }

  if (!bank) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">
          Loading practice questions…
        </div>
      </div>
    )
  }

  if (!engine) {
    if (!game) return <GameSelect onPick={setGame} />
    if (game === 'mongo') return <MongoComingSoon onBack={() => setGame(null)} />
    return (
      <Picker
        topic={topic}
        difficulty={difficulty}
        types={types}
        onTopic={setTopic}
        onDifficulty={setDifficulty}
        onTypes={setTypes}
        bank={bank}
        onStart={() => handleStart()}
        onBack={() => setGame(null)}
      />
    )
  }

  if (snapshot?.status === PRACTICE_STATUS.FINISHED) {
    return <Results snapshot={snapshot} onReplay={() => handleStart({ topic, difficulty, types })} onChangeSettings={handleChangeSettings} />
  }

  if (!snapshot || snapshot.status === PRACTICE_STATUS.READY) return null

  const question = snapshot.current
  const isFeedback = snapshot.status === PRACTICE_STATUS.FEEDBACK
  const lastAnswer = snapshot.answers[snapshot.answers.length - 1]
  const isMc = question.type === 'mc'
  const summary = [
    PRACTICE_TYPES[snapshot.types] ?? snapshot.types,
    snapshot.topic !== 'all' ? PRACTICE_TOPICS[snapshot.topic] : 'All topics',
    snapshot.difficulty !== 'all' ? PRACTICE_DIFFICULTIES[snapshot.difficulty] : 'All levels',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">{summary}</span>
        <button
          type="button"
          onClick={() => engine.end()}
          className="rounded-lg border border-danger-200 px-4 py-1.5 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50"
        >
          End practice
        </button>
      </div>

      <PracticeHUD snapshot={snapshot} />

      <QuestionView
        key={question.id + String(isFeedback)}
        question={question}
        selected={selected}
        onSelect={(opt) => !isFeedback && setSelected(opt)}
        isFeedback={isFeedback}
      />

      {!isMc && !isFeedback && (
        <QuerySection
          question={question}
          onSubmit={(sql) => engine.submitQuery(sql)}
          disabled={snapshot.runningAnswer}
        />
      )}

      {!isFeedback && (
        isMc ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">
              {selected === null ? 'Select an answer above' : 'Ready to submit'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => engine.skip()}
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-line"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={selected === null}
                onClick={() => engine.submit(selected)}
                className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Run your query above, then check it</span>
            <button
              type="button"
              onClick={() => engine.skip()}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-line"
            >
              Skip
            </button>
          </div>
        )
      )}

      {isFeedback && (
        <Feedback
          answer={lastAnswer}
          onNext={() => {
            setSelected(null)
            engine.next()
          }}
        />
      )}
    </div>
  )
}

export default Practice