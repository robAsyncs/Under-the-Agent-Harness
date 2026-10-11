const ROWS: [string, string, string, string][] = [
  ['LangGraph', 'A graph of nodes (steps) and edges (what runs next), over shared state', 'Custom control flow, checkpoints, human-in-the-loop pauses', 'More concepts to learn; you design the graph'],
  ['Claude Agent SDK', 'The Claude Code harness as a library: built-in file, shell and search tools', 'Agents that work on files and code; least code to a capable agent', 'Built around Claude and Claude Code’s way of working'],
  ['OpenAI Agents SDK', 'A small set of primitives: agents, tools, handoffs, guardrails, sessions', 'Handoffs between specialist agents; built-in tracing', 'Thin by design; complex flows are your code'],
  ['CrewAI', 'Agents with a role, goal and backstory, working through tasks as a crew', 'Quick role-based multi-agent prototypes', 'The role-play framing hides what each call does'],
  ['AutoGen', 'Agents that solve tasks by sending each other messages', 'Research on multi-agent conversation', 'Microsoft has since folded it into the Microsoft Agent Framework'],
]

/** What the main frameworks are built around. */
export function FrameworkTable() {
  return (
    <div className="llm-table-wrap">
      <table className="llm-table arc-table">
        <thead>
          <tr>
            <th>Framework</th>
            <th>Built around</th>
            <th>Good for</th>
            <th>Trade-off</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
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

const STAGES = [
  { name: 'Gather context', what: 'Find and read the code that matters', tools: ['Glob', 'Grep', 'Read', 'WebSearch', 'subagents'] },
  { name: 'Take action', what: 'Change files and run commands', tools: ['Edit', 'Write', 'Bash'] },
  { name: 'Verify', what: 'Check that the change worked', tools: ['Bash: tests', 'Bash: build', 'Read output'] },
]

/** Claude Code's turn: gather, act, verify, repeat. */
export function CodingCycle() {
  return (
    <div className="fp-cycle">
      <ol className="fp-cycle-stages">
        {STAGES.map((s, i) => (
          <li key={s.name}>
            <span className="fp-cycle-num">{i + 1}</span>
            <strong>{s.name}</strong>
            <span className="fp-cycle-what">{s.what}</span>
            <span className="fp-chips">
              {s.tools.map((t) => (
                <code key={t}>{t}</code>
              ))}
            </span>
          </li>
        ))}
      </ol>
      <p className="fp-cycle-back">
        <span aria-hidden="true">↺</span> Tests fail or something is missing: back to step 1. Tests pass: done.
      </p>
    </div>
  )
}

const LAYERS = [
  {
    name: 'Disposable environment',
    kind: 'Wall',
    detail: 'A dev container, a VM, or a cloud microVM such as Firecracker. Whatever goes wrong stays on a machine you can throw away.',
  },
  {
    name: 'OS sandbox',
    kind: 'Wall',
    detail: 'Seatbelt on macOS, bubblewrap on Linux. Commands can write only inside the working directory, and all network traffic goes through a proxy that allows approved domains only.',
  },
  {
    name: 'Hook or permission rule',
    kind: 'Seatbelt',
    detail: 'Checks the text of a command before it runs. Catches the obvious cases; a cleverly written command can slip past.',
  },
]

/** Isolation layers around a command the agent runs, from the outside in. */
export function SandboxLayers() {
  const layer = (i: number) => {
    if (i === LAYERS.length) {
      return (
        <div className="fp-layer-core">
          <code>bash: npm test</code>
        </div>
      )
    }
    const l = LAYERS[i]
    return (
      <div className={`fp-layer fp-layer-${i}`}>
        <div className="fp-layer-head">
          <strong>{l.name}</strong>
          <span className={`fp-layer-kind ${l.kind === 'Wall' ? 'wall' : ''}`}>{l.kind}</span>
        </div>
        <p>{l.detail}</p>
        {layer(i + 1)}
      </div>
    )
  }
  return layer(0)
}

const OSWORLD: { label: string; when: string; value: number; plus?: boolean; human?: boolean }[] = [
  { label: 'People', when: '2024', value: 72, human: true },
  { label: 'Best model at launch', when: '2024', value: 12 },
  { label: 'Claude, first computer use release', when: 'Oct 2024', value: 14.9 },
  { label: 'Frontier models', when: 'late 2025', value: 60, plus: true },
]

/** OSWorld task success rates over time. */
export function OsworldChart() {
  return (
    <div className="fp-chart" role="img" aria-label="OSWorld success rates: people 72%, best model 12% in 2024, Claude 14.9% in October 2024, frontier models above 60% by late 2025">
      {OSWORLD.map((r) => (
        <div key={r.label} className={`fp-bar-row ${r.human ? 'human' : ''}`}>
          <span className="fp-bar-label">
            {r.label} <em>{r.when}</em>
          </span>
          <span className="fp-bar-track">
            <span className={`fp-bar ${r.plus ? 'plus' : ''}`} style={{ width: `${r.value}%` }} />
            <span className="fp-bar-human" style={{ left: '72%' }} aria-hidden="true" />
          </span>
          <span className="fp-bar-value">
            {r.plus ? '60%+' : `${r.value}%`}
          </span>
        </div>
      ))}
      <p className="fp-chart-axis">
        <span>0%</span>
        <span>Share of 369 desktop tasks completed · dashed line: people</span>
        <span>100%</span>
      </p>
    </div>
  )
}
