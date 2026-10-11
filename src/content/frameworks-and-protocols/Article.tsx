import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import '../advanced-architectures/advanced-architectures.css'
import '../agent-loop/agent-loop.css'
import '../how-llms-work/how-llms-work.css'
import { Code } from '../llm-apis/Code'
import '../llm-apis/llm-apis.css'
import { CodingCycle, FrameworkTable, OsworldChart, SandboxLayers } from './Diagrams'
import { FrameworkTabs } from './FrameworkTabs'
import './frameworks-and-protocols.css'
import { HookLifecycle } from './HookLifecycle'
import { HooksDemo } from './HooksDemo'
import { McpDemo } from './McpDemo'
import { PageViewsDemo } from './PageViewsDemo'

const MCP_SERVER = `
from pathlib import Path
from mcp.server.fastmcp import FastMCP

NOTES = Path("notes")
NOTES.mkdir(exist_ok=True)
mcp = FastMCP("notes")


def path_for(title: str) -> Path:
    # Letters, digits and dashes only, so a title can never point outside NOTES.
    return NOTES / ("".join(c if c.isalnum() else "-" for c in title.lower()) + ".md")


@mcp.tool()
def save_note(title: str, body: str) -> str:
    """Save a note under a short title. Overwrites a note with the same title."""
    path_for(title).write_text(body)
    return f"Saved note '{title}'."


@mcp.resource("notes://{title}")
def read_note(title: str) -> str:
    """The text of one saved note."""
    return path_for(title).read_text()


if __name__ == "__main__":
    mcp.run()  # stdio by default: the host starts this script and talks to it over stdin/stdout
`

const MCP_ADD = `
# Register the server with Claude Code (it starts the script itself)
claude mcp add --transport stdio notes -- python notes_server.py
`

const MCP_CONNECTOR = `
response = client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=16000,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{"type": "url", "url": "https://notes.example.com/mcp", "name": "notes"}],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "notes"}],
    messages=[{"role": "user", "content": "Note that the demo moved to Friday."}],
)
`

const HOOK_SETTINGS = `
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "python3 \\"$CLAUDE_PROJECT_DIR\\"/.claude/hooks/guard.py"}]
      }
    ],
    "Stop": [
      {
        "hooks": [{"type": "command", "command": "python3 \\"$CLAUDE_PROJECT_DIR\\"/.claude/hooks/tests_pass.py"}]
      }
    ]
  }
}
`

const GUARD = `
#!/usr/bin/env python3
"""PreToolUse hook for Bash: block or flag dangerous commands."""
import json, re, sys

event = json.load(sys.stdin)
command = event["tool_input"].get("command", "")


def decide(decision, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,  # "allow", "deny" or "ask"
        "permissionDecisionReason": reason,
    }}))
    sys.exit(0)


if re.search(r"\\brm\\s+-[a-zA-Z]*r[a-zA-Z]*\\s+[~/]", command):
    decide("deny", "rm -rf outside this project is blocked. Delete inside the project, or ask the user.")
if re.search(r"\\bgit\\s+push\\b.*--force", command):
    decide("ask", "Force-pushing rewrites shared history.")
# No output: the normal permission rules decide.
`

const STOP_HOOK = `
#!/usr/bin/env python3
"""Stop hook: don't let Claude finish while the tests fail."""
import json, subprocess, sys

event = json.load(sys.stdin)
if event.get("stop_hook_active"):
    sys.exit(0)  # Claude is already continuing because of this hook: let it stop, don't loop

tests = subprocess.run(["npm", "test", "--silent"], capture_output=True, text=True)
if tests.returncode != 0:
    print(json.dumps({
        "decision": "block",  # keep going...
        "reason": "The tests are failing. Fix them before finishing:\\n" + tests.stdout[-3000:],  # ...with this
    }))
`

const COMPUTER = `
response = client.messages.create(
    model="claude-opus-5-5", max_tokens=16000,
    tools=[{"type": "computer_toolset_20260801"}],
    messages=[{"role": "user", "content": "Turn on dark mode in System Settings."}],
)
# Claude replies with tool_use blocks named after actions: screenshot, left_click, type, ...
# Your code performs each one on a real (virtual) machine, returns a fresh screenshot
# where needed, and the loop goes round again.
`

export function FrameworksAndProtocolsArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          Everything so far was built by hand on purpose: the loop, the tools, the plans, the approval gates. This
          topic is about the tools that do that work for you. Having written the loop yourself is what makes them easy
          to judge, because each one is a set of decisions about the same pieces, made in advance.
        </p>
      </section>

      <ArticleSection n={1} title="Agent frameworks">
        <p>
          An <Term id="agent-framework">agent framework</Term> packages the agent loop with the parts around it:
          turning functions into tool schemas, running tools and sending results back, keeping state, saving
          checkpoints, tracing runs. Here is the agent from Topic 5 written four ways, from no framework to a full
          one:
        </p>
        <Figure>
          <FrameworkTabs />
        </Figure>
        <p>
          <strong>LangGraph</strong>, from the LangChain team, models an agent as a graph. Nodes are steps (call the
          model, run tools, ask a person), edges say what runs next, and a shared state object flows through. The
          agent loop becomes two nodes and a conditional edge. The payoff comes with anything that isn’t a plain
          loop: the workflows and plans of Topic 7 are just graphs with more nodes, and the checkpointer saves the
          state after every step, which is what makes long runs resumable and lets a graph pause for human approval.
        </p>
        <p>
          <strong>The Claude Agent SDK</strong> is Claude Code as a library (it was called the Claude Code SDK until
          it was renamed). Instead of a loop with your tools, you get the harness Claude Code itself runs on: tools
          for reading, writing and searching files, a shell, web search, context compaction, subagents and
          permissions. Your own tools plug in as an MCP server running in the same process. It is the shortest path
          to an agent that does real work on a filesystem, and the least control over how the loop is built.
        </p>
        <p>
          <strong>The OpenAI Agents SDK</strong> is small on purpose. Its main pieces are agents (instructions plus
          tools), handoffs (one agent passing the conversation to another, from Topic 8), guardrails (checks that run
          alongside an agent) and sessions, with tracing built in. <strong>CrewAI</strong> describes multi-agent
          systems as a crew of role-playing agents, each with a role, a goal and a backstory, working through tasks.{' '}
          <strong>AutoGen</strong>, from Microsoft Research, built multi-agent systems out of agents messaging each
          other, and has since been merged with Semantic Kernel into the Microsoft Agent Framework.
        </p>
        <FrameworkTable />
        <p>
          <strong>Control versus convenience.</strong> Each framework saves code by making decisions for you: what
          goes into the history, how errors are reported, when to stop, how to retry. When those match what you
          need, that is pure gain. When they don’t, you end up debugging someone else’s loop through layers you
          didn’t write, and “Building Effective Agents” warns about exactly this: frameworks make it easy to start
          but can hide the prompts and responses that you need to see. A few rules of thumb:
        </p>
        <ul>
          <li>Start with the API directly. Many agents are under a hundred lines, as Topic 5 showed.</li>
          <li>
            Reach for a framework when it solves a problem you actually have: checkpoints and resumable runs, a
            complex graph of steps, or a full coding-agent harness you don’t want to rebuild.
          </li>
          <li>
            Whatever you use, make sure you can see the raw requests and responses. If a framework won’t show you
            the prompt it sent, you can’t fix it.
          </li>
        </ul>
      </ArticleSection>

      <ArticleSection n={2} title="Model Context Protocol (MCP)">
        <p>
          Before MCP, every AI application wrote its own integration for every tool: a GitHub connector for one chat
          app, another for an IDE, another for an agent framework. With N applications and M tools, that is N×M
          integrations, most of them doing the same thing. The <Term id="mcp">Model Context Protocol</Term>,
          released by Anthropic as an open standard in November 2024, turns that into N+M: each tool is wrapped once
          as an MCP server, each application implements the client side once, and any client can use any server.
          It is often compared to USB-C, and OpenAI, Google and Microsoft added support during 2025.
        </p>
        <p>
          <strong>The pieces.</strong> The <Term id="mcp-host">host</Term> is the AI application: Claude Code,
          Claude Desktop, an IDE or your own agent. For each server it connects to, it runs a client that keeps one
          connection open. Servers are programs that provide capabilities, either started locally and spoken to over
          stdin and stdout (the stdio transport) or reached remotely over HTTP (the Streamable HTTP transport). All
          messages are <Term id="json-rpc">JSON-RPC</Term> 2.0. A server can offer three kinds of thing:
        </p>
        <ul>
          <li>
            <strong>Tools</strong>, which the model calls: functions with a name, a description and an input schema,
            exactly as in Topic 4.
          </li>
          <li>
            <strong>
              <Term id="mcp-resource">Resources</Term>
            </strong>
            , data identified by a URI, such as a file or a record, which the application chooses to put into
            context.
          </li>
          <li>
            <strong>Prompts</strong>, reusable templates the user can pick, like slash commands.
          </li>
        </ul>
        <p>
          The protocol also runs the other way. Servers can ask the client for things: sampling (a model completion,
          so the server needs no API key of its own), elicitation (a question for the user) and roots (which
          directories it may work in). Step through one session to see the messages:
        </p>
        <Figure>
          <McpDemo />
        </Figure>
        <p>
          <strong>Using existing servers.</strong> There are MCP servers for most developer tools: GitHub, Slack,
          databases, browsers, file systems and many more, both official and community-built. Adding one to Claude
          Code is a single command, and the API can connect to remote servers itself through the MCP connector, with
          no client code at all:
        </p>
        <Figure>
          <Code title="Claude Code" lang="bash" code={MCP_ADD} />
        </Figure>
        <Figure>
          <Code title="the MCP connector in the Messages API" lang="python" code={MCP_CONNECTOR} />
        </Figure>
        <p>
          Installing a server means trusting it. Its tool descriptions go straight into the model’s context, so a
          malicious or compromised server can hide instructions there, and its tools run with whatever access you
          gave it. Simon Willison calls the dangerous combination the “lethal trifecta”: an agent with access to
          private data, exposure to untrusted content, and a way to send data out. Any one MCP server can add one of
          the three without you noticing. Use servers from sources you trust, give them the narrowest access that
          works, and keep approval on for tools that write or send. Topic 11 returns to this.
        </p>
        <p>
          <strong>Building your own.</strong> The official Python SDK includes FastMCP, which turns decorated
          functions into tools and resources, with the schema built from type hints and the description from the
          docstring, much like the tool runner. This is the milestone project’s second half: the note-saving tool
          from Topic 4, served over MCP so any client can use it.
        </p>
        <Figure>
          <Code title="notes_server.py" lang="python" code={MCP_SERVER} />
        </Figure>
        <p>
          Everything from Topic 4 about tool design still applies, because the descriptions are what the model
          reads. MCP changes who can use the tool, not how the model decides to call it.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Coding agents">
        <p>
          Coding agents are where everything in this course comes together, and the domain where agents work best
          today, because code comes with an unusually good environment: files to read, commands to run, and tests
          and compilers that say clearly whether something worked. Claude Code is the agent loop from Topic 5 with a
          carefully designed set of tools.
        </p>
        <p>
          <strong>How it works.</strong> Each turn follows the same pattern: gather context (search and read files),
          take action (edit files, run commands) and verify the result (run the tests, read the output), repeating
          until the task is done.
        </p>
        <Figure caption="One task in Claude Code, with the built-in tools each stage mostly uses.">
          <CodingCycle />
        </Figure>
        <p>
          The tools are deliberately few and general: read, write and edit files; find
          files by name and search their contents; run shell commands; fetch and search the web; keep a to-do list;
          and start <strong>subagents</strong>, which explore or work in their own context and return a summary, the
          orchestrator-worker pattern from Topic 8. Research on SWE-agent (Yang et al., 2024) showed why this
          design matters. Giving a model commands built for it, such as a file viewer that shows a window of lines
          and an edit command that checks the syntax, worked much better than handing it a raw shell. The authors
          call this the agent-computer interface, and they argue it deserves the same care as a user interface.
        </p>
        <p>
          Three more pieces handle long sessions. A <Term id="claude-md">CLAUDE.md</Term> file holds what the agent
          should always know about a project: build commands, conventions, things not to touch. When the context
          window fills, Claude Code clears old tool output and then summarizes the conversation (compaction, as in
          Topic 7), and the to-do list carries the plan across. And permission modes set how much it may do without
          asking, from asking before every edit and command, through accepting file edits automatically, to a plan
          mode that can read and propose but not change anything.
        </p>

        <h3 className="arc-h3">Hooks</h3>
        <p>
          Prompts and CLAUDE.md are instructions, and the model can misread or ignore an instruction. A{' '}
          <Term id="hook">hook</Term> is a guarantee. It is your own command, configured in a settings file, that
          Claude Code runs automatically at a fixed point in the loop: before a tool call (<code>PreToolUse</code>),
          after one (<code>PostToolUse</code>), when you submit a prompt (<code>UserPromptSubmit</code>), when Claude
          tries to finish (<code>Stop</code>), when a session starts or ends, before compaction, and more. The hook
          receives JSON describing the event on stdin, and what it prints back can allow the action, block it with a
          reason Claude reads, ask you to confirm, or add context. Not every event can do every one of these; click
          an event to see where it fires and what it can do:
        </p>
        <Figure>
          <HookLifecycle />
        </Figure>
        <p>
          <code>PreToolUse</code> is the one you’ll reach for first. It is Topic 7’s approval gate, moved out of the
          agent’s code and into configuration:
        </p>
        <Figure>
          <HooksDemo />
        </Figure>
        <p>
          Hooks live in <code>.claude/settings.json</code> for a project (checked into git, so the whole team gets
          them) or in your user settings. The <code>matcher</code> picks which tools a hook applies to, by name or
          pattern:
        </p>
        <Figure>
          <Code title=".claude/settings.json" lang="json" code={HOOK_SETTINGS} />
        </Figure>
        <Figure>
          <Code title=".claude/hooks/guard.py" lang="python" code={GUARD} />
        </Figure>
        <p>
          The <code>Stop</code> hook fixes one of Topic 5’s failure modes. Claude decides when it is done, and it can
          claim success it never checked. A Stop hook that runs the tests turns “done” into something the
          environment confirms: if they fail, the hook blocks the stop and hands Claude the failures as its next
          instruction. The <code>stop_hook_active</code> check stops a hook from sending Claude back forever on a
          problem it can’t fix.
        </p>
        <Figure>
          <Code title=".claude/hooks/tests_pass.py" lang="python" code={STOP_HOOK} />
        </Figure>
        <p>
          Other common uses: run the formatter or linter after every edit (<code>PostToolUse</code> on{' '}
          <code>Edit|Write</code>), protect files like <code>.env</code> from being read or changed, log every command
          for review, add the current branch or ticket to every prompt, or send a desktop notification when Claude
          needs input. A hook is code that runs with your permissions, so review hooks as carefully as any script,
          especially ones that come with a project you didn’t write.
        </p>
        {/* TODO: my hooks project goes here. */}

        <h3 className="arc-h3">Sandboxing</h3>
        <p>
          A pattern-matching hook like <code>guard.py</code> is a seatbelt, not a wall: there are endless ways to
          write a dangerous command that a regular expression won’t catch. The wall is a{' '}
          <Term id="sandbox">sandbox</Term>, enforced by the operating system rather than by checking text. Claude
          Code’s sandboxed shell uses Seatbelt on macOS and bubblewrap on Linux to limit which files commands can
          write (by default, the working directory) and sends all network traffic through a proxy that only lets
          approved domains through. Inside those limits, commands can run without asking, which is safer and less
          interrupting at once. The sandbox runtime is open source as <code>@anthropic-ai/sandbox-runtime</code>.
        </p>
        <p>
          For stronger isolation, run the whole agent somewhere disposable: a dev container, a virtual machine, or a
          cloud sandbox built on microVMs such as Firecracker. The rule from Topic 5 holds at every level. Don’t rely
          on the model to stay within bounds; make the bounds something it can’t cross.
        </p>
        <Figure caption="Layers around one command, from the outside in. Each wall still holds when the layer inside it fails.">
          <SandboxLayers />
        </Figure>
      </ArticleSection>

      <ArticleSection n={4} title="Computer and browser use">
        <p>
          Some software has no API, only a screen. <Term id="computer-use">Computer use</Term> gives the model the
          same interface a person has: it sees a screenshot, asks for a click, a scroll or some typing, and gets a new
          screenshot back. It is still the agent loop. Your code runs the actions on a virtual machine or container,
          and the model does the looking and deciding:
        </p>
        <Figure>
          <Code title="computer use" lang="python" code={COMPUTER} />
        </Figure>
        <p>
          Browser agents have more options, because a web page is more than pixels. They can read the page’s DOM or
          its <Term id="accessibility-tree">accessibility tree</Term>, the structured list of buttons, links and
          fields that screen readers use, and act on elements by reference instead of by coordinates. That is faster,
          cheaper and more reliable than reading screenshots, which is why tools like Microsoft’s Playwright MCP
          server use it. Screenshots remain the fallback for canvas apps, images and anything the tree describes
          badly.
        </p>
        <Figure>
          <PageViewsDemo />
        </Figure>
        <p>
          <strong>Capabilities and limits.</strong> Progress has been fast. When the OSWorld benchmark of 369 real
          desktop tasks was published in 2024, people completed 72% of them and the best model 12%. Claude’s first
          computer use release, in October 2024, scored 14.9%, and by late 2025 frontier models were above 60%.
        </p>
        <Figure caption="OSWorld task success. The dashed line marks people.">
          <OsworldChart />
        </Figure>
        <p>
          But computer use is still slower and more expensive than any API, since every step is a screenshot and a
          model call. It is brittle when layouts change, pop-ups appear or pages load slowly. And it is exposed to
          prompt injection from everything on screen: an agent reading web pages can be steered by text written for it
          on one of them. Practical use today means a dedicated, isolated machine, no access to accounts or data the task
          doesn’t need, a person confirming anything consequential like purchases or sending messages, and an API
          whenever one exists.
        </p>
        <Callout label="Checkpoint: what does MCP standardize, and what does it leave alone?">
          <p>
            MCP standardizes the connection between an AI application and its tools and data: how a server says
            what it offers, and how a client calls it, over JSON-RPC. It leaves the model and the agent loop alone.
            The model still sees ordinary tool definitions and still emits ordinary tool calls; it never knows a tool
            came from MCP. That is why a tool written once as an MCP server works in Claude Code, Claude Desktop,
            other vendors’ apps and your own agent alike, and also why everything from Topic 4 about writing good
            tool descriptions still decides whether the model uses it well.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
