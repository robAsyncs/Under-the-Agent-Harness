import { useEffect, useRef, useState } from 'react'

/**
 * The agent stage of the home-page story: one small task, played out turn by turn,
 * so the think → act → observe loop is visible as it happens.
 */

type Phase = 'task' | 'think' | 'act' | 'observe' | 'answer'

type Step = {
  phase: Phase
  dur: number
  thought?: string
  /** A message travelling between the model and the tool. */
  packet?: { dir: 'out' | 'back'; label: string }
  running?: boolean
  /** Added to what the model knows when the step finishes. */
  learn?: string
}

const TASK = 'Is it warmer in Paris or Rome today?'

const STEPS: Step[] = [
  { phase: 'task', dur: 1800 },
  { phase: 'think', dur: 2200, thought: 'I need the weather in Paris.' },
  { phase: 'act', dur: 1700, packet: { dir: 'out', label: 'get_weather("Paris")' } },
  { phase: 'act', dur: 900, running: true },
  { phase: 'observe', dur: 1700, packet: { dir: 'back', label: '18°C, cloudy' }, learn: 'Paris: 18°C' },
  { phase: 'think', dur: 2200, thought: 'Now I need Rome.' },
  { phase: 'act', dur: 1700, packet: { dir: 'out', label: 'get_weather("Rome")' } },
  { phase: 'act', dur: 900, running: true },
  { phase: 'observe', dur: 1700, packet: { dir: 'back', label: '24°C, sunny' }, learn: 'Rome: 24°C' },
  { phase: 'think', dur: 2000, thought: 'I have enough to answer.' },
  { phase: 'answer', dur: 3600, thought: 'Rome is warmer: 24°C vs 18°C.' },
]

const PHASES: { id: Phase; label: string }[] = [
  { id: 'think', label: 'THINK' },
  { id: 'act', label: 'ACT' },
  { id: 'observe', label: 'OBSERVE' },
]

const PHASE_HINT: Record<Phase, string> = {
  task: 'someone gives it a task',
  think: 'the model decides what to do',
  act: 'it calls a tool',
  observe: 'it reads the tool result',
  answer: 'done, so it answers',
}

const TOOL = { x: 336, y: 186, w: 124, h: 62 }

// Two curved paths: model → tool across the top, tool → model across the bottom.
const OUT = { a: [158, 200], c: [248, 112], b: [TOOL.x - 4, 204] } as const
const BACK = { a: [TOOL.x - 4, 232], c: [248, 318], b: [158, 232] } as const
const toPath = (q: typeof OUT | typeof BACK) => `M ${q.a} Q ${q.c} ${q.b}`
const onCurve = (q: typeof OUT | typeof BACK, t: number) => {
  const u = 1 - t
  return [0, 1].map((k) => u * u * q.a[k] + 2 * u * t * q.c[k] + t * t * q.b[k]) as [number, number]
}

const chipWidth = (s: string) => s.length * 6.4 + 20

