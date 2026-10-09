import { Outlet, useLocation } from 'react-router-dom'
import Header from './site/Header.jsx'
import Footer from './site/Footer.jsx'

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  // The SQL Quiz route renders its own full-bleed hero banner below the nav,
  // so it opts out of the shared padded main container (like the landing page).
  const isQuiz = location.pathname === '/quiz/sql'
  // The Academy gate does the same: its pastel hero banner runs the full
  // width of the page, so it only opts out for the gate route (not /academy/sql).
  const isAcademyGate = location.pathname === '/academy'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main
        className={
          isLanding || isQuiz || isAcademyGate
            ? 'flex-1'
            : 'mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10'
        }
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}