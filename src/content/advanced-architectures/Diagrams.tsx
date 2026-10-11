const ROWS: [string, string, string, string][] = [
  ['Search (STRIPS, A*)', 'Before acting, over a model of the world', 'Finds a correct, often optimal plan', 'Needs every state and action spelled out; cost explodes with size'],
  ['Planning graphs', 'Before acting, over a compact graph', 'Rules out impossible combinations early', 'Still needs a formal model; not how LLM agents work'],
  ['Tree of Thoughts', 'Before committing to each step', 'Recovers from bad early steps by backtracking', 'Many model calls per step'],
  ['ReAct', 'One step at a time, while acting', 'Adapts to every result; cheap per step', 'No look-ahead; can wander on long tasks'],
  ['Plan-and-execute', 'Up front, revised on failure', 'A plan people can review; cheap execution', 'The first plan is made with the least information'],
  ['Hierarchical', 'Coarse first, details when reached', 'Scales to long tasks; splits work across agents', 'Bad decomposition at the top spoils everything below'],
  ['With memory', 'Plans kept and reused across steps and runs', 'Survives context resets; gets better with reuse', 'Stale or wrong notes get trusted later'],
]

/** The planning approaches side by side. */
export function PlanningTable() {
  return (
    <div className="llm-table-wrap">
      <table className="llm-table arc-table">
        <thead>
          <tr>
            <th>Approach</th>
            <th>When it plans</th>
            <th>Strength</th>
            <th>Weakness</th>
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