/** `model` is where Evolution draws the model during this stage. */
export function AgentScene({ on, model }: { on: boolean; model: { x: number; y: number; r: number } }) {
  const [i, setI] = useState(0)
  const [wasOn, setWasOn] = useState(on)
  // Start the story over each time the stage comes back into view.
  if (on !== wasOn) {
    setWasOn(on)
    if (on) setI(0)
  }
  const packetRef = useRef<SVGGElement>(null)
  const step = STEPS[i]
  const known = STEPS.slice(0, i).flatMap((s) => (s.learn ? [s.learn] : []))
  const turn = STEPS.slice(0, i + 1).filter((s) => s.phase === 'think').length

  // Advance through the script while the stage is showing.
  useEffect(() => {
    if (!on) return
    const id = setTimeout(() => setI((n) => (n + 1) % STEPS.length), STEPS[i].dur)
    return () => clearTimeout(id)
  }, [on, i])

  // Move the message chip along its curve.
  useEffect(() => {
    const el = packetRef.current
    const packet = STEPS[i].packet
    if (!el || !packet || !on) return
    const q = packet.dir === 'out' ? OUT : BACK
    const travel = STEPS[i].dur * 0.75
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const p = reduced ? 1 : Math.min(1, (now - start) / travel)
      const t = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
      const [x, y] = onCurve(q, t)
      el.setAttribute('transform', `translate(${x} ${y})`)
      if (p < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [on, i])

  const bubble = step.thought
  const bubbleW = bubble ? (step.phase === 'answer' ? 76 : 70) + bubble.length * 6.6 + 16 : 0

  return (
    <g className={`ag ag-${step.phase}`}>
      {/* The task */}
      <g className={`ag-task${step.phase === 'task' ? ' lit' : ''}`}>
        <rect x={20} y={14} width={440} height={40} rx={12} />
        <text className="ag-tag" x={36} y={34} dominantBaseline="central">
          TASK
        </text>
        <text className="ag-task-text" x={82} y={34} dominantBaseline="central">
          {TASK}
        </text>
      </g>

      {/* What the model is thinking, or its final answer */}
      {bubble && (
        <g key={i} className={`ag-bubble${step.phase === 'answer' ? ' answer' : ''}`}>
          <rect x={20} y={76} width={bubbleW} height={36} rx={18} />
          <circle cx={78} cy={124} r={5} />
          <circle cx={92} cy={138} r={3} />
          <text className="ag-tag" x={36} y={94} dominantBaseline="central">
            {step.phase === 'answer' ? 'ANSWER' : 'THINKS'}
          </text>
          <text className="ag-bubble-text" x={step.phase === 'answer' ? 96 : 90} y={94} dominantBaseline="central">
            {bubble}
          </text>
        </g>
      )}

      {/* The loop between model and tool */}
      <path className={`ag-path${step.phase === 'act' ? ' lit' : ''}`} d={toPath(OUT)} markerEnd="url(#ag-arrow)" />
      <path className={`ag-path back${step.phase === 'observe' ? ' lit' : ''}`} d={toPath(BACK)} markerEnd="url(#ag-arrow)" />
      <text className="ag-path-label" x={248} y={146} textAnchor="middle">
        tool call
      </text>
      <text className="ag-path-label" x={248} y={292} textAnchor="middle">
        result
      </text>
      <defs>
        <marker id="ag-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" className="ag-arrowhead" />
        </marker>
      </defs>

      {/* The tool */}
      <g className={`ag-tool${step.running ? ' running' : ''}${step.phase === 'act' ? ' lit' : ''}`}>
        <rect x={TOOL.x} y={TOOL.y} width={TOOL.w} height={TOOL.h} rx={14} />
        <text className="ag-tag" x={TOOL.x + 14} y={TOOL.y + 20} dominantBaseline="central">
          TOOL
        </text>
        <text className="ag-tool-name" x={TOOL.x + 14} y={TOOL.y + 42} dominantBaseline="central">
          {step.running ? 'running…' : 'get_weather'}
        </text>
      </g>

      {/* The message in flight */}
      {step.packet && (
        <g ref={packetRef} key={`p${i}`} className={`ag-packet ${step.packet.dir}`} transform={`translate(${(step.packet.dir === "out" ? OUT : BACK).a})`}>
          <rect x={-chipWidth(step.packet.label) / 2} y={-13} width={chipWidth(step.packet.label)} height={26} rx={13} />
          <text textAnchor="middle" dominantBaseline="central">
            {step.packet.label}
          </text>
        </g>
      )}

      {/* The model is drawn by Evolution; this ring pulses while it thinks. */}
      {(step.phase === 'think' || step.phase === 'answer') && (
        <circle key={`t${i}`} className="ag-thinking" cx={model.x} cy={model.y} r={model.r + 6} />
      )}

      {/* What the model has learned so far: tool results land in its context */}
      <g className="ag-notes">
        <rect x={20} y={290} width={170} height={64} rx={12} />
        <text className="ag-tag" x={34} y={306} dominantBaseline="central">
          IN CONTEXT
        </text>
        {known.length === 0 && (
          <text className="ag-note empty" x={34} y={328} dominantBaseline="central">
            nothing yet
          </text>
        )}
        {known.map((k, j) => (
          <text key={k} className="ag-note" x={34 + j * 76} y={328} dominantBaseline="central">
            {k}
          </text>
        ))}
        <text className="ag-turn" x={34} y={344} dominantBaseline="central">
          {step.phase === 'task' ? '' : `turn ${turn} of the loop`}
        </text>
      </g>

      {/* Where we are in the loop */}
      <g className="ag-phases">
        {PHASES.map((ph, j) => {
          const x = 236 + j * 74
          return (
            <g key={ph.id} className={step.phase === ph.id ? 'on' : ''}>
              <rect x={x} y={304} width={66} height={26} rx={13} />
              <text x={x + 33} y={317} textAnchor="middle" dominantBaseline="central">
                {ph.label}
              </text>
            </g>
          )
        })}
        <text className="ag-loop-mark" x={236 + 3 * 74 - 2} y={317} dominantBaseline="central">
          ↺
        </text>
        <text className="ag-hint" x={236} y={348} dominantBaseline="central">
          {PHASE_HINT[step.phase]}
        </text>
      </g>
    </g>
  )
}
