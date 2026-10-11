import { useState } from 'react'

type Status = 'todo' | 'done' | 'failed' | 'dropped'
type PlanNode = { id: string; text: string; parent: string | null; status: Status; note?: string }

/** One step of the run: what the agent did, and how the plan changed. */
type Event = {
  caption: string
  add?: Omit<PlanNode, 'status'>[]
  set?: { id: string; status: Status; note?: string }[]
}

const GOAL = 'Should our town switch its buses to electric? Write a one-page recommendation.'

const EVENTS: Event[] = [
  {
    caption: 'Decompose: the planner splits the goal into three subgoals. It doesn’t plan their details yet.',
    add: [
      { id: 'a', text: 'Understand the current fleet', parent: null },
      { id: 'b', text: 'Compare electric with diesel', parent: null },
      { id: 'c', text: 'Write the recommendation', parent: null },
    ],
  },
  {
    caption: 'Refine: only the first subgoal is broken into concrete tasks, because it is the one about to start.',
    add: [
      { id: 'a1', text: 'Count buses and routes', parent: 'a' },
      { id: 'a2', text: 'Find the yearly fuel and maintenance cost', parent: 'a' },
    ],
  },
  { caption: 'Execute a task and record the result in the plan file.', set: [{ id: 'a1', status: 'done', note: '24 buses, 9 routes' }] },
  {
    caption: 'Execute. With both tasks done, the subgoal is done too.',
    set: [
      { id: 'a2', status: 'done', note: 'about $1.4M a year' },
      { id: 'a', status: 'done' },
    ],
  },
  {
    caption: 'Refine the next subgoal now that the fleet’s size is known.',
    add: [
      { id: 'b1', text: 'Price of electric buses and chargers', parent: 'b' },
      { id: 'b2', text: 'Winter range in our climate', parent: 'b' },
      { id: 'b3', text: 'Running cost per mile', parent: 'b' },
    ],
  },
  { caption: 'Execute.', set: [{ id: 'b1', status: 'done', note: 'about $750k per bus, plus depot chargers' }] },
  {
    caption: 'A task fails: the search finds no winter range data for this region.',
    set: [{ id: 'b2', status: 'failed', note: 'no local data' }],
  },
  {
    caption: 'Replan: drop the failed task and add one that gets the same information another way. The rest of the plan stands.',
    set: [{ id: 'b2', status: 'dropped' }],
    add: [{ id: 'b4', text: 'Use reports from cities with similar winters', parent: 'b' }],
  },
  {
    caption: 'Execute the new task and the remaining one.',
    set: [
      { id: 'b4', status: 'done', note: 'range drops about 30% in deep cold' },
      { id: 'b3', status: 'done', note: 'roughly half of diesel' },
      { id: 'b', status: 'done' },
    ],
  },
  {
    caption: 'Refine and execute the last subgoal, then check the result before calling it finished.',
    add: [
      { id: 'c1', text: 'Draft the recommendation', parent: 'c' },
      { id: 'c2', text: 'Check every figure has a source', parent: 'c' },
    ],
    set: [
      { id: 'c1', status: 'done' },
      { id: 'c2', status: 'done', note: 'all 6 figures sourced' },
      { id: 'c', status: 'done' },
    ],
  },
]

function planAt(step: number): PlanNode[] {
  const nodes: PlanNode[] = []
  for (const e of EVENTS.slice(0, step)) {
    for (const n of e.add ?? []) nodes.push({ ...n, status: 'todo' })
    for (const s of e.set ?? []) Object.assign(nodes.find((n) => n.id === s.id)!, s)
  }
  return nodes
}

const MARK: Record<Status, string> = { todo: ' ', done: 'x', failed: '!', dropped: '-' }

function planFile(nodes: PlanNode[]) {
  const lines = [`# Goal`, GOAL, '']
  nodes
    .filter((n) => n.parent === null)
    .forEach((sub, i) => {
      lines.push(`## ${i + 1}. ${sub.text}${sub.status === 'done' ? ' (done)' : ''}`)
      for (const t of nodes.filter((n) => n.parent === sub.id)) {
        lines.push(`- [${MARK[t.status]}] ${t.text}${t.note ? ` (${t.note})` : ''}`)
      }
      lines.push('')
    })
  return lines.join('\n').trim()
}

export function PlanDemo() {
  const [step, setStep] = useState(0)
  const nodes = planAt(step)
  const subgoals = nodes.filter((n) => n.parent === null)
  const finished = step === EVENTS.length

  return (
    <div className="demo">
      <div className="msg user arc-goal">{GOAL}</div>

      <div className="arc-plan">
        <div className="arc-tree" aria-label="Plan">
          <span className="api-pane-label">Plan</span>
          {subgoals.length === 0 && <p className="small muted">No plan yet.</p>}
          <ol>
            {subgoals.map((sub) => (
              <li key={sub.id} className={`arc-node arc-${sub.status}`}>
                <strong>{sub.text}</strong>
                <ul>
                  {nodes
                    .filter((n) => n.parent === sub.id)
                    .map((t) => (
                      <li key={t.id} className={`arc-node arc-${t.status}`}>
                        <span>{t.text}</span>
                        {t.note && <em>{t.note}</em>}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
        <div className="arc-file">
          <span className="api-pane-label">PLAN.md, the agent’s scratchpad</span>
          <pre>{planFile(nodes)}</pre>
        </div>
      </div>

      <p className="arc-caption" aria-live="polite">
        {step === 0 ? 'Press the button to start planning.' : EVENTS[step - 1].caption}
      </p>
      <div className="demo-controls">
        <button type="button" className="pill primary" onClick={() => setStep(finished ? 0 : step + 1)}>
          {finished ? 'Replay' : step === 0 ? 'Start' : 'Next step'}
        </button>
        <span className="small muted">
          Step {step} of {EVENTS.length}
        </span>
      </div>
      <p className="demo-note">
        The plan is refined one level at a time, and it lives in a file rather than only in the conversation. A
        fresh model call, a worker agent or a person can read PLAN.md and know exactly where things stand. Figures
        are illustrative.
      </p>
    </div>
  )
}
