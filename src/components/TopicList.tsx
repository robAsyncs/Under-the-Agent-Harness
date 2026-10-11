import { Link } from 'react-router'
import type { Topic } from '../types'

export function TopicList({
  topics,
  showSummary,
  hints,
}: {
  topics: Topic[]
  showSummary?: boolean
  /** Per-topic note on why it matched a search. */
  hints?: Record<string, string | undefined>
}) {
  return (
    <ol className="module-list">
      {topics.map((t) => (
        <li key={t.id}>
          <Link to={`/topics/${t.id}`}>
            <span className="module-num">{t.number === null ? '★' : String(t.number).padStart(2, '0')}</span>
            <span className="module-main">
              <strong>{t.title}</strong>
              {showSummary && <span className="module-goal">{t.summary}</span>}
              {hints?.[t.id] && <span className="module-hint">Mentions: {hints[t.id]}</span>}
            </span>
            <span className="module-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
