const FAILURES: [string, string, string][] = [
  ['Duplicated work', 'Two workers run the same searches or edit the same file', 'Briefs that state each worker’s scope and what is out of scope'],
  ['Conflicting decisions', 'The parts don’t fit together: different styles, assumptions or interfaces', 'Don’t split tightly coupled work; if you must, share the decisions, not just the task'],
  ['The telephone game', 'Facts get distorted as summaries are summarized again', 'Workers write findings with sources to files; the orchestrator reads the originals'],
  ['Runaway spawning', 'Twenty workers for a simple question', 'Effort rules in the orchestrator’s prompt, hard caps in the harness'],
  ['Unverified claims', 'The orchestrator repeats a worker’s mistake with confidence', 'Require sources; add a checking step before the final answer'],
  ['Silent failures', 'A worker crashed and its part is just missing', 'Return failures as results, and make the report say what is missing'],
  ['Losing the task', 'The orchestrator stops early or drifts from the question', 'Keep the plan in a file and check it off before finishing'],
]

/** Common multi-agent failures, what they look like, and the harness fix. */
export function FailureTable() {
  return (
    <div className="llm-table-wrap">
      <table className="llm-table ma-table">
        <thead>
          <tr>
            <th>Failure</th>
            <th>What it looks like</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          {FAILURES.map((r) => (
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

type Span = { name: string; detail: string; ms: number; start: number; error?: boolean; children?: Span[] }

const TRACE: Span = {
  name: 'run',
  detail: 'research question',
  start: 0,
  ms: 300,
  children: [
    { name: 'orchestrator: plan', detail: '3 subtopics', start: 0, ms: 20 },
    {
      name: 'worker: prices',
      detail: '4 searches, 900 tokens back',
      start: 20,
      ms: 180,
      children: [
        { name: 'web_search ×4', detail: '', start: 25, ms: 120 },
        { name: 'answer', detail: '', start: 150, ms: 50 },
      ],
    },
    {
      name: 'worker: running costs',
      detail: '3 searches, 800 tokens back',
      start: 20,
      ms: 150,
      children: [{ name: 'web_search ×3', detail: '', start: 25, ms: 100 }],
    },
    {
      name: 'worker: tax and insurance',
      detail: 'rate limited, retried twice, gave up',
      start: 20,
      ms: 220,
      error: true,
    },
    { name: 'orchestrator: write report', detail: 'notes one subtopic missing', start: 240, ms: 60 },
  ],
}

function Row({ span, depth }: { span: Span; depth: number }) {
  return (
    <>
      <li className={`ma-span ${span.error ? 'error' : ''}`} style={{ paddingLeft: depth * 16 }}>
        <span className="ma-span-name">
          {span.name}
          {span.detail && <em> · {span.detail}</em>}
        </span>
        <span className="ma-span-track">
          <span
            className="ma-span-bar"
            style={{ left: `${(span.start / TRACE.ms) * 100}%`, width: `${(span.ms / TRACE.ms) * 100}%` }}
          />
        </span>
      </li>
      {span.children?.map((c) => <Row key={c.name} span={c} depth={depth + 1} />)}
    </>
  )
}

/** One multi-agent run as a tree of spans, with time running left to right. */
export function TraceTree() {
  return (
    <ul className="ma-trace" aria-label="Trace of one run: three workers in parallel, one of them failed">
      <Row span={TRACE} depth={0} />
    </ul>
  )
}
