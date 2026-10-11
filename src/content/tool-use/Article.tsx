import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import { Code } from '../llm-apis/Code'
import '../llm-apis/llm-apis.css'
import { DescriptionCompare } from './DescriptionCompare'
import { BeforeAfter, ToolFlow } from './Diagrams'
import { ParallelDemo } from './ParallelDemo'
import { ToolCallDemo } from './ToolCallDemo'
import './tool-use.css'

const DEFINE = `
tools = [
    {
        "name": "get_weather",
        "description": (
            "Current weather for one city: temperature in °C, wind in km/h and a short "
            "condition such as 'light rain'. Use it whenever the answer depends on "
            "today's weather. It has no forecasts or historical data."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City and country code, e.g. 'Cape Town, ZA'",
                },
            },
            "required": ["city"],
        },
    },
]

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "Do I need a jacket in Cape Town tonight?"}],
)
`

const HANDLE = `
TOOLS = {"get_weather": get_weather, "calculate": calculate, "save_note": save_note}

def run_tool(block):
    fn = TOOLS.get(block.name)
    if fn is None:
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True,
                "content": f"Unknown tool {block.name!r}. Available: {', '.join(TOOLS)}"}
    try:
        output = fn(**block.input)
    except Exception as e:  # report the failure to the model instead of crashing
        return {"type": "tool_result", "tool_use_id": block.id, "is_error": True,
                "content": f"{type(e).__name__}: {e}"}
    return {"type": "tool_result", "tool_use_id": block.id, "content": str(output)}

if response.stop_reason == "tool_use":
    results = [run_tool(b) for b in response.content if b.type == "tool_use"]
    messages.append({"role": "assistant", "content": response.content})
    messages.append({"role": "user", "content": results})
    response = client.messages.create(
        model=MODEL, max_tokens=1024, tools=tools, messages=messages,
    )
`

const CALCULATOR = `
import ast, operator

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
       ast.Div: operator.truediv, ast.Pow: operator.pow, ast.USub: operator.neg}

def calculate(expression: str) -> float:
    """Evaluate arithmetic like '2450 * 0.18' without ever calling eval()."""
    def ev(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](ev(node.operand))
        raise ValueError("Only numbers and + - * / ** are allowed")
    return ev(ast.parse(expression, mode="eval").body)
`

