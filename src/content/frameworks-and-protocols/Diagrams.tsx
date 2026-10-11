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
