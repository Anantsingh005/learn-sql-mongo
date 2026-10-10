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
