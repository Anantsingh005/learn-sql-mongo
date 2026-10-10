import { Link } from 'react-router-dom'
import { chapterSlugForQuestion } from '../../data/academy/lessonFor.js'
import { CHAPTERS } from '../../data/academy/book.js'
import { ENTER_POP, stagger } from '../site/motion.js'
import SchemaPanel from './SchemaPanel.jsx'
import QuizCardFooter from './QuizCardFooter.jsx'

const CHAPTER_BY_SLUG = new Map(CHAPTERS.map((c) => [c.slug, c]))

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function ListIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}

function CodeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m8.5 8.5-4 3.5 4 3.5" />
      <path d="m15.5 8.5 4 3.5-4 3.5" />
      <path d="m13.5 5-3 14" />
    </svg>
  )
}

function BugIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 9a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0V9Z" />
      <path d="M12 5v2M8.5 7.5 6.8 5.8M15.5 7.5l1.7-1.7" />
      <path d="M4.5 12H8M16 12h3.5M5 16l2.6-1.2M19 16l-2.6-1.2M6.5 20l2.3-2.4M17.5 20l-2.3-2.4" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

function CrossIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function BookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7c-1.4-1.3-3.3-1.9-5.7-1.9-.7 0-1.3.1-1.8.2v11.6c.5-.1 1.1-.2 1.8-.2 2.4 0 4.3.6 5.7 1.9 1.4-1.3 3.3-1.9 5.7-1.9.7 0 1.3.1 1.8.2V5.3c-.5-.1-1.1-.2-1.8-.2-2.4 0-4.3.6-5.7 1.9Z" />
      <path d="M12 7v11.4" />
    </svg>
  )
}

const TYPE_META = {
  mc: { label: 'Multiple choice', tone: 'border-brand-200 bg-brand-50 text-brand-700', Icon: ListIcon },
  write: { label: 'Write query', tone: 'border-leaf-200 bg-leaf-50 text-leaf-700', Icon: CodeIcon },
  bug: { label: 'Fix bug', tone: 'border-amber-200 bg-amber-50 text-amber-700', Icon: BugIcon },
}

const DIFFICULTY_TONE = {
  easy: 'border-leaf-200 bg-leaf-50 text-leaf-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  hard: 'border-danger-200 bg-danger-50 text-danger-700',
}

function MetaChip({ tone, children, capitalize = true }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        capitalize ? 'capitalize' : ''
      } ${tone}`}
    >
      {children}
    </span>
  )
}

function QuestionMeta({ type, difficulty, topic, hideType }) {
  const meta = TYPE_META[type] ?? TYPE_META.mc
  const tone = DIFFICULTY_TONE[difficulty] ?? 'border-line bg-mist/60 text-body'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hideType && (
        <MetaChip tone={meta.tone}>
          <meta.Icon className="h-3.5 w-3.5" />
          {meta.label}
        </MetaChip>
      )}
      {difficulty && <MetaChip tone={tone}>{difficulty}</MetaChip>}
      {topic && (
        <MetaChip tone="border-line bg-mist/60 text-body" capitalize={false}>
          {topic}
        </MetaChip>
      )}
    </div>
  )
}

function ChapterLink({ question }) {
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  if (!chapter) return null
  return (
    <Link
      to={`/academy/sql/${chapter.slug}`}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      <BookIcon className="h-3.5 w-3.5" />
      Ch {chapter.number} · {chapter.title}
    </Link>
  )
}

// A question prompt is stored as "<sql block>\n\n<sentence>" when it contains
// SQL, or as a plain sentence otherwise. Split it so the SQL reads big.
function splitQuestion(text) {
  if (typeof text !== 'string') return { sql: null, sentence: '' }
  const splitAt = text.indexOf('\n\n')
  if (splitAt === -1) return { sql: null, sentence: text }
  return { sql: text.slice(0, splitAt).trimEnd(), sentence: text.slice(splitAt + 2).trim() }
}

function QuestionPrompt({ text }) {
  const { sql, sentence } = splitQuestion(text)
  if (!sql) {
    return <h2 className="font-sans text-lg font-bold leading-snug text-ink sm:text-xl">{sentence}</h2>
  }
  return (
    <div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-mist/60 px-4 py-3 font-mono text-base font-bold leading-relaxed text-ink sm:text-lg">
        {sql}
      </pre>
      {sentence && (
        <h2 className="mt-3 font-sans text-sm font-medium leading-relaxed text-body sm:text-base">
          {sentence}
        </h2>
      )}
    </div>
  )
}

const OPTION_TONE = {
  default: 'border-line bg-white hover:border-brand-200 hover:bg-brand-50/40',
  selected: 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/25',
  correct: 'border-leaf-400 bg-leaf-50 ring-2 ring-leaf-500/25',
  wrong: 'border-danger-500 bg-danger-50 ring-2 ring-danger-500/20',
  muted: 'border-line bg-white opacity-60',
}

const BADGE_TONE = {
  default: 'bg-mist text-muted group-hover:bg-brand-100 group-hover:text-brand-700',
  selected: 'bg-brand-600 text-white',
  correct: 'bg-leaf-500 text-white',
  wrong: 'bg-danger-500 text-white',
  muted: 'bg-mist text-muted',
}

// A quick burst of sparkles radiating from the tick badge on a correct option.
const SPARKS = [
  { dx: -16, dy: -16 },
  { dx: 14, dy: -14 },
  { dx: -18, dy: 10 },
  { dx: 16, dy: 12 },
  { dx: 0, dy: -22 },
]

function SparkStar({ className, style }) {
  return (
    <svg viewBox="0 0 10 10" className={className} style={style} aria-hidden="true">
      <path d="M5 0l1.35 3.65L10 5 6.35 6.35 5 10 3.65 6.35 0 5l3.65-1.35z" fill="currentColor" />
    </svg>
  )
}

function OptionButton({ label, text, state, onSelect, disabled, index }) {
  const showCheck = state === 'correct' || state === 'selected'
  const showCross = state === 'wrong'
  const stateAnim =
    state === 'correct'
      ? 'quiz-glow quiz-opt-pulse'
      : state === 'wrong'
        ? 'quiz-shake'
        : state === 'selected'
          ? 'quiz-opt-pop'
          : ''
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === 'selected'}
      className={`${ENTER_POP} ${stateAnim} group relative flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:scale-[0.99] ${
        OPTION_TONE[state] ?? OPTION_TONE.default
      }`}
      style={stagger(index, 60)}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors ${
          BADGE_TONE[state] ?? BADGE_TONE.default
        }`}
      >
        {label}
      </span>
      <code className="flex-1 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-body">{text}</code>
      {showCheck && (
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
            state === 'correct' ? 'bg-leaf-500' : 'bg-brand-600'
          }`}
        >
          <CheckIcon className="h-3 w-3" />
        </span>
      )}
      {showCross && (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-500 text-white">
          <CrossIcon className="h-3 w-3" />
        </span>
      )}
      {state === 'correct' && (
        <span aria-hidden="true" className="pointer-events-none absolute right-7 top-1/2 block h-0 w-0">
          {SPARKS.map((s, i) => (
            <SparkStar
              key={i}
              className="quiz-sparkle"
              style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${i * 45}ms` }}
            />
          ))}
        </span>
      )}
    </button>
  )
}

