import { isAllowedContentUrl } from './contentPolicy';

type DownloadResponse = {
  info: () => { status: number; headers?: Record<string, string> };
};

type DownloadTask = Promise<DownloadResponse> & { cancel: () => unknown };

export type PdfDownloadClient = {
  config: (options: { path: string; trusty: boolean; followRedirect: boolean; timeout: number }) => {
    fetch: (method: 'GET', url: string, headers: Record<string, string>) => DownloadTask;
  };
  fs: {
    stat: (path: string) => Promise<{ size: string | number }>;
    unlink: (path: string) => Promise<unknown>;
  };
};

const maximumDocumentSize = 25 * 1024 * 1024;

/** Downloads only public HTTPS documents; never uses the app's API client or session headers. */
export function downloadPdfFile(client: PdfDownloadClient, url: string, path: string) {
  let cancelled = false;
  let task: DownloadTask | undefined;

  const promise = (async () => {
    let nextUrl = url;
    try {
      for (let redirects = 0; redirects <= 5; redirects += 1) {
        if (cancelled) throw new Error('Document loading was cancelled.');
        if (!isAllowedContentUrl(nextUrl)) throw new Error('This document link is not supported.');
        task = client.config({ path, trusty: false, followRedirect: false, timeout: 30_000 })
          .fetch('GET', nextUrl, { Accept: 'application/pdf' });
        const response = await task;
        task = undefined;
        if (cancelled) throw new Error('Document loading was cancelled.');
        const { status, headers = {} } = response.info();
        const location = Object.entries(headers).find(([key]) => key.toLowerCase() === 'location')?.[1];
        if ([301, 302, 303, 307, 308].includes(status) && location) {
          nextUrl = new URL(location, nextUrl).href;
          continue;
        }
        if (status < 200 || status >= 300) throw new Error('The document is unavailable. Please try again.');
        const { size } = await client.fs.stat(path);
        if (cancelled) throw new Error('Document loading was cancelled.');
        if (!Number.isFinite(Number(size)) || Number(size) <= 0 || Number(size) > maximumDocumentSize) {
          throw new Error('This document is empty or too large to display.');
        }
        return path;
      }
      throw new Error('The document could not be opened. Please try again.');
    } catch (error) {
      await client.fs.unlink(path).catch(() => {});
      throw error;
    }
  })();

  return {
    promise,
    cancel() {
      cancelled = true;
      if (task) {
        try { return Promise.resolve(task.cancel()).catch(() => {}); } catch { /* Already settled. */ }
      }
      return Promise.resolve();
    },
  };
}
