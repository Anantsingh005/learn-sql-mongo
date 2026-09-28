import { useState } from 'react'
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

function OptionButton({ label, text, selected, onSelect, disabled, masked, revealLabel, affordable = true, justRevealed }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group relative flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        justRevealed
          ? 'reveal-on '
          : ''
      }${
        masked
          ? 'border-dashed border-slate-600 bg-slate-800/40 hover:border-indigo-500/70 hover:bg-slate-800/70'
          : selected
            ? 'pop-on pop-on-indigo border-indigo-500 bg-indigo-500/15 text-indigo-100'
            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
          selected
            ? 'bg-indigo-500 text-white'
            : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
        }`}
      >
        {label}
      </span>

      {/* The badge above deliberately stays crisp while only the text is veiled,
          so the player can still see there are four options and where they sit.
          Blur (rather than a solid cover) also keeps the row's height stable, so
          nothing jumps when the text is revealed.

          Note this is presentation, not concealment: the option text stays in
          the DOM. `select-none` and `pointer-events-none` put ordinary
          copy-paste and text selection out of reach, but devtools can still
          read it. Fine for self-quizzing; real hiding would mean not rendering
          the string at all. */}
      <span className="min-w-0 flex-1">
        {masked ? (
          <span className="block select-none">
            <code className="pointer-events-none block select-none whitespace-pre-wrap font-mono text-[13px] leading-relaxed blur-[7px]">
              {text}
            </code>
            <span
              className={`mt-1 block font-sans text-[11px] font-semibold ${
                affordable ? 'text-indigo-300/90' : 'text-slate-500'
              }`}
            >
              {affordable ? revealLabel : 'Out of time to reveal'}
            </span>
          </span>
        ) : (
          <code className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{text}</code>
        )}
      </span>
    </button>
  )
}

function QuestTypeIndicator({ type, difficulty, topic, question }) {
  const typeColor =
    type === 'mc' ? 'bg-sky-500/15 text-sky-300' : type === 'write' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'
  const diffColor =
    difficulty === 'easy' ? 'bg-slate-700 text-slate-300' : difficulty === 'medium' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-rose-500/15 text-rose-300'
  const chapter = CHAPTER_BY_SLUG.get(chapterSlugForQuestion(question))
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Chip color={typeColor}>{type === 'mc' ? 'Multiple choice' : type === 'write' ? 'Write query' : 'Fix bug'}</Chip>
      <Chip color={diffColor}>{difficulty}</Chip>
      <span className="text-slate-500">{topic}</span>
      {chapter && (
        <Link
          to={`/academy/sql/${chapter.slug}`}
          className="rounded-full border border-slate-700 px-2.5 py-0.5 text-slate-300 transition-colors hover:border-indigo-500/60 hover:bg-indigo-500/10 hover:text-indigo-200"
        >
          📖 Ch {chapter.number} · {chapter.title}
        </Link>
      )}
    </div>
  )
}

/**
 * Multiple-choice options, optionally hidden behind a paid reveal.
 *
 * When `hideOptions` is set, every option starts masked and a tap on a masked
 * row *reveals* it rather than selecting it; a tap on an already-revealed row
 * selects it. That two-step is the whole mechanic, so each row's label says
 * which of the two a tap will do.
 *
 * `revealed` lives here as local state, and needs no reset wiring: SqlQuiz
 * renders QuestionCard with key={question.id}, so this subtree remounts per
 * question and re-masks automatically.
 */
function MultipleChoiceView({
  question,
  selectedIndex,
  onSelect,
  disabled,
  hideOptions,
  revealAll,
  onReveal,
  timeLeft,
  revealCost,
}) {
  const [revealed, setRevealed] = useState(() => new Set())
  // Which option unmasked most recently. The pop is pinned to that single index
  // so earlier reveals don't re-animate every time the list re-renders, and so
  // .reveal-on and .pop-on never contend for the same element.
  const [justRevealed, setJustRevealed] = useState(null)
  const labels = ['A', 'B', 'C', 'D']
  // Revealing is refused when the clock cannot cover the cost, and the row says
  // so rather than swallowing the tap.
  const affordable = timeLeft == null || timeLeft > revealCost

  const isMasked = (i) => hideOptions && !revealAll && !revealed.has(i)

  const handleTap = (i) => {
    if (isMasked(i)) {
      // The engine decides whether the reveal is affordable; only unmask once it
      // has actually charged, so a refused reveal never looks like it worked.
      if (onReveal && !onReveal()) return
      setRevealed((prev) => {
        const next = new Set(prev)
        next.add(i)
        return next
      })
      setJustRevealed(i)
      return
    }
    // Clear the reveal marker so a select never lands on an element still
    // carrying .reveal-on: the two animations collide, and whichever loses
    // simply never plays. Dropping the class first makes the selection pop fire
    // cleanly, since changing `animation` starts a new one.
    setJustRevealed(null)
    onSelect(i)
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {hideOptions && !revealAll && (
        <p className="mb-1 text-xs text-slate-500">
          Options are hidden. Tap one to reveal it — that costs {revealCost}s off this
          question&rsquo;s clock.
        </p>
      )}
      {question.options.map((opt, i) => (
        <OptionButton
          key={i}
          label={labels[i]}
          text={opt}
          selected={i === selectedIndex}
          masked={isMasked(i)}
          justRevealed={!isMasked(i) && justRevealed === i}
          revealLabel={`Tap to reveal · ${revealCost}s`}
          affordable={affordable}
          // A masked row is still clickable — that is how it reveals. Only the
          // post-submit lock disables it, and by then revealAll has unmasked
          // everything anyway.
          onSelect={() => handleTap(i)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

function BuggyQueryView({ question }) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-medium text-slate-400">Buggy query — find the bug:</div>
      <pre className="overflow-x-auto rounded-lg border border-amber-600/40 bg-amber-500/5 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-amber-200">
        {question.buggyQuery}
      </pre>
    </div>
  )
}

function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  disabled,
  children,
  isGuest,
  hideOptions = false,
  revealAll = false,
  onReveal,
  timeLeft,
  revealCost = 10,
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <QuestTypeIndicator
        type={question.type}
        difficulty={question.difficulty}
        topic={question.topic}
        question={question}
      />
      <h2 className="mt-3 whitespace-pre-wrap font-mono text-lg font-medium leading-relaxed text-slate-100">
        {question.question}
      </h2>

      {question.type === 'mc' && (
        <MultipleChoiceView
          question={question}
          selectedIndex={selectedIndex}
          onSelect={onSelect}
          disabled={disabled}
          hideOptions={hideOptions}
          revealAll={revealAll}
          onReveal={onReveal}
          timeLeft={timeLeft}
          revealCost={revealCost}
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