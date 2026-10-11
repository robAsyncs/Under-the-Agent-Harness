import { useState } from 'react'

const QUESTION = 'Is an electric car cheaper to own than a petrol car in the UK?'

type Worker = { brief: string; searches: string[]; returned: string; tokensBack: number }
type Version = { workers: Worker[]; verdict: string }

const VERSIONS: Record<'vague' | 'complete', Version> = {
  vague: {
    workers: [
      {
        brief: 'Research electric car costs.',
        searches: ['electric car cost', 'EV running costs', 'EV vs petrol cost comparison'],
        returned: 'Full transcript: 14 search results and notes, mostly US prices in dollars.',
        tokensBack: 18_000,
      },
      {
        brief: 'Research running costs.',
        searches: ['EV running costs', 'petrol car running costs UK', 'EV vs petrol cost comparison'],
        returned: 'Full transcript: overlapping fuel and charging figures from 2021.',
        tokensBack: 15_000,
      },
      {
        brief: 'Look into ownership costs.',
        searches: ['car ownership costs', 'EV vs petrol cost comparison', 'EV insurance'],
        returned: 'Full transcript: insurance and a general cost overview, no sources dated.',
        tokensBack: 16_000,
      },
    ],
    verdict:
      'The same comparison search ran three times, one worker answered for the wrong country, and 49k tokens of raw transcripts landed in the orchestrator’s context. Nobody covered depreciation.',
  },
  complete: {
    workers: [
      {
        brief:
          'Find the UK purchase price and 3-year depreciation of the 3 best-selling EVs and their closest petrol equivalents. UK sources from 2025 or later. Out of scope: running costs (another worker). Return a table with sources.',
        searches: ['best selling EVs UK 2025', 'EV depreciation 3 years UK', 'petrol equivalent depreciation UK'],
        returned: 'A 6-row table: price, 3-year value, source and date for each car.',
        tokensBack: 900,
      },
      {
        brief:
          'Find UK running costs per mile for an EV (home and public charging) and a petrol car: energy, servicing, tax. 2025 or later. Out of scope: purchase price and insurance. Return figures per 10,000 miles with sources.',
        searches: ['UK electricity price per kWh 2025', 'UK petrol price per litre', 'EV vs petrol servicing costs UK'],
        returned: 'Per-10,000-mile figures for both, split by home and public charging.',
        tokensBack: 800,
      },
      {
        brief:
          'Find UK insurance and vehicle tax for EVs vs petrol cars from 2025, including changes to EV road tax. Out of scope: everything else. Return a short list of figures with sources, and anything still uncertain.',
        searches: ['EV road tax UK 2025', 'EV insurance premium vs petrol UK'],
        returned: 'Five figures with sources and one open question about insurance data.',
        tokensBack: 600,
      },
    ],
    verdict:
      'Every search was different, every figure is UK and recent, and the orchestrator got 2.3k tokens of structured findings it can combine directly.',
  },
}

export function BriefDemo() {
  const [mode, setMode] = useState<keyof typeof VERSIONS>('vague')
  const v = VERSIONS[mode]
  const all = v.workers.flatMap((w) => w.searches)
  const repeated = new Set(all.filter((s, i) => all.indexOf(s) !== i))
  const back = v.workers.reduce((sum, w) => sum + w.tokensBack, 0)

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Briefs">
          <button type="button" className={mode === 'vague' ? 'on' : ''} onClick={() => setMode('vague')}>
            Vague briefs
          </button>
          <button type="button" className={mode === 'complete' ? 'on' : ''} onClick={() => setMode('complete')}>
            Complete briefs
          </button>
        </div>
        <span className="small muted">{QUESTION}</span>
      </div>

      <ol className="ma-workers" key={mode}>
        {v.workers.map((w, i) => (
          <li key={i}>
            <span className="ma-worker-name">Worker {i + 1}</span>
            <p className="ma-brief">{w.brief}</p>
            <ul className="ma-searches">
              {w.searches.map((s) => (
                <li key={s} className={repeated.has(s) ? 'dup' : ''}>
                  {s}
                </li>
              ))}
            </ul>
            <p className="ma-returned">
              <span>Returns</span> {w.returned}
            </p>
          </li>
        ))}
      </ol>

      <dl className="ma-stats">
        <div>
          <dt>Searches</dt>
          <dd>{all.length}</dd>
        </div>
        <div>
          <dt>Repeated searches</dt>
          <dd>{all.length - new Set(all).size}</dd>
        </div>
        <div>
          <dt>Tokens sent back</dt>
          <dd>{(back / 1000).toFixed(1)}k</dd>
        </div>
      </dl>
      <p className="demo-note">
        {v.verdict} Repeated searches are highlighted. All figures are illustrative.
      </p>
    </div>
  )
}
