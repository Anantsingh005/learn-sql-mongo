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
  const headerClass = noClip ? 'rounded-t-[calc(1rem-1px)]' : ''

  return (
    <div
      className={`rounded-2xl border border-line/80 bg-white shadow-[0_2px_14px_-10px_rgba(16,42,67,0.25)] ${noClip ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
    >
      {(title || badge) && (
        <div
          className={`flex items-center gap-2.5 border-b border-line/90 bg-mist/70 px-3 py-2 sm:px-3.5 ${headerClass}`}
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
