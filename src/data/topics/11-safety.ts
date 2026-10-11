import type { Topic } from '../../types'

export const safety: Topic = {
  id: 'safety',
  number: 11,
  title: 'Safety and Security',
  group: 'production',
  summary: 'Build agents that don\'t cause harm or get exploited.',
  sections: [
    {
      title: 'Prompt injection',
      points: [
        'Direct vs. indirect injection (hidden instructions in web pages, emails, files)',
        'Why it\'s an unsolved problem',
        'Mitigation strategies',
      ],
    },
    {
      title: 'Permissions and sandboxing',
      points: [
        'Principle of least privilege for tools',
        'Running code in isolated environments',
        'Read-only vs. write access',
      ],
    },
    {
      title: 'Guardrails',
      points: [
        'Input and output filtering',
        'Confirmations before irreversible actions',
        'Spending and rate limits',
      ],
    },
    {
      title: 'Data privacy',
      points: [
        'Handling sensitive user data',
        'What gets sent to model providers',
      ],
    },
    {
      title: 'Responsible deployment',
      points: [
        'Transparency with users',
        'Failure handling and graceful degradation',
      ],
    },
  ],
  sources: [],
  project: 'Try to break one of your own agents with prompt injection, then harden it.',
}
