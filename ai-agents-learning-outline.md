# AI Agents From the Ground Up: Detailed Outline

## Module 1: Programming Foundations

**Goal:** Be comfortable writing small Python programs that talk to the internet.

1. Python core
   - Variables, data types, control flow, functions
   - Lists, dictionaries, and list comprehensions
   - Classes and objects (enough to read library code)
   - Error handling with try/except
2. Working with data
   - JSON: parsing, creating, and validating
   - Reading and writing files
   - Type hints and Pydantic models (used heavily for structured output)
3. Talking to the web
   - HTTP basics: requests, responses, status codes, headers
   - The `requests` or `httpx` library
   - Environment variables and keeping API keys out of your code (`.env` files)
4. Async programming
   - What `async`/`await` does and why agents use it
   - Running multiple tasks concurrently
5. Developer tooling
   - Virtual environments and pip (or `uv`)
   - Git basics
   - Using a terminal comfortably

**Milestone project:** A script that fetches data from a public API (weather, news, etc.) and saves a cleaned-up summary to a JSON file.

---

## Module 2: How Large Language Models Work

**Goal:** Build an accurate mental model of what the model is and isn't doing.

1. The basics
   - Next-token prediction: what "generating text" actually means
   - Tokens and tokenization, and why they affect cost and limits
   - Context windows and what happens when you exceed them
2. How models are made
   - Pretraining vs. fine-tuning vs. instruction tuning vs. RLHF
   - Base models vs. chat models
3. Generation settings
   - Temperature, top-p, and max tokens
   - Determinism and why the same prompt can give different answers
4. Strengths and limitations
   - Hallucination and why it happens
   - Knowledge cutoffs
   - Reasoning abilities and their limits
   - Extended thinking / reasoning models
5. The model landscape
   - Major providers and model families
   - Choosing between large, capable models and small, fast, cheap ones
   - Open-weight models vs. API-only models

**Resources:** Andrej Karpathy's "Intro to Large Language Models" and "Deep Dive into LLMs" videos; 3Blue1Brown's neural network series for intuition.

**Milestone:** Explain to a friend, without notes, why an LLM can confidently state something false.

---

## Module 3: Working With LLM APIs

**Goal:** Call models directly and control their output reliably.

1. API fundamentals
   - Getting an API key and setting up the SDK
   - The messages format: system, user, and assistant roles
   - Statelessness: resending conversation history every call
   - Streaming responses
2. Prompt engineering
   - Writing clear, specific instructions
   - System prompts and role setting
   - Few-shot examples
   - Asking for step-by-step reasoning
   - Using delimiters or XML tags to separate instructions from data
3. Structured output
   - Getting reliable JSON back
   - Validating output with Pydantic
   - Handling malformed responses and retries
4. Practical concerns
   - Token counting and cost estimation
   - Rate limits and exponential backoff
   - Prompt caching
   - Multimodal inputs (images, PDFs)

**Resources:** Anthropic's prompt engineering docs and interactive tutorial; OpenAI's cookbook.

**Milestone project:** A command-line chatbot with conversation memory that can switch personas via the system prompt.

---

## Module 4: Tool Use (Function Calling)

**Goal:** Let a model take actions in the world through your code.

1. The concept
   - Why models need tools (fresh data, computation, actions)
   - The flow: model requests a tool → your code runs it → you return the result → model continues
2. Defining tools
   - Tool names, descriptions, and JSON Schema for parameters
   - Why tool descriptions matter as much as prompts
3. Handling tool calls
   - Parsing the model's tool request
   - Executing the function safely
   - Returning results and errors back to the model
   - Parallel tool calls
4. Designing good tools
   - Keeping tools focused and well-named
   - Returning useful, concise results (not giant data dumps)
   - Writing error messages the model can act on

**Milestone project:** An assistant with three tools: a calculator, a weather lookup, and a note-saver that writes to a file.

---

## Module 5: The Agent Loop

**Goal:** Build a working agent from scratch, with no framework.

1. What makes something an agent
   - Workflows (predefined steps) vs. agents (model decides the steps)
   - Autonomy levels and when each is appropriate
