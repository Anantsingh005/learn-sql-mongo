export const ENTER_POP = 'enter-pop'

// Inline style for staggered enter-* animations: word i animates at base + i * step ms.
export const stagger = (i, step = 80, base = 0) => ({
  animationDelay: `${base + i * step}ms`,
})

export const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/quiz/sql', label: 'SQL Quiz' },
  { to: '/academy', label: 'Academy' },
  { to: '/practice', label: 'More Practice' },
  { to: '/leaderboard', label: 'Leaderboard' },
]