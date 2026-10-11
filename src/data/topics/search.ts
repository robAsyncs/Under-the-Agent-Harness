import type { Topic } from '../../types'
import { TERMS_BY_TOPIC } from '../glossary'
import { TOPICS } from '.'

export interface TopicMatch {
  topic: Topic
  /** Where the query matched, when it wasn't the title or summary. */
  hint?: string
}

/** Text a topic can be found by, besides its title and summary. */
function extras(t: Topic): string[] {
  const terms = Object.values(TERMS_BY_TOPIC[t.id] ?? {}).map((g) => g.term)
  return [
    ...t.sections.flatMap((s) => [s.title, ...s.points]),
    ...terms,
    ...(t.project ? [t.project] : []),
  ]
}

/** Topics containing every word of the query, in display order. */
export function searchTopics(query: string): TopicMatch[] {
  // Drop a plural "s" so "hooks" finds "Hook" (and "agents" still finds "agents").
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
  if (words.length === 0) return TOPICS.map((topic) => ({ topic }))

  const has = (text: string, w: string) => text.toLowerCase().includes(w)
  const matches: TopicMatch[] = []
  for (const topic of TOPICS) {
    const head = `${topic.number ?? ''} ${topic.title} ${topic.summary}`
    const rest = extras(topic)
    const found = words.every((w) => has(head, w) || rest.some((r) => has(r, w)))
    if (!found) continue
    const missing = words.filter((w) => !has(head, w))
    const hint = missing.length ? rest.find((r) => missing.some((w) => has(r, w))) : undefined
    matches.push({ topic, hint })
  }
  return matches
}
