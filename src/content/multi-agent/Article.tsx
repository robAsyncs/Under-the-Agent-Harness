import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import '../agent-loop/agent-loop.css'
import { Code } from '../llm-apis/Code'
import '../llm-apis/llm-apis.css'
import '../how-llms-work/how-llms-work.css'
import './multi-agent.css'
import { ArchitectureTabs } from './ArchitectureTabs'
import { BriefDemo } from './BriefDemo'
import { FailureTable, TraceTree } from './Diagrams'
import { MultiAgentDemo } from './MultiAgentDemo'

const ORCHESTRATOR = `
from concurrent.futures import ThreadPoolExecutor
import anthropic
from pydantic import BaseModel, Field
from agent import run_agent  # Topic 5's loop: web search + calculator

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"


class Subtopic(BaseModel):
    title: str
    brief: str = Field(description="What to find out, which sources to prefer, and what is "
                                   "out of scope because another subtopic covers it.")

class Plan(BaseModel):
    subtopics: list[Subtopic]


def plan(question):
    # Structured outputs (Topic 3): the reply is guaranteed to parse as a Plan.
    response = client.messages.parse(
        model=MODEL, max_tokens=16000, output_format=Plan,
        messages=[{"role": "user", "content": "Split this research question into 2-5 "
                   f"independent subtopics, each with a self-contained brief:\\n{question}"}],
    )
    return response.parsed_output.subtopics


def research(sub):
    # The worker sees only this brief, never the orchestrator's conversation.
    task = (f"Research this subtopic: {sub.title}\\n{sub.brief}\\n\\n"
            "Reply with at most 300 words of findings, each with its source URL, "
            "and a line saying what you could not confirm.")
    return f"## {sub.title}\\n{run_agent(task)}"


def write_report(question, findings):
    response = client.messages.create(
        model=MODEL, max_tokens=16000,
        messages=[{"role": "user", "content":
                   f"Question: {question}\\n\\nFindings from researchers:\\n\\n" + "\\n\\n".join(findings) +
                   "\\n\\nWrite a report that answers the question. Keep every source; "
                   "point out where the findings disagree or leave gaps."}],
    )
    return "".join(b.text for b in response.content if b.type == "text")


def run(question):
    subtopics = plan(question)
    with ThreadPoolExecutor(max_workers=len(subtopics)) as pool:
        findings = list(pool.map(research, subtopics))  # the workers run at the same time
    return write_report(question, findings)


if __name__ == "__main__":
    print(run(input("Research question: ")))
`

const SPAWN = `
import threading
from concurrent.futures import ThreadPoolExecutor
from agent import run_agent  # Topic 5's loop: web search + calculator, but no spawn_worker

MAX_WORKERS = 8
spawned = 0
lock = threading.Lock()

SPAWN_WORKER = {
    "name": "spawn_worker",
    "description": (
        "Start a research worker with its own fresh context. It sees only the brief, so include the "
        "objective, the answer format, sources to prefer, and what is out of scope because another "
        "worker covers it. Use 1 worker for a simple fact, 2-4 for a comparison, more only for broad "
        "research. Call it several times in one turn to run workers in parallel."
    ),
    "input_schema": {
        "type": "object",
        "properties": {"brief": {"type": "string", "description": "A complete, self-contained brief."}},
        "required": ["brief"],
    },
}


def spawn_worker(brief):
    global spawned
    with lock:  # workers start in parallel threads, so count them safely
        if spawned >= MAX_WORKERS:
            raise RuntimeError(f"Worker limit ({MAX_WORKERS}) reached. Write the answer with what you have.")
        spawned += 1
    # Workers can't spawn workers: no recursion, so the tree is at most two levels deep.
    return run_agent(brief + "\\n\\nReply with at most 300 words of findings, each with its source URL.")


def run_tools(blocks):
    # The orchestrator's loop runs tool calls from one turn together, so workers run at the same time.
    # run_tool is Topic 5's: an exception becomes an is_error result the orchestrator can read.
    with ThreadPoolExecutor() as pool:
        return list(pool.map(run_tool, blocks))
`

const HANDOFF = `
TRANSFER = {
    "name": "transfer_to",
    "description": "Hand the conversation to another agent when the request is outside your job. "
                   "The other agent sees the whole conversation, so don't repeat it.",
    "input_schema": {
        "type": "object",
        "properties": {"agent": {"type": "string", "enum": ["triage", "billing", "tech"]},
                       "reason": {"type": "string"}},
        "required": ["agent", "reason"],
    },
}
ALL_TOOLS = [TRANSFER, LOOKUP_INVOICE, ISSUE_REFUND, SEARCH_DOCS]

AGENTS = {
    "triage":  {"system": TRIAGE_PROMPT,  "allowed": {"transfer_to"}},
    "billing": {"system": BILLING_PROMPT, "allowed": {"transfer_to", "lookup_invoice", "issue_refund"}},
    "tech":    {"system": TECH_PROMPT,    "allowed": {"transfer_to", "search_docs"}},
}


def tool_result(block, text, is_error=False):
    return {"type": "tool_result", "tool_use_id": block.id, "content": text, "is_error": is_error}


def handle(block, state):
    agent = state["agent"]
    if block.name not in AGENTS[agent]["allowed"]:  # enforced here, whatever the prompt says
        return tool_result(block, f"{block.name} isn't available to the {agent} agent. Transfer instead.",
                           is_error=True)
    if block.name == "transfer_to":
        state["agent"] = block.input["agent"]  # same history; the next call uses the new prompt
        return tool_result(block, f"Transferred to {block.input['agent']}.")
    return run_tool(block)


def turn(state, messages):
    while True:
        response = client.messages.create(
            model=MODEL, max_tokens=4000, system=AGENTS[state["agent"]]["system"],
            tools=ALL_TOOLS, messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})
        if response.stop_reason != "tool_use":
            return response
        results = [handle(b, state) for b in response.content if b.type == "tool_use"]
        messages.append({"role": "user", "content": results})
`

