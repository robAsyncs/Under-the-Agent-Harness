import { useEffect, useState } from 'react'
import { type Algo, GOAL, GRID, key, OPEN_CELLS, search, START } from './gridSearch'

const ALGOS: Record<Algo, { name: string; note: string }> = {
  bfs: {
    name: 'Breadth-first',
    note: 'Expands states in order of distance from the start, in every direction, until it reaches the goal.',
  },
  astar: {
    name: 'A*',
    note: 'Expands the state with the lowest steps-so-far plus an estimate of the steps left, so it heads toward the goal.',
  },
}

const RESULTS = { bfs: search('bfs'), astar: search('astar') }
const TICK_MS = 35

export function SearchDemo() {
  const [algo, setAlgo] = useState<Algo>('bfs')
  const [shown, setShown] = useState(0)
  const [started, setStarted] = useState(false)
  const { expanded, path } = RESULTS[algo]
  const finished = shown >= expanded.length
  const running = started && !finished

  useEffect(() => {
    if (!running) return
    const id = setTimeout(() => setShown((s) => s + 1), TICK_MS)
    return () => clearTimeout(id)
  }, [running, shown])

  const order = new Map(expanded.slice(0, shown).map((k, i) => [k, i]))
  const onPath = new Set(finished ? path : [])

  const choose = (a: Algo) => {
    setAlgo(a)
    setShown(0)
    setStarted(false)
  }

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Search algorithm">
          {(Object.keys(ALGOS) as Algo[]).map((a) => (
            <button key={a} type="button" className={algo === a ? 'on' : ''} onClick={() => choose(a)}>
              {ALGOS[a].name}
            </button>
          ))}
        </div>
        <span className="small muted">{ALGOS[algo].note}</span>
      </div>

      <div
        className="arc-grid"
        style={{ gridTemplateColumns: `repeat(${GRID[0].length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${ALGOS[algo].name} search: ${shown} of ${OPEN_CELLS} states expanded`}
      >
        {GRID.flatMap((row, r) =>
          [...row].map((ch, c) => {
            const k = key([r, c])
            const cls =
              ch === '#'
                ? 'wall'
                : k === key(START)
                  ? 'start'
                  : k === key(GOAL)
                    ? 'goal'
                    : onPath.has(k)
                      ? 'path'
                      : order.has(k)
                        ? 'seen'
                        : ''
            return (
              <span key={k} className={`arc-cell ${cls}`}>
                {cls === 'start' ? 'S' : cls === 'goal' ? 'G' : ''}
              </span>
            )
          }),
        )}
      </div>

      <div className="demo-controls">
        <button
          type="button"
          className="pill primary"
          onClick={() => {
            if (finished) setShown(0)
            setStarted(true)
          }}
          disabled={running}
        >
          {finished ? 'Run again' : shown === 0 ? 'Run search' : 'Running…'}
        </button>
        <span className="small muted">
          {Math.min(shown, expanded.length)} of {OPEN_CELLS} states expanded
          {finished && ` · path of ${path.length - 1} moves`}
        </span>
      </div>
      <p className="demo-note">
        Each square is a state and each move to a neighbor is an action. Both searches find a shortest path, but A*
        expands far fewer states because its estimate (the number of moves to G if there were no walls) tells it which way to go.
        This grid has 4 actions per state. A real planning problem can have hundreds, and an LLM’s possible next
        “thoughts” can’t be listed at all.
      </p>
    </div>
  )
}
