import { Fragment, useState } from 'react'

/** Each stage is one box, or several boxes that run side by side. */
type Stage = string[]

const PATTERNS: Record<
  'chain' | 'route' | 'parallel' | 'evaluate',
  { name: string; task: string; stages: Stage[]; loop?: string; how: string; good: string; watch: string }
> = {
  chain: {
    name: 'Prompt chaining',
    task: 'Turn release notes into a customer email.',
    stages: [['Extract the user-facing changes'], ['Check: is anything internal left?'], ['Write the email'], ['Translate']],
    how: 'Each call does one step and its output is the next call’s input. Code checks between steps (gates) catch problems early.',
    good: 'Tasks that split cleanly into fixed steps. Each call is simpler, so each is more accurate.',
    watch: 'Total latency is the sum of every step, and an early mistake flows into everything after it.',
  },
  route: {
    name: 'Routing',
    task: 'Answer a support ticket.',
    stages: [['Classify the ticket'], ['Refund prompt + tools', 'Technical prompt + docs', 'FAQ (small, cheap model)']],
    how: 'A first call (or an ordinary classifier) decides what kind of input this is, and code sends it to a prompt built for that kind.',
    good: 'Inputs that fall into distinct categories that need different handling, or different-sized models.',
    watch: 'A wrong classification sends the input down the wrong path, so measure the classifier on its own.',
  },
  parallel: {
    name: 'Parallelization',
    task: 'Review a pull request.',
    stages: [['Split the work'], ['Security review', 'Correctness review', 'Style review'], ['Combine the findings']],
    how: 'Independent calls run at the same time. Sectioning gives each one a different part of the job; voting runs the same check several times and compares answers.',
    good: 'Independent subtasks (faster), or judgments where several opinions are more reliable than one.',
    watch: 'Only works when the parts really are independent, and it multiplies the number of calls.',
  },
  evaluate: {
    name: 'Evaluator-optimizer',
    task: 'Translate a poem, keeping its rhythm.',
    stages: [['Generator writes a draft'], ['Evaluator scores it against criteria']],
    loop: 'feedback until it passes, or N rounds',
    how: 'One call produces a result and another critiques it against clear criteria. The critique goes back to the generator for another try.',
    good: 'Work with clear criteria where feedback measurably helps: translation, search, writing to a spec.',
    watch: 'Needs a cap on rounds, and an evaluator that can actually tell good from bad.',
  },
}

export function WorkflowTabs() {
  const [mode, setMode] = useState<keyof typeof PATTERNS>('chain')
  const p = PATTERNS[mode]

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Workflow pattern">
          {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((k) => (
            <button key={k} type="button" className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>
              {PATTERNS[k].name}
            </button>
          ))}
        </div>
        <span className="small muted">Example: {p.task}</span>
      </div>

      <div className="arc-flow" key={mode}>
        {p.stages.map((stage, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span className="arc-arrow" aria-hidden="true">
                →
              </span>
            )}
            <div className="arc-stage">
              {stage.map((box) => (
                <span key={box} className={`arc-box ${i === 0 ? 'first' : ''}`}>
                  {box}
                </span>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
      {p.loop && <p className="arc-loop">↺ {p.loop}</p>}
      <p className="arc-how">{p.how}</p>

      <dl className="agl-proscons">
        <div>
          <dt>Good for</dt>
          <dd>{p.good}</dd>
        </div>
        <div>
          <dt>Watch out</dt>
          <dd>{p.watch}</dd>
        </div>
      </dl>
    </div>
  )
}
