/** A small route-finding problem for the search demo. S = start, G = goal, # = wall. */
export const GRID = [
  '..............',
  '..............',
  '.S.....#......',
  '.......#......',
  '.......#....G.',
  '.......#......',
  '..............',
]

export type Cell = [number, number]
export type Algo = 'bfs' | 'astar'

const find = (ch: string): Cell => {
  const r = GRID.findIndex((row) => row.includes(ch))
  return [r, GRID[r].indexOf(ch)]
}

export const START = find('S')
export const GOAL = find('G')
export const key = ([r, c]: Cell) => `${r},${c}`

const open = ([r, c]: Cell) => r >= 0 && r < GRID.length && c >= 0 && c < GRID[0].length && GRID[r][c] !== '#'
const neighbors = ([r, c]: Cell): Cell[] =>
  ([[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]] as Cell[]).filter(open)
/** Manhattan distance: never overestimates on a 4-way grid, so A* still finds a shortest path. */
const h = ([r, c]: Cell) => Math.abs(r - GOAL[0]) + Math.abs(c - GOAL[1])

/** Returns the states in the order they were expanded, and the path found. */
export function search(algo: Algo): { expanded: string[]; path: string[] } {
  const cost = new Map([[key(START), 0]])
  const parent = new Map<string, string>()
  const frontier: { cell: Cell; f: number; n: number }[] = [{ cell: START, f: 0, n: 0 }]
  const done = new Set<string>()
  const expanded: string[] = []
  let n = 0

  while (frontier.length) {
    // BFS takes the oldest state; A* the one with the lowest cost-so-far + estimate (ties: oldest).
    frontier.sort((a, b) => a.f - b.f || a.n - b.n)
    const { cell } = frontier.shift()!
    const k = key(cell)
    if (done.has(k)) continue
    done.add(k)
    expanded.push(k)
    if (k === key(GOAL)) break
    for (const next of neighbors(cell)) {
      const nk = key(next)
      const g = cost.get(k)! + 1
      if (done.has(nk) || g >= (cost.get(nk) ?? Infinity)) continue
      cost.set(nk, g)
      parent.set(nk, k)
      frontier.push({ cell: next, f: algo === 'astar' ? g + h(next) : n + 1, n: ++n })
    }
  }

  const path: string[] = []
  for (let k: string | undefined = key(GOAL); k; k = parent.get(k)) path.unshift(k)
  return { expanded, path: path[0] === key(START) ? path : [] }
}

export const OPEN_CELLS = GRID.join('').replaceAll('#', '').length
