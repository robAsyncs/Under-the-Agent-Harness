import { useEffect, useState } from 'react'

/**
 * The language-model stage of the home-page story, played out in four steps:
 * a sentence comes in, the model places it on the word map it learned in training,
 * looks at the words nearby, and predicts the next word.
 */

type Step = 'read' | 'place' | 'look' | 'predict'

const STEPS: { id: Step; label: string; hint: string; dur: number; x: number; w: number }[] = [
  { id: 'read', label: '1 READ', hint: 'a sentence comes into the model', dur: 1800, x: 16, w: 70 },
  { id: 'place', label: '2 PLACE', hint: 'the model turns it into a point on its word map', dur: 2200, x: 92, w: 74 },
  { id: 'look', label: '3 LOOK NEARBY', hint: 'words close to that point fit best', dur: 2400, x: 172, w: 112 },
  { id: 'predict', label: '4 PREDICT', hint: 'it picks the most likely next word', dur: 3600, x: 290, w: 84 },
]

type Cluster = 'animal' | 'thing' | 'space' | 'verb'

// Laid out in a 290 × 252 box, then fitted into the map below.
const RAW: { word: string; x: number; y: number; c: Cluster }[] = [
  { word: 'cat', x: 66, y: 108, c: 'animal' },
  { word: 'kitten', x: 96, y: 126, c: 'animal' },
  { word: 'dog', x: 52, y: 138, c: 'animal' },
  { word: 'mouse', x: 104, y: 94, c: 'animal' },
  { word: 'moon', x: 228, y: 100, c: 'space' },
  { word: 'star', x: 258, y: 120, c: 'space' },
  { word: 'planet', x: 202, y: 134, c: 'space' },
  { word: 'sun', x: 268, y: 80, c: 'space' },
  { word: 'sat', x: 64, y: 262, c: 'verb' },
  { word: 'ran', x: 96, y: 284, c: 'verb' },
  { word: 'slept', x: 52, y: 296, c: 'verb' },
  { word: 'mat', x: 190, y: 236, c: 'thing' },
  { word: 'rug', x: 222, y: 270, c: 'thing' },
  { word: 'floor', x: 170, y: 274, c: 'thing' },
  { word: 'sofa', x: 238, y: 226, c: 'thing' },
  { word: 'chair', x: 256, y: 256, c: 'thing' },
]

const MAP = { x: 16, y: 92, w: 314, h: 236 }
const fit = (x: number, y: number) => ({
  x: MAP.x + ((x - 16) / 290) * MAP.w,
  y: MAP.y + 22 + ((y - 66) / 252) * (MAP.h - 34),
})

const WORDS = RAW.map((w) => ({ ...w, ...fit(w.x, w.y) }))

const CLUSTER_LABEL: { c: Cluster; label: string; at: { x: number; y: number } }[] = [
  { c: 'animal', label: 'animals', at: fit(78, 76) },
  { c: 'space', label: 'sky', at: fit(234, 68) },
  { c: 'verb', label: 'actions', at: fit(76, 240) },
  { c: 'thing', label: 'things you sit on', at: fit(214, 304) },
]

// Where "The cat sat on the" lands.
const CONTEXT = fit(198, 252)

const nearest = new Set(
  [...WORDS]
    .sort((a, b) => Math.hypot(a.x - CONTEXT.x, a.y - CONTEXT.y) - Math.hypot(b.x - CONTEXT.x, b.y - CONTEXT.y))
    .slice(0, 3)
    .map((w) => w.word),
)

const NEXT = [
  { word: 'mat', p: 0.41 },
  { word: 'rug', p: 0.22 },
  { word: 'floor', p: 0.18 },
  { word: 'sofa', p: 0.09 },
  { word: 'moon', p: 0.01 },
]

