function QuizPlaceholder({ game, comingSoon = false }) {
  const label = game === 'sql' ? 'SQL' : 'MongoDB'

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
      <div className="font-mono text-4xl font-bold text-white">{label} Quiz</div>
      {comingSoon ? (
        <p className="mt-4 text-slate-400">
          The {label} game is coming soon. The same engine already powers the SQL quiz.
        </p>
      ) : (
        <p className="mt-4 text-slate-400">Building…</p>
      )}
    </div>
  )
}

export default QuizPlaceholder