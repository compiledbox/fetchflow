# FetchFlow

## Purpose

**FetchFlow** A modern, production-ready data fetching library for React. FetchFlow helps you fetch, cache, and manage data from REST or GraphQL APIs with minimal code, strong TypeScript support, robust error handling, retries, and performance-focused caching. It unifies REST and GraphQL requests with built-in caching, retries, and robust error handling. Designed for modern apps—no boilerplate, just reliable data, fast.

## Why FetchFlow?

- **No more boilerplate**: Unified hooks for REST and GraphQL, so you never re-write the same fetch/useEffect code again.
- **Automatic caching & retries**: Avoid unnecessary network calls, handle flaky networks gracefully.
- **Consistent error handling**: Standardized error objects, so you never need to guess why a request failed.
- **Framework focused**: Built for React (Vue support can be requested via issues).

## Key Features

- Works with REST and GraphQL out of the box.
- Type-safe React hooks: useFetch, usePoll, useMutation
- Built-in cache (memory & localStorage)
- Retry with backoff for transient errors
- Clean error messages via a single FetchError class
- Easy to extend and contribute

## Installation

```bash
npm install fetchflow
```

## Quick Usage

### 1. Simple REST Fetch

```typescript
import { useFetch } from 'fetchflow';

const { data, isLoading, error, refetch } = useFetch<User[]>(
  'https://jsonplaceholder.typicode.com/users',
);
```

### 2. POST/PUT/DELETE with useMutation

```typescript
import { useMutation } from 'fetchflow';

const { mutate, isMutating, error } = useMutation<User, Partial<User>>({
  url: 'https://api.example.com/users',
  method: 'POST',
  onSuccess: (created) => alert('User created: ' + created.id),
});
```

### 3. Polling Data (auto refresh)

```typescript
import { usePoll } from 'fetchflow';

const { data } = usePoll<User[]>('https://api.example.com/users', { intervalMs: 10000 });
```

## GraphQL Example

```typescript
import { graphqlClient } from 'fetchflow';

const query = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

const data = await graphqlClient<{ user: User }>('https://graphql.example.com', {
  query,
  variables: { id: 1 },
});
```

## SSR Compatibility

FetchFlow works seamlessly in both browser and Node.js. Under Node 18+ you have a global fetch, but you can still inject a custom implementation (e.g. to add logging, metrics, or polyfills) via the customFetch option. No browser‐only APIs are used in core.

```typescript
// pages/index.tsx (Next.js example)

import React from 'react';
import fetch from 'node-fetch';                // or leave out in Node 18+
import { useFetch } from 'fetchflow/adapters/react';

type Item = { id: number; name: string };

export default function Page() {
  // On the server, Next.js will render this component,
  // useFetch will use the global fetch or your customFetch.
  const { data, isLoading, error } = useFetch<Item[]>(
    'https://api.example.com/items',
    {
      // only needed if you want to override or polyfill fetch:
      customFetch: fetch,
      cacheTimeMs: 2 * 60_000,  // 2-minute cache
    }
  );

  if (isLoading) return <p>Loading…</p>;
  if (error)     return <p>Error: {error.message}</p>;
  return (
    <ul>
      {data!.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```
- No extra setup: In modern Node 18+ environments you can omit customFetch entirely and it will default to the built-in fetch.
- Safe in SSR: No references to window or browser-only APIs leak into your server bundle.
- Flexible: Swap in any fetch-compatible function for logging, telemetry, or testing.

## Advanced: Authenticated/API Credential Requests

#### REST (token in header)

```typescript
import { useFetch } from 'fetchflow';

const { data } = useFetch<User[]>('https://api.example.com/secure/users', {
  headers: {
    Authorization: `Bearer ${yourAuthToken}`,
  },
});
```

#### GraphQL (with credentials)

```typescript
import { graphqlClient } from 'fetchflow/core/network/graphqlClient';

const result = await graphqlClient<{ user: User }>(
  'https://graphql.example.com',
  { query, variables: { id: 123 } },
  {
    headers: {
      Authorization: `Bearer ${yourAuthToken}`,
    },
    credentials: 'include', // if you want to send cookies as well
  },
);
```

## List of Main Methods / Hooks

