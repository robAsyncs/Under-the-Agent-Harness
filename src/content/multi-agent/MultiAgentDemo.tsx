import { useState } from 'react'

const LIMIT = 200_000

type Part = { label: string; tokens: number; kind: 'base' | 'a' | 'b' | 'c' | 'summary' }
type Agent = { name: string; parts: Part[] }
type Setup = { name: string; agents: Agent[]; total: string; time: string; note: string }

const research = (kind: 'a' | 'b' | 'c', label: string): Part => ({ label: `${label} research`, tokens: 40_000, kind })
const summary = (kind: 'a' | 'b' | 'c', label: string): Part => ({ label: `${label} summary`, tokens: 1_500, kind })

const SETUPS: Record<'single' | 'multi', Setup> = {
  single: {
    name: 'One agent',
    agents: [
      {
        name: 'Agent',
        parts: [
          { label: 'Task and plan', tokens: 4_000, kind: 'base' },
          research('a', 'Costs'),
          research('b', 'Range'),
          research('c', 'Funding'),
          { label: 'Writing the report', tokens: 4_000, kind: 'base' },
        ],
      },
    ],
    total: '≈ 1.6M',
    time: '≈ 12 min',
    note: 'Every search result stays in one history. By the third subtopic the agent is reasoning over 120k tokens of mostly old material, which is slow, costly, and easy to get lost in.',
  },
  multi: {
    name: 'Orchestrator + 3 workers',
    agents: [
      {
        name: 'Orchestrator',
        parts: [
          { label: 'Task and plan', tokens: 4_000, kind: 'base' },
          summary('a', 'Costs'),
          summary('b', 'Range'),
          summary('c', 'Funding'),
          { label: 'Writing the report', tokens: 4_000, kind: 'base' },
        ],
      },
      { name: 'Worker: costs', parts: [{ label: 'Brief', tokens: 1_000, kind: 'base' }, research('a', 'Costs')] },
      { name: 'Worker: range', parts: [{ label: 'Brief', tokens: 1_000, kind: 'base' }, research('b', 'Range')] },
      { name: 'Worker: funding', parts: [{ label: 'Brief', tokens: 1_000, kind: 'base' }, research('c', 'Funding')] },
    ],
    total: '≈ 2.3M',
    time: '≈ 5 min',
    note: 'Each worker searches in a fresh context and hands back a short summary. No context gets large, and the workers run at the same time, but each one repeats the setup work, so the total bill goes up.',
  },
}

export function MultiAgentDemo() {
  const [mode, setMode] = useState<keyof typeof SETUPS>('single')
  const s = SETUPS[mode]
  const largest = Math.max(...s.agents.map((a) => a.parts.reduce((sum, p) => sum + p.tokens, 0)))

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Setup">
          {(Object.keys(SETUPS) as (keyof typeof SETUPS)[]).map((k) => (
            <button key={k} type="button" className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>
              {SETUPS[k].name}
            </button>
          ))}
        </div>
        <span className="small muted">Task: research three subtopics, then write one report.</span>
      </div>

      <ul className="ma-agents" key={mode}>
        {s.agents.map((a) => {
          const used = a.parts.reduce((sum, p) => sum + p.tokens, 0)
          return (
            <li key={a.name}>
              <span className="ma-agent-name">{a.name}</span>
              <span className="ma-ctx" role="img" aria-label={`${used.toLocaleString()} of ${LIMIT.toLocaleString()} tokens`}>
                {a.parts.map((p, i) => (
                  <span
                    key={i}
                    className={`ma-seg ma-seg-${p.kind}`}
                    style={{ width: `${(p.tokens / LIMIT) * 100}%` }}
                    title={`${p.label}: ${p.tokens.toLocaleString()} tokens`}
                  />
                ))}
              </span>
              <span className="agl-tokens">{Math.round(used / 1000)}k</span>
            </li>
          )
        })}
      </ul>
      <div className="ma-legend small muted" aria-hidden="true">
        <span className="ma-seg-base">Task, brief, writing</span>
        <span className="ma-seg-a">Costs</span>
        <span className="ma-seg-b">Range</span>
        <span className="ma-seg-c">Funding</span>
        <span>Bar width = share of a 200k-token context window</span>
      </div>

      <dl className="ma-stats">
        <div>
          <dt>Largest context</dt>
          <dd>{Math.round(largest / 1000)}k tokens</dd>
        </div>
        <div>
          <dt>Total tokens billed</dt>
          <dd>{s.total}</dd>
        </div>
        <div>
          <dt>Wall-clock time</dt>
          <dd>{s.time}</dd>
        </div>
      </dl>
      <p className="demo-note">{s.note} All numbers are illustrative.</p>
    </div>
  )
}
