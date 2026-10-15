import SqlCode from './SqlCode.jsx'
import { Inline } from './Prose.jsx'

// Small shared pieces used by more than one content card, so the example cards
// (CodeBlock / DmlBlock) stay visually identical without duplicating markup.

const BADGE_TONES = {
  danger: 'border-danger-200 bg-danger-50 text-danger-700',
  leaf: 'border-leaf-200 bg-leaf-50 text-leaf-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  plum: 'border-plum-200 bg-plum-50 text-plum-700',
  slate: 'border-line bg-line/60 text-body',
}

export function Badge({ tone = 'plum', children }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        BADGE_TONES[tone] ?? BADGE_TONES.plum
      }`}
    >
      {children}
    </span>
  )
}

// The intro line of an example card. When the example is one that fails (or is
// a trap), the same text is shown as a styled message rather than plain prose.
export function Caption({ text, tone = 'plain' }) {
  if (tone === 'danger') {
    return (
      <p className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-[13px] leading-relaxed text-danger-700">
        <Inline
          text={text}
          codeClass="rounded bg-white px-1.5 py-0.5 font-mono text-[0.82em] text-danger-700 ring-1 ring-danger-200"
          strongClass="font-semibold text-danger-700"
        />
      </p>
    )
  }
  return (
    <p className="text-[13px] leading-relaxed text-body">
      <Inline text={text} />
    </p>
  )
}

export function CodeSurface({ code, tone = 'plain' }) {
  const bad = tone === 'danger'
  return (
    <div
      className={`overflow-x-auto rounded-xl border px-3 py-2.5 ${
        bad ? 'border-danger-200 bg-danger-50/40' : 'border-line bg-mist/40'
      }`}
    >
      <pre className="font-mono text-[13px] leading-relaxed">
        <SqlCode code={code} />
      </pre>
    </div>
  )
}
