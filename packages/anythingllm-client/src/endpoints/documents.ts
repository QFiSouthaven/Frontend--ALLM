import { HttpClient } from '../lib/http';
import { Document, SearchResult } from '../types';
import { DocumentDetail as DocumentSchema, SearchResult as SearchResultSchema } from '../types/schemas';
import { z } from 'zod';

export class DocumentEndpoints {
  constructor(private http: HttpClient) {}

  async uploadFile(workspaceSlug: string, file: any, options: { title?: string; tags?: string[] } = {}): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if(options.title) formData.append('title', options.title);
    if(options.tags) formData.append('tags', JSON.stringify(options.tags));

    const responseSchema = z.object({
       success: z.boolean(),
       documents: z.array(DocumentSchema).optional(),
       document: DocumentSchema.optional()
    }).transform(d => {
        const doc = d.documents?.[0] || d.document;
        if (!doc) throw new Error("No document returned");
        return doc;
    });

    return this.http.request({
      method: 'POST',
      url: '/document/upload',
      data: formData,
      // Critical: Set Content-Type to undefined so the browser/Axios can
      // automatically generate the correct boundary for multipart/form-data.
      headers: { 'Content-Type': undefined } as any
    }, responseSchema);
  }

  async uploadWebLink(workspaceSlug: string, url: string): Promise<boolean> {
     // Usually returns { success: true, error: null }
     return this.http.request({
      method: 'POST',
      url: '/document/process-link',
      data: { link: url }
    }, z.object({ success: z.boolean() }).transform(d => d.success));
  }

  async list(workspaceSlug: string): Promise<Document[]> {
      return this.http.request({
          method: 'GET',
          url: `/workspace/${workspaceSlug}/documents`
      }, z.object({ localFiles: z.object({ items: z.array(DocumentSchema) }) }).transform(d => d.localFiles.items));
  }

  async search(workspaceSlug: string, query: string, topK: number = 3): Promise<SearchResult[]> {
      return this.http.request({
          method: 'POST',
          url: `/workspace/${workspaceSlug}/chat`, // Using chat endpoint as search proxy often, or specific vector search if available
          data: { message: query, mode: 'query', topK }
      }, z.object({ 
          textResponse: z.string(), 
          sources: z.array(SearchResultSchema).optional().default([]) 
      }).transform(d => d.sources));
  }
}