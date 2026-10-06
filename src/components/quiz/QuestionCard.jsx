import { Link } from 'react-router-dom'
import { chapterSlugForQuestion } from '../../data/academy/lessonFor.js'
import { CHAPTERS } from '../../data/academy/book.js'
import HintReveal from './HintReveal.jsx'
import SchemaPanel from './SchemaPanel.jsx'

const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))

function Chip({ children, color }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${color}`}>
      {children}
    </span>
  )
}

function OptionButton({ label, text, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
          : 'border-line bg-line/60 text-muted hover:border-line hover:bg-line'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
          selected
            ? 'bg-brand-600 text-white'
            : 'bg-line text-muted group-hover:bg-line-soft'
        }`}
      >
        {label}
      </span>
      <code className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{text}</code>
    </button>
  )
}

function QuestTypeIndicator({ type, difficulty, topic, question }) {
  const typeColor =
    type === 'mc' ? 'bg-brand-50 text-brand-700' : type === 'write' ? 'bg-leaf-50 text-leaf-700' : 'bg-amber-50 text-amber-700'
  const diffColor =
    difficulty === 'easy' ? 'bg-line text-muted' : difficulty === 'medium' ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-700'
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Chip color={typeColor}>{type === 'mc' ? 'Multiple choice' : type === 'write' ? 'Write query' : 'Fix bug'}</Chip>
      <Chip color={diffColor}>{difficulty}</Chip>
      <span className="text-muted">{topic}</span>
      {chapter && (
        <Link
          to={`/academy/sql/${chapter.slug}`}
          className="rounded-full border border-line px-2.5 py-0.5 text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          📖 Ch {chapter.number} · {chapter.title}
        </Link>
      )}
    </div>
  )
}

function MultipleChoiceView({ question, selectedIndex, onSelect, disabled }) {
  const labels = ['A', 'B', 'C', 'D']
  return (
    <div className="mt-4 flex flex-col gap-2">
      {question.options.map((opt, i) => (
        <OptionButton
          key={i}
          label={labels[i]}
          text={opt}
          selected={i === selectedIndex}
          onSelect={() => onSelect(i)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

function BuggyQueryView({ question }) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-medium text-muted">Buggy query — find the bug:</div>
      <pre className="overflow-x-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-amber-700">
        {question.buggyQuery}
      </pre>
    </div>
  )
}

function QuestionCard({ question, selectedIndex, onSelect, disabled, children, isGuest }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-6">
      <QuestTypeIndicator
        type={question.type}
        difficulty={question.difficulty}
        topic={question.topic}
        question={question}
      />
      <h2 className="mt-3 whitespace-pre-wrap font-mono text-lg font-medium leading-relaxed text-body">
        {question.question}
      </h2>

      {question.type === 'mc' && (
        <MultipleChoiceView
          question={question}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          disabled={disabled}
        />
      )}

      {question.type === 'bug' && <BuggyQueryView question={question} />}

      {(question.type === 'write' || question.type === 'bug') && (
        <>
          <SchemaPanel schema={question.schema} />
          {!isGuest && <HintReveal hint={question.hint} />}
        </>
      )}

      {children}
    </article>
  )
}

export default QuestionCard