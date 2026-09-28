import { Route, Routes } from 'react-router-dom'
import Home from './components/Home.jsx'
import Layout from './components/Layout.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import QuizPlaceholder from './components/QuizPlaceholder.jsx'
import SqlQuiz from './pages/SqlQuiz.jsx'
import Practice from './pages/Practice.jsx'
import Academy from './pages/Academy.jsx'
import Chapter from './pages/Chapter.jsx'
import AuthPage from './pages/Auth.jsx'
import AdminPage from './pages/Admin.jsx'
import ProfilePage from './pages/Profile.jsx'
import LevelReport from './pages/LevelReport.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="quiz/sql" element={<SqlQuiz />} />
        <Route path="practice" element={<Practice />} />
        <Route path="academy" element={<Academy />} />
        <Route path="academy/sql" element={<Academy />} />
        <Route path="academy/sql/:chapterSlug" element={<Chapter />} />
        <Route path="quiz/mongo" element={<QuizPlaceholder game="mongo" comingSoon />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/report/:mode/:level" element={<LevelReport />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App