import { Link } from 'react-router-dom'
import { COMPLETE_THRESHOLD, levelKey } from '../../firebase/progress.js'

function grade(percent) {
  if (percent >= 90) return { letter: 'A', color: 'text-emerald-300', msg: 'Outstanding!' }
  if (percent >= 75) return { letter: 'B', color: 'text-indigo-300', msg: 'Great job!' }
  if (percent >= 60) return { letter: 'C', color: 'text-sky-300', msg: 'Solid work.' }
  if (percent >= 40) return { letter: 'D', color: 'text-amber-300', msg: 'Keep practicing.' }
  return { letter: 'F', color: 'text-rose-300', msg: 'Review the explanations below.' }
}

function saveMessage(status) {
  switch (status) {
    case 'saving':
      return <span className="text-slate-400">Saving score…</span>
    case 'saved':
      return <span className="text-emerald-400">Score saved to leaderboard.</span>
    case 'error':
      return <span className="text-rose-400">Couldn’t save score. Try again later.</span>
    case 'guest':
      return (
        <span className="text-slate-500">
          <Link to="/auth" className="text-indigo-300 underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to save your score to the leaderboard.
        </span>
      )
    default:
      return null
  }
}

function ResultScreen({ snapshot, saveStatus = 'idle', onReplay, difficulty, mode, progress = {} }) {
  const answers = snapshot.answers
  const correct = answers.filter((a) => a.correct).length
  const total = answers.length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const g = grade(percent)
  const completedThisRun = percent >= COMPLETE_THRESHOLD
  const completedLevels = progress.completed ?? []
  const hardUnlocked =
    completedLevels.includes(levelKey(mode, 'easy')) && completedLevels.includes(levelKey(mode, 'medium'))

  let levelMessage = null
  if (completedThisRun) {
    if (difficulty === 'all') {
      levelMessage = 'You conquered every level in one run. Legendary!'
    } else if (difficulty === 'hard') {
      levelMessage = 'You conquered the Hard level. Legendary!'
    } else if (hardUnlocked) {
      levelMessage = `Nice — ${difficulty} complete! Easy and Medium are done, so Hard is now unlocked.`
    } else {
      levelMessage = `${difficulty} level completed above ${COMPLETE_THRESHOLD}%. Keep going to unlock Hard!`
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quiz complete</div>
        {levelMessage && (
          <div className="mt-3 rounded-lg border border-emerald-600/50 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200">
            {levelMessage}
          </div>
        )}
        <div className="mt-2 text-6xl font-black text-white">{g.letter}</div>
        <div className={`mt-1 text-lg font-semibold ${g.color}`}>{g.msg}</div>
        <div className="mt-1 text-sm text-slate-400">{percent}% correct</div>
        <div className="mt-4 flex items-center justify-center gap-6 font-mono text-sm text-slate-300">
          <span>Score <span className="text-lg font-bold text-indigo-300">{snapshot.score}</span></span>
          <span>{correct} / {total} correct</span>
          <span className={snapshot.lives <= 0 ? 'text-rose-300' : ''}>
            {snapshot.lives}/{3} lives
          </span>
          <span className="font-sans text-xs">{snapshot.elapsedSeconds}s · {saveMessage(saveStatus)}</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Play again
          </button>
          <Link
            to="/"
            className="rounded-lg border border-slate-600 px-5 py-2 font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            Home
          </Link>
        </div>
      </div>

      {total > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-slate-300">Answer review</div>
          <div className="flex flex-col gap-2">
            {answers.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-slate-300">
                    <span className="mr-2 font-mono text-xs text-slate-500">Q{i + 1}</span>
                    {a.question.question.split('\n')[0]}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                      a.correct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {a.correct ? 'CORRECT' : 'WRONG'}
                  </span>
                </div>
                {!a.correct && (
                  <div className="mt-2 text-xs text-slate-500">
                    {a.question.type === 'mc' ? (
                      <>Correct: <code className="text-emerald-300">{a.question.options[a.question.answerIndex]}</code></>
                    ) : (
                      <span>Expected result shown with explanation above.</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultScreen