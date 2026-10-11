/** What a model can know: training data up to the cutoff, then a gap that only the context can fill. */
export function CutoffTimeline() {
  return (
    <div className="llm-cutoff" role="img" aria-label="Timeline: training data up to the cutoff, then release months later, then today. Everything after the cutoff is only knowable if it is in the context.">
      <div className="llm-cutoff-track">
        <div className="llm-cutoff-known">
          <span>Learned in training</span>
          <small>Thinner near the cutoff: less had been written about recent events yet</small>
        </div>
        <div className="llm-cutoff-gap">
          <span>Only knowable if it’s in the context</span>
          <small>New events, today’s date, the latest library versions</small>
        </div>
      </div>
      <ol className="llm-cutoff-marks">
        <li className="above" style={{ left: '58%' }}>
          <strong>Cutoff</strong> ↓
        </li>
        <li className="above end" style={{ left: '100%' }}>
          <strong>Today</strong> ↓
        </li>
        <li style={{ left: '74%' }}>
          ↑ <strong>Release</strong>, months later
        </li>
      </ol>
    </div>
  )
}

const ROWS: [string, string, string][] = [
  ['Access', 'Download the weights and run them yourself', 'Call the provider’s API'],
  ['Infrastructure', 'You host and serve it (GPUs, scaling, updates)', 'None: the provider runs it'],
  ['Data', 'Never leaves your machines', 'Sent to the provider under their terms'],
  ['Customization', 'Full fine-tuning and inspection', 'Prompting, and fine-tuning where offered'],
  ['Capability', 'Strong, usually a step behind the frontier', 'Usually where the frontier models are'],
  ['Change over time', 'Fixed until you choose to upgrade', 'Versions are updated and retired'],
]

/** Open-weight versus API-only models. */
export function LandscapeTable() {
  return (
    <div className="llm-table-wrap">
      <table className="llm-table">
        <thead>
          <tr>
            <th />
            <th>Open-weight</th>
            <th>API-only</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, open, api]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{open}</td>
              <td>{api}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
