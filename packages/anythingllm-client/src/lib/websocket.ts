import EventEmitter from 'events';
import { AnythingLLMError } from '../errors';
import { WebSocketMessage } from '../types';

export class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private explicitlyClosed = false;

  constructor(private url: string, private apiKey: string) {
    super();
    this.connect();
  }

  private connect() {
    if (this.explicitlyClosed) return;

    try {
      this.ws = new WebSocket(`${this.url}?token=${this.apiKey}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('open');
      };

      this.ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data.toString());
          // Defensive: check for minimal structure
          if (rawData && typeof rawData === 'object' && 'type' in rawData) {
            const message = rawData as WebSocketMessage;
            this.emit('message', message);
            // Route specific events for convenience
            this.emit(message.type, message.payload);
          }
        } catch (e) {
          this.emit('error', new AnythingLLMError('WS_PARSE', 'WS Parse Error', undefined, false, undefined, undefined, { raw: event.data }));
        }
      };

      this.ws.onerror = (e) => {
        this.emit('error', new AnythingLLMError('WS_NET', 'WS Network Error'));
      };

      this.ws.onclose = () => {
        if (!this.explicitlyClosed) {
          this.handleReconnect();
        } else {
          this.emit('close');
        }
      };
    } catch (e) {
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      const delay = 1000 * Math.pow(2, this.reconnectAttempts);
      setTimeout(() => this.connect(), delay);
    } else {
      this.emit('error', new AnythingLLMError('WS_MAX_RETRY', 'Max reconnect attempts reached'));
    }
  }

  public close() {
    this.explicitlyClosed = true;
    this.ws?.close();
  }
}