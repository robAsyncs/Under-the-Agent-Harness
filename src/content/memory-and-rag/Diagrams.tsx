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

type Box = { x: number; y: number; w: number; label: string; pin?: number }

const BOX_H = 40
const BOXES: Record<string, Box> = {
  start: { x: 8, y: 80, w: 104, label: 'Session start', pin: 1 },
  model: { x: 162, y: 20, w: 104, label: 'Call model' },
  tools: { x: 162, y: 140, w: 104, label: 'Run tools', pin: 2 },
  end: { x: 316, y: 20, w: 96, label: 'Turn ends', pin: 3 },
  compact: { x: 316, y: 140, w: 96, label: 'Compact', pin: 4 },
}

type Note = { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }

const ARROWS: { d: string; dashed?: boolean; note?: Note }[] = [
  { d: 'M112,92 L160,56' },
  { d: 'M228,60 L228,138', note: { x: 234, y: 104, text: 'tool calls', anchor: 'start' } },
  { d: 'M200,140 L200,62', note: { x: 194, y: 104, text: 'results', anchor: 'end' } },
  { d: 'M266,40 L314,40', note: { x: 290, y: 33, text: 'no tools', anchor: 'middle' } },
  { d: 'M266,160 L314,160', dashed: true, note: { x: 290, y: 176, text: 'near limit', anchor: 'middle' } },
  { d: 'M352,140 L262,62', dashed: true },
]

/** The agent loop from Topic 5, with the four places durable state is read or written. */
export function HookLoop() {
  return (
    <svg viewBox="0 0 420 196" className="mem-hookloop" role="img" aria-label="The agent loop with four hook points: session start, each tool call, end of turn, and before compaction">
      <defs>
        <marker id="mem-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" className="mem-hl-head" />
        </marker>
      </defs>
      {ARROWS.map((a) => (
        <g key={a.d}>
          <path d={a.d} className={`mem-hl-edge ${a.dashed ? 'dashed' : ''}`} markerEnd="url(#mem-arrow)" />
          {a.note && (
            <text x={a.note.x} y={a.note.y} className="mem-hl-note" textAnchor={a.note.anchor}>
              {a.note.text}
            </text>
          )}
        </g>
      ))}
      {Object.entries(BOXES).map(([id, b]) => (
        <g key={id} className={`mem-hl-box ${b.pin ? 'pinned' : ''}`}>
          <rect x={b.x} y={b.y} width={b.w} height={BOX_H} rx={8} />
          <text x={b.x + b.w / 2} y={b.y + 25} textAnchor="middle">
            {b.label}
          </text>
          {b.pin && (
            <g className="mem-hl-pin">
              <circle cx={b.x + 4} cy={b.y + 4} r={10} />
              <text x={b.x + 4} y={b.y + 8} textAnchor="middle">
                {b.pin}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}
