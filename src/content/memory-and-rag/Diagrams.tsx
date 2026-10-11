const TIERS: { kind: string; title: string; lives: string; lasts: string; example: string }[] = [
  {
    kind: 'short',
    title: 'Short-term',
    lives: 'The context window: system prompt, conversation, tool results.',
    lasts: 'One run, until it is compacted or cleared.',
    example: 'The user said the trip is in May.',
  },
  {
    kind: 'working',
    title: 'Working',
    lives: 'A scratchpad, plan file or to-do list the agent updates as it works.',
    lasts: 'One task, across context resets and sessions.',
    example: '3 of 7 sources checked; next: the 2024 census.',
  },
  {
    kind: 'long',
    title: 'Long-term',
    lives: 'Memory files, a database, a document index.',
    lasts: 'Across tasks, until someone deletes or corrects it.',
    example: 'Prefers metric units. The deploy script is in ops/.',
  },
]

/** Three kinds of memory, from the context window outward. */
export function MemoryTiers() {
  return (
    <ol className="mem-tiers">
      {TIERS.map((t) => (
        <li key={t.kind} className={`mem-tier ${t.kind}`}>
          <strong>{t.title}</strong>
          <span>
            <em>Lives in</em> {t.lives}
          </span>
          <span>
            <em>Lasts</em> {t.lasts}
          </span>
          <q>{t.example}</q>
        </li>
      ))}
    </ol>
  )
}

const STORES: [string, string, string][] = [
  ['Transcript / checkpoint', 'The harness, after every turn', 'Replayed when a session resumes; compaction replaces old turns with a summary'],
  ['Instruction and memory files (CLAUDE.md, MEMORY.md)', 'The user, or the agent with file tools', 'Put into the system prompt by the harness at session start'],
  ['Memory tool directory', 'The model, through tool calls', 'The model reads it on demand, and is told to check it first'],
  ['Workspace (progress notes, task list, git)', 'The agent, as a side effect of its work', 'A new session reads them first: “read progress.md and git log”'],
  ['Harness-owned state (to-do list, budgets)', 'The harness, from tool results', 'Re-injected every turn or rendered into the system prompt'],
  ['External stores (database, vector index)', 'Tools and indexing jobs', 'Retrieval tools, or RAG that runs before each call'],
]

/** Where durable state can live, who writes it, and how it gets back into context. */
export function StateTable() {
  return (
    <div className="llm-table-wrap">
      <table className="llm-table mem-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Who writes it</th>
            <th>How it gets back into context</th>
          </tr>
        </thead>
        <tbody>
          {STORES.map((r) => (
            <tr key={r[0]}>
              {r.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const INDEXING = ['Load', 'Chunk', 'Embed', 'Store']
const QUERY = ['Embed the question', 'Search', 'Rerank', 'Add to the prompt', 'Answer with citations']

/** The two halves of RAG: indexing ahead of time, and the steps for each question. */
export function RagPipeline() {
  return (
    <div className="mem-pipeline">
      <div className="mem-pipe-row">
        <span className="mem-pipe-label">Ahead of time</span>
        <ol>
          {INDEXING.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="mem-pipe-row query">
        <span className="mem-pipe-label">Each question</span>
        <ol>
          {QUERY.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
