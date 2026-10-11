import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import { Code } from '../llm-apis/Code'
import '../agent-loop/agent-loop.css'
import '../llm-apis/llm-apis.css'
import '../how-llms-work/how-llms-work.css'
import './memory-and-rag.css'
import { ChunkDemo } from './ChunkDemo'
import { MemoryTiers, RagPipeline, StateTable } from './Diagrams'
import { SimilarityDemo } from './SimilarityDemo'
import { SurvivalDemo } from './SurvivalDemo'

const MEMORY_FILE = `
from pathlib import Path

MEMORY = Path("memory/MEMORY.md")

def build_system():
    """Run at the start of every session: durable notes go into the system prompt."""
    notes = MEMORY.read_text() if MEMORY.exists() else "(nothing saved yet)"
    return f"{BASE_SYSTEM}\\n\\n<memory>\\n{notes}\\n</memory>"

REMEMBER = {
    "name": "remember",
    "description": "Save one fact for future sessions: a user preference, a decision, or a "
                   "correction that will still matter next time. Not for details of the current task, "
                   "and never for secrets.",
    "input_schema": {
        "type": "object",
        "properties": {"fact": {"type": "string", "description": "One short, self-contained sentence."}},
        "required": ["fact"],
    },
}

def remember(fact):
    MEMORY.parent.mkdir(exist_ok=True)
    with MEMORY.open("a") as f:
        f.write(f"- {fact}\\n")
    return "Saved. It will be in your memory at the start of the next session."
`

const EMBED = `
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")  # small, free, runs locally; 384 dimensions

passages = ["Items can be returned within 30 days of delivery.",
            "Full-time staff get 25 vacation days a year."]
question = "Can I send back a jacket I bought last week?"

p = model.encode(passages, normalize_embeddings=True)
q = model.encode(question, normalize_embeddings=True)
print(p @ q)  # cosine similarity, since the vectors are normalized: the first score is much higher
`

const RAG = `
from pathlib import Path
import anthropic, chromadb
from pypdf import PdfReader

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"
# A local, persistent index. Chroma embeds text with a small local model unless you give it another.
docs = chromadb.PersistentClient(path="index").get_or_create_collection("docs")

SYSTEM = (
    "Answer using only the documents provided. Cite every claim as [file, page]. "
    "If the documents don't contain the answer, say so instead of guessing."
)


def chunk(text, size=1200, overlap=200):
    """Fixed-size character chunks that overlap, so a sentence on a boundary appears whole in one of them."""
    step = size - overlap
    return [text[i:i + size] for i in range(0, max(len(text) - overlap, 1), step)]


def index_folder(folder):
    for pdf in Path(folder).glob("*.pdf"):
        for page_no, page in enumerate(PdfReader(pdf).pages, start=1):
            text = page.extract_text() or ""
            if not text.strip():
                continue  # scanned pages have no text layer; they need OCR first
            pieces = chunk(text)
            docs.upsert(  # upsert, so re-indexing a changed file replaces its old chunks
                ids=[f"{pdf.name}:{page_no}:{i}" for i in range(len(pieces))],
                documents=pieces,
                metadatas=[{"file": pdf.name, "page": page_no}] * len(pieces),
            )


def ask(question, k=6):
    hits = docs.query(query_texts=[question], n_results=k)
    context = "\\n".join(
        f'<doc file="{m["file"]}" page="{m["page"]}">\\n{text}\\n</doc>'
        for text, m in zip(hits["documents"][0], hits["metadatas"][0])
    )
    response = client.messages.create(
        model=MODEL, max_tokens=2000, system=SYSTEM,
        messages=[{"role": "user", "content": f"<documents>\\n{context}\\n</documents>\\n\\n{question}"}],
    )
    return response.content[0].text
`

const RRF = `
from collections import defaultdict

def reciprocal_rank_fusion(*rankings, k=60):
    """Merge ranked lists of ids. Rank, not raw score, so BM25 and cosine scores needn't be comparable."""
    scores = defaultdict(float)
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] += 1 / (k + rank)
    return sorted(scores, key=scores.get, reverse=True)

ids = reciprocal_rank_fusion(bm25_search(question, 20), vector_search(question, 20))[:6]
`

