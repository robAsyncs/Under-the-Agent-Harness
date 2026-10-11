import type { GlossaryEntry } from './types'

/** Terms introduced in Topic 8. */
export const MULTI_AGENT_TERMS = {
  'orchestrator-worker': {
    term: 'Orchestrator-worker',
    definition:
      'An architecture where a lead agent splits a task, hands each part to a worker agent with its own fresh context, and combines their results.',
    topic: 'multi-agent',
  },
  subagent: {
    term: 'Subagent',
    definition:
      'An agent started by another agent to do one piece of work in its own context, returning only a short result.',
    topic: 'multi-agent',
  },
  handoff: {
    term: 'Handoff',
    definition:
      'Passing control of a conversation from one agent to another, more specialized one, along with the context it needs.',
    topic: 'multi-agent',
  },
  'context-isolation': {
    term: 'Context isolation',
    definition:
      'Giving each agent its own context window, so one agent’s search results and dead ends never crowd another’s.',
  },
  brief: {
    term: 'Brief',
    definition:
      'The task description an orchestrator writes for a worker. It is all the worker knows, so it must state the goal, output, tools and scope.',
  },
  blackboard: {
    term: 'Blackboard',
    definition:
      'A shared store that every agent reads from and writes to, instead of sending messages to each other directly.',
  },
  'multi-agent-debate': {
    term: 'Multi-agent debate',
    definition:
      'Several model instances answer the same question, read each other’s answers, and revise over a few rounds before settling.',
  },
  'effort-scaling': {
    term: 'Effort scaling',
    definition:
      'Rules that match the number of agents and tool calls to how hard the task is, so simple questions don’t start ten workers.',
  },
  a2a: {
    term: 'A2A',
    definition:
      'Agent2Agent, an open protocol for agents built by different teams or vendors to find each other, hand over tasks and return results.',
  },
} satisfies Record<string, GlossaryEntry>
