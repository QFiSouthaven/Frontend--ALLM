import { z } from 'zod';

// Workspace schemas
export const WorkspaceSummary = z.object({
  name: z.string().min(1),
  slug: z.string().min(3),
  createdAt: z.string().datetime(),
  documentCount: z.number().int().nonnegative(),
}).passthrough();

export const WorkspaceDetail = WorkspaceSummary.extend({
  settings: z.object({
    llmProvider: z.string().optional(),
    embedder: z.string().optional(),
    similarityThreshold: z.number().min(0).max(1).optional(),
    topK: z.number().int().positive().optional(),
  }).passthrough().optional(),
});

// Document schemas
export const DocumentDetail = z.object({
  id: z.string().uuid(),
  title: z.string(),
  location: z.string(),
  type: z.enum(['file', 'web', 'raw', 'pdf']).catch('file'),
  createdAt: z.string().datetime(),
  lastUpdated: z.string().datetime().optional(),
  tags: z.array(z.string()).optional()
}).passthrough();

export const SearchResult = z.object({
  content: z.string(),
  score: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.any()).default({}),
  documentId: z.string().optional()
}).passthrough();

// Chat streaming chunks
export const ChatChunk = z.object({
  type: z.enum(['text', 'citation', 'stop', 'error', 'grounding']).catch('text'),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  chatId: z.string().optional(), // Preserved from v1 logic
  textResponse: z.string().optional(), // Legacy support
  sources: z.array(z.any()).optional() // Legacy support
}).passthrough();

// Retaining ChatResponseSchema for non-streaming compatibility
export const ChatResponseSchema = z.object({
  textResponse: z.string(),
  sources: z.array(z.object({
    title: z.string(),
    uri: z.string().optional(),
    text: z.string().optional()
  })).optional(),
  chatId: z.string().optional()
}).passthrough();

// Agent Schemas (Retained for agents endpoint)
export const AgentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  active: z.boolean(),
  config: z.record(z.string(), z.any()).optional()
}).passthrough();

export const AgentDetailSchema = AgentSummarySchema.extend({}).passthrough();
