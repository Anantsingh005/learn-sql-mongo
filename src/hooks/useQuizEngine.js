import { useEffect, useState } from 'react'

export function useQuizEngine(engine) {
  const [snapshot, setSnapshot] = useState(() => (engine ? engine.snapshot() : null))

  useEffect(() => {
    if (!engine) return undefined
    return engine.subscribe(setSnapshot)
  }, [engine])

  return engine ? snapshot : null
}

export default useQuizEngine