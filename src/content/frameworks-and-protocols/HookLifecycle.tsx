import { useState } from 'react'

type Power = 'block' | 'ask' | 'context' | 'observe'

type Hook = { id: string; when: string; can: Power[]; example: string }

const POWER: Record<Power, string> = {
  block: 'Block',
  ask: 'Ask you',
  context: 'Add context',
  observe: 'Observe only',
}

const HOOKS: Record<string, Hook> = {
  SessionStart: {
    id: 'SessionStart',
    when: 'A session starts or resumes.',
    can: ['context'],
    example: 'Load the open issues or the current branch into Claude’s context.',
  },
  UserPromptSubmit: {
    id: 'UserPromptSubmit',
    when: 'You submit a prompt, before Claude sees it.',
    can: ['block', 'context'],
    example: 'Add the ticket you’re working on, or block prompts that contain secrets.',
  },
  PreToolUse: {
    id: 'PreToolUse',
    when: 'Claude has chosen a tool and its arguments, before the tool runs.',
    can: ['block', 'ask'],
    example: 'guard.py: deny rm -rf outside the project, ask before a force-push.',
  },
  PostToolUse: {
    id: 'PostToolUse',
    when: 'A tool has finished successfully. It already ran, so this can’t undo it.',
    can: ['block', 'context'],
    example: 'Run the formatter after every Edit; tell Claude when the linter fails.',
  },
  PreCompact: {
    id: 'PreCompact',
    when: 'The context is full and Claude Code is about to compact it.',
    can: ['observe'],
    example: 'Save a copy of the full transcript before it is summarized.',
  },
  Notification: {
    id: 'Notification',
    when: 'Claude Code needs your attention: a permission prompt, or waiting for input.',
    can: ['observe'],
    example: 'Send a desktop notification so you know to come back.',
  },
  Stop: {
    id: 'Stop',
    when: 'Claude decides it is done and tries to end its turn.',
    can: ['block'],
    example: 'tests_pass.py: if tests fail, block the stop and hand Claude the failures.',
  },
  SessionEnd: {
    id: 'SessionEnd',
    when: 'The session ends.',
    can: ['observe'],
    example: 'Clean up temporary files, or log how the session went.',
  },
}

/** The loop, top to bottom. Strings are steps; objects are hook points. `loop` marks the part that repeats. */
const TIMELINE: ({ step: string; loop?: boolean } | { hook: string; loop?: boolean })[] = [
  { hook: 'SessionStart' },
  { step: 'You type a prompt' },
  { hook: 'UserPromptSubmit' },
  { step: 'Model call: Claude picks a tool', loop: true },
  { hook: 'PreToolUse', loop: true },
  { step: 'Tool runs', loop: true },
  { hook: 'PostToolUse', loop: true },
  { hook: 'PreCompact', loop: true },
  { step: 'Model call: Claude answers with no tool call' },
  { hook: 'Stop' },
  { hook: 'Notification' },
  { step: 'You type the next prompt, or quit' },
  { hook: 'SessionEnd' },
]

export function HookLifecycle() {
  const [sel, setSel] = useState('PreToolUse')
  const h = HOOKS[sel]

  return (
    <div className="demo fp-life">
      <ol className="fp-timeline" aria-label="Where hooks fire in the agent loop">
        {TIMELINE.map((t) =>
          'step' in t ? (
            <li key={t.step} className={`fp-step ${t.loop ? 'loop' : ''}`}>
              {t.step}
            </li>
          ) : (
            <li key={t.hook} className={`fp-pin-row ${t.loop ? 'loop' : ''}`}>
              <button
                type="button"
                className={`fp-pin ${sel === t.hook ? 'on' : ''}`}
                aria-pressed={sel === t.hook}
                onClick={() => setSel(t.hook)}
              >
                {t.hook}
              </button>
            </li>
          ),
        )}
      </ol>

      <div className="fp-life-detail" key={sel} aria-live="polite">
        <code className="fp-life-name">{h.id}</code>
        <p>
          <strong>Fires when</strong> {h.when}
        </p>
        <p className="fp-powers">
          {(Object.keys(POWER) as Power[]).map((p) => (
            <span key={p} className={`fp-power ${h.can.includes(p) ? 'on' : ''}`}>
              {POWER[p]}
            </span>
          ))}
        </p>
        <p>
          <strong>For example</strong> {h.example}
        </p>
      </div>

      <p className="demo-note">
        The shaded steps repeat once per tool call. PreCompact fires only when the context fills up, and Notification
        whenever Claude is waiting on you. Every hook can also just run a command and say nothing.
      </p>
    </div>
  )
}
