import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import { Code } from './Code'
import { BackoffTimeline, CacheDiagram, RoundTrip } from './Diagrams'
import './llm-apis.css'
import { PromptCompare } from './PromptCompare'
import { RetryDemo } from './RetryDemo'
import { StreamDemo } from './StreamDemo'

const BASIC = `
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system="You are a concise travel assistant.",
    messages=[{"role": "user", "content": "Name three things to pack for a week in Iceland."}],
)

for block in response.content:
    if block.type == "text":
        print(block.text)
`

const HISTORY = `
history = []

while True:
    history.append({"role": "user", "content": input("> ")})
    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=history,  # the whole conversation, every time
    )
    history.append({"role": "assistant", "content": response.content})
    print(next(b.text for b in response.content if b.type == "text"))
`

const STREAM = `
with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a haiku about rain"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
`

const PARSE = `
response = client.messages.parse(
    model="claude-opus-5-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": f"Turn this into a ticket:\\n<email>\\n{email}\\n</email>"}],
    output_format=Ticket,  # the Pydantic class from above
)

ticket = response.parsed_output  # a validated Ticket instance
`

const CACHE = `
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": REFERENCE_DOCUMENT,  # long and identical on every request
        "cache_control": {"type": "ephemeral"},
    }],
    messages=history,
)

print(response.usage.cache_read_input_tokens)  # > 0 on a cache hit
`

const IMAGE = `
"content": [
  {
    "type": "image",
    "source": {"type": "base64", "media_type": "image/png", "data": "iVBORw0KGgo…"}
  },
  {"type": "text", "text": "What is the total on this receipt?"}
]
`

