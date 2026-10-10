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
import QuizSidebar from '../components/quiz/QuizSidebar.jsx'
import HelpPanel from '../components/quiz/HelpPanel.jsx'
import ResultScreen from '../components/quiz/ResultScreen.jsx'

const DEEP_LINK_LEVELS = new Set(['easy', 'medium', 'hard', 'all'])
const OPTION_KEYS = ['a', 'b', 'c', 'd']

function SqlQuiz() {
  const [mode, setMode] = useState(null)
  const [engine, setEngine] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [saveResult, setSaveResult] = useState(null)
  const [progress, setProgress] = useState({ completed: [], best: {} })
  const savedRef = useRef(null)
  const selectedRef = useRef(null)
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

  useEffect(() => {
    selectedRef.current = selectedIndex
  }, [selectedIndex])

  const activeQuestion = snapshot?.current
  const snapshotStatus = snapshot?.status
  useEffect(() => {
    if (!engine || !activeQuestion || activeQuestion.type !== 'mc' || snapshotStatus !== 'question') {
      return undefined
    }
    const optionCount = activeQuestion.options?.length ?? 0
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      const index = OPTION_KEYS.indexOf(event.key.toLowerCase())
      if (index !== -1 && index < optionCount) {
        event.preventDefault()
        setSelectedIndex(index)
        return
      }
      if (event.key === 'Enter') {
        if (tag === 'BUTTON') return
        if (selectedRef.current !== null) {
          event.preventDefault()
          engine.submitMultipleChoice(selectedRef.current)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engine, activeQuestion, snapshotStatus])

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
          username={profile?.username}
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

  const handleNext = () => {
    setSelectedIndex(null)
    engine.next()
  }

  const handleSqlSubmit = async (sql) => {
    await engine.submitQuery(sql)
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-white to-white"
      />
      <div
        aria-hidden="true"
        className="blob-drift pointer-events-none absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-[rgba(247,212,237,0.55)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="blob-drift-b pointer-events-none absolute -right-24 top-48 -z-10 h-80 w-80 rounded-full bg-[rgba(213,194,245,0.5)] blur-3xl"
      />

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-[320px_minmax(0,1fr)] min-[1200px]:grid-cols-[320px_minmax(0,1fr)_320px]">
          {/* Left sidebar (summary) — collapses into a slim row under 900px */}
          <aside
            className="quiz-col order-2 hidden min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:block"
            style={{ animationDelay: '0ms' }}
          >
            <QuizSidebar
              snapshot={snapshot}
              questions={engine.sequence}
              level={engine.difficulty}
            />
          </aside>

          {/* Center — question card with mode-specific body + footer */}
          <div
            className="quiz-col order-1 flex min-w-0 flex-col gap-5 min-[900px]:order-none min-[900px]:col-start-2 min-[900px]:row-start-1"
            style={{ animationDelay: '120ms' }}
          >
            <div className="min-[900px]:hidden">
              <QuizSidebar variant="compact" snapshot={snapshot} level={engine.difficulty} />
            </div>

            <HUD
              snapshot={snapshot}
              onGrantExtraTime={() => engine.grantExtraTime()}
              onDeclineExtraTime={() => engine.declineExtraTime()}
            />

            <QuestionCard
              key={question.id}
              question={question}
              selectedIndex={selectedIndex}
              onSelect={handleMcSelect}
              disabled={isFeedback || snapshot.runningAnswer}
              snapshot={snapshot}
              onSubmit={submitMc}
              onNext={handleNext}
            >
              {(question.type === 'write' || question.type === 'bug') && (
                <SqlEditor
                  question={question}
                  onSubmit={handleSqlSubmit}
                  isFeedback={isFeedback}
                  snapshot={snapshot}
                  onNext={handleNext}
                />
              )}
            </QuestionCard>
          </div>

          {/* Right help panel — collapsible "Help" under the card below 1200px */}
          <aside
            className="quiz-col order-3 min-w-0 min-[900px]:order-none min-[900px]:col-start-2 min-[900px]:row-start-2 min-[1200px]:col-start-3 min-[1200px]:row-start-1"
            style={{ animationDelay: '240ms' }}
          >
            <HelpPanel
              question={question}
              isGuest={isGuest}
              snapshot={snapshot}
              onBackToLevels={handleReplay}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default SqlQuiz