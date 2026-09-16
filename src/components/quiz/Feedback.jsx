import ResultTable from './ResultTable.jsx'

function Feedback({ snapshot, onNext }) {
  if (snapshot.status !== 'feedback') return null
  const answer = snapshot.answers[snapshot.answers.length - 1]
  if (!answer) return null
  const question = answer.question
  const correct = answer.correct

  return (
    <div className="rounded-2xl border p-6">
      <div
        className={`mb-4 flex items-center gap-3 rounded-lg px-4 py-3 ${
          correct ? 'border border-emerald-600/50 bg-emerald-500/10' : 'border border-rose-600/50 bg-rose-500/10'
        }`}
      >
        <span className={`text-xl font-black ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>
          {correct ? 'Correct!' : 'Incorrect'}
        </span>
        {answer.reason && <span className="text-sm text-slate-300">{answer.reason}</span>}
      </div>

      {answer.timedOut && <p className="mb-3 text-sm text-rose-300">Time ran out.</p>}

      {question.type === 'mc' && (
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-400">Correct answer:</div>
          <code className="mt-1 block rounded-lg bg-slate-800 px-3 py-2 font-mono text-sm text-emerald-200">
            {question.options[question.answerIndex]}
          </code>
        </div>
      )}

      {(question.type === 'write' || question.type === 'bug') && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {answer.actualResult && (
            <div>
              <div className="mb-1 text-sm font-medium text-slate-400">Your result:</div>
              <ResultTable columns={answer.actualResult.columns} rows={answer.actualResult.rows} />
            </div>
          )}
          <div>
            <div className="mb-1 text-sm font-medium text-slate-400">Expected result:</div>
            <ResultTable columns={question.expected.columns} rows={question.expected.rows} />
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-300">Why</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{question.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {snapshot.lives <= 0 ? 'No lives left.' : `${snapshot.lives} lives left.`}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          {snapshot.index + 1 >= snapshot.total || snapshot.lives <= 0 ? 'See results' : 'Next question'}
        </button>
      </div>
    </div>
  )
}

export default Feedback