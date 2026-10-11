import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import '../agent-loop/agent-loop.css'
import { Code } from '../llm-apis/Code'
import '../llm-apis/llm-apis.css'
import '../how-llms-work/how-llms-work.css'
import './advanced-architectures.css'
import { ApprovalDemo } from './ApprovalDemo'
import { CrashDemo } from './CrashDemo'
import { MetrTrend, PlanningGraph, PlanningTable } from './Diagrams'
import { PlanDemo } from './PlanDemo'
import { SearchDemo } from './SearchDemo'
import { SessionRelay } from './SessionRelay'
import { TotDemo } from './TotDemo'
import { WorkflowTabs } from './WorkflowTabs'

const STRIPS = `
Action: Fly(plane, from, to)
  Preconditions: At(plane, from), Airport(from), Airport(to)
  Add:           At(plane, to)
  Delete:        At(plane, from)

Start: At(P1, ATL), Airport(ATL), Airport(SFO), Airport(JFK)
Goal:  At(P1, SFO)
`

const PLAN_PROMPT = `
SYSTEM = """Before doing anything, write a plan to PLAN.md:
the goal, then numbered subgoals, each with a checklist of tasks.
Only break down the subgoal you are about to start.

After every task, update PLAN.md: tick it off and add a one-line result.
If a task fails, say why in PLAN.md and change the plan before continuing.
When you are unsure what to do next, read PLAN.md first."""
`

const CHECKPOINT = `
import json, os

PATH = "run.checkpoint.json"

def save(state):
    # Write to a temporary file, then rename, so a crash never leaves half a checkpoint.
    with open(PATH + ".tmp", "w") as f:
        json.dump(state, f, indent=2)
    os.replace(PATH + ".tmp", PATH)

def load():
    try:
        with open(PATH) as f:
            return json.load(f)
    except FileNotFoundError:
        return None

state = load() or {"question": question, "findings": {},
                   "subtopics": [s.model_dump() for s in plan(question)]}
for sub in state["subtopics"]:
    if sub["title"] in state["findings"]:
        continue  # finished before the last crash
    state["findings"][sub["title"]] = research(Subtopic(**sub))
    save(state)  # after every unit of work
`

const APPROVAL = `
ALLOW = {"read_file", "list_files", "run_tests"}  # safe: run without asking
ASK = {"edit_file", "run_shell", "send_email"}       # pause for a person
# Everything else is denied.

def run_tool(block):
    if block.name not in ALLOW | ASK:
        return error(block, f"{block.name} is not allowed in this environment.")
    if block.name in ASK:
        print(f"\\nThe agent wants to call {block.name}({json.dumps(block.input)})")
        reply = input("Approve? [y/N, or type a note for the agent] ").strip()
        if reply.lower() != "y":
            return error(block, "The user rejected this action. "
                                f"Their note: {reply or '(none)'}. Do not retry it unchanged.")
    ...  # run it as in Topic 5

def error(block, message):
    return {"type": "tool_result", "tool_use_id": block.id, "is_error": True, "content": message}
`

const ASK_USER = `
{
  "name": "ask_user",
  "description": "Ask the user a question and wait for the answer. Use it only when the task is ambiguous in a way that changes what you would do, and a wrong guess would waste real work. Do not ask about anything you can find out with your other tools.",
  "input_schema": {
    "type": "object",
    "properties": {"question": {"type": "string"}},
    "required": ["question"]
  }
}
`

