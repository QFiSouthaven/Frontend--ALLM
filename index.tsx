import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- System Instruction ---
const SYSTEM_INSTRUCTION_PART_1 = `
# SYSTEM IDENTITY

You are a **Senior AnythingLLM Solutions Architect** with comprehensive, end-to-end expertise in the AnythingLLM platform (current stable version: v1.9.x series, December 2025). Your purpose is to transform users—specifically no-code AI enthusiasts—into proficient application developers using AnythingLLM as their "seat of command" for runtime AI applications powered by local LLMs and agentic workflows.

**Core Competencies**:
- Full-stack architecture (React/Vite frontend, Node.js/Express backend, document collector, vector databases)
- REST API mastery (OpenAPI 3.0.0 spec at \`/api/docs\`)
- Agent orchestration (Agent Flows, Custom Skills, MCP integration)
- Local LLM deployment & optimization (Ollama, LM Studio, vLLM, llama.cpp)
- RAG (Retrieval-Augmented Generation) system design & tuning
- Multi-deployment strategies (Desktop, Docker, Cloud)
- Runtime application architecture using AnythingLLM as a backend service

**Mental Model Reference**: Google AI Studio's "Build" feature for agent-based app development, but locally hosted with full privacy control.

**Communication Style**:
- Technical precision without jargon overload
- Proactively fill knowledge gaps for non-coders
- Assumption validation before providing solutions
- Future-proof design patterns by default
`;

const SYSTEM_INSTRUCTION_PART_2 = `
# BLUEPRINT 1: LOCALFORGE ARCHITECTURE REFERENCE (v2.0)

**Project Name**: LocalForge
**Core Constraints**: 100% Local, Offline-First, AnythingLLM as Runtime ONLY.

## 1. ARCHITECTURAL LAYERS (Strict Separation of Concerns)

### Layer 1: Developer Control Plane (Frontend)
- **Stack**: Vite + React 18 + TypeScript + shadcn/ui + Tailwind + Zustand.
- **Responsibilities**: Project CRUD, Natural Language Input, Real-time Agent Visualization, Config Editor.
- **Boundary**: NEVER talks to Layer 4 directly. ONLY communicates via Layer 2 (API Client).

### Layer 2: API Abstraction Shield (@localforge/anythingllm-client)
- **Stack**: TypeScript + Zod + axios + p-retry.
- **Responsibilities**: 
  - Version negotiation & graceful degradation.
  - Structured error mapping (HTTP -> Domain Errors).
  - Workspace/Thread persistence (LocalStorage/SQLite).
  - Defense: Semantic versioning diff detection.

### Layer 3: Agent Intelligence (LangGraph - Python)
- **Stack**: Python + LangGraph + Tenacity.
- **Responsibilities**:
  - Truth for control flow, planning, reflection, and routing.
  - Automatic RAG context injection.
  - Error recovery state machine.
- **Boundary**: Uses Layer 2 client for all inference & state retrieval.

### Layer 4: Runtime Engine (AnythingLLM - Docker)
- **Stack**: Docker (pinned v1.9.x) + PostgreSQL.
- **Responsibilities**:
  - LLM Inference (OpenAI-compatible endpoint).
  - Vector Store (LanceDB).
  - Document Ingestion/Chunking.
  - Workspace Memory.

## 2. CRITICAL INTERFACE CONTRACTS

1.  **Frontend ↔ API Client**: 
    - All calls async + typed (Zod). 
    - No raw HTTP codes leak to UI.
2.  **API Client ↔ AnythingLLM**:
    - Bearer Auth only. 
    - Workspace slug validated pre-operation.
    - 3x Exponential backoff on 5xx/Network.
3.  **LangGraph ↔ API Client**:
    - Uses \`get_llm(workspace_slug)\` factory.
    - Injects RAG context pre-inference.
    - Persists Thread_ID ↔ Workspace_Slug mapping.

## 3. PHYSICAL FOLDER STRUCTURE

\`\`\`text
localforge/
├── frontend/                     # Layer 1: Control Plane
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   │       └── anythingllm-client.ts
├── packages/
│   └── anythingllm-client/       # Layer 2: API Shield
├── agents/                       # Layer 3: LangGraph
│   ├── graphs/
│   ├── tools/
│   └── recovery_table.py
├── projects/                     # Generated User Projects
│   └── my-agent-system/
│       ├── src/
│       └── localforge.yaml
├── storage/                      # Layer 4: Persistent Volume
└── docker-compose.yml
\`\`\`

## 4. FAILURE RECOVERY BOUNDARIES

- **Unrecoverable** (Auth, 404): Layer 2 throws \`AuthError\` → Layer 1 triggers immediate Human Interrupt.
- **Recoverable** (Timeout, Context Overflow): Layer 4 Error → Layer 2 Structured Error → Layer 3 Recovery Node (Truncate/Retry) → Layer 1 Visualization (Yellow status).

## 5. UPGRADE & RESILIENCE VECTORS

1. **AnythingLLM Minor Version Upgrade**:
   - Pin exact Docker tag (e.g., mintplexlabs/anythingllm:1.9.15).
   - Run parallel :latest instance for smoke testing.
   - Maintain API contract tests (vitest) that fail on breaking changes.

2. **Model Swap / Quantization Change**:
   - Workspace model setting updated via API.
   - LangGraph LLM factory pulls current setting.
   - Recovery table includes model fallback paths.

3. **Container Death / Restart**:
   - API client auto-reconnects + workspace re-discovery.
   - Checkpoint recovery from disk.
   - Frontend shows "Runtime recovering..." state.

4. **Multi-User Transition Readiness**:
   - Multi-tenant workspace naming convention (e.g., \`user-slug-timestamp\`).
   - Role-based access control stub in API client.
   - Separation of SQLite/PostgreSQL per user context.
`;

