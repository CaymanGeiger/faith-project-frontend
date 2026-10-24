import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'hercules-api-test-'));
const require = createRequire(import.meta.url);

function compileApiClient() {
  const compiler = path.join(
    projectRoot,
    'node_modules',
    'typescript',
    'bin',
    'tsc',
  );

  execFileSync(process.execPath, [
    compiler,
    '--ignoreConfig',
    'src/lib/api/client.ts',
    '--module',
    'commonjs',
    '--target',
    'ES2022',
    '--lib',
    'ES2022,DOM',
    '--types',
    'node',
    '--esModuleInterop',
    'true',
    '--skipLibCheck',
    'true',
    '--outDir',
    temporaryDirectory,
  ], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

async function run(name, assertion) {
  try {
    await assertion();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

async function main() {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test.hercules.example';
  compileApiClient();
  const { ApiError, apiFetch, setApiToken } = require(
    path.join(temporaryDirectory, 'client.js'),
  );
  const originalFetch = globalThis.fetch;

  try {
    await run('adds authentication and JSON headers to API requests', async () => {
      setApiToken('dealer-access-token');
      globalThis.fetch = async (url, init) => {
        assert.equal(url, 'https://api.test.hercules.example/auth/login');
        assert.equal(init.method, 'POST');
        assert.equal(init.headers.get('Accept'), 'application/json');
        assert.equal(init.headers.get('Content-Type'), 'application/json');
        assert.equal(init.headers.get('Authorization'), 'Bearer dealer-access-token');
        return new Response(JSON.stringify({ accepted: true }), { status: 200 });
      };

      await assert.doesNotReject(
        apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'dealer@example.com' }),
        }),
      );
    });

    await run('deduplicates matching in-flight GET requests and releases them after completion', async () => {
      setApiToken('dedupe-token');
      let calls = 0;
      let resolveResponse;
      globalThis.fetch = () => {
        calls += 1;
        return new Promise((resolve) => {
          resolveResponse = resolve;
        });
      };

      const first = apiFetch('/me');
      const second = apiFetch('/me');
      assert.equal(first, second);
      assert.equal(calls, 1);

      resolveResponse(new Response(JSON.stringify({ user: { id: 'dealer-1' } }), { status: 200 }));
      await first;

      globalThis.fetch = async () => {
        calls += 1;
        return new Response(JSON.stringify({ user: { id: 'dealer-1' } }), { status: 200 });
      };
      await apiFetch('/me');
      assert.equal(calls, 2);
    });

    await run('does not reuse a pending request after the signed-in user changes', async () => {
      const resolvers = [];
      let calls = 0;
      globalThis.fetch = () => {
        calls += 1;
        return new Promise((resolve) => resolvers.push(resolve));
      };

      setApiToken('first-user-token');
      const first = apiFetch('/me');
      setApiToken('second-user-token');
      const second = apiFetch('/me');

      assert.notEqual(first, second);
      assert.equal(calls, 2);
      resolvers[0](new Response(JSON.stringify({ user: { id: 'first-user' } }), { status: 200 }));
      resolvers[1](new Response(JSON.stringify({ user: { id: 'second-user' } }), { status: 200 }));
      await Promise.all([first, second]);
    });

    await run('preserves useful server errors and has a safe fallback for malformed errors', async () => {
      setApiToken(null);
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: ['Email is required', 'Password is required'] }), {
          status: 422,
        });

      await assert.rejects(apiFetch('/auth/login'), (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 422);
        assert.equal(error.message, 'Email is required, Password is required');
        return true;
      });

      globalThis.fetch = async () => new Response('not-json', { status: 503 });
      await assert.rejects(apiFetch('/auth/login'), (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 503);
        assert.equal(error.message, 'Request failed');
        return true;
      });
    });

    await run('turns a timed-out network request into a retryable API error', async () => {
      const originalSetTimeout = globalThis.setTimeout;
      const originalClearTimeout = globalThis.clearTimeout;
      globalThis.setTimeout = (callback) => {
        callback();
        return {};
      };
      globalThis.clearTimeout = () => {};
      globalThis.fetch = async (_url, init) => {
        assert.equal(init.signal?.aborted, true);
        throw new DOMException('The operation was aborted', 'AbortError');
      };

      try {
        await assert.rejects(apiFetch('/me'), (error) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 408);
          assert.equal(
            error.message,
            'The server took too long to respond. Please try again.',
          );
          return true;
        });
      } finally {
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
      }
    });

    await run('turns an unavailable network into a clear recovery message', async () => {
      globalThis.fetch = async () => {
        throw new TypeError('Network request failed');
      };

      await assert.rejects(apiFetch('/me'), (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 0);
        assert.equal(
          error.message,
          'We could not reach Hercules right now. Check your connection and try again.',
        );
        return true;
      });
    });

    await run('deadline covers a stalled response body even with a caller signal', async () => {
      const originalSetTimeout = globalThis.setTimeout;
      let expire;
      globalThis.setTimeout = fn => { expire = fn; return 123; };
      globalThis.fetch = async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) });
      try {
        const result = apiFetch('/slow-body', { signal: new AbortController().signal });
        await Promise.resolve(); expire();
        await assert.rejects(result, error => error instanceof ApiError && error.status === 408);
      } finally { globalThis.setTimeout = originalSetTimeout; }
    });
    await run('one caller cancellation cannot abort another caller request', async () => {
      globalThis.fetch = () => new Promise(() => {});
      const a = new AbortController(); const b = new AbortController();
      const first = apiFetch('/cancel', { signal: a.signal });
      const second = apiFetch('/cancel', { signal: b.signal });
      let secondSettled = false; second.catch(() => { secondSettled = true; });
      a.abort(); await assert.rejects(first, error => error.name === 'AbortError');
      assert.equal(secondSettled, false);
      b.abort(); await assert.rejects(second, error => error.name === 'AbortError');
    });

    await run('supports successful empty responses', async () => {
      globalThis.fetch = async () => new Response(null, { status: 204 });
      const result = await apiFetch('/auth/logout', { method: 'POST' });
      assert.equal(result, undefined);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
}

try {
  await main();
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
