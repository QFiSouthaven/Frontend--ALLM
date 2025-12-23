import { HttpClient } from '../lib/http';
import { ChatMessage, ChatResponse, ChatChunk } from '../types';
import { ChatChunk as ChatChunkSchema, ChatResponseSchema } from '../types/schemas';

export class ChatEndpoints {
  constructor(private http: HttpClient) {}

  async chat(
    workspaceSlug: string, 
    messages: ChatMessage[], 
    options: { stream?: boolean; temperature?: number } = {}
  ): Promise<ChatResponse | AsyncIterable<ChatChunk>> {
    
    if (options.stream) {
      return this.streamChat(workspaceSlug, messages, options);
    }

    // Non-streaming
    return this.http.request<ChatResponse>({
      method: 'POST',
      url: `/workspace/${workspaceSlug}/chat`,
      data: { message: messages[messages.length - 1].content, mode: 'chat', ...options }
    }, ChatResponseSchema);
  }

  private async *streamChat(
    workspaceSlug: string,
    messages: ChatMessage[],
    options: any
  ): AsyncIterable<ChatChunk> {
    const response = await this.http.instance.get(`/workspace/${workspaceSlug}/stream-chat`, {
      params: { message: messages[messages.length - 1].content, ...options },
      responseType: 'stream',
    });

    const stream = response.data;
    
    // Simple SSE parsing logic
    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n').filter((l: string) => l.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace('data: ', '');
          if (jsonStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(jsonStr);
            // Use Zod to validate chunk structure safely
            const parsed = ChatChunkSchema.safeParse(data);
            if (parsed.success) {
              yield parsed.data;
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks in stream
          }
        }
      }
    }
  }
}