const SYSTEM_INSTRUCTION_PART_3 = `
## 4B. OFFICIAL TYPESCRIPT CLIENT

**Package**: \`@localforge/anythingllm-client\`
**Recommendation**: Use this library for all Node.js/TypeScript integrations instead of raw fetch.

**Features**:
- **Type-Safe**: Full Zod schema validation for request/response.
- **Resilient**: Built-in exponential backoff and retry logic.
- **Real-Time**: Auto-reconnecting WebSocket support.

**Usage Example**:
\`\`\`typescript
import { AnythingLLMClient, ResourceNotFoundError } from '@localforge/anythingllm-client';

const client = new AnythingLLMClient({
  baseURL: 'http://localhost:3001',
  apiKey: process.env.ANYTHINGLLM_API_KEY
});

// Workspace Management
try {
  const ws = await client.workspaces.create({ name: 'Dev', slug: 'dev-workspace' });
} catch (err) {
    if (err instanceof ResourceNotFoundError) {
        console.error("Resource issue", err.message);
    }
}

// Streaming Chat
try {
  const stream = await client.chat.chat('dev-workspace', [{ role: 'user', content: 'Hello' }], { stream: true });
  for await (const chunk of stream) {
    if (chunk.textResponse) process.stdout.write(chunk.textResponse);
  }
} catch (err) {
  // Errors are now structured and actionable
  console.error(err);
}
\`\`\`
`;

const SYSTEM_INSTRUCTION_PART_4 = `
## BLUEPRINT 3: LANGGRAPH INTEGRATION TEMPLATE (v2.0)

**Responsibility**: Owns all agent control flow, routing, and recovery.

### Python Supervisor Pattern (\`agents/graphs/supervisor_with_error_handling.py\`)

**1. Error-Aware State Schema**
\`\`\`python
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    error_count: int
    last_error: Optional[dict] # { type, message, recoverable }
    recovery_attempts: int
\`\`\`

**2. Resilience Patterns**
- **LLM Factory**: Uses \`tenacity\` for exponential backoff on NetworkErrors.
- **Recovery Node**: Specialized node that catches exceptions from workers.
  - \`ContextOverflowError\` → Truncate history (keep last 8)
  - \`NetworkError\` → Retry with backoff
  - \`LLMToolError\` → Add correction prompt

**3. Flow Control**
- **Supervisor**: Router using \`gemini-3-pro-preview\` (via OpenAI compat).
- **Workers**: Specialized agents (Architect, Code Writer).
- **Edges**: \`supervisor\` → \`worker\` → \`supervisor\` (OR \`recovery\` if error).
`;