export function MultiAgentArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          A multi-agent system sounds like a team of minds working together. In code it is less mysterious: several
          copies of the Topic 5 loop, each with its own context window and prompt, and some harness code deciding
          which one runs and what each gets to see. The interesting questions are when that is worth the extra cost,
          how the agents should pass work between them, and who is in charge of the whole run.
        </p>
      </section>

      <ArticleSection n={1} title="Why use more than one agent">
        <p>
          There are three honest reasons to split work across agents, and “more intelligence” is not one of them.
        </p>
        <p>
          <strong>Context isolation.</strong> A single agent keeps every search result, file and dead end in one
          history. With <Term id="context-isolation">context isolation</Term>, each{' '}
          <Term id="subagent">subagent</Term> explores in its own fresh context and returns only a short result, so
          no context has to hold the whole task. This is the main benefit, and it is the same idea as Topic 6’s
          context management, taken one step further.
        </p>
        <p>
          <strong>Parallelism.</strong> Independent pieces can run at the same time. Anthropic’s research system runs
          its workers in parallel, and has each worker make several tool calls in parallel too. Together these cut
          research time by up to 90% on complex questions.
        </p>
        <p>
          <strong>Specialization.</strong> Each agent can have its own system prompt, tools, permissions and model: a
          search agent with read-only access, a billing agent that alone can issue refunds, a cheap fast model for
          simple lookups. Fewer tools per agent also means fewer ways to pick the wrong one.
        </p>
        <Figure>
          <MultiAgentDemo />
        </Figure>
        <p>
          The price is tokens. In Anthropic’s write-up, a single agent used about 4 times the tokens of a chat, and
          their multi-agent system about 15 times. It also performed much better: a Claude Opus 4 lead agent with
          Claude Sonnet 4 workers beat a single Opus 4 agent by 90.2% on their internal research evaluation. On the
          BrowseComp benchmark, how many tokens a run used explained 80% of the difference in performance. A good part
          of what multiple agents buy is the ability to spend more tokens on a problem without one context filling up,
          so they make sense when the task is valuable enough to pay for that.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="Architectures">
        <p>
          Most multi-agent systems are built from a handful of shapes. They differ mainly in one question: who
          decides what happens next?
        </p>
        <Figure>
          <ArchitectureTabs />
        </Figure>
        <p>
          The <Term id="orchestrator-worker">orchestrator-worker</Term> pattern, which Topic 7 introduced, is the
          most widely used for agents doing open-ended work, and the rest of this page uses it as the main example.
          In a <Term id="handoff">handoff</Term>, by contrast, there is no boss: one agent passes the conversation
          itself to a specialist, as when a front-desk agent hands a customer to billing. A <strong>pipeline</strong>{' '}
          gives each step of a fixed chain a role. MetaGPT (Hong et al., 2023) and ChatDev (Qian et al., 2023) both
          simulate a software company this way, passing requirements, designs and code from one role to the next.
          It is Topic 7’s prompt chaining with job titles.
        </p>
        <p>
          <Term id="multi-agent-debate">Debate</Term> uses several agents for checking rather than splitting. In Du et
          al. (2023), several model instances answer the same question, read each other’s answers and revise them
          over a few rounds. That improved accuracy on arithmetic and math word problems and reduced made-up facts in
          biographies, compared with a single model answering alone. The <Term id="blackboard">blackboard</Term> is the
          oldest design here, from speech recognition systems such as Hearsay-II in the 1970s. Agents never talk to
          each other directly; they read a shared store and write their partial results back to it. A shared task
          list that several coding agents pick work from is a modern blackboard.
        </p>
        <p>
          Real systems mix these. An orchestrator may hand a draft to a two-agent debate for checking, or a
          handoff-based support bot may start an orchestrator for one hard question.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Communication and shared state">
        <p>
          How agents talk matters more than how many there are. Every message between agents loses context, because
          the receiving agent didn’t see what the sender saw. Good multi-agent design is mostly about what crosses
          those boundaries.
        </p>
        <h3 className="ma-h3">Briefs going down</h3>
        <p>
          A worker’s <Term id="brief">brief</Term> is everything it knows about the task. It should state the
          objective, the form of the answer, which sources or tools to use, and the boundaries of the subtask:
          what is out of scope because another worker covers it. Anthropic found early versions of their system
          giving workers short briefs such as “research the semiconductor shortage”, which led different workers to
          run the same searches. Compare the two sets of briefs below:
        </p>
        <Figure>
          <BriefDemo />
        </Figure>
        <h3 className="ma-h3">Results coming back up</h3>
        <p>
          Workers should return short, structured findings, not their transcripts. Anthropic suggests a condensed
          summary of roughly 1,000 to 2,000 tokens from each subagent, however much it explored. Otherwise the
          orchestrator’s context fills up after all, which defeats the point. Ask for a fixed format (claims with
          sources, open questions, a confidence note) so results are easy to combine.
        </p>
        <p>
          Summaries lose detail, and summaries of summaries lose more. For large or exact outputs (a table of figures,
          a piece of code, a long report section), have workers write to a file or a store and return a reference to
          it. The orchestrator reads the original only when it needs it. This is Topic 6’s durable state again: the
          files outlive every agent’s context, so they can also be read by a person, checked into git or picked up
          by a new session if the run is interrupted.
        </p>
        <h3 className="ma-h3">Shared state</h3>
        <p>
          When agents share a store instead of messages, the questions become ones from ordinary software. Who owns
          each file? Can two agents write the same thing at once? Give each worker its own output location, let only
          the orchestrator write the shared plan, and keep a record of who wrote what. Coding agents that work in
          parallel go further and give each worker its own copy of the repository, such as a separate git worktree,
          so their edits can’t collide until someone merges them.
        </p>
        <h3 className="ma-h3">Between systems: A2A</h3>
        <p>
          Everything above assumes you wrote all the agents. When agents are built by different teams or vendors,
          they need a shared protocol. <Term id="a2a">A2A</Term> (Agent2Agent), announced by Google in 2025 and now
          run under the Linux Foundation, is the main one. Each agent publishes an <em>agent card</em> describing what
          it can do and how to reach it. A client agent sends it a <em>task</em>, follows the task’s status as it
          runs, and receives the results as <em>artifacts</em>. It is built on HTTP and JSON-RPC, like{' '}
          <Term id="mcp">MCP</Term>. The difference is in what sits on the other end: MCP connects an agent to tools
          and data it controls, while A2A connects it to another agent whose prompts, tools and memory stay private.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Orchestration in the harness">
        <p>
          Orchestration is the code or model that decides which agent runs, with what, and what happens to its
          result. It sits one level above the agent loop, and there are three places to put it.
        </p>
        <p>
          <strong>In code, as a workflow.</strong> The harness fixes the shape of the run: plan, fan out, combine.
          The model still writes the plan and does the work, but your code decides that there is a planning step, a
          set of workers and a writing step. This is the milestone project for this topic. The worker is Topic 5’s
          agent, unchanged:
        </p>
        <Figure>
          <Code title="research.py" lang="python" code={ORCHESTRATOR} />
        </Figure>
        <p>
          <strong>As a tool, inside the loop.</strong> A fully agentic orchestrator gets a{' '}
          <code>spawn_worker</code> tool and decides for itself when to start workers, how many, and whether to start
          more after reading the first results. The tool’s handler starts a new agent loop and returns its answer as
          the tool result. Several calls in one turn are{' '}
          <Term id="parallel-tools">parallel tool calls</Term> from Topic 4, so they run at the same time:
        </p>
        <Figure>
          <Code title="spawn_worker tool" lang="python" code={SPAWN} />
        </Figure>
        <p>
          This is more flexible and much harder to keep on budget, so the limits belong in the harness: a cap on
          workers per run, workers that can’t spawn workers of their own, and a token or time budget for the whole
          tree. The prompt adds <Term id="effort-scaling">effort scaling</Term>. Anthropic’s orchestrator is told to
          use one agent with 3 to 10 tool calls for simple fact-finding, 2 to 4 subagents for direct comparisons, and
          more than 10 only for complex research. Without such rules, early versions started 50 subagents for simple
          questions.
        </p>
        <p>
          <strong>As a handoff.</strong> In a handoff system, orchestration is just a variable: which agent is
          currently in charge. A <code>transfer_to</code> tool changes it, and the next call uses the new agent’s
          system prompt and permissions with the same history. The harness, not the prompt, decides which tools each
          agent may actually use:
        </p>
        <Figure>
          <Code title="handoffs.py" lang="python" code={HANDOFF} />
        </Figure>
        <p>
          Passing every tool definition to every agent looks wasteful, but it keeps the start of each request
          identical, so <Term id="prompt-caching">prompt caching</Term> still works after a handoff. The permission
          check happens in code either way.
        </p>
        <p>
          Whichever form it takes, the orchestrator should handle a worker that fails. One crashed or rate-limited
          worker should come back as an error result saying what is missing, not take the whole run down or vanish
          without trace. A worker that runs too long should be stopped by its own iteration and token limits from
          Topic 5, which apply to every agent in the tree.
        </p>
      </ArticleSection>

      <ArticleSection n={5} title="When it fails, and when not to">
        <p>
          Cognition’s essay “Don’t Build Multi-Agents” makes the case against. Every action an agent takes carries
          decisions it made implicitly, and two agents that can’t see each other’s context will make conflicting
          ones. Their example is a Flappy Bird clone split between two subagents: one builds a background that looks
          like Super Mario, the other a bird that matches neither, and the final step is left to reconcile them.
          Their advice is to share full context, not just task descriptions, and when that is impractical to keep the
          work in one agent.
        </p>
        <p>
          Anthropic reached a similar conclusion from the other side. Multi-agent systems suit wide, parallel tasks
          like research, and suit poorly tasks where every part depends on the others, which includes most coding.
          Cemri et al. (2025) studied failed multi-agent runs and sorted 14 failure modes into three groups:
          problems with the system’s design and task specification, misalignment between agents (ignoring each
          other’s input, withholding information, drifting from the task), and weak verification of the final
          result. Many failures came from the design, not from the model, which means the harness can fix them:
        </p>
        <Figure>
          <FailureTable />
        </Figure>
        <p>
          A good default is one agent, with context management from Topic 6, until its context really is the
          bottleneck. Then add workers for clearly independent pieces, with complete briefs, structured results and
          hard limits. Before building a team, check whether the work can actually be split so that no part depends on
          a decision made in another.
        </p>
      </ArticleSection>

      <ArticleSection n={6} title="Evaluating and debugging">
        <p>
          A multi-agent run is harder to follow than a single agent, because its <Term id="trajectory">trajectory</Term>{' '}
          is a tree, not a line. Record every agent’s calls as nested spans with a shared run id, so one view shows
          what ran in parallel, how long each part took, where the tokens went and which branch failed:
        </p>
        <Figure caption="An illustrative trace. Time runs left to right; the failed worker is easy to spot.">
          <TraceTree />
        </Figure>
        <p>
          Runs also differ from one try to the next, since the orchestrator can split the same question differently
          each time. So judge the end result, not the exact path. Anthropic evaluates research answers with a model
          acting as a judge, scoring them against a rubric: factual accuracy, citation accuracy, completeness, source
          quality and tool efficiency. They found a single judge call that gives a score from 0 to 1 and a pass or
          fail matched human judgment best. They also started with just about 20 test questions, because early
          changes made differences large enough to see with a small set. Topic 10 covers evaluation in depth.
        </p>
        <p>
          People still catch what judges miss. Anthropic’s human testers noticed that agents preferred search-engine
          friendly content farms over authoritative sources such as academic papers, which no automated check had
          flagged. And because a small change to the orchestrator’s prompt can change how every worker behaves,
          prompt changes should be tested on the whole system, not on one agent at a time.
        </p>
        <Callout label="Checkpoint: what does a multi-agent system buy you, and what does it cost?">
          <p>
            It buys context isolation (each agent explores in a fresh window and returns only what matters), parallel
            work and specialized agents with their own tools and permissions. It costs many more tokens, a lot of
            coordination, and decisions that one agent makes without the others seeing them. Use it when the task
            splits into independent parts and is worth the extra tokens. Keep orchestration in the harness, where caps,
            budgets and permission checks are enforced in code.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
