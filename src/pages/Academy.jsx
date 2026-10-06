import { useLocation } from 'react-router-dom'
import BookGate from '../components/academy/BookGate.jsx'
import SqlBook from '../components/academy/SqlBook.jsx'

export default function Academy() {
  const { pathname } = useLocation()

  if (pathname === '/academy/sql') return <SqlBook />
  return <BookGate />
}
