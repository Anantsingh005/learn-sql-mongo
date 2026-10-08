export default function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span
        title="Rank 1"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-700"
      >
        <span className="sr-only">1</span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M2 8l5 4 5-7 5 7 5-4-2 11H4L2 8z" />
        </svg>
      </span>
    )
  }
  const cls =
    rank === 2
      ? 'border-line bg-mist text-body'
      : rank === 3
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-line bg-shell text-muted'
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${cls}`}
    >
      {rank}
    </span>
  )
}
