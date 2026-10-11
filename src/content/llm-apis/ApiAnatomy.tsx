import { useState } from 'react'

type Line = { text: string; field?: string }

const FIELDS: Record<string, { name: string; side: 'request' | 'response'; note: string }> = {
  model: { name: 'model', side: 'request', note: 'Which model answers. Pin an exact ID so behaviour doesn’t change under you.' },
  max_tokens: {
    name: 'max_tokens',
    side: 'request',
    note: 'Required. The most output tokens the reply may use; a reply that reaches it stops mid-sentence.',
  },
  system: { name: 'system', side: 'request', note: 'The system prompt: role, audience and rules that hold for the whole conversation.' },
  messages: {
    name: 'messages',
    side: 'request',
    note: 'The whole conversation so far, alternating user and assistant turns, starting with a user turn. You resend it every time.',
  },
  content: {
    name: 'content',
    side: 'response',
    note: 'A list of content blocks, not a string. Here it is one text block; a reply can also hold tool_use or thinking blocks.',
  },
  stop_reason: {
    name: 'stop_reason',
    side: 'response',
    note: 'Why generation ended: end_turn (finished), max_tokens (cut off), tool_use (wants a tool), stop_sequence and others.',
  },
  usage: {
    name: 'usage',
    side: 'response',
    note: 'The tokens you are billed for, including how many were read from or written to the prompt cache.',
  },
}

const REQUEST: Line[] = [
  { text: '{' },
  { text: '  "model": "claude-opus-5-5",', field: 'model' },
  { text: '  "max_tokens": 1024,', field: 'max_tokens' },
  { text: '  "system": "Be concise.",', field: 'system' },
  { text: '  "messages": [', field: 'messages' },
  { text: '    {"role": "user",', field: 'messages' },
  { text: '     "content": "Capital of Australia?"}', field: 'messages' },
  { text: '  ]', field: 'messages' },
  { text: '}' },
]

const RESPONSE: Line[] = [
  { text: '{' },
  { text: '  "id": "msg_01…",' },
  { text: '  "role": "assistant",' },
  { text: '  "content": [', field: 'content' },
  { text: '    {"type": "text",', field: 'content' },
  { text: '     "text": "Canberra."}', field: 'content' },
  { text: '  ],', field: 'content' },
  { text: '  "stop_reason": "end_turn",', field: 'stop_reason' },
  { text: '  "usage": {', field: 'usage' },
  { text: '    "input_tokens": 18,', field: 'usage' },
  { text: '    "output_tokens": 6,', field: 'usage' },
  { text: '    "cache_read_input_tokens": 0', field: 'usage' },
  { text: '  }', field: 'usage' },
  { text: '}' },
]

const ORDER = Object.keys(FIELDS)

function Pane({ title, lines, active, setActive }: { title: string; lines: Line[]; active: string; setActive: (f: string) => void }) {
  return (
    <div className="api-anat-pane">
      <span className="api-pane-label">{title}</span>
      <pre className="api-anat-code">
        {lines.map((l, i) => {
          const first = l.field && lines.findIndex((x) => x.field === l.field) === i
          return (
            <span
              key={i}
              className={`api-anat-line ${l.field ? 'hit' : ''} ${l.field && l.field === active ? 'on' : ''}`}
              onMouseEnter={l.field ? () => setActive(l.field!) : undefined}
              onClick={l.field ? () => setActive(l.field!) : undefined}
            >
              {l.text}
              {first && <span className="api-anat-num">{ORDER.indexOf(l.field!) + 1}</span>}
              {'\n'}
            </span>
          )
        })}
      </pre>
    </div>
  )
}

/** The request and response with each field that matters labelled. */
export function ApiAnatomy() {
  const [active, setActive] = useState('messages')

  return (
    <div className="demo api-anat">
      <div className="api-anat-cols">
        <Pane title="Request" lines={REQUEST} active={active} setActive={setActive} />
        <Pane title="Response" lines={RESPONSE} active={active} setActive={setActive} />
      </div>
      <ol className="api-anat-notes">
        {ORDER.map((f, i) => (
          <li key={f} className={f === active ? 'on' : ''}>
            <button type="button" onClick={() => setActive(f)} onFocus={() => setActive(f)} aria-pressed={f === active}>
              <span className="api-anat-num">{i + 1}</span>
              <code>{FIELDS[f].name}</code>
              <span className="api-anat-side">{FIELDS[f].side}</span>
            </button>
            {f === active && <p>{FIELDS[f].note}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
