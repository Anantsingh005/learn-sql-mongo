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
    if (cached === true) {
      setIsAdmin(true)
      return
    }
    let active = true
    fetchIsAdmin().then((ok) => {
      if (!active) return
      cached = ok
      setIsAdmin(ok)
    })
    return () => {
      active = false
    }
  }, [configured, user?.id])

  return { isAdmin, checking: isAdmin === null }
}

export default useIsAdmin