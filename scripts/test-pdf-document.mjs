import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const pdfUrl = 'https://documents.example.com/claim.pdf';
const downloadPdfFile = sourceLoader()('src/features/content/pdfDownload.ts').downloadPdfFile;

function downloadFixture({ responses = [{ status: 200 }], size = 300, pending = false } = {}) {
  const calls = [], removed = [];
  let cancelled = false;
  return {
    calls, removed,
    get cancelled() { return cancelled; },
    client: {
      config(options) {
        return {
          fetch(...args) {
            calls.push({ options, args });
            let rejectTask;
            const promise = pending
              ? new Promise((_resolve, reject) => { rejectTask = reject; })
              : Promise.resolve({ info: () => responses[calls.length - 1] });
            promise.cancel = async () => { cancelled = true; rejectTask?.(new Error('cancelled')); };
            return promise;
          },
        };
      },
      fs: { stat: async () => ({ size }), unlink: async path => { removed.push(path); } },
    },
  };
}

test('PDF download uses a public GET with verified TLS and no app credentials or automatic redirects', async () => {
  const f = downloadFixture();
  assert.equal(await downloadPdfFile(f.client, pdfUrl, '/synthetic/claim.pdf').promise, '/synthetic/claim.pdf');
  assert.equal(f.calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0])), {
    options: { path: '/synthetic/claim.pdf', trusty: false, followRedirect: false, timeout: 30_000 },
    args: ['GET', pdfUrl, { Accept: 'application/pdf' }],
  });
  assert.equal(f.removed.length, 0);
});

test('PDF redirects are resolved inside the app and validated before each request', async () => {
  const f = downloadFixture({ responses: [{ status: 302, headers: { Location: '/new-claim.pdf' } }, { status: 200 }] });
  await downloadPdfFile(f.client, pdfUrl, '/synthetic/claim.pdf').promise;
  assert.equal(f.calls[1].args[1], 'https://documents.example.com/new-claim.pdf');
  const unsafe = downloadFixture({ responses: [{ status: 302, headers: { location: 'http://documents.example.com/claim.pdf' } }] });
  await assert.rejects(downloadPdfFile(unsafe.client, pdfUrl, '/synthetic/claim.pdf').promise, /not supported/);
  assert.equal(unsafe.calls.length, 1);
  assert.deepEqual(unsafe.removed, ['/synthetic/claim.pdf']);
});

test('PDF downloader rejects local URLs, failed HTTP responses and oversized files', async () => {
  const unsafe = downloadFixture();
  await assert.rejects(downloadPdfFile(unsafe.client, 'file:///synthetic/claim.pdf', '/synthetic/copy.pdf').promise, /not supported/);
  assert.equal(unsafe.calls.length, 0);
  const missing = downloadFixture({ responses: [{ status: 404 }] });
  await assert.rejects(downloadPdfFile(missing.client, pdfUrl, '/synthetic/claim.pdf').promise, /unavailable/);
  assert.equal(missing.removed.length, 1);
  const large = downloadFixture({ size: 26 * 1024 * 1024 });
  await assert.rejects(downloadPdfFile(large.client, pdfUrl, '/synthetic/claim.pdf').promise, /too large/);
  assert.equal(large.removed.length, 1);
});

test('closing a pending PDF cancels the download and removes its temporary file', async () => {
  const f = downloadFixture({ pending: true });
  const download = downloadPdfFile(f.client, pdfUrl, '/synthetic/claim.pdf');
  const rejected = assert.rejects(download.promise, /cancelled/);
  await download.cancel();
  await rejected;
  assert.equal(f.cancelled, true);
  assert.deepEqual(f.removed, ['/synthetic/claim.pdf']);
});