const SYSTEM_INSTRUCTION_PART_5 = `
## BLUEPRINT 4: NLP-DRIVEN DEVELOPMENT LOOP (v2.0)

**Responsibility**: Transform natural language into deployment-ready artifacts.

### Core Phasing
1. **Decomposition (YAML)**:
   - Input: "Build a CRM"
   - Output: \`project.yaml\` defining entities, API routes, and agent flows.
2. **Architecture (Skeleton)**:
   - Output: File tree representation.
3. **Generation (Artifacts)**:
   - Output: Actual code files (React components, Node handlers, Agent scripts).
   - Constraint: Must use \`@localforge/anythingllm-client\`.

### Error Recovery Protocol
When generating code or executing agents, adhere to this table:

| Error Type | Action |
|------------|--------|
| \`ContextWindowOverflowError\` | Truncate history (keep last 8 messages). |
| \`LLMTimeoutError\` | Reduce \`max_tokens\` by 30% and retry. |
| \`ToolCallFormatError\` | Inject correction prompt with example JSON. |
| \`EmbedderUnavailableError\` | Disable RAG fallback temporarily. |
| \`AuthError\` / \`404\` | **ESCALATE TO HUMAN**. |
`;

const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_PART_1 + SYSTEM_INSTRUCTION_PART_2 + SYSTEM_INSTRUCTION_PART_3 + SYSTEM_INSTRUCTION_PART_4 + SYSTEM_INSTRUCTION_PART_5;

// --- Types & Constants ---
type Mode = 'architect' | 'thinking' | 'search' | 'image';
type ImageSize = '1K' | '2K' | '4K';

interface Message {
  role: 'user' | 'model';
  text?: string;
  image?: string; // base64 data uri
  sources?: Array<{ title: string, uri: string }>;
}

const MODES: Record<Mode, { label: string, model: string }> = {
  architect: { label: 'Architect (Fast)', model: 'gemini-3-flash-preview' },
  thinking: { label: 'Deep Thinking', model: 'gemini-3-pro-preview' },
  search: { label: 'Web Search', model: 'gemini-3-flash-preview' },
  image: { label: 'Generate Image', model: 'gemini-3-pro-image-preview' }
};

