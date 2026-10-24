export type ContentRequest = { url: string; title: string; kind?: 'page' | 'pdf' };

// These links come from app content, but navigation inside a partner page is untrusted.
// Never hand arbitrary schemes to the operating system or attach app API credentials.
export function isAllowedContentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.port && host.includes('.') && !host.includes(':') &&
      !/^\d+(\.\d+){3}$/.test(host) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/.test(host);
  } catch {
    return false;
  }
}

export function isAppleAppStoreUrl(value: string): boolean {
  return isAllowedContentUrl(value) && new URL(value).hostname === 'apps.apple.com';
}

export function isPdfUrl(value: string): boolean {
  try { return /\.pdf$/i.test(new URL(value).pathname); } catch { return false; }
}

export function contentHost(value: string): string {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function normalizeContent(request: ContentRequest): Required<ContentRequest> | null {
  if (!isAllowedContentUrl(request.url)) return null;
  return { url: new URL(request.url).href, title: request.title.trim() || 'Resource',
    kind: request.kind ?? (isPdfUrl(request.url) ? 'pdf' : 'page') };
}
