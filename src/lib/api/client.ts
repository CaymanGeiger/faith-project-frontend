export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;
let tokenVersion = 0;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const API_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function setApiToken(token: string | null) {
  if (token === accessToken) {
    return;
  }

  accessToken = token;
  tokenVersion += 1;
  inFlightGetRequests.clear();
}

export function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const requestKey =
    method === 'GET' && options.body == null ? `${tokenVersion}:${path}` : null;

  if (requestKey) {
    const existingRequest = inFlightGetRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }
  }

  const request = performApiFetch<T>(path, options);

  if (requestKey) {
    inFlightGetRequests.set(requestKey, request);
    const clearRequest = () => {
      if (inFlightGetRequests.get(requestKey) === request) {
        inFlightGetRequests.delete(requestKey);
      }
    };
    request.then(clearRequest, clearRequest);
  }

  return request;
}

async function performApiFetch<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const controller = options.signal ? null : new AbortController();
  const timeout = controller
    ? setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    : null;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller?.signal,
    });
  } catch (caught) {
    if (controller?.signal.aborted) {
      throw new ApiError(
        'The server took too long to respond. Please try again.',
        408,
      );
    }

    // Native fetch errors are often just "Network request failed", which does
    // not give a dealer a useful way to recover. Preserve deliberate aborts
    // from callers, but normalize genuine connection failures for every screen.
    if (caught instanceof Error && caught.name === 'AbortError') {
      throw caught;
    }

    throw new ApiError(
      'We could not reach Hercules right now. Check your connection and try again.',
      0,
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    return body.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}