| Method          | Description                                 |
| --------------- | ------------------------------------------- |
| `useFetch`      | Fetch & cache REST or GraphQL data (GET).   |
| `usePoll`       | Auto-refresh/poll data at intervals.        |
| `useMutation`   | POST/PUT/PATCH/DELETE data (write/update).  |
| `graphqlClient` | Use for advanced GraphQL queries/mutations. |
| `FetchError`    | Standardized error handling for all hooks.  |

## How does FetchFlow handle caching?

By default, FetchFlow uses an in-memory cache for all fetches. This means repeated fetches to the same URL (with the same params) within a cache window will return instantly from memory (no network call).

Default Behavior

- All hooks (useFetch, usePoll, etc.) use the in-memory cache automatically.
- Cache expiry (TTL) can be configured with the cacheTimeMs option (default: 5 minutes).

## How to Use the Memory Cache

You don’t have to do anything extra—it “just works” out of the box!

```typescript
const { data } = useFetch<User[]>('https://api.com/users');
// Second call with same params will return cached value until expired.
```

To change cache duration:

```typescript
const { data } = useFetch<User[]>('https://api.com/users', {
  cacheTimeMs: 60000, // 1 minute cache
});
```

## How to Use LocalStorage (Persistent) Cache

You can manually instantiate and use the StorageCache class provided and wire it into your own data fetching logic, e.g., by replacing the in-memory cache in your custom hook.

Example: Using StorageCache directly

```typescript
import { StorageCache } from 'fetchflow';

// Create a persistent cache instance
const persistentCache = new StorageCache<User[]>();

// Set value (cache for 10 minutes)
persistentCache.set('my-key', [{ id: 1, name: 'Alice' }], 600_000);

// Get value (auto-removes if expired)
const users = persistentCache.get('my-key');
```

#### Note

- The core useFetch and usePoll hooks use only in-memory cache by default for performance and simplicity.
- If you want to swap in localStorage-based cache globally, you would need to fork and slightly extend the hook to allow a cacheProvider option.

## Login Request: How to Retrieve & Store a Session Token

```typescript
import React, { useState } from 'react';
import { useMutation } from 'fetchflow/adapters/react';

type LoginResponse = { token: string };
type LoginPayload = { username: string; password: string };

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const { mutate, isMutating, error } = useMutation<LoginResponse, LoginPayload>({
    url: 'https://api.example.com/login',
    method: 'POST',
    onSuccess: (response) => {
      // Save the token in localStorage (or cookies)
      localStorage.setItem('sessionToken', response.token);
      setSessionToken(response.token);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ username, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit" disabled={isMutating}>
        {isMutating ? 'Logging in...' : 'Login'}
      </button>

      {sessionToken && <div>Logged in! Token: {sessionToken}</div>}

      {error && <div style={{ color: 'red' }}>Login failed: {error.message}</div>}
    </form>
  );
}
```

## How to Handle Login Error

The error property from useMutation will be populated with a FetchError if the credentials are wrong or if there’s a network/server issue. You can display error.message to the user.

```typescript
{error && <div style={{ color: 'red' }}>Login failed: {error.message}</div>}
```

## How to Use the Token in Future Requests

After storing the token, use it in your API calls:

```typescript
import { useFetch } from 'fetchflow/adapters/react';

const token = localStorage.getItem('sessionToken');
const { data, error } = useFetch<User[]>('https://api.example.com/users', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## If You Prefer Cookies

If the backend sets an HTTP-only cookie (via Set-Cookie), you might need to set credentials: 'include' in your hook options:

```typescript
const { mutate } = useMutation<LoginResponse, LoginPayload>({
  url: 'https://api.example.com/login',
  method: 'POST',
  credentials: 'include', // Send/receive cookies
  // ...
});
```

And in fetches:

```typescript
const { data } = useFetch<User[]>('https://api.example.com/users', { credentials: 'include' });
```

FetchFlow gives you full control to handle authentication in a type-safe, robust, and standard way!

## Contributing

Contributions are welcome! Please:

- Fork the repository.
- Create a branch for your changes.
- Write tests for any new features.
- Submit a pull request with detailed changes.

## License

This project is licensed under the MIT License
