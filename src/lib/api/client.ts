export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let accessToken: string | null = null;
let tokenVersion = 0;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const API_TIMEOUT_MS = 15_000;
const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void) {
  sessionExpiredListeners.add(listener);
  return () => { sessionExpiredListeners.delete(listener); };
}

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
    method === 'GET' && options.body == null && !options.signal ? `${tokenVersion}:${path}` : null;

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
  const requestTokenVersion = tokenVersion;
  const authenticatedRequest = Boolean(accessToken);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortError = () => Object.assign(new Error('The request was canceled.'), { name: 'AbortError' });
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, API_TIMEOUT_MS);
  let rejectAbort: () => void = () => {};
  const canceled = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(timedOut
      ? new ApiError('The server took too long to respond. Please try again.', 408)
      : abortError());
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
    if (controller.signal.aborted) rejectAbort();
  });
  try {
    // The deadline covers both headers and body, even on a native fetch
    // implementation that does not promptly reject an aborted body read.
    return await Promise.race([canceled, (async () => {
      if (controller.signal.aborted) throw abortError();
      const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
      if (!response.ok) {
        if (response.status === 401 && authenticatedRequest && requestTokenVersion === tokenVersion && !path.startsWith('/auth/password-recovery') && path !== '/auth/login') {
          for (const listener of sessionExpiredListeners) listener();
        }
        throw new ApiError(await readErrorMessage(response), response.status);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    })()]);
  } catch (caught) {
    if (timedOut) throw new ApiError('The server took too long to respond. Please try again.', 408);
    if (controller.signal.aborted) throw abortError();
    if (caught instanceof ApiError) throw caught;
    if (caught instanceof Error && caught.name === 'AbortError') throw caught;
    throw new ApiError('We could not reach Hercules right now. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
    controller.signal.removeEventListener('abort', rejectAbort);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
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
