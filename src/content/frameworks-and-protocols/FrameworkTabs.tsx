import { useState } from 'react'
import { Code } from '../llm-apis/Code'

type Version = { name: string; file: string; code: string; you: string; it: string }

const VERSIONS: Record<'raw' | 'runner' | 'sdk' | 'graph', Version> = {
  raw: {
    name: 'By hand',
    file: 'agent.py (Topic 5)',
    code: `
for i in range(1, MAX_ITERATIONS + 1):
    response = client.messages.create(
        model=MODEL, max_tokens=16000, system=SYSTEM, tools=TOOLS, messages=messages,
    )
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason == "end_turn":
        return "".join(b.text for b in response.content if b.type == "text")
    if response.stop_reason == "pause_turn":
        continue
    if response.stop_reason != "tool_use":
        return f"Stopped early: {response.stop_reason}"

    results = [run_tool(b) for b in response.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})
# ...plus the tool schemas, run_tool, logging and limits: about 90 lines in all
`,
    you: 'Everything: every stop reason, every limit, what goes into the history, how errors are reported.',
    it: 'Nothing. Every behavior is a line you can read and change.',
  },
  runner: {
    name: 'Tool runner',
    file: 'agent_runner.py',
    code: `
import anthropic
from anthropic import beta_tool
import calculator  # the safe evaluator from Topic 4

client = anthropic.Anthropic()

@beta_tool
def calculate(expression: str) -> str:
    """Evaluate an arithmetic expression with + - * / ** and parentheses.

    Args:
        expression: The expression, e.g. '2800000 / 140000'.
    """
    return str(calculator.calculate(expression))

runner = client.beta.messages.tool_runner(
    model="claude-opus-5-5", max_tokens=16000, system=SYSTEM,
    tools=[{"type": "web_search_20260209", "name": "web_search", "max_uses": 5}, calculate],
    messages=[{"role": "user", "content": input("Question: ")}],
)
for message in runner:  # one message per model call, until no more tools are requested
    last = message
print("".join(b.text for b in last.content if b.type == "text"))
`,
    you: 'The tools, the prompt, and any checks you add between iterations of the for loop.',
    it: 'The loop itself, the JSON schemas (built from the type hints and docstring) and sending tool results back. A paused server-tool turn simply ends the loop, so you still check stop_reason.',
  },
  sdk: {
    name: 'Claude Agent SDK',
    file: 'agent_sdk.py',
    code: `
import asyncio
from claude_agent_sdk import (ClaudeAgentOptions, ResultMessage,
                              create_sdk_mcp_server, query, tool)
import calculator  # the safe evaluator from Topic 4

@tool("calculate", "Evaluate an arithmetic expression with + - * / ** and parentheses.",
      {"expression": str})
async def calculate(args):
    return {"content": [{"type": "text", "text": str(calculator.calculate(args["expression"]))}]}

options = ClaudeAgentOptions(
    system_prompt=SYSTEM,
    mcp_servers={"math": create_sdk_mcp_server(name="math", version="1.0.0", tools=[calculate])},
    allowed_tools=["WebSearch", "mcp__math__calculate"],  # run these without asking
    max_turns=10,
)

async def main():
    async for message in query(prompt=input("Question: "), options=options):
        if isinstance(message, ResultMessage):
            print(message.result)

asyncio.run(main())
`,
    you: 'The prompt, which tools are allowed, and hooks or a permission callback for anything else.',
    it: 'The whole Claude Code harness: the loop, built-in tools (files, shell, search), context compaction, sessions and subagents. Your own tools are exposed as an in-process MCP server.',
  },
  graph: {
    name: 'LangGraph',
    file: 'agent_graph.py',
    code: `
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
import calculator  # the safe evaluator from Topic 4

@tool
def calculate(expression: str) -> str:
    """Evaluate an arithmetic expression with + - * / ** and parentheses."""
    return str(calculator.calculate(expression))

tools = [calculate]  # web search left out for brevity
model = ChatAnthropic(model="claude-opus-5-5").bind_tools(tools)

def call_model(state: MessagesState):
    return {"messages": [model.invoke(state["messages"])]}

graph = StateGraph(MessagesState)
graph.add_node("model", call_model)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "model")
graph.add_conditional_edges("model", tools_condition)  # tool call -> "tools", else end
graph.add_edge("tools", "model")
app = graph.compile(checkpointer=InMemorySaver())  # state saved after every step

result = app.invoke({"messages": [("user", input("Question: "))]},
                    {"configurable": {"thread_id": "run-1"}})
print(result["messages"][-1].content)
`,
    you: 'The shape of the loop, drawn as nodes and edges. Adding a planning node, an approval step or a second agent means adding nodes.',
    it: 'Running the graph, passing state between nodes, and checkpointing after every step, which gives you resume, replay and human-in-the-loop pauses.',
  },
}

export function FrameworkTabs() {
  const [mode, setMode] = useState<keyof typeof VERSIONS>('raw')
  const v = VERSIONS[mode]

  return (
    <div className="demo">
      <div className="demo-controls agl-tabs-head">
        <div className="speed" role="group" aria-label="Implementation">
          {(Object.keys(VERSIONS) as (keyof typeof VERSIONS)[]).map((k) => (
            <button key={k} type="button" className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>
              {VERSIONS[k].name}
            </button>
          ))}
        </div>
        <span className="small muted">The Topic 5 agent: web search + a calculator</span>
      </div>
      <Code key={mode} title={v.file} lang="python" code={v.code} />
      <dl className="agl-proscons fp-proscons">
        <div>
          <dt>You write</dt>
          <dd>{v.you}</dd>
        </div>
        <div>
          <dt>It handles</dt>
          <dd>{v.it}</dd>
        </div>
      </dl>
    </div>
  )
}
