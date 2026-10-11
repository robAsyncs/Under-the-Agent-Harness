import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import { AgentLoop } from '../language-to-agents/AgentLoop'
import { Code } from '../llm-apis/Code'
import '../llm-apis/llm-apis.css'
import './agent-loop.css'
import { AutonomySpectrum } from './Diagrams'
import { FailureDemo } from './FailureDemo'
import { GrowthDemo } from './GrowthDemo'
import { LoopRunDemo } from './LoopRunDemo'
import { PatternTabs } from './PatternTabs'

const CORE = `
messages = [{"role": "user", "content": task}]

while True:
    response = client.messages.create(model=MODEL, max_tokens=16000,
                                      tools=TOOLS, messages=messages)
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":
        break  # the model answered (or something else ended the turn)

    results = [run_tool(b) for b in response.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})
`

const AGENT = `
import json, time
import anthropic
from calculator import calculate  # the safe arithmetic evaluator from Topic 4

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"
MAX_ITERATIONS = 10
MAX_FAILED_ROUNDS = 3

SYSTEM = (
    "You answer questions that need current facts and arithmetic. Search for every "
    "fact you rely on and use the calculator for all arithmetic. In the final answer, "
    "name your sources and say clearly if anything could not be confirmed."
)

TOOLS = [
    # Web search is a server tool: it runs on Anthropic's side, so there is no code for it here.
    {"type": "web_search_20260209", "name": "web_search", "max_uses": 5},
    {
        "name": "calculate",
        "description": "Evaluate an arithmetic expression with + - * / ** and parentheses. "
                       "Use it for every calculation instead of working it out yourself.",
        "input_schema": {
            "type": "object",
            "properties": {"expression": {"type": "string", "description": "e.g. '2800000 / 140000'"}},
            "required": ["expression"],
        },
    },
]
FUNCTIONS = {"calculate": calculate}


def log(event, **data):
    """Append one JSON line per event, so every run can be replayed and inspected."""
    with open("agent.log.jsonl", "a") as f:
        f.write(json.dumps({"t": round(time.time(), 2), "event": event, **data}, default=str) + "\\n")


def run_tool(block):
    log("tool_use", name=block.name, input=block.input)
    try:
        output = str(FUNCTIONS[block.name](**block.input))
    except Exception as e:
        log("tool_error", name=block.name, error=repr(e))
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True, "content": f"Error: {e}"}
    log("tool_result", name=block.name, output=output)
    return {"type": "tool_result", "tool_use_id": block.id, "content": output}


def run_agent(task):
    messages = [{"role": "user", "content": task}]
    failed_rounds = 0
    log("task", task=task)

    for i in range(1, MAX_ITERATIONS + 1):
        response = client.messages.create(
            model=MODEL, max_tokens=16000, system=SYSTEM, tools=TOOLS, messages=messages,
        )
        log("model", iteration=i, stop_reason=response.stop_reason,
            input_tokens=response.usage.input_tokens, output_tokens=response.usage.output_tokens)
        # Append every block (text, thinking, tool calls, search results), not just the text.
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            answer = "".join(b.text for b in response.content if b.type == "text")
            log("answer", text=answer)
            return answer
        if response.stop_reason == "pause_turn":  # a long server-side search paused; resend to continue
            continue
        if response.stop_reason != "tool_use":  # max_tokens, refusal, ...
            log("stopped", reason=response.stop_reason)
            return f"Stopped early: {response.stop_reason}"

        results = [run_tool(b) for b in response.content if b.type == "tool_use"]
        failed_rounds = failed_rounds + 1 if all(r.get("is_error") for r in results) else 0
        if failed_rounds >= MAX_FAILED_ROUNDS:
            log("stopped", reason="tools kept failing")
            return "Stopped early: the tools kept failing."
        messages.append({"role": "user", "content": results})

    log("stopped", reason="max_iterations")
    return f"Stopped early: no answer after {MAX_ITERATIONS} model calls."


if __name__ == "__main__":
    print(run_agent(input("Question: ")))
`

