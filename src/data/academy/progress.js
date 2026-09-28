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
      // Added after the first release. An older saved object has no `correct`
      // key, and defaulting to [] means those readers need no migration.
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

export function isSectionRead(sectionId) {
  return read().sections.includes(sectionId)
}

export function isChapterRead(chapterSlug) {
  return read().chapters.includes(chapterSlug)
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

/** A chapter counts as finished once the reader has opened every section in it. */
export function syncChapterRead(chapter) {
  const state = read()
  // Section keys are namespaced by chapter (`sectionKey`), so comparing the bare
  // `s.id` here could never match a stored key and the chapter never completed.
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

export function chapterReadCount(chapter) {
  const { sections } = read()
  return chapter.sections.filter((s) => sections.includes(sectionKey(chapter.slug, s.id))).length
}

/* ------------------------------------------------------------------ *
 * Section quizzes.
 *
 * Kept in a bucket of their own: a question being answered is not the
 * same act as a section being read, so the read counts stay exactly as
 * they were. Only *correct* answers are stored, which is what lets a
 * returning reader skip the questions they have already proved.
 * ------------------------------------------------------------------ */

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

/** Drops every stored answer belonging to a question set, for a retry. */
export function clearQuestions(questionIds) {
  const state = read()
  const drop = new Set(questionIds)
  const next = state.correct.filter((id) => !drop.has(id))
  if (next.length === state.correct.length) return
  write({ ...state, correct: next })
}

export function correctCount() {
  return read().correct.length
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to clear */
  }
}
