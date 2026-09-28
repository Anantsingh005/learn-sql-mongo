import { useLocation } from 'react-router-dom'
import BookGate from '../components/academy/BookGate.jsx'
import SqlBook from '../components/academy/SqlBook.jsx'

/**
 * `/academy` opens on the language picker; `/academy/sql` is the book itself.
 * The choice lives in the path so every book and chapter link is shareable and
 * a deep link can skip straight past the gate.
 */
export default function Academy() {
  const { pathname } = useLocation()

  if (pathname === '/academy/sql') return <SqlBook />
  return <BookGate />
}