/** `model` is where Evolution draws the model during this stage. */
export function VectorScene({ on, model }: { on: boolean; model: { x: number; y: number; r: number } }) {
  const [i, setI] = useState(0)
  const [wasOn, setWasOn] = useState(on)
  // Start over each time the stage comes back into view.
  if (on !== wasOn) {
    setWasOn(on)
    if (on) setI(0)
  }

  useEffect(() => {
    if (!on) return
    const id = setTimeout(() => setI((n) => (n + 1) % STEPS.length), STEPS[i].dur)
    return () => clearTimeout(id)
  }, [on, i])

  const step = STEPS[i]

  return (
    <g className={`vs vs-${step.id}`}>
      {/* 1 · The sentence comes in */}
      <g className="vs-input">
        <rect x={16} y={22} width={190} height={40} rx={12} />
        <text className="vs-input-text" x={30} y={42} dominantBaseline="central">
          The cat sat on the <tspan className="evo-blank">___</tspan>
        </text>
      </g>
      <line className="vs-arrow" x1={212} y1={42} x2={model.x - model.r - 8} y2={model.y} markerEnd="url(#vs-head)" />
      {step.id === 'read' && <circle key={`in${i}`} className="vs-token" cx={212} cy={42} r={4} />}
      <defs>
        <marker id="vs-head" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto">
          <path d="M 0 1 L 9 5 L 0 9 z" className="vs-headfill" />
        </marker>
      </defs>

      {/* The word map the model learned in training */}
      <rect className="vs-plot" x={MAP.x} y={MAP.y} width={MAP.w} height={MAP.h} rx={14} />
      <text className="vs-map-title" x={MAP.x + 4} y={MAP.y - 8}>
        THE MODEL'S WORD MAP · LEARNED IN TRAINING
      </text>
      {CLUSTER_LABEL.map((l) => (
        <text key={l.c} className={`vs-cluster ${l.c}`} x={l.at.x} y={l.at.y} textAnchor="middle">
          {l.label}
        </text>
      ))}
      {WORDS.map((w) => (
        <g key={w.word} className={`vs-word ${w.c}${nearest.has(w.word) ? ' near' : ''}`} transform={`translate(${w.x} ${w.y})`}>
          <circle r={4} />
          <text x={7} y={-5}>
            {w.word}
          </text>
        </g>
      ))}

      {/* 2 · The model places the sentence on the map */}
      <path
        className="vs-drop"
        pathLength={100}
        d={`M ${model.x} ${model.y + model.r + 4} C ${model.x} ${model.y + 110}, ${CONTEXT.x + 50} ${CONTEXT.y - 70}, ${CONTEXT.x + 6} ${CONTEXT.y - 12}`}
        markerEnd="url(#vs-head)"
      />
      {/* 3 · and looks at what's nearby */}
      <circle className="vs-reach" cx={CONTEXT.x} cy={CONTEXT.y} r={34} />
      {WORDS.filter((w) => nearest.has(w.word)).map((n) => (
        <line key={n.word} className="vs-link" x1={CONTEXT.x} y1={CONTEXT.y} x2={n.x} y2={n.y} />
      ))}
      <g className="vs-point">
        <path
          transform={`translate(${CONTEXT.x} ${CONTEXT.y})`}
          d="M0 -8 L2.4 -2.4 L8 0 L2.4 2.4 L0 8 L-2.4 2.4 L-8 0 L-2.4 -2.4 Z"
        />
        <text className="vs-point-label" x={CONTEXT.x - 38} y={CONTEXT.y + 2} textAnchor="end" dominantBaseline="central">
          your sentence
        </text>
      </g>

      {/* 4 · and predicts the next word */}
      <g className="vs-out">
        <text className="vs-map-title" x={348} y={104}>
          NEXT WORD
        </text>
        {NEXT.map((w, j) => (
          <g key={w.word} transform={`translate(348 ${116 + j * 24})`}>
            <text className="evo-word" x={0} y={10}>
              {w.word}
            </text>
            <rect className="evo-bar-track" x={40} y={2} width={56} height={10} rx={5} />
            <rect
              className={`evo-bar${j === 0 ? ' top' : ''}`}
              x={40}
              y={2}
              width={Math.max(4, 56 * w.p * 2)}
              height={10}
              rx={5}
              style={{ animationDelay: `${j * 0.12}s` }}
            />
            <text className="evo-prob" x={102} y={10}>
              {w.p.toFixed(2)}
            </text>
          </g>
        ))}
        <g className="vs-answer">
          <rect x={344} y={252} width={128} height={64} rx={12} />
          <text className="vs-answer-pre" x={356} y={272} dominantBaseline="central">
            The cat sat on the
          </text>
          <text className="vs-answer-word" x={356} y={298} dominantBaseline="central">
            mat.
          </text>
        </g>
      </g>

      {/* Where we are */}
      <g className="vs-steps">
        {STEPS.map((s, j) => (
          <g key={s.id} className={s.id === step.id ? 'on' : j < i ? 'done' : ''}>
            <rect x={s.x} y={342} width={s.w} height={24} rx={12} />
            <text x={s.x + s.w / 2} y={354} textAnchor="middle" dominantBaseline="central">
              {s.label}
            </text>
          </g>
        ))}
        <text className="vs-hint" x={16} y={386} dominantBaseline="central">
          {step.hint}
        </text>
      </g>
    </g>
  )
}
