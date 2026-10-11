import { FrameworksAndProtocolsArticle } from '../../content/frameworks-and-protocols/Article'
import type { Topic } from '../../types'

export const frameworksAndProtocols: Topic = {
  id: 'frameworks-and-protocols',
  number: 9,
  title: 'Frameworks, SDKs, and Protocols',
  group: 'advanced',
  summary: 'Use existing tools productively now that you understand what they abstract.',
  sections: [],
  article: FrameworksAndProtocolsArticle,
  sources: [
    { title: 'LangGraph documentation', url: 'https://docs.langchain.com/oss/python/langgraph/overview' },
    { title: 'Anthropic, "Agent SDK overview"', url: 'https://code.claude.com/docs/en/agent-sdk/overview' },
    { title: 'OpenAI Agents SDK documentation', url: 'https://openai.github.io/openai-agents-python/' },
    { title: 'CrewAI documentation', url: 'https://docs.crewai.com/' },
    { title: 'Microsoft, AutoGen documentation', url: 'https://microsoft.github.io/autogen/' },
    { title: 'Anthropic, "Building Effective Agents" (2024)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { title: 'Anthropic, "Introducing the Model Context Protocol" (2024)', url: 'https://www.anthropic.com/news/model-context-protocol' },
    { title: 'Model Context Protocol specification', url: 'https://modelcontextprotocol.io/specification/2025-11-25' },
    { title: 'MCP Python SDK (FastMCP)', url: 'https://github.com/modelcontextprotocol/python-sdk' },
    { title: 'Anthropic, "MCP connector"', url: 'https://platform.claude.com/docs/en/agents-and-tools/mcp-connector' },
    { title: 'Simon Willison, "The lethal trifecta for AI agents" (2025)', url: 'https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/' },
    { title: 'Anthropic, "How Claude Code works"', url: 'https://code.claude.com/docs/en/how-claude-code-works' },
    { title: 'Anthropic, "Hooks reference"', url: 'https://code.claude.com/docs/en/hooks' },
    { title: 'Anthropic, "Configure the sandboxed Bash tool"', url: 'https://code.claude.com/docs/en/sandboxing' },
    { title: 'Yang et al., "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering" (2024)', url: 'https://arxiv.org/abs/2405.15793' },
    { title: 'Anthropic, "Computer use tool"', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool' },
    { title: 'Xie et al., "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments" (2024)', url: 'https://arxiv.org/abs/2404.07972' },
    { title: 'Microsoft, Playwright MCP server', url: 'https://github.com/microsoft/playwright-mcp' },
  ],
  project: 'Rebuild your Module 5 agent in a framework, then build an MCP server that exposes one of your own tools.',
  scenarios: ['coding'],
}
