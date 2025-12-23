import { HttpClient } from '../lib/http';
import { AgentSummary, AgentFull } from '../types';
import { AgentSummarySchema, AgentDetailSchema } from '../types/schemas';
import { z } from 'zod';

export class AgentEndpoints {
  constructor(private http: HttpClient) {}

  async list(workspaceSlug: string): Promise<AgentSummary[]> {
     return this.http.request({
         method: 'GET',
         url: `/workspace/${workspaceSlug}/agents`
     }, z.array(AgentSummarySchema));
  }

  async get(workspaceSlug: string, agentId: string): Promise<AgentFull> {
      return this.http.request({
          method: 'GET',
          url: `/workspace/${workspaceSlug}/agent/${agentId}`
      }, AgentDetailSchema);
  }
}
