import { MemoryAndRagArticle } from '../../content/memory-and-rag/Article'
import type { Topic } from '../../types'

export const memoryAndRag: Topic = {
  id: 'memory-and-rag',
  number: 6,
  title: 'Memory and Retrieval (RAG)',
  group: 'agents',
  summary: 'Give agents access to more knowledge than fits in the context window.',
  sections: [],
  article: MemoryAndRagArticle,
  sources: [
    { title: 'Sumers et al., "Cognitive Architectures for Language Agents" (2023)', url: 'https://arxiv.org/abs/2309.02427' },
    { title: 'Packer et al., "MemGPT: Towards LLMs as Operating Systems" (2023)', url: 'https://arxiv.org/abs/2310.08560' },
    { title: 'Anthropic, "Memory tool"', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool' },
    { title: 'Anthropic, "Managing context on the Claude Developer Platform" (2025)', url: 'https://www.anthropic.com/news/context-management' },
    { title: 'Anthropic, "Effective context engineering for AI agents" (2025)', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
    { title: 'Anthropic, "Effective harnesses for long-running agents" (2025)', url: 'https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents' },
    { title: 'Reimers & Gurevych, "Sentence-BERT" (2019)', url: 'https://arxiv.org/abs/1908.10084' },
    { title: 'Muennighoff et al., "MTEB: Massive Text Embedding Benchmark" (2022)', url: 'https://arxiv.org/abs/2210.07316' },
    { title: 'Malkov & Yashunin, "Efficient and robust approximate nearest neighbor search using HNSW graphs" (2016)', url: 'https://arxiv.org/abs/1603.09320' },
    { title: 'Chroma documentation', url: 'https://docs.trychroma.com/' },
    { title: 'pgvector', url: 'https://github.com/pgvector/pgvector' },
    { title: 'Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (2020)', url: 'https://arxiv.org/abs/2005.11401' },
    { title: 'Anthropic, "Introducing Contextual Retrieval" (2024)', url: 'https://www.anthropic.com/news/contextual-retrieval' },
    { title: 'Robertson & Zaragoza, "The Probabilistic Relevance Framework: BM25 and Beyond" (2009)', url: 'https://doi.org/10.1561/1500000019' },
    { title: 'Cormack, Clarke & Büttcher, "Reciprocal Rank Fusion" (2009)', url: 'https://doi.org/10.1145/1571941.1572114' },
    { title: 'Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (2023)', url: 'https://arxiv.org/abs/2307.03172' },
  ],
  project: 'A "chat with your documents" app that answers questions about a folder of PDFs and cites its sources.',
  scenarios: ['research', 'trip'],
  concepts: ['memory_read', 'memory_write', 'retrieval', 'context_management'],
}
