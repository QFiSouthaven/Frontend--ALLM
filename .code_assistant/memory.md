# Project Memory: AnythingLLM Architect Webapp

## Project Identity
**Role**: Senior AnythingLLM Solutions Architect.
**Goal**: Assist users in building runtime AI applications using AnythingLLM (v1.9.x), local LLMs, and agentic workflows.

## Current Architecture (LocalForge v2.0)

**Core Layers (Strict Separation of Concerns)**:
1.  **Layer 1: Developer Control Plane (Frontend)**
    - Tech: Vite, React 18, TypeScript, shadcn/ui, Zustand.
    - Role: User interaction, Visualization.
    - *Contract*: Uses ONLY Layer 2 Client.
2.  **Layer 2: API Abstraction Shield (@localforge/anythingllm-client)**
    - Tech: TypeScript, Zod, Axios, p-retry.
    - Role: Auth, Resilience, Structured Errors.
    - *Location*: `packages/anythingllm-client/`.
3.  **Layer 3: Agent Intelligence (LangGraph)**
    - Tech: Python, LangGraph, Tenacity.
    - Role: Control flow, Routing, Recovery.
    - *Location*: `agents/graphs/`.
4.  **Layer 4: Runtime Engine (AnythingLLM)**
    - Tech: Docker (v1.9.x), PostgreSQL, LanceDB.
    - Role: Inference, Storage, RAG.

## Implemented Features (as of Dec 2025)

### 1. Multi-Mode Operation (`index.tsx`)
The app supports dynamic mode switching:
- **Architect (Default)**: `gemini-3-flash-preview` for advice.
- **Deep Thinking**: `gemini-3-pro-preview` (32k budget).
- **Web Search**: `gemini-3-flash-preview` with tools.
- **Image Generation**: `gemini-3-pro-image-preview`.

### 2. Client Library (Layer 2)
- **Features**: Zod validation, Auto-retry, WebSocket reconnection.
- **Errors**: `AnythingLLMError`, `AuthError`, `ResourceNotFoundError`.

### 3. LangGraph Supervisor (Layer 3)
- **Features**: Error-Aware State, Recovery Node, Tenacity Retries.
- **Structure**: Supervisor -> [Workers] -> Supervisor/Recovery.

## Resilience & Upgrade Strategy (v2.0)
- **Runtime Pining**: Docker tag `mintplexlabs/anythingllm:1.9.15` (or latest stable).
- **Model Fallback**: LangGraph LLM factory handles model availability checks.
- **Recovery**: Frontend visualizes "Runtime Recovering" state via API Client signals.
- **Multi-User**: Namespace workspaces as `user-slug-timestamp` to future-proof for RBAC.

## Coding Guidelines (Critical)
1.  **SDK Usage**: Always use `import { GoogleGenAI } from "@google/genai"`.
2.  **Streaming**: Access text via property `chunk.text` (not method `chunk.text()`).
3.  **API Keys**:
    - Default: `process.env.API_KEY`.
    - High-Compute (Image/Veo): Must verify `window.aistudio` state.
4.  **Architecture**: Strict adherence to the 4-Layer LocalForge Model.

## Next Steps / Backlog
- Monitor `thinkingBudget` token usage.
- Refine markdown rendering for complex architectural diagrams.
- Add "Export Chat" functionality.
- [Done] Integrate Client into Architect Persona.
- [Done] Implement LangGraph Supervisor Template.
- [Done] Integrate NLP Development Loop Instructions.
- [Done] Refine Architecture to Ultra-Expanded v2.0 (Upgrade Vectors added).
