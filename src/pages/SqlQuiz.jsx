import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QueryRunner from '../engine/QueryRunner.js'
import { QuizEngine } from '../engine/QuizEngine.js'
import { buildCheckQuery } from '../engine/queryCheck.js'
import { selectQuestions, GUEST_QUESTION_LIMIT } from '../data/selectQuestions.js'
import { saveScore } from '../lib/leaderboard.js'
import { getProgress, recordLevelResult, isLevelUnlocked } from '../lib/progress.js'
import { saveAttempts } from '../lib/attempts.js'
import { useAuth } from '../context/AuthContext.jsx'
import useQuizEngine from '../hooks/useQuizEngine.js'
import ModeSelect, { quizModes } from '../components/quiz/ModeSelect.jsx'
import LevelSelect from '../components/quiz/LevelSelect.jsx'
import QuestionCard from '../components/quiz/QuestionCard.jsx'
import SqlEditor from '../components/quiz/SqlEditor.jsx'
import HUD from '../components/quiz/HUD.jsx'
import Feedback from '../components/quiz/Feedback.jsx'
import ResultScreen from '../components/quiz/ResultScreen.jsx'

const DEEP_LINK_LEVELS = new Set(['easy', 'medium', 'hard', 'all'])

function SqlQuiz() {
  const [mode, setMode] = useState(null)
  const [engine, setEngine] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const [progress, setProgress] = useState({ completed: [], best: {} })
  const savedRef = useRef(null)
  const deepLinkRef = useRef(false)
  const [params] = useSearchParams()
  const { user, profile, configured, loading } = useAuth()
  const isGuest = configured && !user
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
    recordLevelResult('sql', engine.difficulty, percent, user?.id, mode?.key).then((next) => {
      if (next) setProgress(next)
    })
    if (user) {
      saveAttempts(user.id, { game: 'sql', mode: mode?.key, attempts: engine.answers })
        .then(({ error }) => {
          if (error) console.error('saveAttempts failed:', error)
        })
      saveScore({
        game: 'sql',
        mode: mode?.key,
        level: engine.difficulty,
        score: snapshot.score,
        time: snapshot.elapsedSeconds,
        correctCount: engine.answers.filter((a) => a.correct).length,
        totalQuestions: engine.answers.length,
        livesLeft: snapshot.lives,
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

  const handleStart = (config, modeObj = mode) => {
    const questions = selectQuestions({ ...config, limit: isGuest ? GUEST_QUESTION_LIMIT : undefined })
    if (questions.length === 0) return
    const checkQuery = buildCheckQuery(QueryRunner)
    const nextEngine = new QuizEngine(questions, { checkQuery }, {
      timePerQuestion: modeObj?.timePerQuestion,
      extraTime: isGuest ? undefined : modeObj?.extraTime,
    })
    nextEngine.difficulty = config.difficulty ?? 'all'
    setEngine((prev) => {
      prev?.destroy()
      return nextEngine
    })
    setSelectedIndex(null)
    nextEngine.start(config.types)
  }

  useEffect(() => {
    if (loading || deepLinkRef.current) return undefined
    const level = params.get('level')
    const key = params.get('mode')
    if (!DEEP_LINK_LEVELS.has(level) || !key) return undefined
    const modeObj = quizModes.find((m) => m.key === key)
    if (!modeObj) return undefined
    if (isGuest && level !== 'easy') return undefined
    if (!isLevelUnlocked(level, progress, modeObj.key)) return undefined
    deepLinkRef.current = true
    setMode(modeObj)
    handleStart({ types: [modeObj.key], difficulty: level }, modeObj)
    return undefined
  }, [loading, isGuest, params, progress])

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
      return <ModeSelect isGuest={isGuest} onPick={(m) => setMode(m)} />
    }
    return (
      <LevelSelect
        mode={mode}
        bank={selectQuestions({ types: [mode.key], limit: isGuest ? GUEST_QUESTION_LIMIT : undefined })}
        progress={progress}
        isGuest={isGuest}
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
          mode={mode?.key}
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

      {snapshot.extraTimePending && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏰</span>
            <div>
              <div className="text-sm font-bold text-amber-200">
                Only {snapshot.timeLeft}s left!
              </div>
              <div className="text-xs text-amber-200/80">
                Add {snapshot.extraTimeSeconds} more seconds to keep working on this question?
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => engine.grantExtraTime()}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-bold text-amber-950 transition-colors hover:bg-amber-400"
            >
              Add {snapshot.extraTimeSeconds}s
            </button>
            <button
              type="button"
              onClick={() => engine.declineExtraTime()}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      <QuestionCard
        key={question.id}
        question={question}
        selectedIndex={selectedIndex}
        onSelect={handleMcSelect}
        disabled={isFeedback || snapshot.runningAnswer}
        isGuest={isGuest}
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

      {isFeedback && (
        <Feedback
          snapshot={snapshot}
          onNext={() => {
            setSelectedIndex(null)
            engine.next()
          }}
        />
      )}
    </div>
  )
}

export default SqlQuiz