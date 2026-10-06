export default function PaperSheet({ accent = '#1554c7', children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#faf7f0] shadow-[0_2px_48px_rgba(0,0,0,0.5)] ring-1 ring-black/40 ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}, ${accent}55)` }}
        aria-hidden="true"
      />
      <div className="relative py-9 pr-6 pl-8 sm:py-11 sm:pr-10 sm:pl-12">{children}</div>
    </div>
  )
}
