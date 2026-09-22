export function shuffleOptions(question) {
  if (question.type !== 'mc' || !Array.isArray(question.options) || question.options.length === 0) {
    return question
  }
  const indices = question.options.map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return {
    ...question,
    options: indices.map((i) => question.options[i]),
    answerIndex: indices.indexOf(question.answerIndex),
  }
}

export default shuffleOptions