export function ToolUseArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          Everything up to this point produced text. Tool use is where that changes, and I was surprised to find that
          the API adds almost nothing new to make it happen: a list of function descriptions goes in with the request,
          and the model can answer with a request to call one. The model still only writes text. Your code does the
          rest.
        </p>
        <Figure caption="One tool call takes two model calls. Your code does the work in between.">
          <ToolFlow />
        </Figure>
      </section>

      <ArticleSection n={1} title="The concept">
        <p>
          Topic 2 ended with a model’s limits: its knowledge is frozen at a cutoff, it is unreliable at exact
          procedures such as arithmetic, and it can’t change anything outside the conversation. Tools address all
          three. A tool can fetch <strong>fresh data</strong> (today’s weather, a database row, a web page), do{' '}
          <strong>exact computation</strong> (a calculator, a code interpreter), or take an{' '}
          <strong>action</strong> (send an email, write a file, open a ticket).
        </p>
        <p>
          The mechanism is called <Term id="tools">tool use</Term>, or <Term id="function-calling">function calling</Term>.
          Along with the messages, you send a list of tool definitions. If the model decides a tool would help, its
          reply contains a <Term id="tool-use-block">tool_use block</Term> with the tool’s name and JSON arguments, and
          the response’s <Term id="stop-reason">stop_reason</Term> is <code>tool_use</code> instead of{' '}
          <code>end_turn</code>. Your code runs the function, sends the output back in a{' '}
          <Term id="tool-result">tool_result block</Term>, and calls the model again. Step through one complete
          exchange:
        </p>
        <Figure>
          <ToolCallDemo />
        </Figure>
        <p>
          Three details in that exchange matter. The tool result goes back in a <code>user</code> message, because
          from the API’s point of view it is new input from your side. The second request repeats everything,
          including the assistant’s tool request, because the model is still <Term id="stateless">stateless</Term>.
          And each result carries the <code>tool_use_id</code> of the request it answers, so the model can match them
          up.
        </p>
        <p>
          The model never touches the network, the file system or your database. It only proposes a call, and your
          code decides whether to make it. That is what makes tool use safe to build on: every action passes through
          code you wrote and can inspect.
        </p>
        <p>
          Models are not born knowing this format. Toolformer (Schick et al., 2023) showed that a model could teach
          itself when to insert API calls into its own text, and today’s chat models are fine-tuned on large numbers
          of tool-use conversations. The Berkeley Function Calling Leaderboard, from the team behind Gorilla (Patil et
          al., 2023), measures how reliably models pick the right function and fill in valid arguments. Even the best
          ones still get it wrong sometimes, which is why the rest of this page is about clear definitions and
          defensive code.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="Defining tools">
        <p>
          A tool definition has three parts: a <code>name</code>, a <code>description</code>, and an{' '}
          <Term id="input-schema">input_schema</Term> that describes the arguments in{' '}
          <Term id="json-schema">JSON Schema</Term>. The schema lists each parameter’s type, which ones are required,
          and optionally allowed values (<code>enum</code>), ranges and a description of its own.
        </p>
        <Figure>
          <Code title="define.py" lang="python" code={DEFINE} />
        </Figure>
        <p>
          The model sees none of your function’s code. Everything it knows about the tool is in that definition,
          which is added to the prompt on every request. So the description does the work a prompt does: it says what
          the tool returns, when to use it, and what it can’t do. Anthropic’s documentation suggests at least three or four
          sentences per tool, and in “Building Effective Agents” they write that, for their coding agent, they spent
          more time optimizing the tools than the overall prompt. Compare what a vague definition and a detailed one
          lead to:
        </p>
        <Figure>
          <DescriptionCompare />
        </Figure>
        <p>
          The arguments are generated text, so they can be wrong in the same ways a JSON reply can (Topic 3): a
          missing field, a string where a number belongs. With <Term id="strict-tools">strict tool use</Term>, you set{' '}
          <code>strict: true</code> on the definition and the API guarantees the input matches the schema. That
          guarantees the shape, not the sense: <code>"Springfield"</code> is a valid string.
        </p>
        <p>
          You can also steer whether tools are used at all with <Term id="tool-choice">tool_choice</Term>. The
          default, <code>auto</code>, lets the model decide; <code>none</code> turns tools off for one request. Some
          models also accept settings that force a call, but the newest Claude models reject those and expect you to
          say in the prompt when a tool should be used.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Handling tool calls">
        <p>
          On the code side, handling a tool call is a dispatch table. Loop over the reply’s content blocks, pick out
          the <code>tool_use</code> ones, look up each name in a dictionary of functions, and call it with the input
          as keyword arguments. The SDK has already parsed the input into a dictionary.
        </p>
        <Figure>
          <Code title="handle.py" lang="python" code={HANDLE} />
        </Figure>
        <p>
          Treat the arguments as untrusted input, because that is what they are: text produced by a model that may
          have read a malicious web page a moment earlier (Topic 11). A tool should check its inputs, run with the
          narrowest permissions it needs, and have a timeout. Never pass model output to <code>eval</code> or a shell.
          A calculator, for example, should parse the expression and allow only arithmetic:
        </p>
        <Figure>
          <Code title="calculator.py" lang="python" code={CALCULATOR} />
        </Figure>
        <p>
          Tools fail, and the model needs to hear about it. Return the error as a <code>tool_result</code> with{' '}
          <Term id="is-error">is_error</Term> set to <code>true</code> and a message explaining what went wrong. The
          model can then fix its arguments, try a different tool, or tell the user. Raising an exception in your loop
          instead ends the whole conversation over a typo in a city name.
        </p>
        <p>
          A single reply can also contain several <code>tool_use</code> blocks, called{' '}
          <Term id="parallel-tools">parallel tool calls</Term>, when the lookups don’t depend on each other. Run
          them concurrently, then return all the results together in one user message. Splitting them across several
          messages works, but it teaches the model by example to stop making parallel calls.
        </p>
        <Figure>
          <ParallelDemo />
        </Figure>
        <Callout label="You don’t have to write this loop">
          <p>
            The official SDKs include a <Term id="tool-runner">tool runner</Term>: you decorate ordinary Python
            functions, it builds the schemas from their type hints and docstrings, and it runs the call–execute–return
            cycle until the model is done. Writing it by hand once is still worth it, since Topic 5 builds on exactly
            this loop.
          </p>
        </Callout>
      </ArticleSection>

      <ArticleSection n={4} title="Designing good tools">
        <p>
          A tool is an interface for a reader who can’t ask follow-up questions. Anthropic’s “Writing effective tools
          for agents” makes the point that tools for agents are not the same as an API wrapper: an agent has limited
          context and pays for every token it reads, so the design goals are different.
        </p>
        <p>
          <strong>Keep tools focused and well named.</strong> Each tool should do one clear job, and its name should
          say what that job is: <code>search_orders</code> and <code>refund_order</code>, not{' '}
          <code>orders(action, ...)</code>. Avoid overlapping tools; if a person could not say which of two tools fits a
          request, the model can’t either. Namespacing related tools with a shared prefix (<code>calendar_list</code>,{' '}
          <code>calendar_create</code>) helps once there are many. More tools is not better: every definition costs
          tokens on every request and is one more option to choose wrongly between. Often a single tool that does a
          whole task (<code>schedule_meeting</code>) beats three low-level ones the model has to chain.
        </p>
        <p>
          <strong>Return what the model needs, not everything you have.</strong> A tool result goes straight into the{' '}
          <Term id="context-window">context window</Term>, where it costs money, pushes out other context, and buries
          the important part. Return the relevant fields, in readable names, and cap list sizes with pagination or a
          limit parameter.
        </p>
        <Figure>
          <BeforeAfter
            before={{
              label: 'Raw API response · ~200 tokens',
              code: `{"coord":{"lon":18.42,"lat":-33.93},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01n"}],"base":"stations","main":{"temp":286.15,"feels_like":284.9,"temp_min":285.2,"temp_max":287.04,"pressure":1018,"humidity":71,"sea_level":1018,"grnd_level":1012},"visibility":10000,"wind":{"speed":8.9,"deg":160,"gust":12.4},"clouds":{"all":0},"dt":1759687200,"sys":{"type":2,"id":2073,"country":"ZA","sunrise":1759636620,"sunset":1759681882},"timezone":7200,"id":3369157,"name":"Cape Town","cod":200}`,
              note: 'Kelvin, metres per second, Unix timestamps and internal ids. The model has to convert units and dig out the few useful numbers, and a forecast endpoint would be ten times longer.',
            }}
            after={{
              label: 'Shaped for the model · ~30 tokens',
              code: `{"city": "Cape Town, ZA", "temp_c": 13, "feels_like_c": 12, "wind_kph": 32, "condition": "clear", "local_time": "20:00"}`,
              note: 'The same facts in the units the user expects. Add a detail parameter if some callers really need more.',
            }}
          />
        </Figure>
        <p>
          <strong>Write errors the model can act on.</strong> An error message is a prompt: it is the only thing the
          model has to decide what to do next. A stack trace or <code>Error 400</code> leaves it guessing. A good
          error says what was wrong and what a valid call looks like.
        </p>
        <Figure>
          <BeforeAfter
            before={{
              label: 'Unhelpful error',
              lang: 'text',
              code: `KeyError: 'sprngfield'`,
              note: 'The model will likely retry the same call, or give up and tell the user the weather service is broken.',
            }}
            after={{
              label: 'Actionable error',
              lang: 'text',
              code: `No city named "Sprngfield". Did you mean "Springfield, Illinois, US" or "Springfield, Missouri, US"? Pass the city with its region and country.`,
              note: 'Sent with is_error: true. The model can fix the spelling, or ask the user which Springfield they meant.',
            }}
          />
        </Figure>
        <p>
          The way to find out whether a tool is well designed is to watch the model use it. Run realistic tasks, read
          the transcripts, and look for the tool calls that went wrong: a misread parameter, a tool called when
          another fit better, a result that needed three follow-up calls. Each one usually points to a sentence
          missing from a description. Once each tool works on its own, the next step is letting the model chain
          them, call after call, until a task is done. That is the agent loop, and it is Topic 5.
        </p>
      </ArticleSection>
    </>
  )
}
