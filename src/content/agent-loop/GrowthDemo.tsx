import { useState } from 'react'
import { StackedBars, type Series } from '../llm-apis/CostCalculator'

/** System prompt, tool definitions and the task. */
const START = 4_000

const SERIES: Series[] = [
  { key: 'fresh', label: 'input at full price', className: 'api-fill-input' },
  { key: 'cached', label: 'input read from cache (counted at 0.1×)', className: 'api-fill-cached' },
]

const k = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))

/** Input tokens per model call in an agent run, and what caching does to them. */
export function GrowthDemo() {
  const [iters, setIters] = useState(20)
  const [perStep, setPerStep] = useState(3_000)
  const [caching, setCaching] = useState(false)

  const sent = (i: number) => START + i * perStep
  // Billed-equivalent tokens: cached reads count a tenth, new tokens a little over one (cache write).
  const rows = Array.from({ length: iters }, (_, i) => {
    if (!caching || i === 0) return [sent(i) * (caching ? 1.25 : 1), 0]
    return [perStep * 1.25, sent(i - 1) * 0.1]
  })
  const totalSent = Array.from({ length: iters }, (_, i) => sent(i)).reduce((a, b) => a + b, 0)
  const billed = rows.flat().reduce((a, b) => a + b, 0)
  const once = START + (iters - 1) * perStep

  return (
    <div className="demo agl-growth">
      <div className="demo-controls agl-growth-head">
        <label className="slider">
          iterations
          <input type="range" min={1} max={50} value={iters} onChange={(e) => setIters(Number(e.target.value))} />
          <output>{iters}</output>
        </label>
        <label className="slider">
          tokens added per step
          <input
            type="range"
            min={500}
            max={10_000}
            step={500}
            value={perStep}
            onChange={(e) => setPerStep(Number(e.target.value))}
          />
          <output>{perStep.toLocaleString('en-US')}</output>
        </label>
        <div className="speed" role="group" aria-label="Caching">
          <button type="button" className={caching ? '' : 'on'} onClick={() => setCaching(false)}>
            No cache
          </button>
          <button type="button" className={caching ? 'on' : ''} onClick={() => setCaching(true)}>
            Cached prefix
          </button>
        </div>
      </div>

      <StackedBars
        series={SERIES}
        rows={rows}
        format={k}
        xLabel="iteration"
        label={`Input tokens per model call over ${iters} iterations, ${caching ? 'with' : 'without'} prompt caching.`}
      />

      <dl className="api-stats">
        <div>
          <dt>Distinct tokens in the run</dt>
          <dd>{k(once)}</dd>
        </div>
        <div>
          <dt>Input tokens sent, all calls</dt>
          <dd>{k(totalSent)}</dd>
        </div>
        <div>
          <dt>{caching ? 'Billed as if' : 'Billed as'}</dt>
          <dd>{k(billed)}</dd>
        </div>
      </dl>
      <p className="demo-note">
        Each call resends everything before it: {START.toLocaleString('en-US')} tokens of system prompt, tools and
        task, plus every earlier tool call and result. Double the iterations and the total sent roughly quadruples.
        Caching doesn’t shrink what is sent, but resent tokens cost about a tenth. Illustrative figures.
      </p>
    </div>
  )
}
