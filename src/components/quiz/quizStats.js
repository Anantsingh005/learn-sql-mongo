// Single source of truth for the life totals shown in the top bar (HUD) and
// the sidebar's "Lives Remaining" card, so the two can never disagree.
export function livesInfo(snapshot) {
  const lives = snapshot?.lives ?? 0
  const answers = snapshot?.answers ?? []
  const wrong = answers.length - answers.filter((a) => a.correct).length
  const total = Math.max(lives, lives + wrong)
  const filled = Math.max(0, Math.min(lives, total))
  return { filled, total }
}

// Mascot reaction while a question is being graded: happy on a correct answer,
// a small wobble on a wrong one, and nothing in between (question reading time).
export function feedbackMood(snapshot) {
  if (!snapshot || snapshot.status !== 'feedback') return null
  const last = snapshot.answers?.[snapshot.answers.length - 1]
  if (!last) return null
  return last.correct ? 'happy' : 'wobble'
}

// Correct-answer streak, derived from the engine's own recorded answers so it
// can never disagree with the score. `current` walks back from the latest
// answer while it stayed correct; `best` is the longest correct run so far.
export function streakInfo(snapshot) {
  const answers = snapshot?.answers ?? []
  let current = 0
  for (let i = answers.length - 1; i >= 0; i -= 1) {
    if (!answers[i]?.correct) break
    current += 1
  }
  let best = 0
  let run = 0
  for (const answer of answers) {
    if (answer?.correct) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return { current, best, answered: answers.length }
}
