import type { GlossaryEntry } from './types'

/** Terms introduced in Topic 7. */
export const ADVANCED_ARCHITECTURES_TERMS = {
  'prompt-chaining': {
    term: 'Prompt chaining',
    definition:
      'A workflow where each model call does one step and its output becomes the next call’s input, often with checks in code between steps.',
  },
  routing: {
    term: 'Routing',
    definition:
      'A workflow where a first step classifies the input and code sends it to a prompt, tool set or model built for that kind of input.',
  },
  'evaluator-optimizer': {
    term: 'Evaluator-optimizer',
    definition:
      'A loop where one call produces a result, another critiques it against criteria, and the critique goes back for a revised attempt.',
  },
  'goal-decomposition': {
    term: 'Goal decomposition',
    definition:
      'Breaking a goal into smaller subgoals, and those into tasks, until each piece is small enough to do in one step.',
  },
  'state-space-search': {
    term: 'State-space search',
    definition:
      'Planning as search: describe the world as states, define actions that move between them, and search for a sequence of actions that reaches the goal.',
  },
  heuristic: {
    term: 'Heuristic',
    definition:
      'An estimate of how far a state is from the goal. A* uses it to expand promising states first; if it never overestimates, A* still finds a shortest plan.',
  },
  'tree-of-thoughts': {
    term: 'Tree of Thoughts',
    definition:
      'Search where each state is a partial solution written by an LLM: the model proposes several next steps, scores them, and the search keeps the best and backtracks from dead ends.',
  },
  'planning-graph': {
    term: 'Planning graph',
    definition:
      'Graphplan’s structure: alternating layers of facts and actions that could be true or taken at each step, with conflicts marked, from which a plan is then extracted.',
  },
  'hierarchical-planning': {
    term: 'Hierarchical planning',
    definition:
      'Planning at several levels: a high-level plan of subgoals first, each refined into concrete steps only when it is reached.',
  },
  replanning: {
    term: 'Replanning',
    definition:
      'Revising a plan during execution when a step fails or a result changes what is needed, instead of following the original plan regardless.',
  },
  scratchpad: {
    term: 'Scratchpad',
    definition:
      'A place outside the conversation, often a file, where an agent keeps its plan, progress and notes so they survive long runs and context resets.',
    topic: 'memory-and-rag',
  },
  checkpoint: {
    term: 'Checkpoint',
    definition:
      'A saved copy of an agent’s state (task, plan, progress, history) that lets a run resume after a crash, a pause or a context reset.',
  },
} satisfies Record<string, GlossaryEntry>
