/**
 * The harness stage of the home-page story: the software wrapped around the model —
 * tools, memory, data, other apps, a sandbox, and rules. A model plus a harness is an agent.
 */

type Kind = 'memory' | 'tools' | 'safety' | 'prompt'

const W = 128
const H = 46

const PARTS: { label: string; sub: string; x: number; y: number; kind: Kind }[] = [
  { label: 'MEMORY', sub: 'vector database', x: 20, y: 44, kind: 'memory' },
  { label: 'INSTRUCTIONS', sub: 'prompt · skills', x: 176, y: 30, kind: 'prompt' },
  { label: 'DATABASE', sub: 'SQL · records', x: 332, y: 44, kind: 'memory' },
  { label: 'TOOLS', sub: 'search · files', x: 12, y: 177, kind: 'tools' },
  { label: 'MCP', sub: 'connect any app', x: 340, y: 177, kind: 'tools' },
  { label: 'SANDBOX', sub: 'run code safely', x: 20, y: 310, kind: 'safety' },
  { label: 'CONTEXT', sub: 'compact old turns', x: 176, y: 324, kind: 'memory' },
  { label: 'PERMISSIONS', sub: 'ask before acting', x: 332, y: 310, kind: 'safety' },
]

export function HarnessScene({ model }: { model: { x: number; y: number; r: number } }) {
  return (
    <g className="hs">
      <rect className="hs-frame" x={4} y={14} width={472} height={374} rx={26} />
      <text className="hs-frame-label" x={30} y={14} dominantBaseline="central">
        HARNESS
      </text>

      {/* The loop that will drive the model */}
      <circle className="hs-loop" cx={model.x} cy={model.y} r={model.r + 18} />

      {PARTS.map((p, j) => {
        const cx = p.x + W / 2
        const cy = p.y + H / 2
        return (
          <g key={p.label}>
            <line className="hs-wire" x1={model.x} y1={model.y} x2={cx} y2={cy} />
            <line
              className={`hs-pulse ${p.kind}`}
              pathLength={100}
              x1={model.x}
              y1={model.y}
              x2={cx}
              y2={cy}
              style={{ animationDelay: `${0.8 + j * 0.55}s` }}
            />
          </g>
        )
      })}

      {PARTS.map((p, j) => (
        <g key={p.label} className={`hs-part ${p.kind}`} style={{ animationDelay: `${j * 0.09}s` }}>
          <rect x={p.x} y={p.y} width={W} height={H} rx={12} />
          <text className="hs-label" x={p.x + 12} y={p.y + 16} dominantBaseline="central">
            {p.label}
          </text>
          <text className="hs-sub" x={p.x + 12} y={p.y + 33} dominantBaseline="central">
            {p.sub}
          </text>
        </g>
      ))}
    </g>
  )
}
