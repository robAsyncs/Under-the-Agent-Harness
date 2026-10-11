import type { Topic } from '../../types'

export const evaluation: Topic = {
  id: 'evaluation',
  number: 10,
  title: 'Evaluation and Reliability',
  group: 'production',
  summary: 'Know whether your agent actually works, and make it better.',
  sections: [
    {
      title: 'Why evaluation is hard for agents',
      points: [
        'Many valid paths to the same answer',
        'Non-deterministic outputs',
      ],
    },
    {
      title: 'Building evaluations',
      points: [
        'Creating test datasets of tasks and expected outcomes',
        'Code-based checks vs. LLM-as-judge vs. human review',
        'Measuring success rate, steps taken, cost, and latency',
      ],
    },
    {
      title: 'Observability',
      points: [
        'Tracing every model call and tool call',
        'Tools like LangSmith, Langfuse, and Braintrust',
      ],
    },
    {
      title: 'Improving performance',
      points: [
        'Error analysis: reading failed traces',
        'Iterating on prompts and tool descriptions',
        'Model selection and routing for cost',
      ],
    },
    {
      title: 'Production concerns',
      points: [
        'Timeouts and retries',
        'Cost controls and budgets',
        'Caching',
        'Monitoring after deployment',
      ],
    },
  ],
  sources: [],
  project: 'Write a 20-case evaluation suite for one of your earlier agents, measure it, make three improvements, and measure again.',
}