async function documentFixture({ nativeAvailable = true, url = pdfUrl, platform = 'android' } = {}) {
  const errors = [], links = [], pages = [], downloads = [], removed = [];
  let ready = 0, required = 0, cancelled = 0, root;
  const Pdf = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ setPage: value => pages.push(value) }));
    return React.createElement('Pdf', props);
  });
  const mocks = {
    'react-native': {
      View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: value => value },
      Platform: { OS: platform }, NativeModules: {}, TurboModuleRegistry: { get: () => nativeAvailable ? {} : null },
      UIManager: { hasViewManagerConfig: () => nativeAvailable },
    },
    'react-native-webview': { WebView: 'WebView' },
    'lucide-react-native': { ChevronLeft: 'ChevronLeft', ChevronRight: 'ChevronRight' },
    'react-native-blob-util': { default: { fs: { dirs: { CacheDir: '/synthetic' }, unlink: async path => removed.push(path) } } },
    './pdfDownload': { downloadPdfFile: (_files, target, path) => {
      downloads.push({ target, path });
      return { promise: Promise.resolve(path), cancel: async () => { cancelled += 1; } };
    } },
  };
  Object.defineProperty(mocks, 'react-native-pdf', { enumerable: true, get: () => { required += 1; return { default: Pdf }; } });
  const { PdfDocument } = sourceLoader(mocks)('src/features/content/PdfDocument.tsx');
  await act(async () => { root = create(React.createElement(PdfDocument, { url, onReady: () => { ready += 1; }, onError: error => errors.push(error), onOpenLink: link => links.push(link) })); });
  return {
    errors, links, pages, downloads, removed, root,
    get ready() { return ready; }, get required() { return required; }, get cancelled() { return cancelled; },
    pdf: () => root.root.findByType('Pdf'),
    close: () => act(async () => root.unmount()),
  };
}

test('PDF viewer fails gracefully in Expo Go or an older app without importing missing native code', async () => {
  const f = await documentFixture({ nativeAvailable: false });
  assert.equal(f.required, 0);
  assert.equal(f.downloads.length, 0);
  assert.match(f.errors[0], /updated app build/);
  await f.close();
});

test('native PDF displays local data, reports readiness once and keeps hyperlinks in the app handler', async () => {
  const f = await documentFixture();
  assert.equal(f.required, 1);
  assert.equal(f.downloads[0].target, pdfUrl);
  assert.match(f.pdf().props.source.uri, /^file:\/\/\/synthetic\/hercules-document-/);
  assert.equal(f.pdf().props.source.cache, false);
  assert.equal(f.pdf().props.trustAllCerts, false);
  assert.equal(f.pdf().props.maxScale, 4);
  await act(async () => { f.pdf().props.onLoadComplete(3); f.pdf().props.onLoadComplete(3); });
  assert.equal(f.ready, 1);
  await act(async () => f.pdf().props.onPageChanged(2, 3));
  await act(async () => f.root.root.findAllByType('Pressable').find(button => button.props.accessibilityLabel === 'Next PDF page').props.onPress());
  assert.deepEqual(f.pages, [3]);
  await act(async () => f.pdf().props.onPressLink('https://resources.example.com/help'));
  assert.deepEqual(f.links, ['https://resources.example.com/help']);
  await act(async () => f.pdf().props.onError(new Error('private native failure')));
  assert.match(f.errors[0], /could not be displayed/);
  assert.ok(!f.errors[0].includes('private'));
  await f.close();
  assert.equal(f.cancelled, 1);
  assert.equal(f.removed.length, 1);
});

test('invalid PDF links fail before requiring or calling native modules', async () => {
  const f = await documentFixture({ url: 'javascript:alert(1)' });
  assert.equal(f.required, 0);
  assert.equal(f.downloads.length, 0);
  assert.match(f.errors[0], /not supported/);
  await f.close();
});


test('iOS without the PDF module displays the original document in the in-app web view', async () => {
  const f = await documentFixture({ nativeAvailable: false, platform: 'ios' });
  assert.equal(f.required, 0);
  assert.equal(f.downloads.length, 0);
  assert.deepEqual(f.errors, []);
  const web = f.root.root.findByType('WebView');
  assert.equal(web.props.source.uri, pdfUrl);
  assert.equal(web.props.onShouldStartLoadWithRequest({ url: pdfUrl }), true);
  assert.equal(web.props.onShouldStartLoadWithRequest({ url: 'file:///private/data' }), false);
  await act(async () => web.props.onLoad());
  assert.equal(f.ready, 1);
  await act(async () => web.props.onHttpError());
  assert.match(f.errors[0], /temporarily unavailable/);
  await f.close();
});
