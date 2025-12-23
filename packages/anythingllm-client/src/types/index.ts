import { z } from 'zod';
import * as Schemas from './schemas';

export interface ClientConfig {
  baseURL: string;              // e.g. http://localhost:3001
  apiKey: string;
  timeout?: number;             // default 30000 ms
  retries?: number;             // default 3
  debug?: boolean;
}

// Re-export inferred types (public API surface)
export type WorkspaceSummary = z.infer<typeof Schemas.WorkspaceSummary>;
export type WorkspaceDetail = z.infer<typeof Schemas.WorkspaceDetail>;
export type DocumentDetail = z.infer<typeof Schemas.DocumentDetail>;
export type SearchResult   = z.infer<typeof Schemas.SearchResult>;
export type ChatChunk      = z.infer<typeof Schemas.ChatChunk>;
export type ChatResponse   = z.infer<typeof Schemas.ChatResponseSchema>;
export type AgentSummary   = z.infer<typeof Schemas.AgentSummarySchema>;
export type AgentFull      = z.infer<typeof Schemas.AgentDetailSchema>;

// Aliases for backward compat / convenience
export type Workspace = WorkspaceSummary;
export type Document = DocumentDetail;

// Common primitives
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// WebSocket Message Types (Retained)
export type WebSocketMessage =
  | { type: 'workspace-updated'; payload: { slug: string; changes: Record<string, any> } }
  | { type: 'agent-started'; payload: { agentId: string; threadId: string; timestamp: string } }
  | { type: 'agent-thinking'; payload: { agentId: string; content: string } }
  | { type: 'agent-tool-call'; payload: { agentId: string; toolName: string; args: Record<string, any> } }
  | { type: 'agent-tool-result'; payload: { agentId: string; result: any; success: boolean } }
  | { type: 'agent-message'; payload: { agentId: string; role: 'assistant'; content: string } }
  | { type: 'agent-finished'; payload: { agentId: string; finalOutput?: string; error?: string } }
  | { type: 'error'; payload: { code: string; message: string; fatal: boolean } };
