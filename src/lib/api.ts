import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly correlationId: string | null;
  readonly details?: unknown;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message || `Request failed (${status})`);
    this.status = status;
    this.code = body.code || `HTTP_${status}`;
    this.retryable = body.retryable ?? status >= 500;
    this.correlationId = body.correlationId ?? null;
    this.details = body.details;
  }
}

/** Same-origin API client: the browser only ever talks to /api (session cookie, no tokens in JS). */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const body = (data as { error?: Partial<ApiErrorBody> } | undefined)?.error ?? {
      message: text || res.statusText,
      correlationId: res.headers.get('x-correlation-id'),
    };
    throw new ApiError(res.status, body);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
