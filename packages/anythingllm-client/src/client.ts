import { z } from 'zod';
import { ClientConfig } from './types';
import { HttpClient } from './lib/http';
import { WebSocketConnection } from './lib/websocket';
import { WorkspaceEndpoints } from './endpoints/workspaces';
import { DocumentEndpoints } from './endpoints/documents'; 
import { ChatEndpoints } from './endpoints/chat';
import { AgentEndpoints } from './endpoints/agents'; 

export class AnythingLLMClient {
  private http: HttpClient;
  private config: ClientConfig;

  public workspaces: WorkspaceEndpoints;
  public documents: DocumentEndpoints;
  public chat: ChatEndpoints;
  public agents: AgentEndpoints;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
    
    this.http = new HttpClient(
      this.config.baseURL, 
      this.config.apiKey, 
      this.config.timeout, 
      this.config.retries
    );

    this.workspaces = new WorkspaceEndpoints(this.http);
    this.documents = new DocumentEndpoints(this.http);
    this.chat = new ChatEndpoints(this.http);
    this.agents = new AgentEndpoints(this.http);
  }

  public async verifyAuth(): Promise<{ authenticated: boolean }> {
    return this.http.request(
      { method: 'GET', url: '/auth' },
      z.object({ authenticated: z.boolean() })
    );
  }

  public connectWebSocket(workspaceSlug: string): WebSocketConnection {
    // Determine WS URL based on Base URL
    const wsBase = this.config.baseURL.replace(/^http/, 'ws');
    return new WebSocketConnection(`${wsBase}/ws/${workspaceSlug}`, this.config.apiKey);
  }
}
