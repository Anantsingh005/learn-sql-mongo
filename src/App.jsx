import { Route, Routes } from 'react-router-dom'
import Home from './components/Home.jsx'
import Layout from './components/Layout.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import QuizPlaceholder from './components/QuizPlaceholder.jsx'
import SqlQuiz from './pages/SqlQuiz.jsx'
import AuthPage from './pages/Auth.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="quiz/sql" element={<SqlQuiz />} />
        <Route path="quiz/mongo" element={<QuizPlaceholder game="mongo" comingSoon />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="auth" element={<AuthPage />} />
      </Route>
    </Routes>
  )
}

export default App