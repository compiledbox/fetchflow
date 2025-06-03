export enum FetchErrorType {
  NetworkError = 'NetworkError',
  HttpError = 'HttpError',
  GraphQLError = 'GraphQLError',
  TimeoutError = 'TimeoutError',
  UnknownError = 'UnknownError',
}

interface FetchErrorOptions {
  type: FetchErrorType;
  message: string;
  statusCode?: number;
  originalError?: Error;
}

/**
 * Custom Error class for standardized fetch errors.
 */
export class FetchError extends Error {
  public readonly type: FetchErrorType;
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor({ type, message, statusCode, originalError }: FetchErrorOptions) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;

    // Ensures correct error instance type (for instanceof checks)
    Object.setPrototypeOf(this, FetchError.prototype);

    // Captures stack trace (excluding constructor call from it)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
  }

  /**
   * Factory method for HTTP errors.
   */
  static httpError(statusCode: number, message?: string): FetchError {
    return new FetchError({
      type: FetchErrorType.HttpError,
      statusCode,
      message: message || `HTTP Error: ${statusCode}`,
    });
  }

  /**
   * Factory method for network-related errors.
   */
  static networkError(originalError?: Error): FetchError {
    return new FetchError({
      type: FetchErrorType.NetworkError,
      message: 'Network error occurred. Please check your connection.',
      originalError,
    });
  }

  /**
   * Factory method for GraphQL errors.
   */
  static graphQLError(message: string, originalError?: Error): FetchError {
    return new FetchError({
      type: FetchErrorType.GraphQLError,
      message,
      originalError,
    });
  }

  /**
   * Factory method for timeout errors.
   */
  static timeoutError(timeoutMs: number): FetchError {
    return new FetchError({
      type: FetchErrorType.TimeoutError,
      message: `Request timed out after ${timeoutMs}ms.`,
    });
  }

  /**
   * Factory method for unknown or unexpected errors.
   */
  static unknownError(originalError?: Error): FetchError {
    return new FetchError({
      type: FetchErrorType.UnknownError,
      message: 'An unknown error occurred.',
      originalError,
    });
  }
}
