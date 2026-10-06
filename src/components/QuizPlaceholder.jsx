function QuizPlaceholder({ game, comingSoon = false }) {
  const label = game === 'sql' ? 'SQL' : 'MongoDB'

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-10 text-center">
      <h1 className="font-mono text-4xl font-bold text-ink">{label} Quiz</h1>
      {comingSoon ? (
        <p className="mt-4 text-muted">
          The {label} game is coming soon. The same engine already powers the SQL quiz.
        </p>
      ) : (
        <p className="mt-4 text-muted">Building…</p>
      )}
    </div>
  )
}

export default QuizPlaceholder
