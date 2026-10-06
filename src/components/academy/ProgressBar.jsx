export default function ProgressBar({ pct, gradient, className = '' }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: gradient }}
      />
    </div>
  )
}
