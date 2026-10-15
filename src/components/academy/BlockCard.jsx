// The shared shell for every lesson content card: rounded corners, a soft
// border, one header row with an icon chip on the left and optional meta /
// actions on the right, and a body with the data's own content. Block
// components only choose the icon, title, tone and body — the chrome is here so
// every card lines up.

const TONES = {
  plum: 'bg-plum-50 text-plum-600',
  brand: 'bg-brand-50 text-brand-600',
  leaf: 'bg-leaf-50 text-leaf-600',
  amber: 'bg-amber-50 text-amber-700',
  danger: 'bg-danger-50 text-danger-600',
  slate: 'bg-line/60 text-body',
}

export default function BlockCard({
  icon,
  title,
  meta,
  actions,
  tone = 'plum',
  clip = true,
  children,
  className = '',
  bodyClassName = 'p-4 sm:p-5',
}) {
  const hasHeader = Boolean(icon || title || meta || actions)

  return (
    <section
      className={`min-w-0 rounded-2xl border border-line bg-white shadow-[0_2px_14px_-10px_rgba(16,42,67,0.25)] ${
        clip ? 'overflow-hidden' : ''
      } ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center gap-2.5 border-b border-line-soft px-3.5 py-2.5 sm:px-4">
          {icon && (
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                TONES[tone] ?? TONES.plum
              }`}
            >
              {icon}
            </span>
          )}
          {title && (
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-body">
              {title}
            </span>
          )}
          {(meta || actions) && (
            <span className="ml-auto flex shrink-0 items-center gap-2">
              {meta}
              {actions}
            </span>
          )}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
