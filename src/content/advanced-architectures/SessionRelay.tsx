import { useState } from 'react'

type Session = {
  title: string
  reads: string
  does: string[]
  commit: string
  progress: string
  passing: number
}

const TOTAL = 40
const HASHES = ['3e1a9c2', '8b04f71', 'c5d2e08', '1f9a6b3']

const SESSIONS: Session[] = [
  {
    title: 'Initializer',
    reads: 'The request: “build a to-do app”',
    does: ['Sets up the project and a script that starts it', `Writes features.json: ${TOTAL} features, all failing`, 'Creates progress.txt'],
    commit: 'Set up project and feature list',
    progress: 'Session 1: setup done. Start with “add a to-do”.',
    passing: 0,
  },
  {
    title: 'Coding',
    reads: 'progress.txt, git log, features.json',
    does: ['Picks “add a to-do”', 'Builds it and tests it in the browser', 'Marks it passing'],
    commit: 'Add to-dos',
    progress: 'Session 2: adding to-dos works.',
    passing: 1,
  },
  {
    title: 'Coding',
    reads: 'progress.txt, git log, features.json',
    does: ['Picks “mark a to-do done”', 'Gets it working, finds a sorting bug', 'Runs low on context'],
    commit: 'Mark to-dos done',
    progress: 'Session 3: done works. Next: done items sort to the top, should sort to the bottom.',
    passing: 2,
  },
  {
    title: 'Coding',
    reads: 'progress.txt, git log, features.json',
    does: ['Reads the note about the sorting bug', 'Fixes it before starting anything new', 'Picks “delete a to-do”'],
    commit: 'Fix sort order; delete to-dos',
    progress: 'Session 4: fixed sorting. Deleting works.',
    passing: 3,
  },
]

export function SessionRelay() {
  const [shown, setShown] = useState(1)
  const done = SESSIONS.slice(0, shown)
  const finished = shown === SESSIONS.length

  return (
    <div className="demo">
      <ol className="arc-sessions">
        {done.map((s, i) => (
          <li key={i} className={`arc-session ${i === shown - 1 ? 'current' : ''}`}>
            <span className="arc-session-head">
              <strong>
                Session {i + 1}: {s.title}
              </strong>
              <span className="arc-fresh">fresh context</span>
            </span>
            <p>
              <span className="arc-session-label">Reads</span> {s.reads}
            </p>
            <ul>
              {s.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="arc-persist" aria-live="polite">
        <span className="api-pane-label">Survives between sessions</span>
        <div className="arc-persist-grid">
          <div>
            <span className="arc-session-label">progress.txt</span>
            <pre>{done.map((s) => s.progress).join('\n')}</pre>
          </div>
          <div>
            <span className="arc-session-label">git log</span>
            <pre>
              {done
                .map((s, i) => `${HASHES[i]} ${s.commit}`)
                .reverse()
                .join('\n')}
            </pre>
          </div>
          <div>
            <span className="arc-session-label">features.json</span>
            <span className="arc-passing">
              <span style={{ width: `${(done[done.length - 1].passing / TOTAL) * 100}%` }} />
            </span>
            <span className="small muted">
              {done[done.length - 1].passing} of {TOTAL} passing
            </span>
          </div>
        </div>
      </div>

      <div className="demo-controls">
        <button type="button" className="pill primary" onClick={() => setShown(finished ? 1 : shown + 1)}>
          {finished ? 'Replay' : 'Next session'}
        </button>
        <span className="small muted">
          Session {shown} of {SESSIONS.length}
        </span>
      </div>
      <p className="demo-note">
        No session remembers the one before it. Everything it knows about the project comes from the three files
        at the bottom, which is why each session ends by committing and writing a note for the next one. Based on
        the pattern in Anthropic’s guide; the app and features are illustrative.
      </p>
    </div>
  )
}
