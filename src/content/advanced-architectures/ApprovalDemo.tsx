import { useState } from 'react'

type Rule = 'allow' | 'ask' | 'deny'
type Call = { tool: string; input: string; rule: Rule; why: string; result: string }

const CALLS: Call[] = [
  {
    tool: 'read_file',
    input: '{"path": "config/billing.yaml"}',
    rule: 'allow',
    why: 'Read-only, so it runs without asking.',
    result: 'retry_limit: 3\ntimeout_s: 30',
  },
  {
    tool: 'run_shell',
    input: '{"command": "rm -rf /var/log/billing"}',
    rule: 'deny',
    why: 'Deleting outside the project is never allowed, whoever asks.',
    result: '',
  },
  {
    tool: 'edit_file',
    input: '{"path": "config/billing.yaml", "old": "retry_limit: 3", "new": "retry_limit: 10"}',
    rule: 'ask',
    why: 'Changes a file, so the harness pauses and asks.',
    result: 'File updated.',
  },
]

type Decision = 'approved' | 'rejected'

function resultFor(call: Call, decision: Decision | undefined, feedback: string) {
  if (call.rule === 'deny')
    return { error: true, text: 'Blocked by policy: run_shell cannot delete files outside the project.' }
  if (call.rule === 'allow' || decision === 'approved') return { error: false, text: call.result }
  return {
    error: true,
    text: `The user rejected this action.${feedback ? ` Their note: “${feedback}”` : ''} Do not retry it unchanged.`,
  }
}

const RULE_LABEL: Record<Rule, string> = { allow: 'Allowed', ask: 'Needs approval', deny: 'Denied' }

export function ApprovalDemo() {
  const [decision, setDecision] = useState<Decision>()
  const [feedback, setFeedback] = useState('')
  const [shown, setShown] = useState(1)
  const waiting = shown === CALLS.length && !decision

  const advance = () => setShown((s) => s + 1)
  const reset = () => {
    setShown(1)
    setDecision(undefined)
    setFeedback('')
  }

  return (
    <div className="demo">
      <div className="msg user arc-goal">Our billing jobs keep timing out. Fix it.</div>
      <ol className="arc-calls">
        {CALLS.slice(0, shown).map((c) => {
          const pending = c.rule === 'ask' && !decision
          const r = resultFor(c, decision, feedback)
          return (
            <li key={c.tool} className="arc-call">
              <div className="arc-call-head">
                <code>
                  {c.tool}({c.input})
                </code>
                <span className={`arc-rule arc-rule-${c.rule}`}>{RULE_LABEL[c.rule]}</span>
              </div>
              <p className="small muted">{c.why}</p>
              {pending ? (
                <div className="arc-ask">
                  <input
                    type="text"
                    placeholder="Optional note for the agent"
                    aria-label="Note for the agent"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <button type="button" className="pill primary" onClick={() => setDecision('approved')}>
                    Approve
                  </button>
                  <button type="button" className="pill" onClick={() => setDecision('rejected')}>
                    Reject
                  </button>
                </div>
              ) : (
                <pre className={`arc-result ${r.error ? 'error' : ''}`}>
                  {`tool_result${r.error ? ' (is_error)' : ''}: `}
                  {r.text}
                </pre>
              )}
              {c.rule === 'deny' && (
                <p className="small muted arc-after">
                  The agent gets the refusal like any other tool error and moves on to a different fix.
                </p>
              )}
              {c.rule === 'ask' && decision && (
                <p className="small muted arc-after">
                  {decision === 'approved'
                    ? 'The edit runs and the loop continues.'
                    : 'Nothing was changed. The rejection, with your note, reaches the model as a tool error, so it can try again differently.'}
                </p>
              )}
            </li>
          )
        })}
      </ol>
      <div className="demo-controls">
        {shown < CALLS.length ? (
          <button type="button" className="pill primary" onClick={advance}>
            Next tool call
          </button>
        ) : (
          <button type="button" className="pill primary" onClick={reset} disabled={waiting}>
            {waiting ? 'Waiting for your decision…' : 'Replay'}
          </button>
        )}
      </div>
      <p className="demo-note">
        The rules live in the harness, not the prompt. Try rejecting the edit with a note such as “use 5, not 10”:
        the note goes back to the model in the tool result, so a rejection is a correction, not a dead end.
      </p>
    </div>
  )
}
