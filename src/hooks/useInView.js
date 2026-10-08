import { useEffect, useRef, useState } from 'react'

export function useInView({ threshold = 0.12, rootMargin = '0px 0px -56px 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver !== 'function')

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setInView(true)
        observer.disconnect()
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [inView, threshold, rootMargin])

  return [ref, inView]
}