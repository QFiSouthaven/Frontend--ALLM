import pRetry, { AbortError } from 'p-retry';
import { AnythingLLMError } from '../errors';

export { AbortError };

export async function withRetry<T>(
  operation: () => Promise<T>, 
  retries: number = 3
): Promise<T> {
  return pRetry(operation, {
    retries,
    minTimeout: 1000,
    maxTimeout: 10000,
    randomize: true,
    onFailedAttempt: (error) => {
      // If error is explicitly marked unrecoverable in our error class, abort immediately
      if (error instanceof AnythingLLMError && !error.recoverable) {
        throw new AbortError(error);
      }
      // 4xx errors (except 429) are generally not retriable unless transient
      if (error instanceof AnythingLLMError && error.httpStatus && error.httpStatus >= 400 && error.httpStatus < 500 && error.httpStatus !== 429) {
        throw new AbortError(error);
      }
    }
  });
}