function MultipleChoiceView({ question, snapshot, selectedIndex, onSelect, disabled }) {
  const isFeedback = snapshot?.status === 'feedback'
  const answer = isFeedback ? snapshot.answers[snapshot.answers.length - 1] : null
  const chosen = isFeedback ? (answer?.answer ?? null) : selectedIndex
  const correctIndex = question.answerIndex

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {question.options.map((opt, i) => {
        let state = 'default'
        if (isFeedback) {
          if (i === correctIndex) state = 'correct'
          else if (i === chosen) state = 'wrong'
          else state = 'muted'
        } else if (i === selectedIndex) {
          state = 'selected'
        }
        return (
          <OptionButton
            key={i}
            index={i}
            label={OPTION_LABELS[i] ?? String(i + 1)}
            text={opt}
            state={state}
            onSelect={() => onSelect(i)}
            disabled={disabled}
          />
        )
      })}
    </div>
  )
}

function McFooter({ question, snapshot, selectedIndex, onSubmit, onNext }) {
  const isFeedback = snapshot.status === 'feedback'
  const answer = isFeedback ? snapshot.answers[snapshot.answers.length - 1] : null
  const isLast = snapshot.index + 1 >= snapshot.total || snapshot.lives <= 0
  const canSubmit = selectedIndex !== null && !snapshot.runningAnswer

  let title = 'Select an answer above'
  let titleTone = 'text-muted'
  let detail = null
  if (isFeedback && answer) {
    if (answer.correct) {
      title = 'Correct!'
      titleTone = 'text-leaf-700'
    } else {
      title = answer.timedOut ? 'Time ran out.' : 'Not quite'
      titleTone = 'text-danger-700'
    }
    detail = (
      <>
        {answer.reason && <p className="mt-1 text-sm leading-relaxed text-body">{answer.reason}</p>}
        {question.explanation && (
          <p className="mt-1 text-sm leading-relaxed text-body">{question.explanation}</p>
        )}
      </>
    )
  }

  return (
    <QuizCardFooter status={title} statusTone={titleTone} detail={detail}>
      {isFeedback ? (
        <button
          type="button"
          onClick={onNext}
          className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 motion-safe:active:scale-[0.97]"
        >
          {isLast ? 'See results' : 'Next question'}
          <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:enabled:active:scale-[0.97]"
        >
          Submit
          <span aria-hidden="true" className="transition-transform motion-safe:group-hover:translate-x-0.5">→</span>
        </button>
      )}
    </QuizCardFooter>
  )
}

function QuestionCard({ question, selectedIndex, onSelect, disabled, children, snapshot, onSubmit, onNext }) {
  const isMc = question.type === 'mc'
  return (
    <article className="quiz-card-swap min-h-[18rem] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,42,67,0.05)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-mist/50 px-5 py-3.5 sm:px-6">
        <QuestionMeta
          type={question.type}
          difficulty={question.difficulty}
          topic={question.topic}
          hideType={isMc}
        />
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <QuestionPrompt text={question.question} />

        {!isMc && <ChapterLink question={question} />}

        {isMc && (
          <>
            <MultipleChoiceView
              question={question}
              snapshot={snapshot}
              selectedIndex={selectedIndex}
              onSelect={onSelect}
              disabled={disabled}
            />
            {snapshot && (
              <McFooter
                question={question}
                snapshot={snapshot}
                selectedIndex={selectedIndex}
                onSubmit={onSubmit}
                onNext={onNext}
              />
            )}
          </>
        )}

        {(question.type === 'write' || question.type === 'bug') && (
          <SchemaPanel schema={question.schema} />
        )}

        {children}
      </div>
    </article>
  )
}

export default QuestionCard
