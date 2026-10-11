import { MultiAgentArticle } from '../../content/multi-agent/Article'
import type { Topic } from '../../types'

export const multiAgent: Topic = {
  id: 'multi-agent',
  number: 8,
  title: 'Multi-Agent Systems',
  group: 'advanced',
  summary: 'Split work across agents with their own contexts, and orchestrate them from the harness.',
  sections: [],
  article: MultiAgentArticle,
  sources: [
    { title: 'Anthropic, "How we built our multi-agent research system" (2025)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
    { title: 'Anthropic, "Building Effective Agents" (2024)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { title: 'Anthropic, "Effective context engineering for AI agents" (2025)', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
    { title: 'Cognition, "Don\'t Build Multi-Agents" (2025)', url: 'https://cognition.ai/blog/dont-build-multi-agents' },
    { title: 'Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (2025)', url: 'https://arxiv.org/abs/2503.13657' },
    { title: 'Du et al., "Improving Factuality and Reasoning in Language Models through Multiagent Debate" (2023)', url: 'https://arxiv.org/abs/2305.14325' },
    { title: 'Hong et al., "MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework" (2023)', url: 'https://arxiv.org/abs/2308.00352' },
    { title: 'Qian et al., "ChatDev: Communicative Agents for Software Development" (2023)', url: 'https://arxiv.org/abs/2307.07924' },
    { title: 'Erman et al., "The Hearsay-II Speech-Understanding System" (1980)', url: 'https://doi.org/10.1145/356810.356816' },
    { title: 'OpenAI Agents SDK, "Handoffs"', url: 'https://openai.github.io/openai-agents-python/handoffs/' },
    { title: 'Agent2Agent (A2A) Protocol', url: 'https://a2a-protocol.org/' },
  ],
  project: 'A research agent where an orchestrator splits a question into subtopics, sends worker agents to research each, and combines the findings into a report.',
  concepts: ['planning'],
}
