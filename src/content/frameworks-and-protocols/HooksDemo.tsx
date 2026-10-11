import { useState } from 'react'
import { Code } from '../llm-apis/Code'

type Case = {
  command: string
  output: string
  outcome: 'allow' | 'ask' | 'deny'
  result: string
}

const CASES: Case[] = [
  {
    command: 'npm test',
    output: '(no output, exit code 0)',
    outcome: 'allow',
    result: 'The hook has no objection, so the normal permission rules decide. The tests run.',
  },
  {
    command: 'git push --force origin main',
    output: `{"hookSpecificOutput": {
  "hookEventName": "PreToolUse",
  "permissionDecision": "ask",
  "permissionDecisionReason": "Force-pushing rewrites shared history."
}}`,
    outcome: 'ask',
    result: 'Claude Code stops and shows you a permission prompt with the hook’s reason. Nothing runs until you answer.',
  },
  {
    command: 'rm -rf ~/projects/old-site',
    output: `{"hookSpecificOutput": {
  "hookEventName": "PreToolUse",
  "permissionDecision": "deny",
  "permissionDecisionReason": "rm -rf outside this project is blocked. Delete inside the project, or ask the user."
}}`,
    outcome: 'deny',
    result: 'The command never runs. Claude gets the reason back and has to find another way, the same as a tool error in Topic 5.',
  },
]

const OUTCOME = { allow: 'Runs', ask: 'Asks you', deny: 'Blocked' }

export function HooksDemo() {
  const [i, setI] = useState(2)
  const c = CASES[i]
  const stdin = `{
  "hook_event_name": "PreToolUse",
  "session_id": "8f2c…",
  "cwd": "/Users/me/blog",
  "tool_name": "Bash",
  "tool_input": {"command": "${c.command}"}
}`

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Command Claude wants to run">
          {CASES.map((x, k) => (
            <button key={x.command} type="button" className={i === k ? 'on' : ''} onClick={() => setI(k)}>
              <code>{x.command.split(' ').slice(0, 2).join(' ')}</code>
            </button>
          ))}
        </div>
        <span className={`arc-rule arc-rule-${c.outcome}`}>{OUTCOME[c.outcome]}</span>
      </div>
      <div className="fp-hook" key={i}>
        <div>
          <span className="api-pane-label">1. Claude Code runs guard.py with this on stdin</span>
          <Code lang="json" code={stdin} />
        </div>
        <div>
          <span className="api-pane-label">2. guard.py prints</span>
          <Code lang={c.outcome === 'allow' ? 'text' : 'json'} code={c.output} />
        </div>
      </div>
      <p className="arc-caption fp-caption">
        <strong>3. </strong>
        {c.result}
      </p>
      <p className="demo-note">
        The hook is ordinary code you wrote, so it runs every time, whatever the model was told or talked into. A
        hook can also block by exiting with code 2; its stderr then becomes the reason.
      </p>
    </div>
  )
}
