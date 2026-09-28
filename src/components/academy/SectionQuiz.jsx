import { useEffect, useState } from 'react'
import Console from './Console.jsx'
import { Inline } from './Prose.jsx'
import { clearQuestions, isQuestionCorrect, markQuestionCorrect } from '../../data/academy/progress.js'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

/** How far back each card in the deck sits, in pixels of Z. */
const DEPTH = 34

/** How far each card in the deck sits below the one in front of it. */
const STAGGER = 10

/** How many cards behind the live one are worth rendering. */
const STACK = 3

/**
 * The end-of-section check-yourself quiz, staged as a deck of cards in a
 * perspective arena.
 *
 * One question is on screen at a time. The reader picks an option, presses
 * Check, sees whether they were right and why, and moves on — advancing pulls
 * the next card forward out of the stack rather than swapping text in place. A
 * wrong answer is never a dead end: the correct option is revealed and Next
 * stays enabled, because a book that traps its reader is worse than a book that
 * lets them skim.
 *
 * Only *correct* answers are persisted (`markQuestionCorrect`), so a reader who
 * comes back later is shown the questions they have not proved yet rather than
 * being asked to re-answer everything. The stored answers never gate reading:
 * a section is still marked read by scrolling to it, exactly as before.
 *
 * Three deliberate constraints on the 3D, since it is decoration on top of a
 * correctness tool rather than the other way round:
 *
 *  - The text is real DOM, not a texture. It stays selectable, searchable,
 *    zoomable and legible, which a canvas or WebGL scene could not manage.
 *  - Colour and copy carry the verdict; the depth does not. A reader who
 *    cannot perceive the lift, or who is on a touch screen where there is no
 *    hover at all, still sees exactly which option was right.
 *  - Every transform funnels through `t3`, which returns nothing when the
 *    reader has asked for reduced motion. `ScrollProgress` can just return
 *    early from its effect, because its progress bar is driven by rAF; these
 *    transforms are declarative, so the only honest way to honour the
 *    preference is to never compute the depth in the first place.
 */