export function AdvancedArchitecturesArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          Topic 5’s loop handles a task you can finish in one sitting. This topic is about what happens when the task
          gets bigger: too many steps to take one at a time, too much material for one context window, too long for
          one session, or too risky to run unwatched. The answers all come down to adding structure around the loop,
          and the most important piece of that structure is a plan.
        </p>
      </section>

      <ArticleSection n={1} title="Workflow patterns">
        <p>
          Before reaching for more autonomy, it is worth knowing the fixed shapes that solve many problems without
          it. “Building Effective Agents” describes a handful of <Term id="workflow">workflow</Term> patterns, where
          your code decides the structure and the model does the work inside each step. They are cheaper and easier to
          test than agents, and the larger systems later on this page are mostly these patterns combined.
        </p>
        <p>
          <Term id="prompt-chaining">Prompt chaining</Term> splits a task into a fixed sequence of calls.{' '}
          <Term id="routing">Routing</Term> sends each input to the handler built for its kind. Parallelization runs
          independent calls at once, either on different parts of a job (sectioning) or on the same job several times
          to compare answers (voting). And an <Term id="evaluator-optimizer">evaluator-optimizer</Term> loop pairs a
          generator with a critic, which is Topic 5’s reflection pattern turned into a fixed structure.
        </p>
        <Figure>
          <WorkflowTabs />
        </Figure>
        <p>
          A fifth pattern from the same essay, orchestrator-workers, is where workflows start turning into agents:
          the model, not your code, decides how to split the task. Section 3 introduces it, after the planning ideas
          it depends on, and Topic 8 is devoted to it.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="Planning">
        <p>
          In a workflow you write the plan. In an agent the model has to make it, and planning is one of the oldest
          problems in AI. The modern LLM techniques make more sense next to the ideas they came from, so this section
          goes through them in order, from classical search to the plan files today’s coding agents keep.
        </p>

        <h3 className="arc-h3">Goal decomposition</h3>
        <p>
          Every planning method starts by breaking the problem down. <Term id="goal-decomposition">Goal
          decomposition</Term> turns a goal (“recommend whether to electrify the bus fleet”) into subgoals
          (“understand the fleet”, “compare costs”, “write it up”) and those into tasks small enough to do in one step
          (“count the buses”). Models are good at producing these breakdowns. The hard parts are knowing when to
          stop splitting, and noticing when a subgoal was the wrong one.
        </p>

        <h3 className="arc-h3">Search-based planning</h3>
        <p>
          Classical AI treated planning as <Term id="state-space-search">search</Term>. STRIPS (Fikes and Nilsson,
          1971), built for the Shakey robot at SRI, described the world as a set of facts and each action by its
          preconditions and effects: the facts it adds and the facts it deletes. A plan is any sequence of actions
          that turns the start state into one where the goal is true.
        </p>
        <Figure caption="A STRIPS-style action. The planner chains actions whose preconditions are met until the goal holds.">
          <Code title="planning domain" lang="text" code={STRIPS} />
        </Figure>
        <p>
          Finding that sequence is a search problem, and A* (Hart, Nilsson and Raphael, 1968, from the same
          lab) is the classic way to do it. It expands the state with the lowest cost so far plus a{' '}
          <Term id="heuristic">heuristic</Term> estimate of the cost left. If the estimate never overestimates, the
          first plan A* finds is a shortest one, and a good estimate saves an enormous amount of work:
        </p>
        <Figure>
          <SearchDemo />
        </Figure>
        <p>
          LLM versions of search keep the idea and change what a state is. In <Term id="tree-of-thoughts">Tree of
          Thoughts</Term> (Yao et al., 2023) a state is a partial solution in text. The model proposes several next
          “thoughts”, rates how promising each one is, and a breadth- or depth-first search keeps the best and
          backtracks from dead ends. On the Game of 24 puzzle, GPT-4 with chain-of-thought solved 4% of problems;
          with Tree of Thoughts it solved 74%. RAP (Hao et al., 2023) goes further and has the model act as its own
          world model, predicting the result of each action so it can search with Monte Carlo tree search. LATS
          (Zhou et al., 2023) uses the same kind of tree search over real actions, with environment feedback and
          self-reflection guiding which branches to try.
        </p>
        <Figure>
          <TotDemo />
        </Figure>
        <p>
          The catch is cost. Every node in the tree is at least one model call, and a step-by-step agent may need
          dozens of nodes per step. These methods pay off on problems where an early wrong step is fatal and can be
          detected, like puzzles and code with tests, more than on everyday tasks.
        </p>

        <h3 className="arc-h3">Planning graphs</h3>
        <p>
          Searching state by state gets expensive quickly, because the number of reachable states grows
          exponentially with the number of facts. Graphplan (Blum and Furst, 1997) took a different route. It builds
          a <Term id="planning-graph">planning graph</Term>: alternating layers of every fact that might be true and
          every action that might be possible at each time step, with pairs that can’t happen together (mutual
          exclusions) marked. The graph grows only polynomially, it shows quickly when a goal can’t be reached in a
          given number of steps, and a plan is then extracted by searching backward through it. Graphplan was much
          faster than the planners of its day, and its graph later became a source of heuristics for search-based
          planners.
        </p>
        <Figure caption="The textbook cake example. Both goal facts appear after one step, but only eating could produce “eaten”, and eating removes the cake, so they are mutex. One layer later, baking makes them compatible, and the plan is eat, then bake.">
          <PlanningGraph />
        </Figure>
        <p>
          LLM agents don’t build planning graphs. The lesson that carries over is the problem Graphplan was solving:
          explicit search over every possibility is exponential, so practical planners need ways to rule most of it
          out cheaply. A language model’s judgment is one such way. Instead of enumerating the options, it proposes
          the few that seem sensible.
        </p>

        <h3 className="arc-h3">ReAct: one step at a time</h3>
        <p>
          <Term id="react">ReAct</Term>, from Topic 5, is the other extreme: no search and no plan, just a decision
          about the next step after each observation. That sounds naive next to A*, but the real world is full of
          surprises that no model of it predicts, and reacting to what actually happened often beats planning for
          what you thought would happen. Its weakness is the mirror image. With no look-ahead, a ReAct agent on a long
          task can drift, repeat itself or forget what it was doing.
        </p>

        <h3 className="arc-h3">Plan-and-execute and replanning</h3>
        <p>
          <Term id="plan-and-execute">Plan-and-execute</Term> sits between the two. The model writes a full plan
          first, in the spirit of Plan-and-Solve prompting (Wang et al., 2023), then the steps are carried out one by
          one. The plan gives the agent direction and gives people something to review. The risk is that it was
          written before any results came in, so it is a plan made with the least information the agent will ever
          have. <Term id="replanning">Replanning</Term> fixes this: when a step fails or a result changes what is
          needed, the planner is called again with what has been learned, and only the affected part of the plan
          changes.
        </p>

        <h3 className="arc-h3">Hierarchical planning</h3>
        <p>
          <Term id="hierarchical-planning">Hierarchical planning</Term> applies decomposition at several levels. In
          classical AI this is hierarchical task network (HTN) planning, where abstract tasks are refined into
          subtasks by methods until only primitive actions remain. For an agent the practical version is: write the
          high-level plan first, and only refine a subgoal into concrete steps when it is reached, when the results
          of earlier subgoals are known. Step through the demo below and watch the plan grow one level at a time,
          including a replan when a task fails:
        </p>
        <Figure>
          <PlanDemo />
        </Figure>
        <p>
          Hierarchy is also the bridge to the next section. Once a plan is a tree of subgoals, nothing requires the
          same agent to work on all of them. Give each subgoal to its own agent and you have an orchestrator with
          workers.
        </p>

        <h3 className="arc-h3">Planning with memory</h3>
        <p>
          A plan that lives only in the conversation is fragile. It scrolls into the middle of a long context, where
          models pay it less attention, and it is lost entirely if the context is cleared or summarized. Agents that
          work for a long time keep the plan somewhere outside the conversation, in a{' '}
          <Term id="scratchpad">scratchpad</Term> (a file, a database row, a to-do list tool) that they read and
          update as they go. Anthropic’s multi-agent research system does exactly this: its lead agent saves its plan
          to memory at the start, because a context over 200,000 tokens gets truncated and the plan has to survive
          that. Coding agents keep a to-do list for the same reason.
        </p>
        <Figure caption="Asking an agent to plan in a file, as in the demo above.">
          <Code title="system prompt" lang="python" code={PLAN_PROMPT} />
        </Figure>
        <p>
          Memory also lets an agent reuse plans across runs. In Generative Agents (Park et al., 2023), simulated
          characters write a plan for each day, break it down into hour-long and then 5-to-15-minute chunks, and store
          the plans in their memory stream, revising them when something happens. Voyager (Wang et al., 2023), a
          Minecraft agent, saves every behavior that works as a piece of code in a skill library and retrieves those
          skills for later tasks, so a plan step like “craft an iron pickaxe” becomes one call to a tested skill
          instead of fresh planning. With its curriculum and skill library, Voyager collected 3.3 times as many unique
          items as earlier agents and reached key tech-tree milestones up to 15.3 times faster. Topic 6 covers the
          memory systems themselves.
        </p>
        <PlanningTable />
      </ArticleSection>

      <ArticleSection n={3} title="From one agent to many">
        <p>
          A hierarchical plan raises an obvious question: why should one agent work through every subgoal? In an{' '}
          <Term id="orchestrator-worker">orchestrator-worker</Term> system, a lead agent plans the task, hands each
          piece to a worker agent, and combines what comes back. Each worker is the Topic 5 loop with its own fresh
          context window and a brief written by the orchestrator, so no single context has to hold the whole task,
          and independent pieces can run at the same time.
        </p>
        <p>
          That buys breadth and speed at a real price: many more tokens, and agents that can’t see each other’s
          decisions. Multi-agent systems are a large enough subject to have their own topic. Topic 8 covers the
          architectures, how agents share context and state, where orchestration lives in a harness, and the
          failure modes that make a single agent the right default. The rest of this page applies whether there is
          one agent or many.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Long-running agents">
        <p>
          The length of task agents can complete is growing fast. METR measures it as the length of task, in human
          working time, that a model completes half the time, and in 2025 they found that length had been doubling
          roughly every seven months for six years. Tasks that run for hours raise problems a five-minute agent never
          meets: the context fills up, processes crash, rate limits bite, and someone wants to see progress or stop
          the run halfway.
        </p>
        <Figure caption="A doubling every seven months, drawn relative to 2019 on a log scale. Six years of it is about ten doublings, a thousandfold increase. This is the trend line, not individual models.">
          <MetrTrend />
        </Figure>
        <p>
          <strong>Save state, and resume from it.</strong> A long-running agent should be able to stop at any point
          and continue later. That means keeping a <Term id="checkpoint">checkpoint</Term> outside the process: the
          task, the plan, what is done and what was found. Saving after every unit of work means a crash costs one
          unit, not the whole run:
        </p>
        <Figure>
          <Code title="checkpointing the research run" lang="python" code={CHECKPOINT} />
        </Figure>
        <p>
          Frameworks such as LangGraph build this in, checkpointing the state after every step so a run can be
          resumed, replayed or inspected. Whatever does the saving, two details matter. Tool calls with side effects
          can run twice if a crash lands between the call and the save, so they should be safe to repeat (sending
          the same email twice is not). And the checkpoint should store what you need to continue, not the full
          message history, which is large and soon stale.
        </p>
        <Figure>
          <CrashDemo />
        </Figure>
        <p>
          <strong>Work across context windows.</strong> Even without crashes, a task that runs for hours outlasts any
          context window. Anthropic’s guide to harnesses for long-running coding agents describes a pattern that
          handles this: a first session sets up the environment, writes a detailed feature list with each item
          marked as failing, and creates a progress file. Every later session starts fresh, reads the progress file
          and git log to get its bearings, works on one feature, tests it, commits, and updates the progress notes
          for whoever comes next. The plan file from Section 2 becomes the handover between sessions, and git becomes
          the checkpoint.
        </p>
        <Figure>
          <SessionRelay />
        </Figure>
        <p>
          <strong>Watch it.</strong> The longer the run, the more it matters to see what it is doing. Stream progress
          events to a log (Topic 5), report the current step somewhere a person can check, and set budgets on time
          and tokens as well as iterations.
        </p>
      </ArticleSection>

      <ArticleSection n={5} title="Human-in-the-loop">
        <p>
          Most of this page is about letting agents do more on their own. The counterweight is deciding where a
          person stays involved. A <Term id="human-in-the-loop">human in the loop</Term> doesn’t mean watching every
          step; it means the harness stops at the few points where a mistake would be expensive or the agent can’t
          know the answer.
        </p>
        <p>
          <strong>Approval for risky actions.</strong> Sort tools into three groups: safe ones that run freely,
          risky ones that pause for approval, and ones that are never allowed. The check belongs in the harness,
          because a prompt can be ignored, misread or overridden by text the agent read on a web page. A rejection
          should go back to the model as a tool error, with the person’s reason if they gave one, so the agent can
          adjust instead of stalling:
        </p>
        <Figure>
          <ApprovalDemo />
        </Figure>
        <Figure>
          <Code title="approval gate" lang="python" code={APPROVAL} />
        </Figure>
        <p>
          <strong>Asking clarifying questions.</strong> Sometimes the agent needs information only the user has:
          which of two plausible meanings they intended, or a preference that changes the result. Giving it an{' '}
          <code>ask_user</code> tool makes asking an action like any other. The description is what keeps it from
          asking too much, or too little:
        </p>
        <Figure>
          <Code title="ask_user tool" lang="json" code={ASK_USER} />
        </Figure>
        <p>
          A related habit is asking up front. A plan-and-execute agent can show its plan before doing anything, which
          is the cheapest point to catch a misunderstanding, since nothing has been done yet.
        </p>
        <p>
          <strong>Interrupting and redirecting.</strong> People should also be able to step in without being asked.
          The loop makes this simple: between iterations, check for new messages from the user, and if there is one,
          add it to the next user turn as a text block after the tool results. The agent sees the correction on its
          very next call. A stop button that ends the run cleanly, saving a checkpoint first, matters just as much. For
          long tasks, a person who can see the plan file and redirect the agent is worth more than any amount of
          autonomy.
        </p>
        <Callout label="Checkpoint: why does a plan belong in a file and not just in the conversation?">
          <p>
            The conversation is the agent’s working memory, and it is the first thing to go wrong on a long task: the
            plan drifts into the middle of a huge context, gets summarized away, or vanishes when the context is
            reset or a new session starts. A file survives all of that. It can be read by a fresh session, a worker
            agent or a person, it can be checked into git, and it turns “where was I?” into one tool call. Hierarchical
            plans, orchestrators, checkpoints and human review all build on having it.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
