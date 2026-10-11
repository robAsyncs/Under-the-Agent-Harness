import { useState } from 'react'

type Node = { id: string; label: string; x: number; y: number; lead?: boolean; store?: boolean }
type Arch = {
  name: string
  nodes: Node[]
  /** Directed edges by node id. Two-way edges are listed once with `both`. */
  edges: { from: string; to: string; both?: boolean; dashed?: boolean }[]
  how: string
  decides: string
  goodFor: string
  watch: string
  example: string
}

const ARCHS: Record<string, Arch> = {
  orchestrator: {
    name: 'Orchestrator-worker',
    nodes: [
      { id: 'o', label: 'Orchestrator', x: 160, y: 34, lead: true },
      { id: 'a', label: 'Worker', x: 60, y: 126 },
      { id: 'b', label: 'Worker', x: 160, y: 126 },
      { id: 'c', label: 'Worker', x: 260, y: 126 },
    ],
    edges: [
      { from: 'o', to: 'a', both: true },
      { from: 'o', to: 'b', both: true },
      { from: 'o', to: 'c', both: true },
    ],
    how: 'A lead agent splits the task, sends each worker a brief, and combines the short results that come back.',
    decides: 'The orchestrator, at run time.',
    goodFor: 'Broad tasks that split into independent parts: research, auditing many files, comparing options.',
    watch: 'Duplicated work from vague briefs; the orchestrator’s context filling with worker output.',
    example: 'Anthropic’s Research feature; Claude Code’s subagents.',
  },
  handoff: {
    name: 'Handoffs',
    nodes: [
      { id: 't', label: 'Triage', x: 60, y: 80, lead: true },
      { id: 'b', label: 'Billing', x: 230, y: 34 },
      { id: 'h', label: 'Tech support', x: 230, y: 126 },
    ],
    edges: [
      { from: 't', to: 'b' },
      { from: 't', to: 'h' },
      { from: 'b', to: 'h', both: true, dashed: true },
    ],
    how: 'One agent talks to the user at a time. When a request is outside its job, it passes the whole conversation to a specialist.',
    decides: 'Whichever agent currently has the conversation.',
    goodFor: 'Conversations that move between distinct jobs, each with its own tools and rules.',
    watch: 'Agents passing the user back and forth; a specialist missing context from before the handoff.',
    example: 'Customer support bots; the OpenAI Agents SDK’s handoffs.',
  },
  pipeline: {
    name: 'Pipeline',
    nodes: [
      { id: 'p', label: 'Product', x: 40, y: 80, lead: true },
      { id: 'a', label: 'Architect', x: 133, y: 80 },
      { id: 'e', label: 'Engineer', x: 226, y: 80 },
      { id: 'q', label: 'QA', x: 300, y: 80 },
    ],
    edges: [
      { from: 'p', to: 'a' },
      { from: 'a', to: 'e' },
      { from: 'e', to: 'q', both: true },
    ],
    how: 'Fixed roles in a fixed order, each turning the previous role’s document into the next one.',
    decides: 'Your code. This is prompt chaining from Topic 7, with a role per step.',
    goodFor: 'Processes that already have well-defined stages and handover documents.',
    watch: 'Errors early in the chain flow downstream; extra roles that add cost but no checks.',
    example: 'MetaGPT and ChatDev, which simulate a software company.',
  },
  debate: {
    name: 'Debate',
    nodes: [
      { id: 'a', label: 'Agent A', x: 60, y: 30 },
      { id: 'b', label: 'Agent B', x: 260, y: 30 },
      { id: 'c', label: 'Agent C', x: 160, y: 78 },
      { id: 'j', label: 'Judge', x: 160, y: 140, lead: true },
    ],
    edges: [
      { from: 'a', to: 'b', both: true },
      { from: 'b', to: 'c', both: true },
      { from: 'c', to: 'a', both: true },
      { from: 'a', to: 'j', dashed: true },
      { from: 'b', to: 'j', dashed: true },
      { from: 'c', to: 'j', dashed: true },
    ],
    how: 'Several agents answer the same question, read each other’s answers, and revise over a few rounds. A vote or a judge settles it.',
    decides: 'Your code fixes the rounds; the agents argue the content.',
    goodFor: 'Questions with one right answer where independent checks catch mistakes: reasoning, fact-checking.',
    watch: 'Agents converging on a confident wrong answer; cost multiplies with agents × rounds.',
    example: 'Du et al. (2023), multi-agent debate.',
  },
  blackboard: {
    name: 'Blackboard',
    nodes: [
      { id: 's', label: 'Shared board', x: 160, y: 80, store: true },
      { id: 'a', label: 'Searcher', x: 50, y: 34 },
      { id: 'b', label: 'Analyst', x: 270, y: 34 },
      { id: 'c', label: 'Writer', x: 50, y: 126 },
      { id: 'd', label: 'Checker', x: 270, y: 126 },
    ],
    edges: [
      { from: 'a', to: 's', both: true },
      { from: 'b', to: 's', both: true },
      { from: 'c', to: 's', both: true },
      { from: 'd', to: 's', both: true },
    ],
    how: 'Agents never message each other. They read a shared store, pick up work they can do, and write results back to it.',
    decides: 'Each agent, by what it sees on the board; often a controller picks who goes next.',
    goodFor: 'Problems where the order of work isn’t known in advance and partial results build on each other.',
    watch: 'Two agents overwriting each other; nobody owning the final answer.',
    example: 'The Hearsay-II speech system (1970s); shared task lists in coding agents.',
  },
}

