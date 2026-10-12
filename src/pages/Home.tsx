import { Link } from 'react-router'
import { HarnessDiagram } from '../components/HarnessDiagram'
import { Evolution } from '../components/Evolution'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Home() {
  useDocumentTitle()

  return (
    <div className="home">
      <section className="home-hero">
        <HarnessDiagram />
        <h1>Under the Harness</h1>
        <p>A semester project on how AI agents work.</p>
        <a className="scroll-cue" href="#evolution" aria-label="Scroll to the story">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </section>

      <Evolution />

      <section className="evo-end">
        <h2>That's the whole family tree.</h2>
        <p>
          Every step added one layer around the same next-word predictor. Want to learn how each layer actually works?
        </p>
        <Link className="cta" to="/topics">
          Explore the topics →
        </Link>
      </section>

      <section className="home-section">
        <div className="tiles">
          <Link className="tile" to="/playground">
            <span className="tile-eyebrow">Playground</span>
            <h3>Watch an agent run, step by step.</h3>
          </Link>
          <Link className="tile" to="/reference">
            <span className="tile-eyebrow">Reference</span>
            <h3>Every agent action, with examples.</h3>
          </Link>
        </div>
      </section>
    </div>
  )
}
