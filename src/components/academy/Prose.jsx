const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*)/g

const CODE_CLASS =
  'rounded bg-mist px-1.5 py-0.5 font-mono text-[0.82em] text-ink ring-1 ring-brand-200'

export function Inline({ text, codeClass = CODE_CLASS, strongClass = 'font-semibold text-ink' }) {
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

export default function Prose({ text, className = '' }) {
  return (
    <p className={className}>
      <Inline text={text} />
    </p>
  )
}
