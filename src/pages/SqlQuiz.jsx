import { useEffect, useRef, useState } from 'react'
import QueryRunner from '../engine/QueryRunner.js'
import { QuizEngine } from '../engine/QuizEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import { selectQuestions } from '../data/selectQuestions.js'
import { saveScore } from '../firebase/leaderboard.js'
import { getProgress, recordLevelResult } from '../firebase/progress.js'
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
  const [engine, setEngine] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const [progress, setProgress] = useState({ completed: [], best: {} })
  const savedRef = useRef(null)
  const { user, profile } = useAuth()
  const snapshot = useQuizEngine(engine)

  useEffect(() => {
    let active = true
    getProgress('sql', user?.id).then((p) => {
      if (active) setProgress(p ?? { completed: [], best: {} })
    })
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    return () => engine?.destroy()
  }, [engine])

  useEffect(() => {
    document.title = snapshot?.status === 'finished' ? 'Results — DBQuiz' : 'SQL Quiz — DBQuiz'
  }, [snapshot?.status])

  useEffect(() => {
    if (!snapshot?.finished || !engine || savedRef.current === engine) return
    savedRef.current = engine
    const correct = engine.answers.filter((a) => a.correct).length
    const answered = engine.answers.length
    const percent = answered > 0 ? Math.round((correct / answered) * 100) : 0
    recordLevelResult('sql', engine.difficulty, percent, user?.id).then((next) => {
      if (next) setProgress(next)
    })
    if (user) {
      saveScore({
        game: 'sql',
        score: snapshot.score,
        time: snapshot.elapsedSeconds,
        userId: user.id,
        username: profile?.username,
      })
        .then(({ error }) => setSaveResult(error ? 'error' : 'saved'))
        .catch(() => setSaveResult('error'))
    }
  }, [snapshot?.finished, snapshot?.score, snapshot?.elapsedSeconds, engine, user, profile])

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
    nextEngine.difficulty = config.difficulty ?? 'all'
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
        progress={progress}
        onPick={({ difficulty }) => handleStart({ types: [mode.key], difficulty })}
        onBack={() => setMode(null)}
      />
    )
  }

  if (!snapshot || snapshot.status === 'ready' || snapshot.status === 'finished') {
    if (snapshot?.status === 'finished') {
      return (
        <ResultScreen
          snapshot={snapshot}
          saveStatus={saveStatus}
          difficulty={engine?.difficulty}
          progress={progress}
          onReplay={handleReplay}
        />
      )
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