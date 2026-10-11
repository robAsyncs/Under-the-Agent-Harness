import { ADVANCED_ARCHITECTURES_TERMS } from './advanced-architectures'
import { AGENT_LOOP_TERMS } from './agent-loop'
import { CORE_TERMS } from './core'
import { FRAMEWORKS_AND_PROTOCOLS_TERMS } from './frameworks-and-protocols'
import { HOW_LLMS_WORK_TERMS } from './how-llms-work'
import { LLM_APIS_TERMS } from './llm-apis'
import { MEMORY_AND_RAG_TERMS } from './memory-and-rag'
import { MULTI_AGENT_TERMS } from './multi-agent'
import { TOOL_USE_TERMS } from './tool-use'
import type { GlossaryEntry } from './types'

export type { GlossaryEntry } from './types'

/** Short definitions shown in popovers when a highlighted term is clicked. One file per topic. */
export const GLOSSARY = {
  ...CORE_TERMS,
  ...HOW_LLMS_WORK_TERMS,
  ...LLM_APIS_TERMS,
  ...TOOL_USE_TERMS,
  ...AGENT_LOOP_TERMS,
  ...MEMORY_AND_RAG_TERMS,
  ...ADVANCED_ARCHITECTURES_TERMS,
  ...MULTI_AGENT_TERMS,
  ...FRAMEWORKS_AND_PROTOCOLS_TERMS,
} satisfies Record<string, GlossaryEntry>

export type GlossaryId = keyof typeof GLOSSARY

/** Terms each topic introduces, by topic id. Used by topic search. */
export const TERMS_BY_TOPIC: Record<string, Record<string, GlossaryEntry>> = {
  'language-to-agents': CORE_TERMS,
  'how-llms-work': HOW_LLMS_WORK_TERMS,
  'llm-apis': LLM_APIS_TERMS,
  'tool-use': TOOL_USE_TERMS,
  'agent-loop': AGENT_LOOP_TERMS,
  'memory-and-rag': MEMORY_AND_RAG_TERMS,
  'advanced-architectures': ADVANCED_ARCHITECTURES_TERMS,
  'multi-agent': MULTI_AGENT_TERMS,
  'frameworks-and-protocols': FRAMEWORKS_AND_PROTOCOLS_TERMS,
}
