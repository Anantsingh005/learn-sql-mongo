const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*)/g

const CODE_CLASS =
  'rounded bg-slate-900/[0.07] px-1.5 py-0.5 font-mono text-[0.82em] text-slate-900 ring-1 ring-slate-900/10'

/**
 * The two inline marks the book uses, rendered as bare fragments with no
 * wrapper element of its own. Exported separately from `Prose` because both of
 * these render inside elements that already *are* a paragraph — a `<p>` cannot
 * legally contain another `<p>`, and nesting one would break the page layout.
 *
 * `codeClass` / `strongClass` let a caller on a tinted background restyle the
 * marks; both default to the paper-background colours.
 */
export function Inline({ text, codeClass = CODE_CLASS, strongClass = 'font-semibold text-slate-900' }) {
  const parts = String(text).split(INLINE_RE).filter(Boolean)

  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className={codeClass}>
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={strongClass}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

/**
 * Renders a paragraph of book prose on the paper background.
 * Two inline marks only — `backticks` for code and **double stars** for bold.
 * A full markdown parser is not worth the dependency for two features.
 */
export default function Prose({ text, className = '' }) {
  return (
    <p className={className}>
      <Inline text={text} />
    </p>
  )
}
