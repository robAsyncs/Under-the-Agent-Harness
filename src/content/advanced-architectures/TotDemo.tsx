import { useState } from 'react'

type Rating = 'sure' | 'likely' | 'impossible'
type Thought = {
  id: string
  step: string
  /** The numbers left after this step. */
  left: string
  rating?: Rating
  children?: Thought[]
}

/**
 * The Game of 24 example from Yao et al. (2023): 4 9 10 13. Ratings are what a
 * model might say, not the truth. 4 9 23 looks close to 24 but can't reach it.
 */
const TREE: Thought[] = [
  { id: 'a', step: '4 + 9 = 13', left: '10 13 13', rating: 'impossible' },
  {
    id: 'b',
    step: '10 − 4 = 6',
    left: '6 9 13',
    rating: 'sure',
    children: [
      { id: 'b1', step: '13 − 9 = 4', left: '4 6', rating: 'sure', children: [{ id: 'b1x', step: '4 × 6 = 24', left: '24' }] },
      { id: 'b2', step: '6 + 9 = 15', left: '13 15', rating: 'impossible' },
    ],
  },
  {
    id: 'c',
    step: '13 − 9 = 4',
    left: '4 4 10',
    rating: 'likely',
    children: [
      { id: 'c1', step: '10 − 4 = 6', left: '4 6', rating: 'sure' },
      { id: 'c2', step: '4 × 4 = 16', left: '10 16', rating: 'impossible' },
    ],
  },
  { id: 'd', step: '9 × 10 = 90', left: '4 13 90', rating: 'impossible' },
  {
    id: 'e',
    step: '13 + 10 = 23',
    left: '4 9 23',
    rating: 'likely',
    children: [
      { id: 'e1', step: '23 − 9 = 14', left: '4 14', rating: 'impossible' },
      { id: 'e2', step: '23 + 4 = 27', left: '9 27', rating: 'impossible' },
    ],
  },
]

/** What is visible at each step: deepest level shown, whether it is rated, and whether pruning has happened. */
const STEPS: { depth: number; rated: boolean; pruned: boolean; calls: number; caption: string }[] = [
  { depth: 0, rated: false, pruned: false, calls: 0, caption: 'The puzzle: use 4, 9, 10 and 13 once each, with + − × ÷, to make 24.' },
  {
    depth: 1,
    rated: false,
    pruned: false,
    calls: 1,
    caption: 'The model proposes five possible first steps. Each one is a “thought”: a partial solution with the numbers left over.',
  },
  {
    depth: 1,
    rated: true,
    pruned: false,
    calls: 6,
    caption:
      'A second prompt asks the model whether the numbers left can still reach 24: sure, likely or impossible. It doesn’t solve them, it judges them.',
  },
  {
    depth: 1,
    rated: true,
    pruned: true,
    calls: 6,
    caption: 'Impossible states are dropped. The search keeps the three most promising and expands only those.',
  },
  {
    depth: 2,
    rated: true,
    pruned: false,
    calls: 15,
    caption: 'Each kept state gets its own proposals and ratings. 4 9 23 looked close to 24, but none of its next steps can reach it.',
  },
  {
    depth: 2,
    rated: true,
    pruned: true,
    calls: 15,
    caption: 'That whole branch is a dead end, so the search abandons it. An early mistake costs a few calls instead of the answer.',
  },
  {
    depth: 3,
    rated: true,
    pruned: true,
    calls: 16,
    caption: 'One step later, 4 × 6 = 24. Reading back up the tree gives the answer: (10 − 4) × (13 − 9) = 24.',
  },
]

const SOLUTION = new Set(['b', 'b1', 'b1x'])
/** Ids kept after pruning at each level: the top three at level 1, everything not impossible below. */
const KEPT_L1 = new Set(['b', 'c', 'e'])

export function TotDemo() {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const finished = step === STEPS.length - 1

  const render = (nodes: Thought[], depth: number) => (
    <ul>
      {nodes.map((t) => {
        // Rated at the deepest level only once that level's rating step is shown.
        const showRating = t.rating && (depth < s.depth || s.rated)
        const prunedHere = depth === 1 ? !KEPT_L1.has(t.id) : t.rating === 'impossible'
        const dead = t.id === 'e' && (s.depth > 2 || (s.depth === 2 && s.pruned))
        const gone = (prunedHere && (depth < s.depth || s.pruned)) || dead
        const solved = finished && SOLUTION.has(t.id)
        const kids = t.children && depth < s.depth && !(depth === 1 && !KEPT_L1.has(t.id)) ? t.children : null
        return (
          <li key={t.id} className={`arc-thought ${gone ? 'pruned' : ''} ${solved ? 'solved' : ''}`}>
            <span className="arc-thought-row">
              <code>{t.step}</code>
              <span className="arc-thought-left">left: {t.left}</span>
              {showRating && <span className={`arc-rating ${t.rating}`}>{t.rating}</span>}
              {t.left === '24' && <span className="arc-rating sure">24 ✓</span>}
              {dead && <span className="arc-rating impossible">dead end</span>}
            </span>
            {kids && render(kids, depth + 1)}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="demo">
      <div className="arc-tot" role="group" aria-label="Tree of Thoughts search">
        <span className="arc-thought-root">4 9 10 13</span>
        {s.depth > 0 && render(TREE, 1)}
      </div>

      <p className="arc-caption" aria-live="polite">
        {s.caption}
      </p>
      <div className="demo-controls">
        <button type="button" className="pill primary" onClick={() => setStep(finished ? 0 : step + 1)}>
          {finished ? 'Replay' : step === 0 ? 'Start' : 'Next step'}
        </button>
        <span className="small muted">
          Step {step} of {STEPS.length - 1} · {s.calls} model calls so far
        </span>
      </div>
      <p className="demo-note">
        Breadth-first search with a beam of three, as in Yao et al. (2023), simplified to two proposals per state
        below the first level. The ratings are the model’s guesses: “likely” on 4 9 23 was wrong, and the search
        recovered because it kept other options open. Chain-of-thought gets one guess at the first step and has to
        live with it.
      </p>
    </div>
  )
}
