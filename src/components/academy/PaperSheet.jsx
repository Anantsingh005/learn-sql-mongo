export default function PaperSheet({ accent = '#1554c7', children, className = '' }) {
  return (
    <div
      className={`enter-rise relative overflow-hidden rounded-[20px] border border-line bg-[#fdfcf9] shadow-[0_28px_60px_-32px_rgba(16,42,67,0.35)] ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}55)` }}
        aria-hidden="true"
      />
      <div className="relative py-7 pl-7 pr-5 sm:py-11 sm:pl-12 sm:pr-10">{children}</div>
    </div>
  )
}
