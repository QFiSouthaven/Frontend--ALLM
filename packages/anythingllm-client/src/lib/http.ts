import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { AnythingLLMError, ValidationError } from '../errors';
import { mapToAnythingLLMError } from './errorMapper';
import { withRetry } from './retry';

export class HttpClient {
  private axios: AxiosInstance;
  private maxRetries: number;

  constructor(baseURL: string, apiKey: string, timeout: number = 30000, retries: number = 3) {
    this.maxRetries = retries;
    this.axios = axios.create({
      baseURL: `${baseURL.replace(/\/$/, '')}/api/v1`,
      timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async request<T>(
    config: AxiosRequestConfig, 
    schema: z.ZodType<T>
  ): Promise<T> {
    return withRetry(async () => {
      try {
        const response = await this.axios.request(config);
        
        // Validation Step
        const result = schema.safeParse(response.data);
        if (!result.success) {
          // Wrap Zod error
          throw new ValidationError(
            'Client schema mismatch with server response', 
            { errors: result.error.issues, data: response.data }
          );
        }
        return result.data;
      } catch (err: any) {
        throw mapToAnythingLLMError(err);
      }
    }, config.method?.toLowerCase() === 'get' ? this.maxRetries : 0); 
  }

  get instance() { return this.axios; }
}