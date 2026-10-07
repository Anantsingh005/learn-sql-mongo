import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchIsAdmin } from '../lib/admin.js'

let cached = null

export function useIsAdmin() {
  const { user, configured } = useAuth()
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (!configured || !user?.id) {
      cached = null
      setIsAdmin(false)
      return
    }
    if (cached && cached.id === user.id) {
      setIsAdmin(cached.ok)
      return
    }
    let active = true
    fetchIsAdmin().then((ok) => {
      if (!active) return
      cached = { id: user.id, ok }
      setIsAdmin(ok)
    })
    return () => {
      active = false
    }
  }, [configured, user?.id])

  return { isAdmin, checking: isAdmin === null }
}

export default useIsAdmin