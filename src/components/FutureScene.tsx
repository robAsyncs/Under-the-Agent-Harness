import { useEffect, useState } from 'react'

/**
 * The last, speculative stage of the home-page story: an agent team that runs for days,
 * builds up memory and skills, talks to other organisations' agents, and only checks in
 * with a person for the decisions that matter. Drawn dashed and muted to read as a sketch.
 */

const DAYS = 4
const DAY_MS = 2300
const TL = { x0: 40, x1: 440, y: 34 }
const dayX = (d: number) => TL.x0 + (d / (DAYS - 1)) * (TL.x1 - TL.x0)

// What the agent has learned by the end of each day.
const LEARNED = [
  { day: 0, kind: 'skill', text: 'compare flight prices' },
  { day: 1, kind: 'lesson', text: 'check visa rules first' },
  { day: 3, kind: 'note', text: 'you prefer window seats' },
]

const OTHERS = [
  { x: 404, y: 112, label: "airline's agent" },
  { x: 404, y: 208, label: "hotel's agent" },
]

const YOU = { x: 400, y: 330 }

export function FutureScene({ on, model }: { on: boolean; model: { x: number; y: number; r: number } }) {
  const [day, setDay] = useState(0)
  const [wasOn, setWasOn] = useState(on)
  // Start over each time the stage comes back into view.
  if (on !== wasOn) {
    setWasOn(on)
    if (on) setDay(0)
  }

  useEffect(() => {
    if (!on) return
    const id = setTimeout(() => setDay((d) => (d + 1) % DAYS), DAY_MS)
    return () => clearTimeout(id)
  }, [on, day])

  const asking = day === 2

  return (
    <g className="fx">
      {/* Runs for days, not minutes */}
      <line className="fx-track" x1={TL.x0} y1={TL.y} x2={TL.x1} y2={TL.y} />
      <line className="fx-done" x1={TL.x0} y1={TL.y} x2={dayX(day)} y2={TL.y} />
      {Array.from({ length: DAYS }, (_, d) => (
        <g key={d} className={d <= day ? 'fx-day on' : 'fx-day'}>
          <circle cx={dayX(d)} cy={TL.y} r={5} />
          <text x={dayX(d)} y={TL.y + 20} textAnchor="middle">
            DAY {d + 1}
          </text>
        </g>
      ))}
      <text className="fx-title" x={TL.x0} y={TL.y - 16}>
        one task, running for days
      </text>

      {/* A team, still working */}
      <g className="fx-team" style={{ transformOrigin: `${model.x}px ${model.y}px` }}>
        {[0, 120, 240].map((deg) => {
          const a = (deg * Math.PI) / 180
          return <circle key={deg} cx={model.x + 50 * Math.cos(a)} cy={model.y + 50 * Math.sin(a)} r={7} />
        })}
      </g>
      <circle className="fx-orbit" cx={model.x} cy={model.y} r={50} />

      {/* Other organisations' agents */}
      {OTHERS.map((o, j) => (
        <g key={o.label}>
          <line className="fx-link" x1={model.x + model.r + 4} y1={model.y} x2={o.x - 26} y2={o.y} />
          <line
            className="fx-msg"
            pathLength={100}
            x1={model.x + model.r + 4}
            y1={model.y}
            x2={o.x - 26}
            y2={o.y}
            style={{ animationDelay: `${j * 1.3}s` }}
          />
          <circle className="fx-other" cx={o.x} cy={o.y} r={22} />
          <text className="fx-other-label" x={o.x} y={o.y + 38} textAnchor="middle">
            {o.label}
          </text>
        </g>
      ))}
      <text className="fx-tag" x={300} y={172} textAnchor="middle">
        agent ↔ agent
      </text>

      {/* What it has picked up along the way */}
      <g className="fx-memory">
        <rect x={20} y={262} width={240} height={96} rx={14} />
        <text className="fx-tag" x={34} y={282}>
          MEMORY &amp; SKILLS · GROWS EACH DAY
        </text>
        {LEARNED.filter((l) => l.day <= day).map((l, j) => (
          <text key={l.text} className="fx-item" x={34} y={304 + j * 18}>
            <tspan className="fx-kind">{l.kind}:</tspan> {l.text}
          </text>
        ))}
      </g>

      {/* A person, asked only when it matters */}
      <line className="fx-link" x1={model.x + 20} y1={model.y + model.r} x2={YOU.x - 16} y2={YOU.y - 8} />
      <circle className={`fx-you${asking ? ' asking' : ''}`} cx={YOU.x} cy={YOU.y} r={16} />
      <text className="fx-you-label" x={YOU.x} y={YOU.y} textAnchor="middle" dominantBaseline="central">
        you
      </text>
      {asking && (
        <g className="fx-ask">
          <rect x={YOU.x - 72} y={YOU.y - 54} width={144} height={28} rx={14} />
          <text x={YOU.x} y={YOU.y - 40} textAnchor="middle" dominantBaseline="central">
            approve the booking?
          </text>
        </g>
      )}

      <text className="fx-caption" x={240} y={392} textAnchor="middle">
        a sketch, not history: the field is still working this out
      </text>
    </g>
  )
}