// --- Components ---

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '20px',
    }}>
      <div style={{
        backgroundColor: isUser ? 'var(--user-msg-bg)' : 'var(--ai-msg-bg)',
        color: 'var(--text-color)',
        padding: '16px',
        borderRadius: '12px',
        maxWidth: '80%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace, monospace'
      }}>
        {msg.text && <div>{msg.text}</div>}
        {msg.image && (
          <img src={msg.image} alt="Generated Content" style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px' }} />
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #444', fontSize: '0.85rem' }}>
            <strong>Sources:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
              {msg.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.uri} target="_blank" rel="noopener noreferrer" style={{ color: '#5c6bc0' }}>
                    {s.title || s.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Array<Message>>([
    { role: 'model', text: 'Hello. I am your Senior AnythingLLM Solutions Architect. I can help you architect robust, private AI solutions using the AnythingLLM platform. Select a mode above to begin.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>('architect');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  
  // Refs to track session state across re-renders
  const chatSessionRef = useRef<any>(null);
  const currentModelRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Initialize default chat session on mount
  useEffect(() => {
    initChatSession('architect');
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChatSession = (mode: Mode) => {
    try {
      const modelName = MODES[mode].model;
      
      // Configuration based on mode
      let config: any = {
        systemInstruction: SYSTEM_INSTRUCTION,
      };

      if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      } else if (mode === 'search') {
        config.tools = [{ googleSearch: {} }];
      }
      
      // Note: Image mode does not use chat session
      if (mode !== 'image') {
        const chat = ai.chats.create({
          model: modelName,
          config: config,
        });
        chatSessionRef.current = chat;
        currentModelRef.current = modelName;
      }
    } catch (e) {
      console.error("Failed to initialize chat", e);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setActiveMode(newMode);
    // Reset or re-init session logic if switching between incompatible modes
    if (newMode !== 'image') {
       // Re-initialize chat session for the new mode to ensure correct config/tools
       initChatSession(newMode);
       // Optional: Add a system message indicating mode switch
       setMessages(prev => [...prev, { role: 'model', text: `Switched to **${MODES[newMode].label}** mode.` }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      if (activeMode === 'image') {
        // --- IMAGE GENERATION LOGIC ---
        
        // 1. Mandatory API Key Selection for Pro Image Model
        const win = window as any;
        if (win.aistudio) {
            const hasKey = await win.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await win.aistudio.openSelectKey();
            }
        }
        
        // 2. Create new AI instance to ensure fresh key is used
        const imageAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

        // 3. Call generateContent (NOT chat)
        const response = await imageAI.models.generateContent({
            model: MODES.image.model,
            contents: { parts: [{ text: userMsg }] },
            config: {
                imageConfig: {
                    imageSize: imageSize,
                    aspectRatio: "1:1"
                }
            }
        });

        // 4. Parse Response
        let imageUri: string | undefined;
        let textPart: string = "";
        
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                } else if (part.text) {
                    textPart += part.text;
                }
            }
        }

        setMessages(prev => [...prev, { 
            role: 'model', 
            text: textPart || (imageUri ? "Here is your generated image." : "Failed to generate image."),
            image: imageUri 
        }]);

      } else {
        // --- CHAT LOGIC (Architect, Thinking, Search) ---
        
        // Ensure session matches mode (defensive check)
        if (!chatSessionRef.current || currentModelRef.current !== MODES[activeMode].model) {
            initChatSession(activeMode);
        }

        setMessages(prev => [...prev, { role: 'model', text: '' }]);
        
        const result = await chatSessionRef.current.sendMessageStream({ message: userMsg });
        
        let fullText = '';
        let sources: Array<{ title: string, uri: string }> = [];

        for await (const chunk of result) {
          const text = chunk.text;
          if (text) {
              fullText += text;
          }
          
          // Collect Grounding Metadata if present (Search Mode)
          const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (groundingChunks) {
             groundingChunks.forEach((c: any) => {
                 if (c.web) {
                     sources.push({ title: c.web.title, uri: c.web.uri });
                 }
             });
          }

          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { 
                  role: 'model', 
                  text: fullText,
                  sources: sources.length > 0 ? sources : undefined
              };
              return newMessages;
          });
        }
      }

    } catch (error) {
      console.error("Error processing request:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Please check the logs or your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--chat-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00e676' }}></div>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>AnythingLLM Architect</h1>
             </div>
             <div style={{ fontSize: '0.8rem', color: '#888' }}>v1.9.x Spec Compliant</div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
                value={activeMode}
                onChange={(e) => handleModeChange(e.target.value as Mode)}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                }}
            >
                {Object.entries(MODES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>

            {activeMode === 'image' && (
                <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as ImageSize)}
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="1K">Size: 1K</option>
                    <option value="2K">Size: 2K</option>
                    <option value="4K">Size: 4K</option>
                </select>
            )}
        </div>
      </header>

      {/* Chat Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} msg={msg} />
          ))}
          {loading && messages[messages.length - 1]?.role !== 'model' && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', marginBottom: '20px' }}>
                <span>{activeMode === 'thinking' ? 'Reasoning deeply...' : activeMode === 'image' ? 'Generating visual...' : 'Thinking...'}</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer style={{
        padding: '20px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--chat-bg)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeMode === 'image' ? "Describe the image you want to generate..." : "Ask about Agents, RAG architecture, or Deployment..."}
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '1rem',
              resize: 'none',
              height: '50px',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              backgroundColor: 'var(--primary-color)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0 24px',
              fontSize: '1rem',
              cursor: 'pointer',
              opacity: loading || !input.trim() ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);