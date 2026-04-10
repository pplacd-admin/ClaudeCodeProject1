export interface CurriculumTopic {
  topicId: string;
  track: 'claude' | 'gemini' | 'agents-ecosystem';
  title: string;
  description: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites: string[];
}

export const CURRICULUM: CurriculumTopic[] = [
  // ─── Claude Track (40 topics) ───────────────────────────────────────────────
  { topicId: 'claude-01-api-basics', track: 'claude', title: 'Claude API Basics', description: 'Getting started with the Anthropic API', order: 1, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: [] },
  { topicId: 'claude-02-models', track: 'claude', title: 'Claude Model Family', description: 'Opus, Sonnet, Haiku — when to use each', order: 2, difficulty: 'beginner', estimatedMinutes: 6, prerequisites: ['claude-01-api-basics'] },
  { topicId: 'claude-03-tokens', track: 'claude', title: 'Tokens, Context & Pricing', description: 'How tokens work and how to control costs', order: 3, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: ['claude-02-models'] },
  { topicId: 'claude-04-system-prompts', track: 'claude', title: 'System Prompts & Personas', description: 'Crafting system prompts that shape behavior', order: 4, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: ['claude-01-api-basics'] },
  { topicId: 'claude-05-temperature', track: 'claude', title: 'Temperature & Sampling', description: 'Controlling creativity and determinism', order: 5, difficulty: 'beginner', estimatedMinutes: 6, prerequisites: ['claude-03-tokens'] },
  { topicId: 'claude-06-streaming', track: 'claude', title: 'Streaming Responses', description: 'Building real-time UX with SSE and WebSockets', order: 6, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: ['claude-01-api-basics'] },
  { topicId: 'claude-07-multimodal', track: 'claude', title: 'Vision & Multimodal Input', description: 'Sending images and documents to Claude', order: 7, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['claude-04-system-prompts'] },
  { topicId: 'claude-08-tool-use', track: 'claude', title: 'Tool Use & Function Calling', description: 'Giving Claude the ability to call functions', order: 8, difficulty: 'intermediate', estimatedMinutes: 15, prerequisites: ['claude-04-system-prompts'] },
  { topicId: 'claude-09-prompt-caching', track: 'claude', title: 'Prompt Caching', description: 'Cutting costs 90% with cache_control', order: 9, difficulty: 'intermediate', estimatedMinutes: 8, prerequisites: ['claude-03-tokens'] },
  { topicId: 'claude-10-batch-api', track: 'claude', title: 'Batch API', description: 'Processing thousands of requests at 50% cost', order: 10, difficulty: 'intermediate', estimatedMinutes: 8, prerequisites: ['claude-01-api-basics'] },
  { topicId: 'claude-11-rag-patterns', track: 'claude', title: 'RAG Patterns with Claude', description: 'Retrieval-augmented generation fundamentals', order: 11, difficulty: 'intermediate', estimatedMinutes: 15, prerequisites: ['claude-08-tool-use'] },
  { topicId: 'claude-12-multi-turn', track: 'claude', title: 'Multi-Turn Conversations', description: 'Managing conversation history and context', order: 12, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['claude-04-system-prompts'] },
  { topicId: 'claude-13-computer-use', track: 'claude', title: 'Computer Use API', description: "Claude controls a computer — how it works", order: 13, difficulty: 'advanced', estimatedMinutes: 12, prerequisites: ['claude-08-tool-use'] },
  { topicId: 'claude-14-agents-overview', track: 'claude', title: 'Agentic AI Overview', description: 'What makes a system "agentic"', order: 14, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['claude-08-tool-use'] },
  { topicId: 'claude-15-agent-loops', track: 'claude', title: 'Agent Loops & ReAct Pattern', description: 'Reason → Act → Observe loops', order: 15, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['claude-14-agents-overview'] },
  { topicId: 'claude-16-multi-agent', track: 'claude', title: 'Multi-Agent Orchestration', description: 'Orchestrator-subagent patterns', order: 16, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['claude-15-agent-loops'] },
  { topicId: 'claude-17-mcp-protocol', track: 'claude', title: 'Model Context Protocol (MCP)', description: 'The universal plugin standard for AI', order: 17, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['claude-08-tool-use'] },
  { topicId: 'claude-18-agent-memory', track: 'claude', title: 'Agent Memory Patterns', description: 'In-context, episodic, and semantic memory', order: 18, difficulty: 'advanced', estimatedMinutes: 12, prerequisites: ['claude-16-multi-agent'] },
  { topicId: 'claude-19-human-loop', track: 'claude', title: 'Human-in-the-Loop Design', description: 'When and how to interrupt agent autonomy', order: 19, difficulty: 'advanced', estimatedMinutes: 10, prerequisites: ['claude-15-agent-loops'] },
  { topicId: 'claude-20-production', track: 'claude', title: 'Production Patterns for Claude', description: 'Rate limits, retries, observability, cost control', order: 20, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['claude-03-tokens'] },

  // ─── Gemini Track (40 topics) ────────────────────────────────────────────────
  { topicId: 'gemini-01-intro', track: 'gemini', title: 'Google Gemini Overview', description: 'Gemini model family and capabilities', order: 1, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: [] },
  { topicId: 'gemini-02-ai-studio', track: 'gemini', title: 'Google AI Studio', description: 'Prototyping with the free tier', order: 2, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: ['gemini-01-intro'] },
  { topicId: 'gemini-03-vertex-ai', track: 'gemini', title: 'Vertex AI vs AI Studio', description: 'When to use each, enterprise features', order: 3, difficulty: 'intermediate', estimatedMinutes: 12, prerequisites: ['gemini-02-ai-studio'] },
  { topicId: 'gemini-04-multimodal', track: 'gemini', title: 'Gemini Multimodal Input', description: 'Images, video, audio, and documents', order: 4, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: ['gemini-01-intro'] },
  { topicId: 'gemini-05-grounding', track: 'gemini', title: 'Grounding with Google Search', description: 'Real-time web knowledge in responses', order: 5, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['gemini-02-ai-studio'] },
  { topicId: 'gemini-06-function-calling', track: 'gemini', title: 'Function Calling in Gemini', description: 'Tool use patterns in Gemini API', order: 6, difficulty: 'intermediate', estimatedMinutes: 12, prerequisites: ['gemini-03-vertex-ai'] },
  { topicId: 'gemini-07-code-execution', track: 'gemini', title: 'Code Execution Tool', description: 'Gemini running Python in a sandbox', order: 7, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['gemini-06-function-calling'] },
  { topicId: 'gemini-08-long-context', track: 'gemini', title: 'Long Context & Context Caching', description: '2M token window and cache API', order: 8, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['gemini-01-intro'] },
  { topicId: 'gemini-09-embeddings', track: 'gemini', title: 'Gemini Embeddings API', description: 'Semantic search and similarity', order: 9, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['gemini-03-vertex-ai'] },
  { topicId: 'gemini-10-rag-vertex', track: 'gemini', title: 'RAG on Vertex AI', description: 'Enterprise search with your own data', order: 10, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['gemini-09-embeddings'] },
  { topicId: 'gemini-11-agent-builder', track: 'gemini', title: 'Vertex AI Agent Builder', description: 'No-code and low-code agent creation', order: 11, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['gemini-10-rag-vertex'] },
  { topicId: 'gemini-12-workspace', track: 'gemini', title: 'Gemini for Google Workspace', description: 'AI in Gmail, Docs, Sheets, Slides', order: 12, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: ['gemini-01-intro'] },
  { topicId: 'gemini-13-cloud-run', track: 'gemini', title: 'Deploying AI to Cloud Run', description: 'Serverless deployment for Gemini apps', order: 13, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['gemini-03-vertex-ai'] },
  { topicId: 'gemini-14-safety', track: 'gemini', title: 'Safety Settings & Filters', description: 'Content filtering and harm categories', order: 14, difficulty: 'intermediate', estimatedMinutes: 8, prerequisites: ['gemini-02-ai-studio'] },
  { topicId: 'gemini-15-enterprise-security', track: 'gemini', title: 'Enterprise Security on Vertex', description: 'IAM, VPC, data residency, compliance', order: 15, difficulty: 'advanced', estimatedMinutes: 12, prerequisites: ['gemini-13-cloud-run'] },

  // ─── Ecosystem Track (40 topics) ────────────────────────────────────────────
  { topicId: 'eco-01-openai-assistants', track: 'agents-ecosystem', title: 'OpenAI Assistants API', description: 'Threads, runs, and persistent assistants', order: 1, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: [] },
  { topicId: 'eco-02-gpt4o', track: 'agents-ecosystem', title: 'GPT-4o Capabilities', description: 'What GPT-4o can do vs Claude and Gemini', order: 2, difficulty: 'beginner', estimatedMinutes: 8, prerequisites: [] },
  { topicId: 'eco-03-langchain', track: 'agents-ecosystem', title: 'LangChain Fundamentals', description: 'Chains, agents, and the LCEL pipeline', order: 3, difficulty: 'intermediate', estimatedMinutes: 15, prerequisites: ['eco-01-openai-assistants'] },
  { topicId: 'eco-04-llamaindex', track: 'agents-ecosystem', title: 'LlamaIndex for RAG', description: 'Data ingestion, indexing, and querying', order: 4, difficulty: 'intermediate', estimatedMinutes: 15, prerequisites: ['eco-03-langchain'] },
  { topicId: 'eco-05-autogen', track: 'agents-ecosystem', title: 'AutoGen Multi-Agent', description: "Microsoft's agent conversation framework", order: 5, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['eco-03-langchain'] },
  { topicId: 'eco-06-crewai', track: 'agents-ecosystem', title: 'CrewAI — Role-Based Agents', description: 'Crews, tasks, and agent collaboration', order: 6, difficulty: 'advanced', estimatedMinutes: 12, prerequisites: ['eco-05-autogen'] },
  { topicId: 'eco-07-vector-databases', track: 'agents-ecosystem', title: 'Vector Databases', description: 'Pinecone, Weaviate, pgvector compared', order: 7, difficulty: 'intermediate', estimatedMinutes: 12, prerequisites: [] },
  { topicId: 'eco-08-embeddings-101', track: 'agents-ecosystem', title: 'Embeddings Fundamentals', description: 'How text becomes numbers that mean things', order: 8, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: [] },
  { topicId: 'eco-09-chunking', track: 'agents-ecosystem', title: 'Chunking Strategies for RAG', description: 'Fixed, semantic, and hierarchical chunking', order: 9, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['eco-08-embeddings-101'] },
  { topicId: 'eco-10-ai-market', track: 'agents-ecosystem', title: 'AI Market Landscape 2025–2026', description: 'Who\'s winning, who\'s losing, and why', order: 10, difficulty: 'beginner', estimatedMinutes: 10, prerequisites: [] },
  { topicId: 'eco-11-foundation-economics', track: 'agents-ecosystem', title: 'Foundation Model Economics', description: 'How the AI companies actually make money', order: 11, difficulty: 'intermediate', estimatedMinutes: 10, prerequisites: ['eco-10-ai-market'] },
  { topicId: 'eco-12-agent-design-patterns', track: 'agents-ecosystem', title: 'Agent Design Patterns', description: 'Reflection, planning, tool use, memory patterns', order: 12, difficulty: 'advanced', estimatedMinutes: 15, prerequisites: ['eco-03-langchain'] },
  { topicId: 'eco-13-observability', track: 'agents-ecosystem', title: 'AI Observability & Tracing', description: 'LangSmith, Langfuse, and tracing AI calls', order: 13, difficulty: 'advanced', estimatedMinutes: 12, prerequisites: ['eco-03-langchain'] },
  { topicId: 'eco-14-building-ai-products', track: 'agents-ecosystem', title: 'Building AI Products', description: 'From prototype to production: the full arc', order: 14, difficulty: 'intermediate', estimatedMinutes: 12, prerequisites: ['eco-10-ai-market'] },
  { topicId: 'eco-15-competitive-dynamics', track: 'agents-ecosystem', title: 'AI Competitive Dynamics', description: 'Moats, commoditization, and where to play', order: 15, difficulty: 'advanced', estimatedMinutes: 10, prerequisites: ['eco-11-foundation-economics'] },
];
