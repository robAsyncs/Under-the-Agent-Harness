import { useEffect, useRef, useState } from 'react'

/**
 * The multi-agent stage of the home-page story: a lead agent splits one question three ways,
 * sub-agents work on their piece in parallel, and the lead combines what they send back.
 * The sub-agent circles themselves are drawn by Evolution, so they can split off from the agent on scroll.
 */

type Phase = 'task' | 'plan' | 'delegate' | 'work' | 'report' | 'answer'

const TASK = 'Where should I travel in March: Tokyo, Paris, or Rome?'

const SUB_ROLES = [
  { city: 'Tokyo', brief: 'Tokyo', result: 'mild' },
  { city: 'Paris', brief: 'Paris', result: 'rainy' },
  { city: 'Rome', brief: 'Rome', result: 'crowded' },
]

const STEPS: { phase: Phase; dur: number; thought?: string }[] = [
  { phase: 'task', dur: 1600 },
  { phase: 'plan', dur: 2000, thought: 'One agent per city.' },
  { phase: 'delegate', dur: 1700 },
  { phase: 'work', dur: 2200 },
  { phase: 'report', dur: 1700 },
  { phase: 'answer', dur: 3400, thought: 'Tokyo: mild, in bloom.' },
]

const PHASE_PILLS: { id: Phase; label: string; w: number }[] = [
  { id: 'plan', label: 'PLAN', w: 56 },
  { id: 'delegate', label: 'DELEGATE', w: 82 },
  { id: 'work', label: 'WORK', w: 56 },
  { id: 'report', label: 'REPORT', w: 70 },
  { id: 'answer', label: 'ANSWER', w: 70 },
]
// Laid out left to right, centred in the 480-wide stage.
const PILLS_W = PHASE_PILLS.reduce((n, p) => n + p.w, 0) + 6 * (PHASE_PILLS.length - 1)
const PHASES = PHASE_PILLS.map((p, j) => ({
  ...p,
  x: 240 - PILLS_W / 2 + PHASE_PILLS.slice(0, j).reduce((n, q) => n + q.w + 6, 0),
}))

const HINT: Record<Phase, string> = {
  task: 'one big question comes in',
  plan: 'the lead agent splits it into pieces',
  delegate: 'each sub-agent gets its own piece: one city',
  work: 'they work in parallel, each with its own tools and context',
  report: 'each sends back a short summary, not its whole search',
  answer: 'the lead combines them into one answer',
}

const chipWidth = (s: string) => s.length * 6.4 + 20

type Pt = { x: number; y: number }

export function MultiScene({ on, lead, subs }: { on: boolean; lead: Pt & { r: number }; subs: Pt[] }) {
  const [i, setI] = useState(0)
  const [wasOn, setWasOn] = useState(on)
  // Start over each time the stage comes back into view.
  if (on !== wasOn) {
    setWasOn(on)
    if (on) setI(0)
  }
  const chipRefs = useRef<(SVGGElement | null)[]>([])
  const step = STEPS[i]
  const moving = step.phase === 'delegate' || step.phase === 'report'

  useEffect(() => {
    if (!on) return
    const id = setTimeout(() => setI((n) => (n + 1) % STEPS.length), STEPS[i].dur)
    return () => clearTimeout(id)
  }, [on, i])

  // Briefs travel down to the sub-agents; summaries travel back up.
  useEffect(() => {
    if (!on || !moving) return
    const down = STEPS[i].phase === 'delegate'
    const travel = STEPS[i].dur * 0.8
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const p = reduced ? 1 : Math.min(1, (now - start) / travel)
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
      // Kept to the lower part of each line, where the three paths are far enough apart not to overlap.
      const t = down ? 0.42 + 0.46 * e : 0.88 - 0.44 * e
      chipRefs.current.forEach((el, j) => {
        if (!el) return
        const s = subs[j]
        const x = lead.x + (s.x - lead.x) * t
        const y = lead.y + (s.y - lead.y) * t
        el.setAttribute('transform', `translate(${x} ${y})`)
      })
      if (p < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [on, i, moving, lead, subs])

  const bubbleW = step.thought ? step.thought.length * 6.6 + 28 : 0

  return (
    <g className={`ma ma-${step.phase}`}>
      <g className={`ag-task${step.phase === 'task' ? ' lit' : ''}`}>
        <rect x={20} y={8} width={440} height={36} rx={12} />
        <text className="ag-tag" x={34} y={26} dominantBaseline="central">
          TASK
        </text>
        <text className="ag-task-text ma-task-text" x={76} y={26} dominantBaseline="central">
          {TASK}
        </text>
      </g>

      <g className="ag-phases">
        {PHASES.map((ph) => (
          <g key={ph.id} className={step.phase === ph.id ? 'on' : ''}>
            <rect x={ph.x} y={54} width={ph.w} height={22} rx={11} />
            <text x={ph.x + ph.w / 2} y={65} textAnchor="middle" dominantBaseline="central">
              {ph.label}
            </text>
          </g>
        ))}
      </g>

      {/* What the lead is thinking, or the combined answer */}
      {step.thought && (
        <g key={i} className={`ag-bubble${step.phase === 'answer' ? ' answer' : ''}`}>
          <rect x={lead.x - lead.r - 18 - bubbleW} y={lead.y - 18} width={bubbleW} height={36} rx={18} />
          <text className="ag-bubble-text" x={lead.x - lead.r - 18 - bubbleW + 14} y={lead.y} dominantBaseline="central">
            {step.thought}
          </text>
        </g>
      )}

      {/* Sub-agents busy with their piece */}
      {step.phase === 'work' &&
        subs.map((s, j) => <circle key={j} className="ma-busy" cx={s.x} cy={s.y} r={30} style={{ animationDelay: `${j * -0.3}s` }} />)}

      {SUB_ROLES.map((r, j) => {
        const s = subs[j]
        const status =
          step.phase === 'work' ? 'searching…' : step.phase === 'report' || step.phase === 'answer' ? 'done ✓' : ''
        return (
          <text key={r.city} className={`ma-status${status === 'done ✓' ? ' done' : ''}`} x={s.x} y={s.y + 72} textAnchor="middle">
            {status}
          </text>
        )
      })}

      {/* Messages in flight */}
      {moving &&
        SUB_ROLES.map((r, j) => {
          const label = step.phase === 'delegate' ? r.brief : r.result
          const w = chipWidth(label)
          return (
            <g
              key={`${i}-${j}`}
              ref={(el) => {
                chipRefs.current[j] = el
              }}
              className={`ag-packet ${step.phase === 'delegate' ? 'out' : 'back'}`}
              transform={`translate(${lead.x} ${lead.y})`}
            >
              <rect x={-w / 2} y={-12} width={w} height={24} rx={12} />
              <text textAnchor="middle" dominantBaseline="central">
                {label}
              </text>
            </g>
          )
        })}

      <text className="ag-hint" x={240} y={392} textAnchor="middle" dominantBaseline="central">
        {HINT[step.phase]}
      </text>
    </g>
  )
}
