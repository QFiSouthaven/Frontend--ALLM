import { z } from 'zod';
import { HttpClient } from '../lib/http';
import { Workspace, WorkspaceDetail } from '../types';
import { WorkspaceSummary as WorkspaceSummarySchema, WorkspaceDetail as WorkspaceDetailSchema } from '../types/schemas';

export class WorkspaceEndpoints {
  constructor(private http: HttpClient) {}

  async list(): Promise<Workspace[]> {
    // API returns { workspaces: [...] } usually, but assuming direct array based on schema prompts
    // Defensive: Handle array response directly
    return this.http.request({ method: 'GET', url: '/workspaces' }, z.array(WorkspaceSummarySchema));
  }

  async create(params: { name: string; slug?: string }): Promise<Workspace> {
    return this.http.request({ method: 'POST', url: '/workspaces/new', data: params }, WorkspaceSummarySchema.or(z.object({ workspace: WorkspaceSummarySchema }).transform(d => d.workspace)));
  }

  async get(slug: string): Promise<WorkspaceDetail> {
    return this.http.request({ method: 'GET', url: `/workspace/${slug}` }, WorkspaceDetailSchema.or(z.object({ workspace: WorkspaceDetailSchema }).transform(d => d.workspace)));
  }

  async update(slug: string, updates: Partial<WorkspaceDetail>): Promise<WorkspaceDetail> {
    return this.http.request({ method: 'POST', url: `/workspace/${slug}/update`, data: updates }, WorkspaceDetailSchema.or(z.object({ workspace: WorkspaceDetailSchema }).transform(d => d.workspace)));
  }

  async delete(slug: string): Promise<void> {
    // void response
    return this.http.request({ method: 'DELETE', url: `/workspace/${slug}` }, z.any());
  }
}