const LOG = `
{"t": 1759687201.2, "event": "task", "task": "How many times more people live in Brasília than in Reykjavík?"}
{"t": 1759687209.8, "event": "model", "iteration": 1, "stop_reason": "tool_use", "input_tokens": 9412, "output_tokens": 236}
{"t": 1759687209.8, "event": "tool_use", "name": "calculate", "input": {"expression": "2800000 / 140000"}}
{"t": 1759687209.8, "event": "tool_result", "name": "calculate", "output": "20.0"}
{"t": 1759687213.5, "event": "model", "iteration": 2, "stop_reason": "end_turn", "input_tokens": 9702, "output_tokens": 118}
{"t": 1759687213.5, "event": "answer", "text": "About 20 times as many: Brasília has roughly 2.8 million people…"}
`

const REPEAT_GUARD = `
from collections import Counter

seen = Counter()

def run_tool(block):
    key = (block.name, json.dumps(block.input, sort_keys=True))
    seen[key] += 1
    if seen[key] > 2:
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True,
                "content": "You already made this exact call twice. Try something different, "
                           "or answer with what you have and say what is still uncertain."}
    ...
`

export function AgentLoopArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          I expected an agent to be a large piece of software. The working core turned out to be a{' '}
          <code>while</code> loop around the tool call from Topic 4: call the model, run whatever tools it asks for,
          send back the results, and repeat until it stops asking. Almost everything else on this page is about
          deciding when that loop should stop, and what to do when it misbehaves.
        </p>
        <Figure caption="The loop from Topic 1, now in code. Each pass through Think is one model call.">
          <AgentLoop />
        </Figure>
      </section>

      <ArticleSection n={1} title="What makes something an agent">
        <p>
          Topic 1 drew the line using Anthropic’s definitions. In a <Term id="workflow">workflow</Term>, your code
          decides the sequence of steps and the model does the work inside each one: classify this ticket, then send it
          to the matching prompt, then check the reply. In an <strong>agent</strong>, the model decides the steps
          itself, choosing which tool to call next based on what it has seen so far, and how many steps the task
          needs.
        </p>
        <p>
          That is not a binary choice so much as a scale of <Term id="autonomy">autonomy</Term>. Each step to the
          right hands more decisions to the model, which buys flexibility at the price of predictability, cost and
          ease of testing.
        </p>
        <Figure>
          <AutonomySpectrum />
        </Figure>
        <p>
          The advice in “Building Effective Agents” is to pick the leftmost level that solves the problem. If you can
          write the steps down in advance, a workflow will be cheaper, faster and easier to debug. Agents earn their
          cost on open-ended problems where the number and order of steps can’t be predicted: fixing a bug in an
          unfamiliar codebase, researching a question whose answer depends on what the first search turns up.
        </p>
        <p>
          A useful check before building one is to ask four questions. Is the task complex enough that you can’t
          specify the steps? Is the result valuable enough to pay for many model calls? Is the model actually good
          at this kind of task? And can its mistakes be caught and undone, with tests, review or rollback? If any
          answer is no, stay further left. The third level on the scale, an agent that pauses for a{' '}
          <Term id="human-in-the-loop">human in the loop</Term> before risky actions, is often the right compromise
          when mistakes are expensive.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="The core loop">
        <p>
          The <Term id="agent-loop">agent loop</Term> is usually described as <strong>think → act → observe</strong>.
          The model reads the history and decides what to do (think), asks for a tool (act), and your code runs it
          and adds the result to the history (observe). Then it starts over. In code, the whole thing fits on a
          screen:
        </p>
        <Figure>
          <Code title="loop.py" lang="python" code={CORE} />
        </Figure>
        <p>
          This loop has no way to stop except the model deciding it is done. That is the normal ending, signalled by
          a <Term id="stop-reason">stop_reason</Term> of <code>end_turn</code>, but a real harness needs more{' '}
          <Term id="stopping-condition">stopping conditions</Term> than that:
        </p>
        <ul className="agl-stops">
          <li>
            <strong>Task complete.</strong> The model replies without asking for a tool.
          </li>
          <li>
            <strong>Maximum iterations.</strong> A hard cap on model calls, so a confused agent can’t loop forever.
          </li>
          <li>
            <strong>Budget.</strong> A cap on tokens, money or wall-clock time, which matters more than iterations
            once tool results are large.
          </li>
          <li>
            <strong>Repeated errors.</strong> If every tool call fails several rounds in a row, something is wrong
            that the model can’t fix by itself.
          </li>
          <li>
            <strong>Other stop reasons.</strong> <code>max_tokens</code> (the reply was cut off) or{' '}
            <code>refusal</code> should end the run, or be handled explicitly, never be treated as an answer.
          </li>
        </ul>
        <p>
          Try lowering the iteration cap in the run below. The agent needs four model calls for this question, so any
          limit under four stops it before it can answer. Watch the token count as well: every iteration resends the
          entire history, so each call is bigger than the last.
        </p>
        <Figure>
          <LoopRunDemo />
        </Figure>
        <p>
          When a limit is hit, the agent should fail clearly: say it stopped, why, and what it found so far. A run
          that silently returns half an answer is worse than one that says it ran out of steps.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Key patterns">
        <p>
          The loop says nothing about <em>how</em> the model should decide each step. A few patterns from research
          have become standard ways to structure that decision.
        </p>
        <p>
          <Term id="react">ReAct</Term> (Yao et al., 2022) interleaves a written reasoning step before each action:
          Thought, Action, Observation, repeated. Reasoning without acting tends to hallucinate facts, and acting
          without reasoning tends to lose track of the goal; combining them helped on both counts. On two interactive
          benchmarks, ALFWorld and WebShop, ReAct beat imitation and reinforcement learning baselines by 34 and 10
          percentage points in success rate, using only one or two examples in the prompt. Today’s models do this by
          default, since they reason before each tool call, so the loop above is already a ReAct agent.
        </p>
        <p>
          <Term id="plan-and-execute">Plan-and-execute</Term> separates the thinking from the doing. The model first
          writes a complete plan, then the steps are carried out one at a time, often by a smaller and cheaper model,
          and the planner is only called again to revise the plan when a step fails. The idea comes from
          Plan-and-Solve prompting (Wang et al., 2023), which asked the model to devise a plan before solving a
          problem. A visible plan is also something a person can review before any action is taken.
        </p>
        <p>
          <Term id="reflection">Reflection</Term> adds a self-critique step. In Reflexion (Shinn et al., 2023), an
          agent that fails a task writes a short note on what went wrong and keeps it for the next attempt; on the
          HumanEval coding benchmark this reached 91% pass@1, against 80% for GPT-4 on its own. Self-Refine (Madaan et
          al., 2023) applies the same idea to a single output: generate, critique, revise. Both work best with a real
          signal to reflect on, such as a failing test.
        </p>
        <Figure>
          <PatternTabs />
        </Figure>
        <p>
          These are not exclusive. A coding agent might write a plan, execute each step as a short ReAct loop, and
          reflect when the tests fail. Topic 7 places ReAct and plan-and-execute in the longer history of planning,
          from classical search and planning graphs to hierarchical plans and planning with memory. Topic 8 looks at
          the larger systems built from these pieces, such as an orchestrator handing subtasks to other agents.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Building it yourself">
        <p>
          Frameworks hide this loop, which makes it hard to see what they are doing. Thorsten Ball’s “How to Build an
          Agent” makes the case that a useful agent is “an LLM, a loop, and enough tokens”, and it is worth writing
          one by hand before reaching for a framework. Here is a complete agent for the milestone project, multi-step
          questions answered with web search and a calculator, in well under 100 lines:
        </p>
        <Figure>
          <Code title="agent.py" lang="python" code={AGENT} />
        </Figure>
        <p>
          A few choices in it are worth explaining. Web search is a <em>server tool</em>: it runs on Anthropic’s
          infrastructure, and its results arrive inside the model’s response, so the loop only has to execute the
          calculator. A long search can pause the turn (<code>pause_turn</code>), in which case the loop sends the
          response back to let it continue. And the loop appends <code>response.content</code>, every block the model
          returned, rather than just the text. Tool calls, search results and the model’s thinking all have to be
          sent back unchanged for the next call to make sense.
        </p>
        <p>
          <strong>The history grows on every iteration.</strong> Each model call resends everything before it, so a
          run’s total input cost grows roughly with the square of its length. Search results and file contents are
          the big items. Three habits keep this under control: keep tool results short (Topic 4),{' '}
          <Term id="prompt-caching">cache</Term> the stable prefix so resent history is cheap, and for long runs
          drop or summarize old tool results. Anthropic calls this broader practice context engineering: finding the
          smallest set of high-signal tokens that lets the model do the next step. Topic 6 covers the memory side of
          it.
        </p>
        <Figure caption="Each bar is one model call. The bars grow in a straight line, so their total grows with the square of the run’s length.">
          <GrowthDemo />
        </Figure>
        <p>
          <strong>Log every step.</strong> An agent’s behavior is only visible in its{' '}
          <Term id="trajectory">trajectory</Term>, the sequence of calls and results. Writing one JSON line per event
          costs nothing and turns “the agent did something weird” into a file you can read:
        </p>
        <Figure caption="An illustrative log. The search happened inside iteration 1 on the server, so only the calculator appears as a tool call.">
          <Code title="agent.log.jsonl" lang="json" code={LOG} />
        </Figure>
        <p>
          The logs are also how you find out where tokens go, which iteration a run went wrong in, and which tool
          descriptions need work. They become the raw material for evaluation in Topic 10.
        </p>
      </ArticleSection>

      <ArticleSection n={5} title="Common failure modes">
        <p>
          Agents fail in recognizable ways. Cemri et al. (2025) built a taxonomy of failures from annotated
          multi-agent traces, and step repetition, stopping too early, and missing or wrong verification all feature
          in it. Each has a fix that belongs in the harness, not just in the prompt.
        </p>
        <Figure>
          <FailureDemo />
        </Figure>
        <p>
          <strong>Infinite loops and repeated actions.</strong> An agent that gets the same unhelpful result keeps
          trying the same call, often because it believes the next attempt will differ. The iteration cap stops it
          eventually, but a cheaper fix is to notice the repeat and say so:
        </p>
        <Figure>
          <Code title="repeat guard" lang="python" code={REPEAT_GUARD} />
        </Figure>
        <p>
          <strong>Giving up early, or claiming false success.</strong> The model decides when it is done, and it can
          be wrong in both directions: stopping at the first obstacle, or announcing success it never checked. A{' '}
          <Term id="false-success">false success</Term> is the more dangerous of the two, because it looks like a
          result. The defense is ground truth from the environment. Define in the prompt what done means (“all tests
          pass”, “every claim has a source”), and have the harness check it, for example by running the tests itself
          before accepting <code>end_turn</code>.
        </p>
        <p>
          <strong>Tool misuse.</strong> The model calls the wrong tool, invents an argument, or uses a tool for
          something it shouldn’t. Most of this is fixed with Topic 4’s advice: clear descriptions, strict schemas
          and error messages that say what a correct call looks like. Destructive mistakes need a harder line.
          Permission checks and <Term id="human-in-the-loop">human approval</Term> belong in code, because the model
          can be wrong, or be manipulated by text it read along the way (Topic 11).
        </p>
        <Callout label="Checkpoint: why does the harness, not the model, decide when to stop?">
          <p>
            The model decides when it <em>thinks</em> it is done, and usually that is right. But it can loop, give up
            or claim success it never checked, and it has no idea how much the run has cost. The harness is ordinary
            code: it can count iterations and tokens, compare calls, run the tests and refuse dangerous actions,
            reliably, every time. A good agent is a capable model inside a harness that doesn’t have to trust it.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
