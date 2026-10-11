import { useState } from 'react'

const QUESTION =
  'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?'

const STEPS = [
  'Let the ball cost x.',
  'The bat costs $1.00 more, so it costs x + 1.00.',
  'Together: x + (x + 1.00) = 1.10, so 2x + 1.00 = 1.10.',
  '2x = 0.10, so x = 0.05.',
  'Check: $0.05 + $1.05 = $1.10, and $1.05 is $1.00 more than $0.05.',
]

/** The same question answered in one step and with the working written out. */
export function CotDemo() {
  const [steps, setSteps] = useState(false)

  return (
    <div className="demo">
      <div className="demo-controls">
        <div className="speed" role="group" aria-label="Answer style">
          <button type="button" className={steps ? '' : 'on'} onClick={() => setSteps(false)}>
            Answer directly
          </button>
          <button type="button" className={steps ? 'on' : ''} onClick={() => setSteps(true)}>
            Think step by step
          </button>
        </div>
      </div>

      <p className="llm-problem">{QUESTION}</p>

      <div className="llm-cot" key={String(steps)}>
        {steps && (
          <ol className="llm-cot-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        <p className={`llm-cot-answer ${steps ? 'right' : 'wrong'}`}>
          <span className="llm-role">Answer</span> {steps ? '$0.05' : '$0.10'}
          <span className="llm-cot-mark">{steps ? 'correct' : 'plausible, wrong'}</span>
        </p>
      </div>

      <p className="demo-note">
        {steps
          ? 'Each written step is more computation the next tokens can build on, and the check at the end catches the trap.'
          : '$0.10 is the answer that “sounds” right: $1.10 minus $1.00. But then the bat would cost $1.10 and the total would be $1.20.'}{' '}
        A classic trap question; current models usually get this one right, but the effect holds on harder problems.
      </p>
    </div>
  )
}
