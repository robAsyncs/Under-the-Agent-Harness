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

type GraphNode = { x: number; y: number; label: string; goal?: boolean; mutex?: boolean }

const COLS = [
  { x: 60, label: 'Facts 0' },
  { x: 185, label: 'Actions 0' },
  { x: 310, label: 'Facts 1' },
  { x: 435, label: 'Actions 1' },
  { x: 560, label: 'Facts 2' },
]
const ROW = { have: 60, none: 120, eaten: 180 }
const FACT_W = 40
const ACT_W = 26

const FACTS: GraphNode[] = [
  { x: 60, y: ROW.have, label: 'Have cake' },
  { x: 310, y: ROW.have, label: 'Have cake', mutex: true },
  { x: 310, y: ROW.none, label: 'No cake' },
  { x: 310, y: ROW.eaten, label: 'Eaten', mutex: true },
  { x: 560, y: ROW.have, label: 'Have cake', goal: true },
  { x: 560, y: ROW.none, label: 'No cake' },
  { x: 560, y: ROW.eaten, label: 'Eaten', goal: true },
]
const ACTIONS: GraphNode[] = [
  { x: 185, y: ROW.none, label: 'Eat' },
  { x: 435, y: 90, label: 'Bake' },
  { x: 435, y: 150, label: 'Eat' },
]
/** [from fact, to action] preconditions and [from action, to fact] effects, as coordinates. */
const PRE: [GraphNode, GraphNode][] = [
  [FACTS[0], ACTIONS[0]],
  [FACTS[2], ACTIONS[1]],
  [FACTS[1], ACTIONS[2]],
]
const EFFECTS: [GraphNode, GraphNode][] = [
  [ACTIONS[0], FACTS[2]],
  [ACTIONS[0], FACTS[3]],
  [ACTIONS[1], FACTS[4]],
  [ACTIONS[2], FACTS[5]],
  [ACTIONS[2], FACTS[6]],
]
/** Facts carried forward unchanged (Graphplan's no-op actions). */
const PERSIST: [GraphNode, GraphNode][] = [
  [FACTS[0], FACTS[1]],
  [FACTS[1], FACTS[4]],
  [FACTS[2], FACTS[5]],
  [FACTS[3], FACTS[6]],
]

/** A three-layer planning graph for "have your cake and eat it", the textbook Graphplan example. */
export function PlanningGraph() {
  return (
    <div className="arc-scroll">
      <svg
        viewBox="0 0 620 240"
        className="arc-pgraph"
        role="img"
        aria-label="Planning graph. Facts 0: have cake. Actions 0: eat. Facts 1: have cake, no cake, eaten, with have cake and eaten mutually exclusive. Actions 1: bake, eat. Facts 2: have cake and eaten, now possible together."
      >
        {COLS.map((c) => (
          <text key={c.label} x={c.x} y={22} textAnchor="middle" className="arc-pg-col">
            {c.label}
          </text>
        ))}
        {PERSIST.map(([a, b]) => (
          <line key={`p${a.x}${a.y}`} x1={a.x + FACT_W} y1={a.y} x2={b.x - FACT_W} y2={b.y} className="arc-pg-noop" />
        ))}
        {PRE.map(([f, a]) => (
          <line key={`pre${a.x}${a.y}`} x1={f.x + FACT_W} y1={f.y} x2={a.x - ACT_W} y2={a.y} className="arc-pg-edge" />
        ))}
        {EFFECTS.map(([a, f]) => (
          <line key={`eff${f.x}${f.y}`} x1={a.x + ACT_W} y1={a.y} x2={f.x - FACT_W} y2={f.y} className="arc-pg-edge" />
        ))}
        <path d={`M ${310 - FACT_W - 2} ${ROW.have + 8} Q 232 ${ROW.none} ${310 - FACT_W - 2} ${ROW.eaten - 8}`} className="arc-pg-mutex" />
        <text x={244} y={ROW.none - 18} textAnchor="end" className="arc-pg-mutex-label">
          mutex
        </text>
        {FACTS.map((n) => (
          <g key={`f${n.x}${n.y}`} className={`arc-pg-fact ${n.goal ? 'goal' : ''} ${n.mutex ? 'mutex' : ''}`}>
            <rect x={n.x - FACT_W} y={n.y - 13} width={FACT_W * 2} height={26} rx={13} />
            <text x={n.x} y={n.y + 4} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}
        {ACTIONS.map((n) => (
          <g key={`a${n.x}${n.y}`} className="arc-pg-action">
            <rect x={n.x - ACT_W} y={n.y - 13} width={ACT_W * 2} height={26} rx={4} />
            <text x={n.x} y={n.y + 4} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}
        <text x={310} y={226} textAnchor="middle" className="arc-pg-note">
          Goal facts both appear, but can’t hold together
        </text>
        <text x={560} y={226} textAnchor="middle" className="arc-pg-note goal">
          Goal reachable: eat, then bake
        </text>
      </svg>
    </div>
  )
}

/** Months from early 2019 to early 2025, doubling every 7. */
const SPAN = 72
const DOUBLING = 7
const X0 = 64
const X1 = 540
const Y0 = 196
const Y1 = 24
const LOG_MAX = Math.log10(2000)
const sx = (m: number) => X0 + (m / SPAN) * (X1 - X0)
const sy = (v: number) => Y0 - (Math.log10(v) / LOG_MAX) * (Y0 - Y1)

/** METR's trend in task length, drawn relative to 2019 on a log scale. */
export function MetrTrend() {
  const points = Array.from({ length: Math.floor(SPAN / DOUBLING) + 1 }, (_, k) => ({ m: k * DOUBLING, v: 2 ** k }))
  const end = 2 ** (SPAN / DOUBLING)
  return (
    <svg
      viewBox="0 0 560 230"
      className="arc-metr"
      role="img"
      aria-label="Task length agents can complete, relative to 2019, on a log scale. A straight line doubling every seven months reaches about a thousand times the 2019 length by 2025."
    >
      {[1, 10, 100, 1000].map((v) => (
        <g key={v}>
          <line x1={X0} x2={X1} y1={sy(v)} y2={sy(v)} className="arc-metr-grid" />
          <text x={X0 - 8} y={sy(v) + 4} textAnchor="end" className="arc-metr-tick">
            ×{v.toLocaleString('en-US')}
          </text>
        </g>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <text key={i} x={sx(i * 12)} y={Y0 + 20} textAnchor="middle" className="arc-metr-tick">
          {2019 + i}
        </text>
      ))}
      <line x1={sx(0)} y1={sy(1)} x2={sx(SPAN)} y2={sy(end)} className="arc-metr-line" />
      {points.map((p) => (
        <circle key={p.m} cx={sx(p.m)} cy={sy(p.v)} r={4.5} className="arc-metr-dot">
          <title>{`${p.m} months in: ×${p.v.toLocaleString('en-US')}`}</title>
        </circle>
      ))}
      <text x={sx(SPAN) - 4} y={sy(end) - 12} textAnchor="end" className="arc-metr-label">
        ≈ ×{(Math.round(end / 50) * 50).toLocaleString('en-US')} in six years
      </text>
      <text x={sx(2 * DOUBLING) + 12} y={sy(4) + 16} className="arc-metr-label muted">
        each dot: one more doubling
      </text>
    </svg>
  )
}
