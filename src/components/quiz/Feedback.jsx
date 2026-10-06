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
          correct ? 'border border-leaf-200 bg-leaf-50' : 'border border-danger-200 bg-danger-50'
        }`}
      >
        <span className={`text-xl font-black ${correct ? 'text-leaf-700' : 'text-danger-700'}`}>
          {correct ? 'Correct!' : 'Incorrect'}
        </span>
        {answer.reason && <span className="text-sm text-muted">{answer.reason}</span>}
      </div>

      {answer.timedOut && <p className="mb-3 text-sm text-danger-700">Time ran out.</p>}

      {question.type === 'mc' && answer.timedOut && (
        <div className="mb-4">
          <div className="text-sm font-medium text-muted">Correct answer:</div>
          <code className="mt-1 block rounded-lg bg-line px-3 py-2 font-mono text-sm text-leaf-700">
            {question.options[question.answerIndex]}
          </code>
        </div>
      )}

      {(question.type === 'write' || question.type === 'bug') && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {answer.actualResult && (
            <div>
              <div className="mb-1 text-sm font-medium text-muted">Your result:</div>
              <ResultTable columns={answer.actualResult.columns} rows={answer.actualResult.rows} />
            </div>
          )}
          <div>
            <div className="mb-1 text-sm font-medium text-muted">Expected result:</div>
            <ResultTable columns={question.expected.columns} rows={question.expected.rows} />
          </div>
        </div>
      )}

      {question.explanation && (
        <div className="rounded-lg border border-line bg-line/50 px-4 py-3">
          <div className="text-sm font-semibold text-muted">Why</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{question.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted">
          {snapshot.lives <= 0 ? 'No lives left.' : `${snapshot.lives} lives left.`}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {snapshot.index + 1 >= snapshot.total || snapshot.lives <= 0 ? 'See results' : 'Next question'}
        </button>
      </div>
    </div>
  )
}

export default Feedback