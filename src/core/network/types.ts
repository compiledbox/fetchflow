export interface GraphQLOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
}

export interface GraphQLRequestPayload {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[]; extensions?: Record<string, unknown> }>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: object; // Will be serialized to JSON
  timeoutMs?: number;
  credentials?: RequestCredentials;
}
