export default function Console({
  title,
  badge,
  badgeClass = '',
  dots = true,
  noClip = false,
  children,
  className = '',
  bodyClass = 'p-3',
}) {
  const headerClass = noClip ? 'rounded-t-[calc(0.75rem-1px)]' : ''

  return (
    <div
      className={`rounded-xl border border-line/80 bg-white ${noClip ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
    >
      {(title || badge) && (
        <div
          className={`flex items-center gap-2.5 border-b border-line/90 bg-white px-3 py-1.5 ${headerClass}`}
        >
          {dots && (
            <span className="flex shrink-0 gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-line" />
              <span className="h-2 w-2 rounded-full bg-line" />
              <span className="h-2 w-2 rounded-full bg-line" />
            </span>
          )}
          {title && (
            <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {title}
            </span>
          )}
          {badge && (
            <span
              className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  )
}
