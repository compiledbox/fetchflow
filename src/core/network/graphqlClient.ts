import { httpClient } from './httpClient';
import type { GraphQLOptions, GraphQLRequestPayload, GraphQLResponse } from './types';
import { FetchError } from '../errors/FetchError';

export async function graphqlClient<T>(
  endpoint: string,
  payload: GraphQLRequestPayload,
  options: GraphQLOptions = {},
): Promise<T> {
  const { headers = {}, timeoutMs, credentials = 'same-origin' } = options;

  try {
    const response = await httpClient<GraphQLResponse<T>>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: payload,
      timeoutMs,
      credentials,
    });

    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];
      throw FetchError.graphQLError(firstError.message);
    }

    if (response.data === undefined) {
      throw FetchError.unknownError(new Error('GraphQL response missing data'));
    }

    return response.data;
  } catch (error) {
    if (error instanceof FetchError) {
      throw error; // re-throw standardized errors
    }
    throw FetchError.unknownError(error instanceof Error ? error : undefined);
  }
}
