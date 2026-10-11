import { useState } from 'react'
import { Code } from '../llm-apis/Code'

type Who = 'client' | 'server' | 'model'
type Step = { from: Who; to: Who; label: string; caption: string; json: string }

const NAME: Record<Who, string> = { client: 'Client', server: 'Server', model: 'Model' }

const STEPS: Step[] = [
  {
    from: 'client',
    to: 'server',
    label: 'initialize',
    caption:
      'The host (Claude Code, Claude Desktop, your app) starts the server and its client opens the session: which protocol version it speaks and what it supports.',
    json: `{
  "jsonrpc": "2.0", "id": 1, "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "clientInfo": {"name": "my-agent", "version": "1.0"}
  }
}`,
  },
  {
    from: 'server',
    to: 'client',
    label: 'capabilities',
    caption: 'The server answers with what it offers. This one has tools and resources.',
    json: `{
  "jsonrpc": "2.0", "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {"tools": {}, "resources": {}},
    "serverInfo": {"name": "notes", "version": "0.1"}
  }
}`,
  },
  {
    from: 'client',
    to: 'server',
    label: 'tools/list',
    caption: 'The client asks for the tool list. This is discovery: nothing about these tools is written into the host.',
    json: `{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}`,
  },
  {
    from: 'server',
    to: 'client',
    label: 'tool definitions',
    caption: 'Each tool comes back with a name, a description and a JSON Schema, the same three things as a tool definition in Topic 4.',
    json: `{
  "jsonrpc": "2.0", "id": 2,
  "result": {"tools": [{
    "name": "save_note",
    "description": "Save a note under a short title. Overwrites a note with the same title.",
    "inputSchema": {
      "type": "object",
      "properties": {"title": {"type": "string"}, "body": {"type": "string"}},
      "required": ["title", "body"]
    }
  }]}
}`,
  },
  {
    from: 'client',
    to: 'model',
    label: 'tools in the request',
    caption: 'The host passes those definitions to the model with the user’s message. The model can’t tell an MCP tool from any other.',
    json: `{
  "model": "claude-opus-5-5",
  "tools": [{"name": "save_note", "description": "Save a note under…", "input_schema": {…}}],
  "messages": [{"role": "user", "content": "Note that the demo moved to Friday."}]
}`,
  },
  {
    from: 'model',
    to: 'client',
    label: 'tool_use',
    caption: 'The model asks for the tool in the usual way.',
    json: `{"type": "tool_use", "id": "toolu_01", "name": "save_note",
 "input": {"title": "Demo date", "body": "The demo moved to Friday."}}`,
  },
  {
    from: 'client',
    to: 'server',
    label: 'tools/call',
    caption: 'The client turns the tool_use block into a tools/call request to the server that owns the tool.',
    json: `{
  "jsonrpc": "2.0", "id": 3, "method": "tools/call",
  "params": {"name": "save_note",
             "arguments": {"title": "Demo date", "body": "The demo moved to Friday."}}
}`,
  },
  {
    from: 'server',
    to: 'client',
    label: 'result',
    caption: 'The server runs its function and returns content blocks. The host sends them to the model as the tool_result, and the loop carries on.',
    json: `{
  "jsonrpc": "2.0", "id": 3,
  "result": {"content": [{"type": "text", "text": "Saved note 'Demo date'."}], "isError": false}
}`,
  },
]

export function McpDemo() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="demo">
      <div className="fp-lanes" aria-hidden="true">
        {(['model', 'client', 'server'] as Who[]).map((w) => (
          <span key={w} className={`fp-lane ${s.from === w ? 'from' : ''} ${s.to === w ? 'to' : ''}`}>
            {w === 'client' ? 'Host + client' : w === 'server' ? 'MCP server' : 'Model'}
          </span>
        ))}
      </div>
      <p className="fp-dir">
        <strong>
          {NAME[s.from]} → {NAME[s.to]}
        </strong>{' '}
        <code>{s.label}</code>
      </p>
      <Code lang="json" code={s.json} />
      <p className="arc-caption fp-caption" aria-live="polite">
        {s.caption}
      </p>
      <div className="demo-controls">
        <button type="button" className="pill" onClick={() => setStep(step - 1)} disabled={step === 0}>
          Back
        </button>
        <button type="button" className="pill primary" onClick={() => setStep(last ? 0 : step + 1)}>
          {last ? 'Start over' : 'Next message'}
        </button>
        <span className="small muted">
          {step + 1} of {STEPS.length}
        </span>
      </div>
      <p className="demo-note">
        MCP messages are JSON-RPC 2.0. Steps 5 and 6 are the ordinary model API, not MCP: the protocol sits between
        the host and the tools, and the model never talks to a server directly.
      </p>
    </div>
  )
}
