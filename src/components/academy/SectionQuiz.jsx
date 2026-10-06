import { useEffect, useState } from 'react'
import Console from './Console.jsx'
import { Inline } from './Prose.jsx'
import { clearQuestions, isQuestionCorrect, markQuestionCorrect } from '../../data/academy/progress.js'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

const DEPTH = 34

const STAGGER = 10

const STACK = 3

export default function SectionQuiz({ questions, accent = '#1554c7', ink = accent }) {
  const total = questions.length

  const reduced = useReducedMotion()

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState(() =>
    questions.map((q) => (isQuestionCorrect(q.id) ? 'correct' : null)),
  )
  const [done, setDone] = useState(false)

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
        ? 'pop-on pop-on-indigo border-brand-200 bg-brand-50 text-brand-700'
        : 'border-line bg-line/60 text-body hover:border-line hover:bg-line'
    }
    if (i === question.answerIndex) {
      return 'border-leaf-200 bg-leaf-50 text-leaf-700'
    }
    if (i === picked) {
      return 'border-danger-200 bg-danger-50 text-danger-700'
    }
    return 'border-line bg-white/30 text-body'
  }

  function optionTransform(i) {
    if (!checked) return undefined
    if (i === question.answerIndex) return t3('translateZ(22px) scale(1.012)')
    if (i === picked) return t3('translateZ(9px) rotateX(15deg)')
    return t3('scale(0.985)')
  }

  const lift =
    !reduced && !checked
      ? 'hover:[transform:translateZ(16px)_translateY(-2px)] focus-visible:[transform:translateZ(16px)_translateY(-2px)] hover:shadow-[0_18px_30px_-14px_rgba(0,0,0,0.85)] focus-visible:shadow-[0_18px_30px_-14px_rgba(0,0,0,0.85)]'
      : ''

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
        ? 'bg-leaf-100'
        : a === 'wrong'
          ? 'bg-danger-100'
          : isCurrent
            ? 'bg-line'
            : 'bg-line'
    return { key: i, label: `Question ${i + 1}: ${a ?? 'not answered'}`, tone, isCurrent }
  })

  return (
    <div className="mt-8">
      <Console
        title="check yourself"
        badge={complete ? `${score}/${total} correct` : `Question ${index + 1} of ${total}`}
        badgeClass={
          complete ? 'bg-leaf-50 text-leaf-700' : 'bg-line text-body'
        }
        noClip
        bodyClass="p-3 sm:p-4"
      >
        <div style={{ perspective: reduced ? undefined : 1400 }}>
          <div
            className={`relative [transform-style:preserve-3d] ${reduced ? '' : 'sm:[transform:rotateX(4deg)]'}`}
            style={{ paddingBottom: reduced ? 0 : STAGGER * (STACK - 1) }}
          >
            {complete ? (
              <div
                className="rounded-xl border border-line/80 bg-white p-5"
                style={{
                  animation: reduced ? undefined : 'arena-in 0.5s var(--ease-3d) both',
                }}
              >
                <div
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: ink }}
                >
                  {alreadyAllCorrect ? 'Section complete' : 'Results'}
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-4xl leading-none font-semibold text-body">
                    {score}
                  </span>
                  <span className="font-mono text-[13px] text-muted">
                    / {total} correct
                  </span>
                </div>

                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
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
                  className="mt-4 rounded-lg border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line hover:text-body"
                >
                  {alreadyAllCorrect ? 'Answer again' : 'Retry'}
                </button>
              </div>
            ) : (
              questions.map((q, i) => {
                const d = i - index
                if (d < 0 || d >= STACK) return null

                if (d > 0) {
                  return (
                    <div
                      key={q.id}
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 rounded-xl border border-line bg-white/60 transition-transform duration-300 ease-3d"
                      style={{ transform: deckTransform(d) }}
                    />
                  )
                }

                return (
                  <div
                    key={q.id}
                    className="relative rounded-xl border border-line/80 bg-white p-4 transition-transform duration-300 ease-3d sm:p-5"
                    style={{
                      transform: deckTransform(0),
                      boxShadow: `0 24px 48px -24px ${accent}40`,
                    }}
                  >
                    <p className="text-[15px] leading-relaxed text-body">
                      <Inline
                        text={question.prompt}
                        codeClass="rounded bg-white px-1.5 py-0.5 font-mono text-[0.82em] text-body ring-1 ring-brand-600"
                              strongClass="font-semibold text-ink"
                      />
                    </p>

                    {question.check?.code && (
                      <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-body">
                        {question.check.code}
                      </pre>
                    )}

                    <div className="mt-3.5 flex flex-col gap-2 [transform-style:preserve-3d]">
                      {question.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !checked && setPicked(i)}
                          disabled={checked}
                          aria-pressed={picked === i}
                          className={`relative flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-[13px] leading-relaxed transition-[transform,box-shadow,color,background-color,border-color,opacity] duration-200 ease-3d disabled:cursor-default ${optionClass(i)} ${lift}`}
                          style={{ transform: optionTransform(i), opacity: !checked || i === question.answerIndex || i === picked ? 1 : 0.85 }}
                        >
                          <span
                            className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold"
                            style={
                              checked && i === question.answerIndex
                                ? { background: '#316644', color: '#fff' }
                                : checked && i === picked
                                  ? { background: '#a32e2e', color: '#fff' }
                                  : picked === i
                                    ? { background: '#1554c7', color: '#fff' }
                                    : { background: '#eef2f7', color: '#3d566e' }
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
                              codeClass="rounded bg-white px-1.5 py-0.5 font-mono text-[0.82em] text-body ring-1 ring-brand-600"
                        strongClass="font-semibold text-ink"
                            />
                          </span>
                        </button>
                      ))}
                    </div>

                    {checked && (
                      <div className="mt-3.5 border-t border-line pt-3">
                        <div
                          className="text-[13px] font-semibold"
                          style={{ color: answer === 'correct' ? '#3d7f55' : '#d24444' }}
                        >
                          {answer === 'correct'
                            ? 'Correct.'
                            : 'Not quite — the highlighted option is the answer.'}
                        </div>
                        {question.explanation && (
                          <p className="mt-1 text-[13px] leading-relaxed text-muted">
                            <Inline
                              text={question.explanation}
                              codeClass="rounded bg-white px-1.5 py-0.5 font-mono text-[0.82em] text-muted ring-1 ring-brand-600"
                              strongClass="font-semibold text-body"
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
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-[filter,opacity] duration-200 enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${
                  picked === null ? 'text-white' : 'text-ink'
                }`}
                style={{ background: picked === null ? '#243b53' : accent }}
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-[filter,transform] duration-200 hover:brightness-110"
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
