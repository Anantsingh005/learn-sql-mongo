import DatabaseCard from './DatabaseCard.jsx'
import { CodeIcon } from './icons.jsx'

export default function SQLCard({ baseDelay = 0 }) {
  return (
    <DatabaseCard
      to="/quiz/sql"
      tone="sql"
      Icon={CodeIcon}
      title="SQL Practice"
      description="Write and run real SQL queries with instant feedback."
      action="Start Now"
      baseDelay={baseDelay}
    />
  )
}
