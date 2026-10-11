import { useState } from 'react'

const LIMIT = 200_000

type Fate = 'keep' | 'compress' | 'drop'
type Segment = { id: string; label: string; fate: Fate; before: number; after: number; afterLabel?: string }

/** One long research task, just before it hits the context limit. Token counts are illustrative. */
const SEGMENTS: Segment[] = [
  { id: 'system', label: 'System prompt', fate: 'keep', before: 3_000, after: 3_000 },
  { id: 'memory', label: 'Memory file', fate: 'keep', before: 2_000, after: 2_000 },
  { id: 'tools', label: 'Tool definitions', fate: 'keep', before: 8_000, after: 8_000 },
  { id: 'turns', label: 'Old turns', fate: 'compress', before: 36_000, after: 3_000, afterLabel: 'Summary' },
  { id: 'results', label: 'Old tool results', fate: 'drop', before: 132_000, after: 0 },
  { id: 'recent', label: 'Recent messages', fate: 'keep', before: 14_000, after: 14_000 },
]

const FATE_LABEL: Record<Fate, string> = { keep: 'Kept verbatim', compress: 'Compressed', drop: 'Dropped' }

const k = (n: number) => `${Math.round(n / 1000)}k`

export function ContextBarDemo() {
  const [compacted, setCompacted] = useState(false)
  const size = (s: Segment) => (compacted ? s.after : s.before)
  const total = SEGMENTS.reduce((sum, s) => sum + size(s), 0)

  return (
    <div className="demo">
      <div className="demo-controls mem-demo-head">
        <button type="button" className="pill primary" onClick={() => setCompacted(!compacted)}>
          {compacted ? 'Reset' : 'Run compaction'}
        </button>
        <span className="small muted">
          {k(total)} of {k(LIMIT)} tokens ({Math.round((total / LIMIT) * 100)}%)
        </span>
      </div>

      <div className="mem-ctx" role="img" aria-label={`Context window, ${k(total)} of ${k(LIMIT)} tokens used`}>
        {SEGMENTS.map((s) => (
          <span
            key={s.id}
            className={`mem-ctx-seg ${s.fate}`}
            style={{ width: `${(size(s) / LIMIT) * 100}%` }}
            title={`${compacted && s.afterLabel ? s.afterLabel : s.label}: ${k(size(s))}`}
          />
        ))}
      </div>

      <ul className="mem-ctx-legend">
        {SEGMENTS.map((s) => (
          <li key={s.id} className={`${s.fate} ${compacted && s.after === 0 ? 'gone' : ''}`}>
            <span className="mem-ctx-swatch" />
            <span>
              {compacted && s.afterLabel ? `${s.afterLabel} of old turns` : s.label}
              <em>{FATE_LABEL[s.fate]}</em>
            </span>
            <span className="mem-score">{compacted && s.after === 0 ? '0' : k(size(s))}</span>
          </li>
        ))}
      </ul>

      <p className="demo-note">
        {compacted
          ? 'The system prompt, memory file and tools were never part of the messages, so compaction leaves them alone. Everything before the cut became one user message holding the summary; the facts the old tool results contained live on in it, or in the agent’s notes. The recent messages, starting at an assistant turn so every tool result still follows its call, are kept as they were.'
          : 'A long research task, near the limit. Most of the space is tool results the agent has already read. Token counts are illustrative.'}
      </p>
    </div>
  )
}
