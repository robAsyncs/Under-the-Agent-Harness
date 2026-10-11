import type { GlossaryEntry } from './types'

/** Terms introduced in Topic 6. */
export const MEMORY_AND_RAG_TERMS = {
  'working-memory': {
    term: 'Working memory',
    definition:
      'What the agent is using right now: the context window, plus any scratchpad or to-do list it keeps for the current task.',
  },
  'long-term-memory': {
    term: 'Long-term memory',
    definition:
      'Facts, past events and learned procedures stored outside the model and the context window, and loaded back in when they are relevant.',
  },
  'durable-state': {
    term: 'Durable state',
    definition:
      'Anything the harness keeps outside the context window, so it survives compaction, a crash or a new session: transcripts, memory files, plans, databases.',
  },
  'memory-tool': {
    term: 'Memory tool',
    definition:
      'A tool the model calls to read and write its own notes, usually files in a memory directory. The harness decides where they are actually stored.',
  },
  'cosine-similarity': {
    term: 'Cosine similarity',
    definition:
      'How closely two vectors point the same way, from -1 to 1. For embeddings, a higher score means the texts are closer in meaning.',
  },
  'vector-database': {
    term: 'Vector database',
    definition:
      'A store for embeddings that finds the vectors nearest to a query quickly, usually with an approximate index such as HNSW.',
  },
  rag: {
    term: 'RAG',
    definition:
      'Retrieval-augmented generation: search a document collection for passages related to the question, put them in the prompt, and have the model answer from them.',
  },
  chunking: {
    term: 'Chunking',
    definition:
      'Splitting documents into passages small enough to embed and retrieve on their own, usually with some overlap between neighbors.',
  },
  reranking: {
    term: 'Reranking',
    definition:
      'A second, slower pass that scores each retrieved passage against the question directly and keeps only the best few.',
  },
  'hybrid-search': {
    term: 'Hybrid search',
    definition:
      'Running keyword search (such as BM25) and embedding search together and merging the two rankings, so exact terms and paraphrases both match.',
  },
  compaction: {
    term: 'Compaction',
    definition:
      'Replacing the older part of a long conversation with a summary, so the agent can keep working without hitting the context limit.',
  },
  'agentic-retrieval': {
    term: 'Agentic retrieval',
    definition:
      'Giving the agent search tools and letting it decide what to look up, how to phrase it, and when it has found enough.',
  },
} satisfies Record<string, GlossaryEntry>
