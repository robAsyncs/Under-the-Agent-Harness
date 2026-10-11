import { useState } from 'react'

type Event = {
  who: 'agent' | 'crash' | 'server'
  text: string
  /** Emails in the board's inbox after this event, without and with an idempotency key. */
  inbox: [number, number]
  checkpoint: string
}

const KEY = 'run-42/step-3'

const EVENTS = (keyed: boolean): Event[] => [
  {
    who: 'agent',
    text: 'Load checkpoint: steps 1–2 done, step 3 is “email the report to the board”.',
    inbox: [0, 0],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'agent',
    text: keyed ? `send_email(to="board", body=report, key="${KEY}")` : 'send_email(to="board", body=report)',
    inbox: [1, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'server',
    text: keyed ? `Sent. Remembers key ${KEY}.` : 'Sent.',
    inbox: [1, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'crash',
    text: 'The process is killed before save(state) runs.',
    inbox: [1, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'agent',
    text: 'Restart and load checkpoint: step 3 is still not done, so run it again.',
    inbox: [1, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'agent',
    text: keyed ? `send_email(to="board", body=report, key="${KEY}")` : 'send_email(to="board", body=report)',
    inbox: [2, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'server',
    text: keyed ? `Key ${KEY} already used. Returns the first result without sending.` : 'Sent.',
    inbox: [2, 1],
    checkpoint: 'step 3: not done',
  },
  {
    who: 'agent',
    text: 'save(state)',
    inbox: [2, 1],
    checkpoint: 'step 3: done',
  },
]

export function CrashDemo() {
  const [keyed, setKeyed] = useState(false)
  const [step, setStep] = useState(0)
  const events = EVENTS(keyed)
  const shown = events.slice(0, step)
  const last = shown[shown.length - 1]
  const inbox = last ? last.inbox[keyed ? 1 : 0] : 0
  const finished = step === events.length

  const choose = (k: boolean) => {
    setKeyed(k)
    setStep(0)
  }

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Email tool">
          <button type="button" className={!keyed ? 'on' : ''} onClick={() => choose(false)}>
            Plain send
          </button>
          <button type="button" className={keyed ? 'on' : ''} onClick={() => choose(true)}>
            With idempotency key
          </button>
        </div>
      </div>

      <div className="arc-crash">
        <ol className="arc-crash-log" aria-live="polite">
          {shown.length === 0 && <li className="small muted">Press Start to run step 3.</li>}
          {shown.map((e, i) => (
            <li key={i} className={`arc-crash-event ${e.who}`}>
              <span className="arc-session-label">{e.who}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ol>
        <div className="arc-crash-side">
          <div>
            <span className="api-pane-label">Board’s inbox</span>
            <p className={`arc-inbox ${inbox > 1 ? 'twice' : ''}`}>
              {inbox} {inbox === 1 ? 'email' : 'emails'}
            </p>
          </div>
          <div>
            <span className="api-pane-label">Checkpoint</span>
            <p className="arc-crash-check">{last?.checkpoint ?? 'step 3: not done'}</p>
          </div>
        </div>
      </div>

      <div className="demo-controls">
        <button type="button" className="pill primary" onClick={() => setStep(finished ? 0 : step + 1)}>
          {finished ? 'Replay' : step === 0 ? 'Start' : 'Next step'}
        </button>
        <span className="small muted">
          Step {step} of {events.length}
        </span>
      </div>
      <p className="demo-note">
        {finished && !keyed
          ? 'The checkpoint was right to say step 3 wasn’t saved, and the board got the report twice anyway. '
          : finished
            ? 'Same crash, one email. '
            : ''}
        The key is built from the run and step, so a retry sends the same key and the email service can tell it’s a
        repeat. Payment APIs such as Stripe’s accept a key like this; for your own tools, check whether the work was
        already done before doing it again.
      </p>
    </div>
  )
}