2. The core loop
   - Think → act → observe → repeat
   - Stopping conditions: task complete, max iterations, errors
3. Key patterns
   - ReAct (reasoning + acting)
   - Plan-and-execute
   - Reflection and self-critique
4. Building it yourself
   - Writing the loop in under 100 lines
   - Managing the growing message history
   - Logging every step so you can see what the agent is doing
5. Common failure modes
   - Infinite loops and repeated actions
   - The agent giving up too early or claiming false success
   - Tool misuse

**Resources:** The ReAct paper (Yao et al., 2022); Anthropic's "Building Effective Agents."

**Milestone project:** A from-scratch agent that can answer multi-step questions using web search and a calculator.

---

## Module 6: Memory and Retrieval (RAG)

**Goal:** Give agents access to more knowledge than fits in the context window.

1. Types of memory
   - Short-term: the conversation and context window
   - Long-term: stored facts, preferences, past interactions
   - Working memory: scratchpads and notes during a task
2. Durable state in the harness
   - Where it lives: transcripts, memory files, memory tools, workspace files, databases
   - What each store survives (compaction, a new session, a crash, a fresh machine)
   - Where it hooks into the loop: session start, tool calls, end of turn, before compaction
   - Who decides what to remember: the harness or the model
3. Embeddings
   - What an embedding is (meaning as a list of numbers)
   - Similarity search and cosine similarity
   - Embedding models and choosing one
4. Vector databases
   - Chroma, pgvector, Pinecone, Qdrant
   - Storing, indexing, and querying
5. Building a RAG pipeline
   - Loading documents
   - Chunking strategies (size, overlap, semantic chunking)
   - Retrieval and re-ranking
   - Injecting retrieved context into prompts
   - Hybrid search (keywords + embeddings)
6. Context management
   - Summarizing old conversation history
   - Deciding what to keep, compress, or drop
   - Agentic retrieval: letting the agent decide what to search for

**Milestone project:** A "chat with your documents" app that answers questions about a folder of PDFs and cites its sources.

---

## Module 7: Advanced Agent Architectures

**Goal:** Handle complex, long-running, multi-part tasks.

1. Workflow patterns
   - Prompt chaining
   - Routing (sending tasks to specialized handlers)
   - Parallelization
   - Evaluator-optimizer loops
2. Planning
   - Goal decomposition: breaking a goal into subgoals and tasks
   - Search-based planning: states, actions and searching for a path to the goal (STRIPS, A*), and LLM versions such as Tree of Thoughts and tree search
   - Planning graphs: Graphplan and why explicit search gets expensive
   - ReAct: choosing one step at a time instead of searching (recap of Module 5)
   - Plan-and-execute: a plan written up front, with dynamic replanning when things go wrong
   - Hierarchical planning: high-level plans refined into subtasks, the bridge to orchestrator-worker systems
   - Planning with memory: keeping plans and progress in a scratchpad, reusing past plans and skills
3. From one agent to many (introduces orchestrator-worker; covered in depth in Module 8)
4. Long-running agents
   - Saving state and resuming
   - Checkpointing progress
   - Handling tasks that span hours
5. Human-in-the-loop
   - Approval steps for risky actions
   - Asking clarifying questions
   - Interrupting and redirecting agents

**Milestone project:** A long-running agent that keeps its plan in a file, checkpoints after every step, resumes after a crash, and asks for approval before risky actions.

---

## Module 8: Multi-Agent Systems

**Goal:** Split work across agents with their own contexts, and orchestrate them from the harness.

1. Why use more than one agent
   - Context isolation, parallelism and specialization
   - The token cost, and when it is worth paying
2. Architectures
   - Orchestrator-worker
   - Handoffs between specialist agents
   - Pipelines of roles (MetaGPT, ChatDev)
   - Debate and voting
   - Blackboards and shared state
3. Communication and shared state
   - Writing complete briefs for workers
   - Returning short, structured results; files for large outputs
   - Shared stores and who owns what
   - Agent-to-agent protocols (A2A) and how they differ from MCP
4. Orchestration in the harness
   - In code, as a workflow
   - As a spawn_worker tool inside the loop
   - As handoffs, with permissions enforced in code
   - Caps, budgets, effort scaling and failed workers
5. When it fails, and when not to
   - Conflicting implicit decisions (Cognition's argument)
   - Failure taxonomies for multi-agent systems
   - Defaulting to one agent
6. Evaluating and debugging
   - Tracing a run as a tree of spans
   - Judging end results with a rubric
   - Human testing and whole-system prompt changes

**Milestone project:** A research agent where an orchestrator splits a question into subtopics, sends worker agents to research each, and combines the findings into a report.

---

## Module 9: Frameworks, SDKs, and Protocols

**Goal:** Use existing tools productively now that you understand what they abstract.

1. Agent frameworks
   - LangGraph (graph-based agent workflows)
   - Claude Agent SDK
   - OpenAI Agents SDK
   - CrewAI, AutoGen, and others
   - Comparing tradeoffs: control vs. convenience
2. Model Context Protocol (MCP)
   - What problem MCP solves
   - Clients, servers, tools, and resources
   - Using existing MCP servers
   - Building your own MCP server
3. Coding agents
   - How tools like Claude Code work
   - Agents that read, write, and run code
   - Sandboxing code execution
4. Computer and browser use
   - Agents that control browsers or desktops
   - Current capabilities and limits

**Milestone project:** Rebuild your Module 5 agent in a framework, then build an MCP server that exposes one of your own tools.

---

## Module 10: Evaluation and Reliability

**Goal:** Know whether your agent actually works, and make it better.

1. Why evaluation is hard for agents
   - Many valid paths to the same answer
   - Non-deterministic outputs
2. Building evaluations
   - Creating test datasets of tasks and expected outcomes
   - Code-based checks vs. LLM-as-judge vs. human review
   - Measuring success rate, steps taken, cost, and latency
3. Observability
   - Tracing every model call and tool call
   - Tools like LangSmith, Langfuse, and Braintrust
4. Improving performance
   - Error analysis: reading failed traces
   - Iterating on prompts and tool descriptions
   - Model selection and routing for cost
5. Production concerns
   - Timeouts and retries
   - Cost controls and budgets
   - Caching
   - Monitoring after deployment

**Milestone project:** Write a 20-case evaluation suite for one of your earlier agents, measure it, make three improvements, and measure again.

---

## Module 11: Safety and Security

**Goal:** Build agents that don't cause harm or get exploited.

1. Prompt injection
   - Direct vs. indirect injection (hidden instructions in web pages, emails, files)
   - Why it's an unsolved problem
   - Mitigation strategies
2. Permissions and sandboxing
   - Principle of least privilege for tools
   - Running code in isolated environments
   - Read-only vs. write access
3. Guardrails
   - Input and output filtering
   - Confirmations before irreversible actions
   - Spending and rate limits
4. Data privacy
   - Handling sensitive user data
   - What gets sent to model providers
5. Responsible deployment
   - Transparency with users
   - Failure handling and graceful degradation

**Milestone:** Try to break one of your own agents with prompt injection, then harden it.

---

## Capstone Project

Build an end-to-end agent that combines everything: tool use, memory or RAG, a well-designed agent loop, an evaluation suite, and safety guardrails. Good ideas include a personal research assistant, an email triage agent, a coding helper for a specific codebase, or a customer support agent for a fictional business. Deploy it somewhere others can try it.

---

## Rough Timeline (at ~10 hours/week)

| Module | Time |
|---|---|
| 1. Programming Foundations | 2–4 weeks (skip if you already code) |
| 2. How LLMs Work | 1 week |
| 3. Working With LLM APIs | 1 week |
| 4. Tool Use | 1 week |
| 5. The Agent Loop | 2 weeks |
| 6. Memory and Retrieval | 2 weeks |
| 7. Advanced Architectures | 2 weeks |
| 8. Multi-Agent Systems | 1–2 weeks |
| 9. Frameworks and Protocols | 1–2 weeks |
| 10. Evaluation and Reliability | 1–2 weeks |
| 11. Safety and Security | 1–2 weeks |
| Capstone | 3–4 weeks |

**Total:** roughly 4–6 months. The most important thing is building at every stage rather than just reading.
