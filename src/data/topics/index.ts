import type { GroupId, Topic } from '../../types'
import { languageToAgents } from './01-language-to-agents'
import { howLlmsWork } from './02-how-llms-work'
import { llmApis } from './03-llm-apis'
import { toolUse } from './04-tool-use'
import { agentLoop } from './05-agent-loop'
import { memoryAndRag } from './06-memory-and-rag'
import { advancedArchitectures } from './07-advanced-architectures'
import { multiAgent } from './08-multi-agent'
import { frameworksAndProtocols } from './09-frameworks-and-protocols'
import { evaluation } from './10-evaluation'
import { safety } from './11-safety'
import { finalProject } from './11-final-project'

/** Display order. Each topic's write-up lives in its own file. */
export const TOPICS: Topic[] = [
  languageToAgents,
  howLlmsWork,
  llmApis,
  toolUse,
  agentLoop,
  memoryAndRag,
  advancedArchitectures,
  multiAgent,
  frameworksAndProtocols,
  evaluation,
  safety,
  finalProject,
]

export const GROUPS: { id: GroupId; title: string }[] = [
  { id: 'foundations', title: 'Foundations' },
  { id: 'agents', title: 'Building agents' },
  { id: 'advanced', title: 'Going further' },
  { id: 'production', title: 'Production' },
  { id: 'final', title: 'Final project' },
]

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<string, Topic>

export const topicsIn = (group: GroupId) => TOPICS.filter((t) => t.group === group)
