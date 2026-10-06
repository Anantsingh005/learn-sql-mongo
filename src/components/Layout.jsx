import { Outlet, useLocation } from 'react-router-dom'
import Header from './site/Header.jsx'
import Footer from './site/Footer.jsx'

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className={isLanding ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10'}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}