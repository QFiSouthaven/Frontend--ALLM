import { AxiosError } from 'axios';
import { 
  AnythingLLMError, 
  AuthError, 
  ResourceNotFoundError, 
  EmbedderUnavailableError,
  ValidationError,
  RateLimitError
} from '../errors';

export function mapToAnythingLLMError(err: unknown): AnythingLLMError {
  if (err instanceof AnythingLLMError) return err;

  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data ?? {};

    // High-priority mappings
    if (status === 401 || status === 403) {
      return new AuthError(data.error || err.message, data);
    }

    if (status === 404 || (data.error && /not found/i.test(data.error))) {
      const resource = guessResourceFromMessage(data.error);
      return new ResourceNotFoundError(resource, undefined, data);
    }

    if (status === 429) {
        return new RateLimitError(data.error || 'Rate limit exceeded');
    }

    if (status === 502 || status === 504) {
      return new EmbedderUnavailableError(data.error);
    }
    
    if (status === 400) {
        return new ValidationError(data.error || 'Bad Request', data);
    }

    // Generic fallback
    return new AnythingLLMError(
      'UNKNOWN_SERVER_ERROR',
      data.error || err.message || 'Unknown server error',
      status,
      status ? status >= 500 : false,
      status && status >= 500 ? 30 : undefined,
      status && status >= 500 ? 'Server issue detected. Retrying...' : 'Unexpected error occurred.',
      { responseData: data }
    );
  }

  // Non-HTTP errors (network, timeout, etc.)
  if (err instanceof Error) {
    if (/timeout/i.test(err.message)) {
      return new AnythingLLMError('TIMEOUT', err.message, undefined, true, 30, 'Request timed out. Retrying...', {});
    }
    if (/network|connection/i.test(err.message)) {
      return new AnythingLLMError('NETWORK_FAILURE', err.message, undefined, true, 10, 'Network issue. Retrying...', {});
    }
  }

  // Last resort
  return new AnythingLLMError('CLIENT_UNEXPECTED', String(err), undefined, false, undefined, 'Unexpected client error.', {});
}

// Simple heuristic to guess resource type
function guessResourceFromMessage(msg?: string): string {
  const lower = (msg || '').toLowerCase();
  if (lower.includes('workspace')) return 'workspace';
  if (lower.includes('document')) return 'document';
  if (lower.includes('agent')) return 'agent';
  return 'resource';
}
