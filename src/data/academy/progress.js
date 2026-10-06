import { sectionKey } from './book.js'

const STORAGE_KEY = 'dbquiz:academy-progress'

const EMPTY = { sections: [], chapters: [], correct: [] }

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw)
    return {
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
      correct: Array.isArray(parsed.correct) ? parsed.correct : [],
    }
  } catch {
    return { ...EMPTY }
  }
}

function write(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked (private mode) — progress is a nicety, not required */
  }
}

export function getProgress() {
  return read()
}

export function markSectionRead(sectionId, done) {
  const state = read()
  const has = state.sections.includes(sectionId)
  if (done === has) return state
  write({
    ...state,
    sections: done
      ? [...state.sections, sectionId]
      : state.sections.filter((id) => id !== sectionId),
  })
  return read()
}

export function markChapterRead(chapterSlug, done) {
  const state = read()
  const has = state.chapters.includes(chapterSlug)
  if (done === has) return state
  write({
    ...state,
    chapters: done
      ? [...state.chapters, chapterSlug]
      : state.chapters.filter((slug) => slug !== chapterSlug),
  })
  return read()
}

export function syncChapterRead(chapter) {
  const state = read()
  const all = chapter.sections.every((s) =>
    state.sections.includes(sectionKey(chapter.slug, s.id)),
  )
  const any = chapter.sections.some((s) => state.sections.includes(sectionKey(chapter.slug, s.id)))
  if (all !== state.chapters.includes(chapter.slug)) {
    markChapterRead(chapter.slug, all)
  } else if (!all && !any) {
    markChapterRead(chapter.slug, false)
  }
}

export function isQuestionCorrect(questionId) {
  return read().correct.includes(questionId)
}

export function markQuestionCorrect(questionId, done = true) {
  const state = read()
  const has = state.correct.includes(questionId)
  if (done === has) return
  write({
    ...state,
    correct: done
      ? [...state.correct, questionId]
      : state.correct.filter((id) => id !== questionId),
  })
}

export function clearQuestions(questionIds) {
  const state = read()
  const drop = new Set(questionIds)
  const next = state.correct.filter((id) => !drop.has(id))
  if (next.length === state.correct.length) return
  write({ ...state, correct: next })
}