type ArchId = keyof typeof ARCHS

function Topology({ arch }: { arch: Arch }) {
  const at = Object.fromEntries(arch.nodes.map((n) => [n.id, n]))
  // Stop each edge short of the node centres, so arrowheads stay visible.
  const trim = (x1: number, y1: number, x2: number, y2: number, padA: number, padB: number) => {
    const d = Math.hypot(x2 - x1, y2 - y1)
    const ux = (x2 - x1) / d
    const uy = (y2 - y1) / d
    return [x1 + ux * padA, y1 + uy * padA, x2 - ux * padB, y2 - uy * padB]
  }
  return (
    <svg viewBox="0 0 320 180" className="ma-topology" role="img" aria-label={`${arch.name} layout`}>
      <defs>
        <marker id="ma-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" className="ma-arrowhead" />
        </marker>
      </defs>
      {arch.edges.map((e) => {
        const a = at[e.from]
        const b = at[e.to]
        const [x1, y1, x2, y2] = trim(a.x, a.y, b.x, b.y, a.store ? 44 : 22, b.store ? 44 : 22)
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`ma-edge ${e.dashed ? 'dashed' : ''}`}
            markerEnd="url(#ma-arrow)"
            markerStart={e.both ? 'url(#ma-arrow)' : undefined}
          />
        )
      })}
      {arch.nodes.map((n) => (
        <g key={n.id} className={`ma-node ${n.lead ? 'lead' : ''} ${n.store ? 'store' : ''}`}>
          {n.store ? (
            <rect x={n.x - 44} y={n.y - 17} width={88} height={34} rx={6} />
          ) : (
            <circle cx={n.x} cy={n.y} r={17} />
          )}
          <text x={n.x} y={n.store ? n.y + 4 : n.y + 31} textAnchor="middle">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ArchitectureTabs() {
  const [id, setId] = useState<ArchId>('orchestrator')
  const arch = ARCHS[id]

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Architecture">
          {(Object.keys(ARCHS) as ArchId[]).map((k) => (
            <button key={k} type="button" className={id === k ? 'on' : ''} onClick={() => setId(k)}>
              {ARCHS[k].name}
            </button>
          ))}
        </div>
      </div>

      <div className="ma-arch" key={id}>
        <Topology arch={arch} />
        <div>
          <p className="ma-arch-how">{arch.how}</p>
          <dl className="agl-proscons">
            <div>
              <dt>Who decides the flow</dt>
              <dd>{arch.decides}</dd>
            </div>
            <div>
              <dt>Good for</dt>
              <dd>{arch.goodFor}</dd>
            </div>
            <div>
              <dt>Watch out for</dt>
              <dd>{arch.watch}</dd>
            </div>
            <div>
              <dt>Seen in</dt>
              <dd>{arch.example}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
