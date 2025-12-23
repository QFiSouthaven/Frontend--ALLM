export class AnythingLLMError extends Error {
  constructor(
    public code: string,
    public message: string,
    public httpStatus?: number,
    public recoverable: boolean = false,
    public retryAfterSeconds?: number,
    public userSuggestion?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AnythingLLMError';
    Object.setPrototypeOf(this, AnythingLLMError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.httpStatus,
      recoverable: this.recoverable,
      retryAfter: this.retryAfterSeconds,
      suggestion: this.userSuggestion,
      details: this.details,
    };
  }
}

export class AuthError extends AnythingLLMError {
  constructor(msg = 'Authentication failed', details?: any) {
    super('AUTH_FAILURE', msg, 401, false, undefined,
      'Invalid or expired API key. Regenerate it in Settings → API Keys.', details);
  }
}

export class ResourceNotFoundError extends AnythingLLMError {
  constructor(resource: string, slug?: string, details?: any) {
    super('RESOURCE_NOT_FOUND', `${resource} not found${slug ? ` (${slug})` : ''}`, 404, false, undefined,
      `The ${resource} no longer exists or was renamed.`, details);
  }
}

export class EmbedderUnavailableError extends AnythingLLMError {
  constructor(msg = 'Embedder service unavailable') {
    super('EMBEDDER_UNAVAILABLE', msg, 502, true, 30,
      'Document processing is temporarily down. Retrying automatically...', {});
  }
}

export class ValidationError extends AnythingLLMError {
    constructor(msg = 'Validation Failed', details?: any) {
        super('VALIDATION_ERROR', msg, 400, false, undefined, 'Request data is invalid.', details);
    }
}

export class RateLimitError extends AnythingLLMError {
    constructor(msg = 'Rate limit exceeded', retryAfter?: number) {
        super('RATE_LIMIT', msg, 429, true, retryAfter, 'You are sending requests too quickly.', {});
    }
}
