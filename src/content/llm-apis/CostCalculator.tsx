import { useState } from 'react'

export type Series = { key: string; label: string; className: string }

/** A small stacked bar chart: one bar per request, one segment per series. */
export function StackedBars({
  series,
  rows,
  format,
  xLabel,
  label,
}: {
  series: Series[]
  /** One entry per bar, with one value per series. */
  rows: number[][]
  format: (v: number) => string
  xLabel: string
  label: string
}) {
  const W = 600
  const H = 210
  const L = 58
  const R = 8
  const T = 12
  const B = 34
  const plotW = W - L - R
  const plotH = H - T - B
  const max = Math.max(...rows.map((r) => r.reduce((a, b) => a + b, 0)), 1e-12)
  const step = plotW / rows.length
  const barW = Math.max(2, step * 0.72)
  const y = (v: number) => T + plotH - (v / max) * plotH
  const ticks = rows.length <= 12 ? rows.map((_, i) => i) : rows.map((_, i) => i).filter((i) => i === 0 || (i + 1) % 5 === 0)

  return (
    <div className="api-bars">
      <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={L} x2={W - R} y1={y(max * f)} y2={y(max * f)} className="api-grid" />
            <text x={L - 8} y={y(max * f) + 4} className="api-tick" textAnchor="end">
              {format(max * f)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          let acc = 0
          return (
            <g key={i}>
              {r.map((v, s) => {
                const top = y(acc + v)
                const h = y(acc) - top
                acc += v
                return h > 0 ? (
                  <rect key={s} x={L + i * step + (step - barW) / 2} y={top} width={barW} height={h} className={series[s].className} />
                ) : null
              })}
            </g>
          )
        })}
        {ticks.map((i) => (
          <text key={i} x={L + i * step + step / 2} y={T + plotH + 16} className="api-tick" textAnchor="middle">
            {i + 1}
          </text>
        ))}
        <text x={L + plotW / 2} y={H - 2} className="api-tick" textAnchor="middle">
          {xLabel}
        </text>
      </svg>
      <ul className="api-legend">
        {series.map((s) => (
          <li key={s.key} className={`api-swatch ${s.className}`}>
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const money = (v: number) => (v === 0 ? '$0' : v < 0.1 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`)

/** Input tokens on the first request: system prompt plus the first message. */
const FIRST_INPUT = 2_000

const SERIES: Series[] = [
  { key: 'input', label: 'input (resent history)', className: 'api-fill-input' },
  { key: 'cached', label: 'input read from cache', className: 'api-fill-cached' },
  { key: 'output', label: 'output', className: 'api-fill-output' },
]

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  show,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  show: string
}) {
  return (
    <label className="slider">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{show}</output>
    </label>
  )
}

/** What a chat costs, request by request, as its history grows. */
export function CostCalculator() {
  const [turns, setTurns] = useState(20)
  const [added, setAdded] = useState(1_500)
  const [output, setOutput] = useState(500)
  const [inPrice, setInPrice] = useState(3)
  const [outPrice, setOutPrice] = useState(15)
  const [caching, setCaching] = useState(false)
  const [batch, setBatch] = useState(false)

  const discount = batch ? 0.5 : 1
  const rows = Array.from({ length: turns }, (_, i) => {
    const input = FIRST_INPUT + i * added
    // With caching, everything sent last time is read back at a tenth of the price,
    // and only the new tokens are written (at 1.25x for the five-minute cache).
    const cachedTokens = caching && i > 0 ? FIRST_INPUT + (i - 1) * added : 0
    const fresh = (input - cachedTokens) * (caching ? 1.25 : 1)
    return [
      (fresh * inPrice * discount) / 1e6,
      (cachedTokens * inPrice * 0.1 * discount) / 1e6,
      (output * outPrice * discount) / 1e6,
    ]
  })
  const total = rows.flat().reduce((a, b) => a + b, 0)
  const inputShare = rows.reduce((a, r) => a + r[0] + r[1], 0) / total
  const last = rows[rows.length - 1]
  const lastInput = FIRST_INPUT + (turns - 1) * added

  return (
    <div className="demo api-cost">
      <div className="api-cost-controls">
        <Slider label="turns" value={turns} min={1} max={40} step={1} onChange={setTurns} show={String(turns)} />
        <Slider
          label="tokens added per turn"
          value={added}
          min={0}
          max={5_000}
          step={100}
          onChange={setAdded}
          show={added.toLocaleString('en-US')}
        />
        <Slider
          label="output per turn"
          value={output}
          min={100}
          max={2_000}
          step={100}
          onChange={setOutput}
          show={output.toLocaleString('en-US')}
        />
        <Slider label="$ per 1M input" value={inPrice} min={0.5} max={15} step={0.5} onChange={setInPrice} show={`$${inPrice}`} />
        <Slider label="$ per 1M output" value={outPrice} min={1} max={75} step={1} onChange={setOutPrice} show={`$${outPrice}`} />
      </div>
      <div className="demo-controls api-cost-toggles">
        <div className="speed" role="group" aria-label="Discounts">
          <button type="button" className={caching ? 'on' : ''} aria-pressed={caching} onClick={() => setCaching(!caching)}>
            Prompt caching
          </button>
          <button type="button" className={batch ? 'on' : ''} aria-pressed={batch} onClick={() => setBatch(!batch)}>
            Batch API
          </button>
        </div>
      </div>

      <StackedBars
        series={SERIES}
        rows={rows}
        format={money}
        xLabel="turn"
        label={`Cost per request over ${turns} turns. The last request costs ${money(last.reduce((a, b) => a + b, 0))}; the whole chat costs ${money(total)}.`}
      />

      <dl className="api-stats">
        <div>
          <dt>Input on the last request</dt>
          <dd>{lastInput.toLocaleString('en-US')} tokens</dd>
        </div>
        <div>
          <dt>Last request</dt>
          <dd>{money(last.reduce((a, b) => a + b, 0))}</dd>
        </div>
        <div>
          <dt>Whole chat</dt>
          <dd>{money(total)}</dd>
        </div>
        <div>
          <dt>Share spent on input</dt>
          <dd>{Math.round(inputShare * 100)}%</dd>
        </div>
      </dl>
      <p className="demo-note">
        The first request sends {FIRST_INPUT.toLocaleString('en-US')} input tokens; each turn adds the new message and
        the previous reply. Caching here assumes every turn arrives within the cache’s five minutes, with new tokens
        written at 1.25× and earlier ones read at 0.1×. The batch API halves every price but returns results
        asynchronously, so it suits offline jobs rather than a live chat. Illustrative rates, not current prices.
      </p>
    </div>
  )
}
