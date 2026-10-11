import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { TopicList } from '../components/TopicList'
import { GROUPS } from '../data/topics'
import { searchTopics } from '../data/topics/search'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Topics() {
  useDocumentTitle('Topics')
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const matches = searchTopics(query)
  const hints = Object.fromEntries(matches.map((m) => [m.topic.id, m.hint]))
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" focuses the search box, like most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== '/' || target.matches('input, textarea, [contenteditable]')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const setQuery = (q: string) => setParams(q ? { q } : {}, { replace: true })

  return (
    <main className="app">
      <header className="page-head">
        <h1>Topics</h1>
        <input
          ref={inputRef}
          className="topic-search"
          type="search"
          placeholder="Search topics, sections, and terms"
          aria-label="Search topics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
      </header>
      {matches.length === 0 && <p className="topic-search-empty">No topics match “{query}”.</p>}
      {GROUPS.map((group) => {
        const topics = matches.filter((m) => m.topic.group === group.id).map((m) => m.topic)
        if (topics.length === 0) return null
        return (
          <section key={group.id} className="phase">
            <h2 className="phase-title">{group.title}</h2>
            <TopicList topics={topics} showSummary hints={hints} />
          </section>
        )
      })}
    </main>
  )
}
