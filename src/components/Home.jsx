import { useInView } from '../hooks/useInView.js'
import Hero from './site/Hero.jsx'
import MobileHome from './site/MobileHome.jsx'
import SQLCard from './site/SQLCard.jsx'
import MongoDBCard from './site/MongoDBCard.jsx'

export default function Home() {
  const [cardsRef, cardsInView] = useInView()

  const cards = [
    { key: 'sql', Card: SQLCard },
    { key: 'mongo', Card: MongoDBCard },
  ]

  return (
    <>
      <MobileHome />

      <div className="hidden overflow-x-clip bg-white text-body lg:block">
        <Hero />

        <section
          ref={cardsRef}
          className="border-t border-line bg-mist/60"
          aria-labelledby="games-heading"
        >
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
            <h2 id="games-heading" className="sr-only">
              Choose a game
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {cards.map(({ key, Card }, i) => (
                <div
                  key={key}
                  className={`reveal h-full ${cardsInView ? 'is-in' : ''}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Card baseDelay={i * 80} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}