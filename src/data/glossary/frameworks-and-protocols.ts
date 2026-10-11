import type { GlossaryEntry } from './types'

/** Terms introduced in Topic 9. */
export const FRAMEWORKS_AND_PROTOCOLS_TERMS = {
  'agent-framework': {
    term: 'Agent framework',
    definition:
      'A library that provides the agent loop and the pieces around it (tool wiring, state, memory, tracing) so you configure an agent instead of writing the loop yourself.',
  },
  mcp: {
    term: 'Model Context Protocol (MCP)',
    definition:
      'An open protocol for connecting AI applications to tools and data. A server exposes tools, resources and prompts once, and any MCP-compatible app can use them.',
  },
  'mcp-host': {
    term: 'MCP host, client and server',
    definition:
      'The host is the AI application. It runs one client per connection, and each client talks to one server, the program that provides the tools or data.',
  },
  'json-rpc': {
    term: 'JSON-RPC',
    definition:
      'A simple format for remote procedure calls: a JSON request with a method name, parameters and an id, answered by a JSON response with the same id. MCP uses version 2.0.',
  },
  'mcp-resource': {
    term: 'Resource (MCP)',
    definition:
      'Read-only data a server makes available by URI, such as a file or a database record, which the host can add to the model’s context. Unlike a tool, it is chosen by the app or user rather than called by the model.',
  },
  hook: {
    term: 'Hook',
    definition:
      'Your own code that the harness runs automatically at a fixed point, such as before every tool call or when the agent tries to stop. It can allow, block or change what happens.',
  },
  sandbox: {
    term: 'Sandbox',
    definition:
      'An environment, enforced by the operating system, that limits what code can reach: which files it can read or write and which network hosts it can contact.',
    topic: 'safety',
  },
  'claude-md': {
    term: 'CLAUDE.md',
    definition:
      'A Markdown file in a project that Claude Code loads at the start of every session: build commands, conventions and anything else the agent should always know.',
  },
  'computer-use': {
    term: 'Computer use',
    definition:
      'A tool that lets a model operate a desktop: it sees screenshots and asks for mouse clicks and key presses, which your code carries out.',
  },
  'accessibility-tree': {
    term: 'Accessibility tree',
    definition:
      'The structured description of a page or app that browsers and operating systems build for screen readers: each element’s role, name and state. Agents can read it instead of pixels.',
  },
} satisfies Record<string, GlossaryEntry>