export default function SectionQuiz({ questions, accent = '#38bdf8' }) {
  const total = questions.length

  const reduced = useReducedMotion()

  // `picked` is the option chosen for the current question, `checked` flips once
  // the answer has been graded, and `index` walks the set. `answers` keeps the
  // per-question outcome so the markers and the final tally survive going back.
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState(() =>
    questions.map((q) => (isQuestionCorrect(q.id) ? 'correct' : null)),
  )
  const [done, setDone] = useState(false)

  // A section with no questions written yet should not render a shell at all.
  if (total === 0) return null

  const question = questions[index]
  const answer = answers[index]
  const isLast = index === total - 1
  const score = answers.filter((a) => a === 'correct').length
  const alreadyAllCorrect = answers.every((a) => a === 'correct')
  const complete = done || alreadyAllCorrect

  const t3 = (value) => (reduced ? undefined : value)

  function check() {
    if (picked === null || checked) return
    const right = picked === question.answerIndex
    const outcome = right ? 'correct' : 'wrong'
    setChecked(true)
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = outcome
      return next
    })
    if (right) markQuestionCorrect(question.id, true)
  }

  function advance() {
    if (isLast) {
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setPicked(null)
    setChecked(false)
  }

  function retry() {
    clearQuestions(questions.map((q) => q.id))
    setIndex(0)
    setPicked(null)
    setChecked(false)
    setAnswers(questions.map(() => null))
    setDone(false)
  }

  function optionClass(i) {
    if (!checked) {
      return picked === i
        ? 'border-slate-500 bg-slate-800 text-slate-100'
        : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
    }
    if (i === question.answerIndex) {
      return 'border-emerald-500/70 bg-emerald-500/10 text-emerald-200'
    }
    if (i === picked) {
      return 'border-rose-400/60 bg-rose-500/10 text-rose-200'
    }
    return 'border-slate-800 bg-slate-900/30 text-slate-600'
  }

  /**
   * The graded state of a tile. The correct one is pushed furthest out of the
   * plane, the wrong pick tips up as if being lifted off, and the rest shrink a
   * little to concede the floor.
   *
   * Nothing is ever pushed *behind* the card: the card is opaque so it can hide
   * the stack, and an opaque plane in a preserve-3d context would occlude
   * anything behind it. So "receding" is a scale, not a negative Z.
   */
  function optionTransform(i) {
    if (!checked) return undefined
    if (i === question.answerIndex) return t3('translateZ(22px) scale(1.012)')
    if (i === picked) return t3('translateZ(9px) rotateX(15deg)')
    return t3('scale(0.985)')
  }

  // The lift is a class rather than more inline state, and is withheld once the
  // answer is graded so it can never fight the transform above. `:focus-visible`
  // carries it too, otherwise keyboard readers get no feedback at all.
  const lift =
    !reduced && !checked
      ? 'hover:[transform:translateZ(16px)_translateY(-2px)] focus-visible:[transform:translateZ(16px)_translateY(-2px)] hover:shadow-[0_18px_30px_-14px_rgba(0,0,0,0.85)] focus-visible:shadow-[0_18px_30px_-14px_rgba(0,0,0,0.85)]'
      : ''

  // Depth, in Z, for a card sitting `d` places behind the live one. Cards are
  // keyed by question id rather than by slot, so advancing transitions the same
  // DOM node forward one place instead of tearing it down and popping a new one
  // into the front slot.
  function deckTransform(d) {
    if (d === 0) return t3('translateZ(0)')
    return t3(
      `translateZ(${-DEPTH * d}px) translateY(${STAGGER * d}px) rotateX(${-2.5 * d}deg)`,
    )
  }

  const markers = answers.map((a, i) => {
    const isCurrent = !complete && i === index
    const tone =
      a === 'correct'
        ? 'bg-emerald-500'
        : a === 'wrong'
          ? 'bg-rose-400'
          : isCurrent
            ? 'bg-slate-400'
            : 'bg-slate-700'
    return { key: i, label: `Question ${i + 1}: ${a ?? 'not answered'}`, tone, isCurrent }
  })

  return (
    <div className="mt-8">
      <Console
        title="check yourself"
        badge={complete ? `${score}/${total} correct` : `Question ${index + 1} of ${total}`}
        badgeClass={
          complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
        }
        noClip
        bodyClass="p-3 sm:p-4"
      >
        <div style={{ perspective: reduced ? undefined : 1400 }}>
          <div
            className={`relative [transform-style:preserve-3d] ${reduced ? '' : 'sm:[transform:rotateX(4deg)]'}`}
            // The ghost stack reaches `STAGGER * (STACK - 1)` below the live
            // card, and `Console` is unclipped so the scene can escape its box.
            // Reserving that here keeps the spill inside the panel.
            style={{ paddingBottom: reduced ? 0 : STAGGER * (STACK - 1) }}
          >
            {complete ? (
              <div
                className="rounded-xl border border-slate-700/80 bg-slate-900 p-5"
                style={{
                  animation: reduced ? undefined : 'arena-in 0.5s var(--ease-3d) both',
                }}
              >
                <div
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  {alreadyAllCorrect ? 'Section complete' : 'Results'}
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-4xl leading-none font-semibold text-slate-100">
                    {score}
                  </span>
                  <span className="font-mono text-[13px] text-slate-500">
                    / {total} correct
                  </span>
                </div>

                <p className="mt-2.5 text-[14px] leading-relaxed text-slate-400">
                  {alreadyAllCorrect
                    ? 'You have answered every question in this section correctly. Read on, or test yourself again.'
                    : score === total
                      ? 'All correct. Nothing here tripped you up.'
                      : `You got ${score} of ${total}. The ones you missed are worth a second look above — they are usually the subtle ones.`}
                </p>

                <div className="mt-3.5">
                  <MarkerRail markers={markers} reduced={reduced} />
                </div>

                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-[13px] font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
                >
                  {alreadyAllCorrect ? 'Answer again' : 'Retry'}
                </button>
              </div>
            ) : (
              questions.map((q, i) => {
                const d = i - index
                if (d < 0 || d >= STACK) return null

                // Ghosts are empty shells. The live card is opaque, so their
                // contents would never be seen, and rendering the text would
                // only put four questions in the accessibility tree at once.
                if (d > 0) {
                  return (
                    <div
                      key={q.id}
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 rounded-xl border border-slate-800 bg-slate-900/60 transition-transform duration-300 ease-3d"
                      style={{ transform: deckTransform(d) }}
                    />
                  )
                }

                return (
                  <div
                    key={q.id}
                    className="relative rounded-xl border border-slate-700/80 bg-slate-900 p-4 transition-transform duration-300 ease-3d sm:p-5"
                    style={{
                      transform: deckTransform(0),
                      boxShadow: `0 24px 48px -24px ${accent}40`,
                    }}
                  >
                    <p className="text-[15px] leading-relaxed text-slate-100">
                      <Inline
                        text={question.prompt}
                        codeClass="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-200 ring-1 ring-slate-700"
                        strongClass="font-semibold text-white"
                      />
                    </p>

                    {question.code && (
                      <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-slate-200">
                        {question.code}
                      </pre>
                    )}

                    {/* The tiles live inside the card and each push out of its
                        plane, so the card itself has to stay in 3D. Nothing here
                        goes behind the card's own opaque background, which is why
                        the recede is a scale. */}
                    <div className="mt-3.5 flex flex-col gap-2 [transform-style:preserve-3d]">
                      {question.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !checked && setPicked(i)}
                          disabled={checked}
                          aria-pressed={picked === i}
                          className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-[13px] leading-relaxed transition-[transform,box-shadow,color,background-color,border-color,opacity] duration-200 ease-3d disabled:cursor-default ${optionClass(i)} ${lift}`}
                          style={{ transform: optionTransform(i), opacity: !checked || i === question.answerIndex || i === picked ? 1 : 0.5 }}
                        >
                          <span
                            className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold"
                            style={
                              checked && i === question.answerIndex
                                ? { background: '#059669', color: '#fff' }
                                : checked && i === picked
                                  ? { background: '#e11d48', color: '#fff' }
                                  : picked === i
                                    ? { background: accent, color: '#0f172a' }
                                    : { background: '#1e293b', color: '#64748b' }
                            }
                          >
                            {checked && i === question.answerIndex
                              ? '✓'
                              : checked && i === picked
                                ? '✗'
                                : LETTERS[i]}
                          </span>
                          <span className="min-w-0 flex-1">
                            <Inline
                              text={opt}
                              codeClass="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-200 ring-1 ring-slate-700"
                              strongClass="font-semibold text-white"
                            />
                          </span>
                        </button>
                      ))}
                    </div>

                    {checked && (
                      <div className="mt-3.5 border-t border-slate-800 pt-3">
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: answer === 'correct' ? '#34d399' : '#fb7185' }}
                        >
                          {answer === 'correct'
                            ? 'Correct.'
                            : 'Not quite — the highlighted option is the answer.'}
                        </div>
                        {question.explanation && (
                          <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                            <Inline
                              text={question.explanation}
                              codeClass="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-300 ring-1 ring-slate-700"
                              strongClass="font-semibold text-slate-200"
                            />
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {!complete && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!checked ? (
              <button
                type="button"
                onClick={check}
                disabled={picked === null}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-[filter,opacity] duration-200 enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: picked === null ? '#334155' : accent }}
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-[filter,transform] duration-200 hover:brightness-110"
                style={{ background: accent }}
              >
                {isLast ? 'Show results' : 'Next question →'}
              </button>
            )}

            <MarkerRail markers={markers} reduced={reduced} />
          </div>
        )}
      </Console>
    </div>
  )
}

/**
 * The per-question outcomes as markers running into the screen. The current
 * question is pushed out of the plane rather than merely recoloured, so the
 * answer trail doubles as a position in the deck.
 */
function MarkerRail({ markers, reduced }) {
  return (
    <div style={{ perspective: reduced ? undefined : 140 }}>
      <div className="flex items-center gap-1.5 [transform-style:preserve-3d]">
        {markers.map((m) => (
          <span
            key={m.key}
            aria-label={m.label}
            role="img"
            className={`block h-1.5 rounded-full transition-transform duration-300 ease-3d ${m.tone} ${
              m.isCurrent ? 'h-2.5 w-4' : 'w-1.5'
            }`}
            style={{ transform: reduced ? undefined : m.isCurrent ? 'translateZ(26px)' : undefined }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Tracks the live value of `prefers-reduced-motion`, so the arena recomputes
 * itself flat if the reader turns the setting on mid-session.
 */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