const COMPACT = `
import json

SUMMARY_PROMPT = (
    "Summarize this conversation for whoever continues the task. Keep: the goal, decisions and why, "
    "facts found with their sources, what is done, what is next, and anything the user asked for. "
    "Drop tool output that has already been used."
)

def compact(messages, keep_last=8):
    """Replace everything before the last few turns with a summary."""
    cut = len(messages) - keep_last
    # Start the kept part at an assistant turn, so every tool_result still follows its tool_use.
    while cut > 0 and messages[cut]["role"] != "assistant":
        cut -= 1
    if cut <= 0:
        return messages
    transcript = json.dumps(messages[:cut], default=str)
    summary = client.messages.create(
        model=MODEL, max_tokens=4000, system=SUMMARY_PROMPT,
        messages=[{"role": "user", "content": f"<transcript>\\n{transcript}\\n</transcript>"}],
    ).content[0].text
    return [{"role": "user", "content": f"<summary>\\n{summary}\\n</summary>\\nContinue the task."},
            *messages[cut:]]
`

export function MemoryAndRagArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          The model remembers nothing between calls. Everything that feels like memory, from the last message in a
          chat to a preference saved months ago, is the harness choosing what to put into the context window this
          time. This topic is about that choice: what to keep, where to keep it so it survives, and how to find the
          right piece of a large collection when the question arrives.
        </p>
        <Figure caption="Three kinds of memory, from what the model sees right now to what is kept for later.">
          <MemoryTiers />
        </Figure>
      </section>

      <ArticleSection n={1} title="Types of memory">
        <p>
          Topic 1 showed that the model is <Term id="stateless">stateless</Term>: each request has to carry the whole
          conversation. Within that limit, it helps to sort what an agent remembers by how long it needs to last.
        </p>
        <p>
          <strong>Short-term memory</strong> is the <Term id="context-window">context window</Term> itself: the
          system prompt, the conversation and every tool result so far. It is the only memory the model reads
          directly, and it is limited, expensive (every call resends it) and unreliable at the edges, since facts
          buried in the middle of a long context get less attention (Topic 2’s{' '}
          <Term id="lost-in-the-middle">lost in the middle</Term>).
        </p>
        <p>
          <Term id="working-memory">Working memory</Term> is what the agent keeps for the task in hand: a{' '}
          <Term id="scratchpad">scratchpad</Term>, a plan file or a to-do list. Topic 7 showed why plans belong in a
          file. The context can be summarized or reset, and the file is still there.
        </p>
        <p>
          <Term id="long-term-memory">Long-term memory</Term> outlasts the task. The CoALA framework (Sumers et al.,
          2023) borrows three kinds from cognitive science. <em>Semantic</em> memory holds facts (“the user prefers
          metric units”, a company handbook). <em>Episodic</em> memory holds past experiences (“last time, the deploy
          failed because the migration ran first”). <em>Procedural</em> memory holds how to do things, which for an
          agent means its prompts, its tools and saved skills such as Voyager’s library of working code from Topic 7.
        </p>
        <p>
          MemGPT (Packer et al., 2023) made the link to operating systems explicit. The context window is like RAM:
          small and fast. Everything else is like disk: large, slow to search, and only useful once something has
          been paged back in. The agent manages the paging itself, with tools to save, search and recall. That
          picture is a good one to keep in mind for the rest of this page.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="Durable state in the harness">
        <p>
          Anything that should outlast the context window has to be <Term id="durable-state">durable state</Term>:
          stored outside the model, in places the harness controls, and loaded back in when it is needed. There is no
          single place for it. A real harness uses several stores, each written by someone different and brought back
          into context in a different way:
        </p>
        <Figure>
          <StateTable />
        </Figure>
        <p>
          “Durable” always means durable against something. A local file survives compaction and a crash but not a
          move to a fresh machine. A variable in the harness process survives compaction but not a crash. Try each
          event below and see which stores come through it:
        </p>
        <Figure>
          <SurvivalDemo />
        </Figure>

        <h3 className="mem-h3">Where it hooks into the loop</h3>
        <p>The agent loop from Topic 5 has four natural places to read and write durable state:</p>
        <ul className="agl-stops">
          <li>
            <strong>Session start.</strong> Build the system prompt from memory files, the task list and a summary of
            earlier work, so the first call already knows what matters.
          </li>
          <li>
            <strong>Each tool call.</strong> Writes happen as side effects of tools: a file edit, a database insert, a
            call to a <Term id="memory-tool">memory tool</Term>.
          </li>
          <li>
            <strong>End of each turn.</strong> Save the transcript, write a <Term id="checkpoint">checkpoint</Term>,
            commit, update the progress file. A <Term id="hook">hook</Term> (Topic 9) can do this every time,
            whether the model remembers to or not.
          </li>
          <li>
            <strong>Before compaction.</strong> Whatever is not in the summary or in a file is gone afterwards, so this
            is the last chance to save it.
          </li>
        </ul>

        <h3 className="mem-h3">Who decides what to remember</h3>
        <p>
          There are two ways to fill a memory, and most harnesses use both. The harness can save things{' '}
          <strong>deterministically</strong>: every transcript, every checkpoint, the instruction files a person
          wrote. Or the <strong>model decides</strong>, through a tool: it notices a preference or a correction and
          saves it. Only the model knows that “use the staging database, not prod” is worth keeping, and only the
          harness can promise the transcript is saved. Here is the simplest version of both, a file loaded at session
          start and a tool for adding to it:
        </p>
        <Figure>
          <Code title="memory.py" lang="python" code={MEMORY_FILE} />
        </Figure>
        <p>
          Claude Code works this way: a <Term id="claude-md">CLAUDE.md</Term> file and a memory directory are loaded
          when a session starts, and the agent can add to them as it works. Anthropic’s API also offers a memory tool
          that follows the same pattern with more commands: the model views, creates and edits files in a{' '}
          <code>/memories</code> directory, and your code decides where those files actually live. Paired with
          clearing old tool results from the context, Anthropic reported a 39% improvement on an internal agentic
          search evaluation.
        </p>
        <p>
          Memory brings its own failure modes. Notes go stale (“the API is on v2” after v3 ships), and a wrong note
          is worse than none, because the agent trusts it in every future session. Text the agent read on a web page
          can try to get itself saved, which turns a one-off prompt injection into a permanent one (Topic 11). And
          memory is user data. Keep it short and specific, date it or tie it to a source, let people see and delete
          it, and don’t save what can be looked up again.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Embeddings">
        <p>
          Memory files work while they are small enough to load whole. A folder of manuals, a year of support
          tickets or a codebase is not. For those, the harness has to <em>find</em> the few passages that matter to
          the current question, and the standard tool for that is an <Term id="embedding">embedding</Term>: a list of
          numbers that represents what a piece of text means.
        </p>
        <p>
          An embedding model turns any text into a vector of fixed length, typically a few hundred to a few thousand
          numbers. It is trained so that texts with similar meanings get vectors that point in similar directions,
          even when they share no words. Closeness is measured with{' '}
          <Term id="cosine-similarity">cosine similarity</Term>, the cosine of the angle between two vectors: 1 for
          the same direction, 0 for unrelated, negative for opposite. Pick a question below and see which handbook
          passages it lands closest to:
        </p>
        <Figure>
          <SimilarityDemo />
        </Figure>
        <p>
          That is the whole idea behind semantic search: embed every passage once, embed the question when it
          arrives, and return the passages with the highest scores. In code, with a small open model:
        </p>
        <Figure>
          <Code title="embed.py" lang="python" code={EMBED} />
        </Figure>
        <p>
          Sentence-BERT (Reimers and Gurevych, 2019) made this practical by training models to produce one vector per
          sentence that can be compared directly. Choosing a model today comes down to a few questions. How well does
          it do on retrieval for text like yours (the MTEB leaderboard is a starting point, but test on your own
          questions)? Does it handle your languages and, for code, your programming languages? How long a passage
          can it embed, and how many dimensions does it produce, which sets storage cost? And can it run locally, or
          does every document go to an API? Anthropic doesn’t offer an embedding model and points to Voyage AI; open
          models such as the one above are fine for learning and for many real projects.
        </p>
        <p>
          One rule never changes: the question and the documents must be embedded with the same model. Vectors from
          different models live in different spaces, and comparing them gives meaningless scores.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Vector databases">
        <p>
          A few thousand vectors can be searched by comparing the question with every one of them. Millions cannot,
          at least not quickly. A <Term id="vector-database">vector database</Term> stores embeddings alongside
          their text and metadata, and builds an index that finds the nearest vectors without checking them all.
        </p>
        <p>
          The most common index is HNSW (Malkov and Yashunin, 2016), a layered graph that links each vector to its
          near neighbors. A search starts on a sparse top layer, jumps toward the query, and drops to denser layers
          for the final steps, a little like taking a highway and then side streets. It is{' '}
          <em>approximate</em>: it can occasionally miss a true nearest neighbor, in exchange for answering in
          milliseconds. Most databases let you trade some speed for accuracy with a setting.
        </p>
        <div className="llm-table-wrap">
          <table className="llm-table mem-table">
            <thead>
              <tr>
                <th>Option</th>
                <th>What it is</th>
                <th>Good for</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chroma</td>
                <td>Open source, runs in your Python process or as a server</td>
                <td>Learning and prototypes; embeds text for you</td>
              </tr>
              <tr>
                <td>pgvector</td>
                <td>A Postgres extension that adds a vector column and indexes</td>
                <td>Apps that already use Postgres; vectors next to the rest of your data</td>
              </tr>
              <tr>
                <td>Qdrant</td>
                <td>Open-source vector database, self-hosted or managed</td>
                <td>Larger collections with heavy filtering on metadata</td>
              </tr>
              <tr>
                <td>Pinecone</td>
                <td>Fully managed cloud service</td>
                <td>Production without running any database yourself</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          They all do the same three things. <strong>Store</strong> each chunk with an id, its vector, its text and
          metadata such as file name, page and date. <strong>Index</strong> the vectors, which happens automatically
          as you add them. <strong>Query</strong> with a vector and a number of results, usually with a filter on the
          metadata (“only documents from 2025”, “only this customer’s files”). Filters matter more than they look:
          they are how you stop one user’s question from retrieving another user’s documents.
        </p>
        <p>
          For a first project, the choice barely matters. Start with Chroma or pgvector, and move only when you can
          name the problem the move solves.
        </p>
      </ArticleSection>

      <ArticleSection n={5} title="Building a RAG pipeline">
        <p>
          <Term id="rag">Retrieval-augmented generation</Term> puts these pieces together. The name comes from Lewis
          et al. (2020), who paired a retriever over Wikipedia with a generator model, and found its answers were more
          specific and more factual than the generator’s alone. The pattern has two halves: indexing, done once
          ahead of time, and the steps that run for every question.
        </p>
        <Figure>
          <RagPipeline />
        </Figure>
        <p>
          <strong>Loading</strong> turns files into plain text with useful metadata. It is unglamorous and decides a
          lot: a PDF parser that scrambles table columns or drops headings will hurt answers more than any choice of
          model.
        </p>
        <p>
          <Term id="chunking">Chunking</Term> splits that text into passages small enough to retrieve on their own.
          Size is a trade-off. A small chunk matches a question precisely but may hold only half the answer; a large
          one keeps the answer whole but its embedding averages over several topics and it costs more tokens in the
          prompt. Overlapping neighbors protects sentences that fall on a boundary. Try it:
        </p>
        <Figure>
          <ChunkDemo />
        </Figure>
        <p>
          Fixed-size chunks with overlap are a fine start. Better splitters cut at natural boundaries, such as
          headings, paragraphs and functions in code. <em>Semantic chunking</em> goes further, embedding sentence by
          sentence and starting a new chunk where the meaning shifts. Anthropic’s{' '}
          <strong>contextual retrieval</strong> fixes a different problem: a chunk such as “Revenue grew 3% over the
          previous quarter” doesn’t say which company or quarter. Before indexing, a model writes a sentence or two
          placing each chunk in its document, and that context is embedded with it. In their tests this cut failed
          retrievals by 35%, by 49% combined with keyword search, and by 67% with reranking added.
        </p>
        <p>
          <strong>Retrieval and reranking.</strong> Embedding search is fast but coarse: the question and each chunk
          were embedded separately, without seeing each other. So a common pattern retrieves generously, say the top
          20 to 50, then uses a <Term id="reranking">reranker</Term>, a model that reads the question and each chunk
          together and scores how well the chunk answers it, and keeps only the best few for the prompt.
        </p>
        <p>
          <strong>Injecting the context.</strong> Put the chunks in the prompt with clear boundaries and their
          source, using the <Term id="xml-tags">XML tags</Term> from Topic 3. Tell the model to answer only from them,
          to cite sources, and to say when the answer isn’t there. That last instruction is what turns RAG from a way
          to add knowledge into a defense against <Term id="hallucination">hallucination</Term>. Here is the core of
          the milestone project, a document Q&amp;A tool with citations:
        </p>
        <Figure>
          <Code title="rag.py" lang="python" code={RAG} />
        </Figure>
        <p>
          <Term id="hybrid-search">Hybrid search</Term> covers what embeddings miss. Embeddings are good at
          paraphrases but weak on exact strings: a product code, an error message, a rare name. Keyword search, such
          as the classic BM25 ranking, is the opposite. Run both and merge the two rankings. Reciprocal rank fusion
          (Cormack et al., 2009) is the usual way, because it only uses each result’s rank, so the two kinds of scores
          never have to be compared:
        </p>
        <Figure>
          <Code title="hybrid search" lang="python" code={RRF} />
        </Figure>
        <p>
          Finally, measure it. Write twenty or so real questions with the passages that answer them, and check how
          often those passages make the top results. Most RAG failures are retrieval failures, and you can’t see them
          by reading the final answers alone. Topic 10 turns this into a proper evaluation.
        </p>
      </ArticleSection>

      <ArticleSection n={6} title="Context management">
        <p>
          The last kind of memory work is inside the context window itself. Topic 5 showed the history growing with
          every iteration. On a long task it eventually reaches the limit, and well before that it gets slow,
          expensive and harder for the model to use. Anthropic calls the discipline context engineering: keeping the
          smallest set of high-signal tokens that lets the model do the next step well.
        </p>
        <p>
          <strong>Keep, compress or drop.</strong> Different parts of the history deserve different treatment. Keep
          the task, the user’s instructions and corrections, and recent turns verbatim. Compress old reasoning and
          finished subtasks into a summary. Drop tool results that have already been used, such as a 5,000-token web
          page whose one useful fact is now in the agent’s notes. Clearing old tool results is the safest place to
          start, because the agent can always call the tool again.
        </p>
        <p>
          <strong>Summarize old history.</strong> <Term id="compaction">Compaction</Term> replaces the older part of
          the conversation with a summary written by the model. The summary prompt decides what survives, so it
          should name what to keep. The other subtle part is where to cut: a tool result must stay next to the tool
          call it answers.
        </p>
        <Figure>
          <Code title="compaction" lang="python" code={COMPACT} />
        </Figure>
        <p>
          Compaction loses detail every time it runs, which is why it works best alongside the durable state from
          Section 2. The plan, the progress notes and the saved facts live in files, so the summary only has to
          bridge to them.
        </p>
        <p>
          <strong>Agentic retrieval.</strong> The RAG pipeline above retrieves once, with the user’s exact words,
          whether or not that helps. <Term id="agentic-retrieval">Agentic retrieval</Term> turns retrieval into a
          tool: <code>search_docs(query)</code>, <code>read_file(path)</code>, <code>grep(pattern)</code>. The agent
          decides when to search, rewrites vague questions into good queries, searches again when the first results
          fall short, and stops when it has enough. It costs more model calls, and it is far better on questions that
          need several hops (“which of our suppliers was affected by the change in last month’s policy?”). Coding
          agents such as Claude Code lean on this heavily, searching the codebase with file and text search tools
          instead of relying on a pre-built index, and loading files only when they are needed. Instead of guessing
          up front what belongs in the context, the agent fetches it just in time.
        </p>
        <Callout label="Checkpoint: where should an agent’s memory live?">
          <p>
            Not in the model, which keeps nothing, and not only in the context window, which is small, gets compacted
            and starts empty every session. The context is working space. Anything that must last goes into durable
            state the harness controls (files, a transcript, a database, an index) and is loaded back in on purpose:
            at session start, through retrieval, or when the agent asks for it. Choosing what to keep, where, and when
            to bring it back is most of what “memory” means for an agent.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
