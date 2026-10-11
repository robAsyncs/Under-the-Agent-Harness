import { AdvancedArchitecturesArticle } from '../../content/advanced-architectures/Article'
import type { Topic } from '../../types'

export const advancedArchitectures: Topic = {
  id: 'advanced-architectures',
  number: 7,
  title: 'Advanced Agent Architectures',
  group: 'advanced',
  summary: 'Handle complex, long-running, multi-part tasks.',
  sections: [],
  article: AdvancedArchitecturesArticle,
  sources: [
    { title: 'Fikes & Nilsson, "STRIPS: A New Approach to the Application of Theorem Proving to Problem Solving" (1971)', url: 'https://doi.org/10.1016/0004-3702(71)90010-5' },
    { title: 'Blum & Furst, "Fast Planning Through Planning Graph Analysis" (1997)', url: 'https://doi.org/10.1016/S0004-3702(96)00047-1' },
    { title: 'Yao et al., "Tree of Thoughts: Deliberate Problem Solving with Large Language Models" (2023)', url: 'https://arxiv.org/abs/2305.10601' },
    { title: 'Hao et al., "Reasoning with Language Model is Planning with World Model" (2023)', url: 'https://arxiv.org/abs/2305.14992' },
    { title: 'Zhou et al., "Language Agent Tree Search" (2023)', url: 'https://arxiv.org/abs/2310.04406' },
    { title: 'Wang et al., "Plan-and-Solve Prompting" (2023)', url: 'https://arxiv.org/abs/2305.04091' },
    { title: 'Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (2023)', url: 'https://arxiv.org/abs/2304.03442' },
    { title: 'Wang et al., "Voyager: An Open-Ended Embodied Agent with Large Language Models" (2023)', url: 'https://arxiv.org/abs/2305.16291' },
    { title: 'Anthropic, "Building Effective Agents" (2024)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { title: 'Hart, Nilsson & Raphael, "A Formal Basis for the Heuristic Determination of Minimum Cost Paths" (1968)', url: 'https://doi.org/10.1109/TSSC.1968.300136' },
    { title: 'Anthropic, "How we built our multi-agent research system" (2025)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
    { title: 'Anthropic, "Effective harnesses for long-running agents" (2025)', url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents' },
    { title: 'METR, "Measuring AI Ability to Complete Long Tasks" (2025)', url: 'https://arxiv.org/abs/2503.14499' },
  ],
  project: 'A long-running agent that keeps its plan in a file, checkpoints after every step, resumes after a crash, and asks for approval before risky actions.',
  scenarios: ['trip'],
  concepts: ['planning'],
}