export function LlmApisArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          The first time I called a model from my own code, I was surprised by how little there was to it: one HTTP
          endpoint, a JSON body in, a JSON body out. Most of this topic is about what it takes to make that one call
          reliable enough to build on.
        </p>
        <Figure caption="A complete request and its response (response abridged). Everything else builds on this round trip.">
          <RoundTrip />
        </Figure>
      </section>

      <ArticleSection n={1} title="API fundamentals">
        <p>
          Every request needs an <Term id="api-key">API key</Term>, created in the provider’s console. It goes in an
          environment variable such as <code>ANTHROPIC_API_KEY</code>, usually loaded from a <code>.env</code> file
          that is listed in <code>.gitignore</code>. Keys committed to a public repository are found by automated scanners,
          often within minutes. You could call the HTTP endpoint directly, but the official <Term id="sdk">SDK</Term> handles
          headers, typing, streaming and retries for you, and finds the key in the environment on its own:
        </p>
        <Figure>
          <Code title="hello.py" lang="python" code={BASIC} />
        </Figure>
        <p>
          The request has four parts worth knowing. <code>model</code> picks the model. <code>max_tokens</code> caps
          the reply (see <Term id="max-tokens">max_tokens</Term>); it is required, and a reply that hits it is cut off
          mid-sentence. <code>system</code> holds the <Term id="system-prompt">system prompt</Term>, and{' '}
          <code>messages</code> is the <Term id="conversation-format">conversation</Term>: alternating{' '}
          <code>user</code> and <code>assistant</code> turns that must start with a user turn.
        </p>
        <p>
          The response is just as structured. Its <code>content</code> is a list of{' '}
          <Term id="content-blocks">content blocks</Term>, not a string, because one reply can mix text, a request to
          use a tool, or the model’s reasoning. That is why the code above loops and checks each block’s type.{' '}
          <Term id="stop-reason">stop_reason</Term> says why generation ended, and <code>usage</code> reports the
          tokens you are billed for.
        </p>
        <p>
          Topic 1 showed that the model is <Term id="stateless">stateless</Term>. In code, that means the conversation
          is a list you own. You append the user’s message, send the whole list, and append the reply:
        </p>
        <Figure>
          <Code title="chat.py" lang="python" code={HISTORY} />
        </Figure>
        <p>
          Generating a long answer takes seconds, and nobody wants to stare at a blank screen while it happens. With{' '}
          <strong>streaming</strong>, the API sends the response as it is generated, as{' '}
          <Term id="sse">server-sent events</Term>. Each event has a type: one opens the message, others open and
          close each content block, and the <code>content_block_delta</code> events in between carry the text a few
          characters at a time. Streaming also avoids HTTP timeouts on very long outputs.
        </p>
        <Figure>
          <StreamDemo />
        </Figure>
        <p>The SDK hides the event parsing behind a simple iterator:</p>
        <Figure>
          <Code title="stream.py" lang="python" code={STREAM} />
        </Figure>
        <p>
          Calls also fail, and the HTTP status tells you whether trying again can help. A <code>400</code> means the
          request itself is wrong (a missing field, an unknown parameter) and will fail the same way every time;{' '}
          <code>401</code> is a bad key. A <code>429</code> means you are over a rate limit, and <code>5xx</code>{' '}
          errors, including <code>529</code> when the service is overloaded, are temporary. Only the last two are
          worth retrying, and section 4 covers how. The SDK raises a distinct exception class for each case, so code
          can catch them separately instead of matching on error messages.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="Prompt engineering">
        <p>
          The model only knows what is in the request. The most useful habit is to write prompts as if for a capable
          new colleague who has no context: say who the output is for, what a good result looks like, how long it
          should be, and what to avoid. “Summarize this” leaves every one of those decisions to chance.
        </p>
        <p>
          The <Term id="system-prompt">system prompt</Term> is the place for things that hold for the whole
          conversation: a role (“You are a support triage assistant”), the audience, tone and hard rules. The user
          turn carries the task at hand.
        </p>
        <p>
          <Term id="few-shot">Few-shot examples</Term> are the fastest way to pin down a format. One or two worked
          examples of input and output usually beat a paragraph of description, because the model picks up the
          pattern through <Term id="in-context">in-context learning</Term>. Make examples varied, or the model will
          copy their quirks too.
        </p>
        <p>
          <Term id="xml-tags">XML tags</Term> keep the parts of a prompt apart. Wrapping the material in{' '}
          <code>&lt;email&gt;…&lt;/email&gt;</code> tells the model where the data starts and stops, so a sentence
          inside the email is read as content, not as an instruction to follow. That separation also matters for
          security, which Topic 11 returns to.
        </p>
        <Figure>
          <PromptCompare />
        </Figure>
        <p>
          Older advice says to add “think step by step”, and for multi-step problems, reasoning before answering does
          improve results. Current models do this on their own: Claude Opus 5.5 has thinking always on, decides how much
          to reason before replying, and you tune the depth with an <code>effort</code> setting rather than with
          prompt wording. Asking
          for reasoning in the prompt is still useful when you want to see it, for example inside{' '}
          <code>&lt;reasoning&gt;</code> tags that your code strips before showing the answer.
        </p>
        <p>
          Finally, prompt engineering is empirical. A change that fixes one input can quietly break another, so keep a
          small set of real test inputs, including the awkward ones, and rerun all of them after every edit. Ten
          examples you check by eye catch more regressions than any amount of rewording based on a single try. Topic 10
          turns this habit into proper evaluation.
        </p>
      </ArticleSection>

      <ArticleSection n={3} title="Structured output">
        <p>
          As soon as code, not a person, reads the reply, free text becomes a liability. Asking for JSON in the prompt
          works most of the time, but “most” is the problem: the model may wrap the JSON in a sentence, add a code
          fence, invent a field name, or pick a value your code does not accept.
        </p>
        <p>
          The fix is to treat the reply as untrusted input and validate it. In Python, a{' '}
          <Term id="pydantic">Pydantic</Term> model describes the shape you expect and raises a precise error when the
          data does not match. That error is also the best possible feedback for the model, so the standard pattern is
          a short retry loop:
        </p>
        <Figure>
          <RetryDemo />
        </Figure>
        <p>
          Many APIs now go one step further with <Term id="structured-outputs">structured outputs</Term>: you pass a
          JSON schema, and the response is constrained to match it. The Anthropic SDK accepts a Pydantic class
          directly and hands back a validated object:
        </p>
        <Figure>
          <Code title="ticket.py" lang="python" code={PARSE} />
        </Figure>
        <p>
          A schema guarantees shape, not truth. The JSON will parse and <code>urgency</code> will be one of the three
          allowed values, but whether “high” is the <em>right</em> urgency is still a judgment the model made. Rules
          that depend on meaning, like “a delivery date can’t be in the past”, still belong in your own validation.
        </p>
        <p>
          The two approaches combine well. Use structured outputs wherever the API supports them, since they remove
          the parsing failures entirely, and keep the validate-and-retry loop for the rules a schema can’t express.
          The same idea shows up in tool use: a tool’s arguments are also JSON described by a schema, and Topic 4
          relies on exactly this machinery.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Practical concerns">
        <p>
          <strong>Cost is counted in tokens.</strong> Every response’s <code>usage</code> reports input and output{' '}
          <Term id="tokens">tokens</Term>, and a token-counting endpoint can measure a request before you send it.
          Input and output are priced separately per million tokens; on current Claude models, output costs five
          times as much as input. Because a chat resends its history, input tokens grow with every turn.
        </p>
        <Callout label="Worked example (illustrative rates)">
          <p>
            Assume $3 per million input tokens and $15 per million output tokens. These are example numbers, not
            current prices; check the provider’s pricing page. One request with 2,000 input tokens and 500 output
            tokens costs 2,000 × $3/1M + 500 × $15/1M = $0.006 + $0.0075 ≈ <strong>$0.014</strong>. The same chat
            twenty turns later might send 30,000 input tokens per request, and input becomes most of the bill.
          </p>
        </Callout>
        <p>
          Two more levers are worth knowing before the big one. Not every request needs an instant answer: a
          batch API accepts thousands of requests at once and returns results asynchronously, at half the normal
          price, which suits nightly reports or labelling a dataset. And <code>max_tokens</code> is a cost ceiling as
          well as a length limit, since you never pay for more output than it allows.
        </p>
        <p>
          <strong>Rate limits</strong> cap how much you can send per minute: requests, input tokens and output
          tokens, per model, rising as your account’s usage tier grows. Exceed a limit and the API answers{' '}
          <code>429</code> with a <code>retry-after</code> header. The right response is to wait and try again with{' '}
          <Term id="backoff">exponential backoff</Term>, adding random jitter so a thousand clients don’t all retry in
          the same instant. The official SDKs already retry 429s and server errors this way, twice by default.
        </p>
        <Figure caption="Each wait roughly doubles. If the response includes retry-after, wait at least that long.">
          <BackoffTimeline />
        </Figure>
        <p>
          <Term id="prompt-caching">Prompt caching</Term> is the biggest cost lever for apps that resend the same
          large prefix: a long system prompt, a reference document, or a growing conversation. Mark the end of the
          stable part with <code>cache_control</code>; the first request writes that prefix to the cache (at about
          1.25× the normal input price for the default five-minute cache), and later requests that start with the
          exact same bytes read it back at about a tenth of the price, with lower latency.
        </p>
        <Figure caption="The cache matches a prefix of the request, in the order tools → system → messages.">
          <CacheDiagram />
        </Figure>
        <Figure>
          <Code title="cached.py" lang="python" code={CACHE} />
        </Figure>
        <p>
          The catch is in the word “exact”. A timestamp in the system prompt or a reordered tool list changes the
          prefix and silently turns every request into a cache miss. Put stable content first and anything that
          changes per request at the end, and check <code>cache_read_input_tokens</code> to confirm hits.
        </p>
        <p>
          Finally, <Term id="multimodal">multimodal input</Term> uses the same messages format. An image or a PDF is
          just another content block in the user turn, placed before the text that asks about it:
        </p>
        <Figure>
          <Code title="user message content" lang="json" code={IMAGE} />
        </Figure>
        <p>
          Images are converted to tokens too, with larger images costing more, so resizing a photo before sending it
          is an easy saving. PDFs are processed page by page as both extracted text and an image of each page, which
          lets the model read charts and tables but makes long documents expensive. They are also an obvious candidate
          for prompt caching when you ask several questions about the same file.
        </p>
        <p>
          With these pieces, one call becomes something you can rely on: a known request shape, streamed replies,
          prompts that say what they mean, output your code can trust, and costs and limits you can predict. Topic 4
          adds the last ingredient an agent needs, letting the model ask your code to run{' '}
          <Term id="tools">tools</Term>.
        </p>
      </ArticleSection>
    </>
  )
}
