import { useState } from 'react'

type Vec = [number, number]

/**
 * Toy 2-D embeddings for passages from a company handbook. Real embeddings have hundreds of dimensions,
 * but the arithmetic is the same: the angle between vectors measures closeness in meaning.
 */
const DOCS: { text: string; v: Vec }[] = [
  { text: 'Items can be returned within 30 days of delivery.', v: [0.94, 0.2] },
  { text: 'Refunds go back to the original card in 5–7 days.', v: [0.98, 0.05] },
  { text: 'Standard shipping takes 3–5 business days.', v: [0.82, -0.45] },
  { text: 'Full-time staff get 25 vacation days a year.', v: [0.12, 0.97] },
  { text: 'Parental leave is 16 weeks, fully paid.', v: [0.3, 0.92] },
  { text: 'The office Wi-Fi password is on the kitchen fridge.', v: [-0.55, 0.62] },
]

const QUERIES: { text: string; v: Vec }[] = [
  { text: 'Can I send back a jacket I bought last week?', v: [0.92, 0.32] },
  { text: 'How much time off do I get?', v: [0.2, 0.96] },
  { text: 'When will my order arrive?', v: [0.86, -0.32] },
]

const cosine = (a: Vec, b: Vec) => (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))

const SIZE = 220
const C = SIZE / 2
const R = SIZE / 2 - 18
const pt = (v: Vec) => {
  const n = Math.hypot(...v)
  return [C + (v[0] / n) * R, C - (v[1] / n) * R] as const
}

export function SimilarityDemo() {
  const [q, setQ] = useState(0)
  const [k, setK] = useState(2)
  const query = QUERIES[q]
  const ranked = DOCS.map((d, i) => ({ ...d, i, score: cosine(query.v, d.v) })).sort((a, b) => b.score - a.score)
  const top = new Set(ranked.slice(0, k).map((d) => d.i))
  const [qx, qy] = pt(query.v)

  return (
    <div className="demo">
      <div className="demo-controls mem-demo-head">
        <div className="speed" role="group" aria-label="Question">
          {QUERIES.map((item, i) => (
            <button key={item.text} type="button" className={q === i ? 'on' : ''} onClick={() => setQ(i)}>
              {item.text}
            </button>
          ))}
        </div>
        <label className="slider">
          top k
          <input type="range" min={1} max={DOCS.length} value={k} onChange={(e) => setK(Number(e.target.value))} />
          <output>{k}</output>
        </label>
      </div>

      <div className="mem-sim">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mem-sim-plot"
          role="img"
          aria-label="Passages and the question as arrows; a smaller angle means a closer meaning"
        >
          <circle cx={C} cy={C} r={R} className="mem-sim-ring" />
          {DOCS.map((d, i) => {
            const [x, y] = pt(d.v)
            return (
              <g key={d.text} className={top.has(i) ? 'hit' : ''}>
                <line x1={C} y1={C} x2={x} y2={y} className="mem-sim-doc" />
                <circle cx={x} cy={y} r={5} className="mem-sim-dot" />
                <text x={x} y={y - 9} textAnchor="middle" className="mem-sim-num">
                  {i + 1}
                </text>
              </g>
            )
          })}
          <line x1={C} y1={C} x2={qx} y2={qy} className="mem-sim-query" />
          <circle cx={qx} cy={qy} r={6} className="mem-sim-qdot" />
        </svg>

        <ol className="mem-ranked">
          {ranked.map((d) => (
            <li key={d.text} className={top.has(d.i) ? 'hit' : ''}>
              <span className="mem-score">{d.score.toFixed(2)}</span>
              <span>
                <b>{d.i + 1}.</b> {d.text}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="demo-note">
        The question is the solid arrow. Cosine similarity is 1 when two arrows point the same way, 0 at a right
        angle, and negative when they point apart. Note that the returns question matches “returned” and “refunds”
        without sharing the word “jacket” or “send back” with either. The vectors are hand-made in two dimensions;
        real embedding models use hundreds.
      </p>
    </div>
  )
}
