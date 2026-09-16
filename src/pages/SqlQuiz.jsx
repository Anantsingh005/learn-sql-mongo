import { useEffect, useRef, useState } from 'react'
import QueryRunner from '../engine/QueryRunner.js'
import { QuizEngine } from '../engine/QuizEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import { selectQuestions } from '../data/selectQuestions.js'
import { saveScore } from '../lib/scores.js'
import { useAuth } from '../context/AuthContext.jsx'
import useQuizEngine from '../hooks/useQuizEngine.js'
import ModeSelect from '../components/quiz/ModeSelect.jsx'
import LevelSelect from '../components/quiz/LevelSelect.jsx'
import QuestionCard from '../components/quiz/QuestionCard.jsx'
import SqlEditor from '../components/quiz/SqlEditor.jsx'
import HUD from '../components/quiz/HUD.jsx'
import Feedback from '../components/quiz/Feedback.jsx'
import ResultScreen from '../components/quiz/ResultScreen.jsx'

function SqlQuiz() {
  const [mode, setMode] = useState(null)
  const [questionBank, setQuestionBank] = useState([])
  const [engine, setEngine] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const savedRef = useRef(null)
  const { user } = useAuth()
  const snapshot = useQuizEngine(engine)

  useEffect(() => {
    return () => engine?.destroy()
  }, [engine])

  useEffect(() => {
    document.title = snapshot?.status === 'finished' ? 'Results — DBQuiz' : 'SQL Quiz — DBQuiz'
  }, [snapshot?.status])

  useEffect(() => {
    if (!snapshot?.finished || !engine || savedRef.current === engine) return
    savedRef.current = engine
    if (!user) return
    saveScore({ game: 'sql', score: snapshot.score, time: snapshot.elapsedSeconds, userId: user.id })
      .then(({ error }) => setSaveResult(error ? 'error' : 'saved'))
      .catch(() => setSaveResult('error'))
  }, [snapshot?.finished, snapshot?.score, snapshot?.elapsedSeconds, engine, user])

  const saveStatus = snapshot?.finished
    ? !user
      ? 'guest'
      : saveResult ?? 'saving'
    : 'idle'

  const handleStart = (config) => {
    const questions = selectQuestions(config)
    if (questions.length === 0) return
    const checkQuery = buildCheckQuery(QueryRunner)
    const nextEngine = new QuizEngine(questions, { checkQuery })
    setEngine((prev) => {
      prev?.destroy()
      return nextEngine
    })
    setSelectedIndex(null)
    nextEngine.start(config.types)
  }

  const handleReplay = () => {
    setEngine((prev) => {
      prev?.destroy()
      return null
    })
    setSelectedIndex(null)
    setSaveResult(null)
    savedRef.current = null
  }

  if (!engine) {
    if (!mode) {
      return <ModeSelect onPick={(m) => setMode(m)} />
    }
    return (
      <LevelSelect
        mode={mode}
        bank={selectQuestions({ types: [mode.key] })}
        onPick={({ difficulty }) => handleStart({ types: [mode.key], difficulty })}
        onBack={() => setMode(null)}
      />
    )
  }

  if (!snapshot || snapshot.status === 'ready' || snapshot.status === 'finished') {
    if (snapshot?.status === 'finished') {
      return <ResultScreen snapshot={snapshot} saveStatus={saveStatus} onReplay={handleReplay} />
    }
    return null
  }

  const question = snapshot.current
  const isFeedback = snapshot.status === 'feedback'

  const handleMcSelect = (index) => {
    if (isFeedback) return
    setSelectedIndex(index)
  }

  const submitMc = () => {
    if (selectedIndex === null) return
    engine.submitMultipleChoice(selectedIndex)
  }

  const handleSqlSubmit = async (sql) => {
    await engine.submitQuery(sql)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <HUD snapshot={snapshot} />

      <QuestionCard
        key={question.id}
        question={question}
        selectedIndex={selectedIndex}
        onSelect={handleMcSelect}
        disabled={isFeedback || snapshot.runningAnswer}
      >
        {(question.type === 'write' || question.type === 'bug') && !isFeedback && (
          <div className="mt-4">
            <SqlEditor key={question.id} question={question} onSubmit={handleSqlSubmit} disabled={isFeedback} />
          </div>
        )}
        {(question.type === 'write' || question.type === 'bug') && isFeedback && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-slate-400">Your query:</p>
            <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[13px] text-emerald-200">
              {snapshot.answers[snapshot.answers.length - 1]?.answer}
            </pre>
          </div>
        )}
      </QuestionCard>

      {question.type === 'mc' && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIndex === null ? 'Select an answer above' : 'Ready to submit'}
          </span>
          <button
            type="button"
            disabled={selectedIndex === null || isFeedback}
            onClick={submitMc}
            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      )}

      {isFeedback && <Feedback snapshot={snapshot} onNext={() => engine.next()} />}
    </div>
  )
}

export default SqlQuiz