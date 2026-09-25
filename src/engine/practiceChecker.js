export function checkPracticeAnswer(question, selected, options = {}) {
  const { ignoreCase = false } = options
  const expected = question.correctAnswer ?? question.correct_answer
  const selectedText = String(selected ?? '').trim()
  const expectedText = String(expected ?? '').trim()
  const correct = ignoreCase
    ? selectedText.toLowerCase() === expectedText.toLowerCase()
    : selectedText === expectedText
  return {
    correct,
    selected: selectedText,
    correctAnswer: expectedText,
  }
}

export default checkPracticeAnswer