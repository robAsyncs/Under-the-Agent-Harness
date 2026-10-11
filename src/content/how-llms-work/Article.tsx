import { ArticleSection, Callout, Figure } from '../../components/article/Article'
import { Term } from '../../components/article/Term'
import { ContextWindowDemo } from './ContextWindowDemo'
import { LandscapeTable, TrainingPipeline } from './Diagrams'
import { SamplerDemo } from './SamplerDemo'
import { TokenizerDemo } from './TokenizerDemo'
import './how-llms-work.css'

export function HowLlmsWorkArticle() {
  return (
    <>
      <section className="topic prose">
        <p className="prose-intro">
          For a long time I treated a language model as a black box that answered questions. Once I understood
          what it actually computes, most of its strange behavior stopped being mysterious: miscounted letters,
          invented citations, a different answer every time I asked. This page is the mental model that made
          that click.
        </p>
      </section>

      <ArticleSection n={1} title="The basics">
        <p>
          Topic 1 described a language model as a <Term id="next-token">next-token predictor</Term>. Concretely,
          a model has a fixed vocabulary of tokens. For a given input, it outputs one score per vocabulary entry,
          called the <Term id="logits">logits</Term>, and a <Term id="softmax">softmax</Term> turns those scores
          into a probability distribution. One token is picked, appended to the input, and the whole model runs
          again. A 500-token answer means 500 of these steps.
        </p>
        <p>
          That loop explains a practical asymmetry. The input (the prompt) can be processed in parallel in one
          pass, but the output has to be generated one token at a time. That is why long answers take longer
          than long prompts, and why providers typically charge more per output token than per input token.
        </p>
        <p>
          <Term id="tokens">Tokens</Term> are not words. Most modern tokenizers use{' '}
          <Term id="bpe">byte-pair encoding</Term>: start from single characters (or bytes) and repeatedly merge
          the most frequent adjacent pair into a new token. Frequent words end up as one token, rare words get
          split into pieces, and a leading space is usually part of the token. The demo below runs that algorithm
          on a tiny corpus. Drag the slider back to zero and watch the merges undo themselves.
        </p>
        <Figure>
          <TokenizerDemo />
        </Figure>
        <p>
          A useful rule of thumb for English is about four characters per token. Text in languages that were
          rare in the tokenizer's training data, and many kinds of code, take more tokens for the same content,
          so they cost more and fill the window faster. Tokenization also explains a famous failure: asked how
          many times the letter <em>r</em> appears in <em>strawberry</em>, a model is reasoning about a few tokens,
          not ten letters, so character-level questions are surprisingly hard for it.
        </p>
        <p>
          The <Term id="context-window">context window</Term> is the maximum number of tokens the model can
          handle in one request. Everything counts against it: the{' '}
          <Term id="system-prompt">system prompt</Term>, the conversation history, any tool results, and the
          response being generated. Because the model is <Term id="stateless">stateless</Term>, whatever falls
          outside the window simply does not exist for it. If a request is too long, the API rejects it, so
          applications have to decide what to cut.
        </p>
        <Figure>
          <ContextWindowDemo />
        </Figure>
        <p>
          A bigger window is not a free pass either. Long contexts are slower and more expensive, and models use
          them unevenly: Liu et al. (2023) found that accuracy drops when the relevant fact sits in the middle of
          a long input rather than near the start or end, an effect known as{' '}
          <Term id="lost-in-the-middle">lost in the middle</Term>.
        </p>
      </ArticleSection>

      <ArticleSection n={2} title="How models are made">
        <p>
          A chat model is built in stages. <Term id="pretraining">Pretraining</Term> is next-token prediction
          over trillions of tokens of web pages, books and code. No human labeling is needed, because the label
          for each position is simply the next token in the text. This stage uses the vast majority of the
          compute and is where the model's knowledge and general skills come from. The result is a{' '}
          <Term id="base-model">base model</Term>: an extremely good document completer with no notion of being
          an assistant.
        </p>
        <Callout label="Example: the same prompt, two models">
          <p>
            Prompt: <code>What is the capital of France?</code>
          </p>
          <p>
            <strong>Base model:</strong> “What is the capital of Germany? What is the capital of Italy? Test your
            knowledge with these 20 geography questions…” It continues the most likely kind of document: a quiz.
          </p>
          <p>
            <strong>Chat model:</strong> “The capital of France is Paris.”
          </p>
        </Callout>
        <p>
          <Term id="fine-tuning">Fine-tuning</Term> means continuing to train on a smaller, targeted dataset.{' '}
          <Term id="sft">Supervised fine-tuning</Term> (also called instruction tuning) uses written examples of
          prompts paired with ideal responses. The dataset is tiny compared with pretraining; the InstructGPT
          paper used about 13,000 training prompts. It teaches format and behavior more than new knowledge.
        </p>
        <p>
          Preference tuning comes last. In <Term id="rlhf">RLHF</Term>, people compare pairs of responses, a{' '}
          <Term id="reward-model">reward model</Term> learns to predict their preferences, and reinforcement
          learning pushes the LLM toward higher-scoring answers while a penalty keeps it close to the fine-tuned
          model. Newer methods simplify this: <Term id="dpo">DPO</Term> trains on the preference pairs directly,
          and Anthropic's Constitutional AI replaces many of the human comparisons with AI feedback guided by a
          written set of principles.
        </p>
        <Figure caption="Compute bars are illustrative: pretraining dominates the cost.">
          <TrainingPipeline />
        </Figure>
        <p>
          The “conversation” a chat model sees is still a single token sequence. A{' '}
          <Term id="chat-template">chat template</Term> wraps each message in special tokens that mark who is
          speaking, and fine-tuning teaches the model what an assistant turn looks like:
        </p>
        <Callout label="Illustrative chat template">
          <pre className="payload">
            {`<|system|>You are a concise travel assistant.<|end|>
<|user|>What is the capital of Canada?<|end|>
<|assistant|>`}
          </pre>
          <p>
            Each model family uses its own special tokens. The model generates from the open assistant turn and
            emits an end token when it is done.
          </p>
        </Callout>
      </ArticleSection>

      <ArticleSection n={3} title="Generation settings">
        <p>
          The settings you pass with a request control how the next token is chosen from the distribution.{' '}
          <Term id="temperature">Temperature</Term> divides the logits before the softmax:
        </p>
        <p className="equation">
          p<sub>i</sub> = exp(z<sub>i</sub> / T) / ∑<sub>j</sub> exp(z<sub>j</sub> / T)
        </p>
        <p>
          A temperature below 1 sharpens the distribution toward the most likely token; as it approaches 0, the
          model effectively always picks the top token (greedy decoding). A temperature above 1 flattens it, so
          unlikely tokens get picked more often. <Term id="top-p">Top-p</Term>, or nucleus sampling (Holtzman et
          al., 2019), works on the other end: it keeps only the smallest set of tokens whose probabilities add up
          to <em>p</em> and samples from those, cutting the long tail of odd choices that makes text go off the
          rails.
        </p>
        <Figure>
          <SamplerDemo />
        </Figure>
        <p>
          <Term id="max-tokens">Max tokens</Term> is a hard cap on the length of the output. Generation normally
          stops when the model emits its end token; if the cap is hit first, the response is cut off mid-sentence
          and the API reports that as the stop reason. It limits cost, but it does not make the model write more
          concisely. Instructions do that.
        </p>
        <p>
          Sampling is why the same prompt can give different answers: each run draws from the distribution
          again. Setting the temperature to 0 makes outputs far more repeatable, but providers generally do not
          guarantee identical results even then. Floating-point math on GPUs is not perfectly associative, and the
          exact numbers can depend on how your request was batched with others. Some models, especially
          reasoning models, also restrict which of these settings you can change.
        </p>
      </ArticleSection>

      <ArticleSection n={4} title="Strengths and limitations">
        <p>
          The same mechanism produces both the strengths and the failures. The model is excellent at anything
          that looks like patterns it has seen: writing, summarizing, translating, explaining, transforming
          formats, and writing common kinds of code. Its weaknesses come from the fact that it generates{' '}
          <em>plausible</em> text, not <em>verified</em> text.
        </p>
        <p>
          A <Term id="hallucination">hallucination</Term> is a fluent, confident statement that is false. Nothing
          in next-token prediction checks facts; when the model's knowledge is thin, the most likely continuation
          is still a well-formed, confident sentence. Kalai et al. (2025) add that training and evaluation often
          reward guessing: a benchmark that gives no credit for “I don't know” teaches the same strategy as a
          student guessing on a multiple-choice test.
        </p>
        <Callout label="A real example">
          <p>
            In <em>Mata v. Avianca</em> (2023), lawyers in New York filed a brief citing court decisions that
            ChatGPT had invented, complete with plausible case names, citations and quotes. The court sanctioned
            them. The citations looked exactly like real ones because the model had learned what citations look
            like, not which ones exist.
          </p>
        </Callout>
        <p>
          The practical fixes all move facts into the context instead of relying on memory: retrieving documents
          and asking the model to answer only from them (Topic 6), giving it tools such as search (Topic 4), and
          explicitly allowing it to say it does not know.
        </p>
        <p>
          The model's knowledge also has a <Term id="knowledge-cutoff">knowledge cutoff</Term>: it learned
          nothing after its training data was collected. It cannot know today's date, recent events or the latest
          version of a library unless that information is put in the context, and it is often unsure of its own
          cutoff.
        </p>
        <p>
          Reasoning is real but brittle. Apple's GSM-Symbolic study (Mirzadeh et al., 2024) took grade-school
          math problems and changed only names and numbers, and accuracy dropped; adding one irrelevant clause
          caused much larger drops. Models do best on problems that resemble their training data, and worst on
          long, exact procedures such as multiplying large numbers digit by digit.
        </p>
        <p>
          One reliable improvement is letting the model think on paper. With{' '}
          <Term id="chain-of-thought">chain-of-thought</Term> prompting (Wei et al., 2022), the model writes out
          intermediate steps before the answer, and every generated token is extra computation that later tokens
          can use. <Term id="reasoning-model">Reasoning models</Term> build this in: they are trained, largely
          with reinforcement learning on problems with checkable answers such as math and code, to produce a long
          internal reasoning trace before responding. DeepSeek-R1 (2025) published one such recipe and released the weights.
          The trade-off is cost and latency, since thinking tokens are billed and take up context, and the benefit
          is largest on multi-step problems rather than simple lookups.
        </p>
      </ArticleSection>

      <ArticleSection n={5} title="The model landscape">
        <p>
          A handful of labs train frontier models and sell access through APIs, including Anthropic (Claude),
          OpenAI (GPT) and Google (Gemini). Others publish their weights, including Meta (Llama), Mistral,
          DeepSeek and Alibaba (Qwen). Most families come in size tiers: a large, most capable model, and smaller
          models that are faster and cheaper per token. Specific versions change every few months; these
          trade-offs do not.
        </p>
        <p>
          Choosing a size is an engineering decision. A good default is to prove the task works with a capable
          model first, measure it, then try smaller models and keep the cheapest one that still passes. Many
          production systems mix tiers, sending easy requests to a small model and hard ones to a large one
          (Topic 10 covers measuring this).
        </p>
        <p>
          The other axis is access. An <Term id="open-weight">open-weight</Term> model can be downloaded, run on
          your own hardware and fine-tuned freely, although “open-weight” is not the same as open source: the
          training data and code usually stay private. An API-only model needs no infrastructure and is often more
          capable, but your data goes to the provider and the model can change under you.
        </p>
        <Figure>
          <LandscapeTable />
        </Figure>
        <Callout label="Checkpoint: why can an LLM confidently state something false?">
          <p>
            Because it generates the most plausible next token, not the most accurate one. Its knowledge is a
            compressed, frozen statistical memory of its training data with no built-in fact check, fine-tuning
            rewards sounding like a helpful expert, and sampling adds randomness on top. When the true answer is
            missing or weak in that memory, a confident-sounding wrong answer is still a very likely sequence of
            tokens.
          </p>
        </Callout>
      </ArticleSection>
    </>
  )
}
