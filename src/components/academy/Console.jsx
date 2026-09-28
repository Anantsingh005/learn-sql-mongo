/**
 * The dark "console" inset that every piece of data sits inside while the prose
 * around it is on paper. Reusing the app's slate palette keeps the tables and
 * queries looking native next to the quiz screens.
 *
 * `noClip` drops the rounded-corner clip. An element with a non-visible
 * `overflow` forces `transform-style: preserve-3d` to compute to `flat`, so a
 * console holding a CSS-3D scene has to stay unclipped or the whole scene
 * collapses back into a single plane. `SectionQuiz` is the one caller that
 * needs it, and it reserves the depth it uses as padding.
 *
 * That clip is also what keeps the title bar's background inside the rounded
 * corners, so dropping it means the bar has to round its own top corners. The
 * radius is the panel's minus its 1px border, otherwise the bar would leave a
 * hairline of panel showing at each corner.
 */
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
      className={`rounded-xl border border-slate-700/80 bg-slate-950 ${noClip ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
    >
      {(title || badge) && (
        <div
          className={`flex items-center gap-2.5 border-b border-slate-800/90 bg-slate-900/70 px-3 py-1.5 ${headerClass}`}
        >
          {dots && (
            <span className="flex shrink-0 gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-slate-700" />
            </span>
          )}
          {title && (
            <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
