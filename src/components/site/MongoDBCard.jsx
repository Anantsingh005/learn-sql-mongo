import DatabaseCard from './DatabaseCard.jsx'
import { LeafIcon } from './icons.jsx'

export default function MongoDBCard({ baseDelay = 0 }) {
  return (
    <DatabaseCard
      to="/quiz/mongo"
      tone="mongo"
      Icon={LeafIcon}
      title="MongoDB Practice"
      description="Work with MongoDB queries and real-time challenges."
      action="Start Now"
      comingSoon
      baseDelay={baseDelay}
    />
  )
}
