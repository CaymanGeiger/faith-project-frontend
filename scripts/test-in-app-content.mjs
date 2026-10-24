import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const icons = new Proxy({}, { get: (_, name) => String(name) });
const resource = (id, category, resourceType = 'DOCUMENT') => ({
  id, title: `Synthetic ${id}`, description: 'Local QA fixture', category,
  resourceType, url: `https://resources.example.com/${id}`,
});
const benefit = (id, url = `https://benefits.example.com/${id}`) => ({
  id, title: `Synthetic ${id}`, description: 'Local QA fixture', benefitType: 'DISCOUNT', url,
});

test('content links allow secure public pages and reject unsafe schemes, credentials, and local hosts', () => {
  const { isAllowedContentUrl, normalizeContent, isPdfUrl } = sourceLoader()('src/features/content/contentPolicy.ts');
  for (const url of ['https://training.example.com/calendar?session=synthetic', 'https://warranty.example.com/register', 'https://files.example.com/Claim.PDF?download=1#page=2']) {
    assert.equal(isAllowedContentUrl(url), true, url);
  }
  for (const url of ['', 'not a link', 'http://training.example.com', 'javascript:alert(1)', 'data:text/html,test', 'file:///private/tmp/fixture', 'content://document/1', 'intent://scan', 'mailto:test@example.com', 'tel:123', 'https://user:secret@example.com', 'https://localhost', 'https://portal.local', 'https://service.internal', 'https://127.0.0.1', 'https://2130706433', 'https://[::1]', 'https://example.com:3000']) {
    assert.equal(isAllowedContentUrl(url), false, url);
    assert.equal(normalizeContent({ url, title: 'Fixture' }), null, url);
  }
  assert.equal(isPdfUrl('https://files.example.com/Claim.PDF?download=1#page=2'), true);
  assert.equal(isPdfUrl('https://files.example.com/view?name=claim.pdf'), false);
  assert.equal(normalizeContent({ url: 'https://files.example.com/Claim.PDF', title: '  ' }).title, 'Resource');
  assert.equal(normalizeContent({ url: 'https://files.example.com/Claim.PDF', title: 'Claim' }).kind, 'pdf');
  assert.equal(normalizeContent({ url: 'https://files.example.com/download', title: 'Claim', kind: 'pdf' }).kind, 'pdf');
});

async function nativeWebFixture(url = 'https://training.example.com/calendar') {
  const events = { loading: [], progress: [], ready: [], error: [], history: [], locations: [], links: [], injections: [] };
  const commands = [];
  const NativeBoundary = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ goBack: () => commands.push('back'), reload: () => commands.push('reload'), injectJavaScript: script => events.injections.push(script) }), []);
    return React.createElement('NativeWebView', props);
  });
  const { WebContent } = sourceLoader({
    'react-native': { NativeModules: {}, TurboModuleRegistry: { get: name => name === 'RNCWebViewModule' ? {} : null }, View: 'View' },
    'react-native-webview': { WebView: NativeBoundary },
  })('src/features/content/WebContent.tsx');
  let root;
  const ref = React.createRef();
  const props = { ref, url, title: 'Training',
    onLoading: value => events.loading.push(value), onProgress: value => events.progress.push(value),
    onReady: () => events.ready.push(true), onError: value => events.error.push(value),
    onHistoryChange: value => events.history.push(value), onLocationChange: value => events.locations.push(value),
    onOpenLink: value => events.links.push(value) };
  await act(async () => { root = create(React.createElement(WebContent, props)); });
  return { events, commands, ref, get node() { return root.root.findByType('NativeWebView'); }, get web() { return root.root.findByType('NativeWebView').props; }, close: () => act(async () => root.unmount()) };
}

test('older app builds without a WebView module show an update message without importing native code', async () => {
  let imports = 0, root;
  const events = [];
  const mocks = {
    'react-native': { NativeModules: {}, TurboModuleRegistry: { get: () => null }, View: 'View' },
  };
  Object.defineProperty(mocks, 'react-native-webview', { get() { imports++; throw new Error('Native module is not installed'); } });
  const { WebContent } = sourceLoader(mocks)('src/features/content/WebContent.tsx');
  assert.equal(imports, 0, 'The root import must remain safe for an older installed app');
  await act(async () => { root = create(React.createElement(WebContent, {
    url: 'https://training.example.com/calendar', title: 'Training',
    onLoading: value => events.push(['loading', value]), onProgress() {}, onReady: () => events.push(['ready']),
    onError: value => events.push(['error', value]), onHistoryChange() {}, onLocationChange() {}, onOpenLink() {},
  })); });
  try {
    assert.equal(imports, 0);
    assert.equal(root.root.findAllByType('NativeWebView').length, 0);
    assert.deepEqual(events[0], ['loading', false]);
    assert.equal(events[1][0], 'error');
    assert.match(events[1][1], /updated app build/i);
    assert.equal(events.length, 2, 'Missing native support never reports a successful page load');
  } finally { await act(async () => root.unmount()); }
});

test('native page navigation, popups and PDFs stay inside app control without app credentials', async () => {
  const f = await nativeWebFixture();
  try {
    assert.deepEqual(Object.keys(f.web.source), ['uri']);
    assert.equal(f.web.source.uri, 'https://training.example.com/calendar');
    assert.equal(f.web.sharedCookiesEnabled, false);
    assert.equal(f.web.thirdPartyCookiesEnabled, false);
    assert.equal(f.web.allowFileAccess, false);
    assert.equal(f.web.mixedContentMode, 'never');
    assert.equal(f.web.onShouldStartLoadWithRequest({ url: 'https://training.example.com/register', isTopFrame: true }), true);
    const pdf = 'https://files.example.com/claim.pdf?download=1';
    assert.equal(f.web.onShouldStartLoadWithRequest({ url: pdf, isTopFrame: true }), false);
    assert.equal(f.events.links.at(-1), pdf);
    f.web.onOpenWindow({ nativeEvent: { targetUrl: 'https://registration.example.com/new' } });
    assert.equal(f.events.links.at(-1), 'https://registration.example.com/new');
    f.web.onFileDownload({ nativeEvent: { downloadUrl: pdf } });
    assert.equal(f.events.links.at(-1), pdf);
    assert.equal(f.web.onShouldStartLoadWithRequest({ url: 'javascript:alert(1)', isTopFrame: true }), false);
    const count = f.events.links.length;
    assert.equal(f.web.onShouldStartLoadWithRequest({ url: 'file:///tmp/fixture', isTopFrame: false }), false);
    assert.equal(f.events.links.length, count);
    assert.equal(f.web.onShouldStartLoadWithRequest({ url: 'https://127.0.0.1/private', isTopFrame: true }), false);
  } finally { await f.close(); }
});

test('Apple store previews use a separate desktop-mode viewer without allowing OS schemes', async () => {
  const { isAppleAppStoreUrl } = sourceLoader()('src/features/content/contentPolicy.ts');
  const storeUrl = 'https://apps.apple.com/us/app/lg-thinq/id993504342';
  assert.equal(isAppleAppStoreUrl(storeUrl), true);
  for (const url of ['http://apps.apple.com/us/app/lg-thinq/id993504342', 'https://apps.apple.com.example.com/app/id993504342', 'https://user:secret@apps.apple.com/app/id993504342', 'https://apps.apple.com:8443/app/id993504342', 'itms-apps://apps.apple.com/app/id993504342', 'https://www.lg.com/us/lg-thinq', 'invalid']) {
    assert.equal(isAppleAppStoreUrl(url), false, url);
  }
  const page = await nativeWebFixture('https://www.lg.com/us/lg-thinq');
  const store = await nativeWebFixture(storeUrl);
  try {
    assert.equal(page.web.contentMode, 'mobile');
    assert.equal(store.web.contentMode, 'desktop');
    assert.equal(store.web.userAgent, undefined, 'WebKit should choose its own desktop user agent');
    assert.equal(page.web.onShouldStartLoadWithRequest({ url: storeUrl, isTopFrame: true }), false);
    assert.deepEqual(page.events.links, [storeUrl], 'same-frame Apple links create a configured store viewer');
    assert.equal(store.web.onShouldStartLoadWithRequest({ url: storeUrl + '?platform=iphone', isTopFrame: true }), true);
    assert.equal(page.web.onShouldStartLoadWithRequest({ url: storeUrl, isTopFrame: false }), true);
    assert.equal(page.events.links.length, 1, 'subframes must not open a new viewer');
    for (const url of ['itms-apps://apps.apple.com/app/id993504342', 'intent://app', 'javascript:alert(1)']) {
      assert.equal(store.web.onShouldStartLoadWithRequest({ url, isTopFrame: true }), false);
    }
  } finally { await page.close(); await store.close(); }
});

test('LG viewport follows redirected document host, enables zoom, and leaves other sites unchanged', () => {
  const { lgMediaViewportScript } = sourceLoader()('src/features/content/webPageReadability.ts');
  function documentFixture(hostname, { protocol = 'https:', initial = null, loading = false } = {}) {
    let meta = initial === null ? null : element(initial);
    let writes = 0;
    const listeners = [];
    function element(content = null) {
      const attrs = { name: 'viewport', content };
      return { getAttribute: name => attrs[name], setAttribute: (name, value) => { attrs[name] = value; writes++; } };
    }
    const document = {
      head: loading ? null : { appendChild: value => { meta = value; } },
      readyState: loading ? 'loading' : 'complete',
      querySelector: () => meta,
      createElement: () => element(),
      addEventListener: (name, callback, options) => { assert.equal(name, 'DOMContentLoaded'); assert.equal(options.once, true); listeners.push(callback); },
    };
    const run = () => vm.runInNewContext(lgMediaViewportScript, { window: { location: { hostname, protocol } }, document });
    return { run, document, listeners, get meta() { return meta; }, get writes() { return writes; }, ready() { document.head = { appendChild: value => { meta = value; } }; document.readyState = 'complete'; listeners.forEach(callback => callback()); } };
  }
  for (const initial of [null, 'width=1200, initial-scale=0.3, maximum-scale=1, user-scalable=no']) {
    const f = documentFixture('media.us.lg.com', { initial });
    f.run();
    assert.equal(f.meta.getAttribute('content'), 'width=device-width, initial-scale=1, user-scalable=yes');
    const writes = f.writes;
    f.run();
    assert.equal(f.writes, writes, 'The load fallback must not reset an already-correct viewport or user zoom');
  }
  const early = documentFixture('media.us.lg.com', { loading: true });
  early.run();
  assert.equal(early.meta, null);
  early.ready();
  assert.match(early.meta.getAttribute('content'), /width=device-width/);
  for (const hostname of ['lghvac.com', 'form.jotform.com', 'www.herculesindustries.com', 'media.us.lg.com.example.com']) {
    const other = documentFixture(hostname, { initial: 'width=device-width, initial-scale=1' });
    other.run();
    assert.equal(other.writes, 0);
    assert.equal(other.listeners.length, 0);
  }
  const insecure = documentFixture('media.us.lg.com', { protocol: 'http:' });
  insecure.run();
  assert.equal(insecure.writes, 0);
});

test('library loading illustration override stays on the secure public collection and survives early injection', () => {
  const { lgMediaLoadingScript } = sourceLoader()('src/features/content/webPageReadability.ts');
  function fixture(url, early = false) {
    const styles = new Map();
    const listeners = [];
    const head = { appendChild: element => { assert.equal(styles.has(element.id), false); styles.set(element.id, element); } };
    const document = {
      head: early ? null : head,
      readyState: early ? 'loading' : 'complete',
      getElementById: id => styles.get(id),
      createElement: tag => { assert.equal(tag, 'style', 'only presentation styles may be added'); return {}; },
      addEventListener: (event, callback, options) => { assert.equal(event, 'DOMContentLoaded'); assert.equal(options.once, true); listeners.push(callback); },
    };
    return { styles, listeners,
      run: () => vm.runInNewContext(lgMediaLoadingScript, { window: { location: new URL(url) }, document }),
      ready: () => { document.head = head; document.readyState = 'complete'; listeners.forEach(callback => callback()); },
    };
  }
  const base = 'https://media.us.lg.com/web/fb9b717fcfa19bcc/public-resources';
  for (const suffix of ['', '/', '/?page=2']) {
    const f = fixture(base + suffix); f.run(); f.run();
    assert.equal(f.styles.size, 1, 'document-start and load fallback must not duplicate styles');
  }
  const early = fixture(base, true); early.run();
  assert.equal(early.styles.size, 0);
  early.ready(); early.run(); assert.equal(early.styles.size, 1);
  for (const url of [base.replace('https:', 'http:'), base.replace('media.us.lg.com', 'media.us.lg.com.example.com'), 'https://media.us.lg.com/login/', 'https://media.us.lg.com/web/another-collection/', 'https://lg-dfs-warranty.com/register']) {
    const f = fixture(url); f.run();
    assert.equal(f.styles.size, 0, url);
    assert.equal(f.listeners.length, 0, url);
  }
});

test('warranty layout correction is limited to the exact secure registration page and is idempotent', () => {
  const { lgWarrantyLayoutScript } = sourceLoader()('src/features/content/webPageReadability.ts');
  function fixture(url, loading = false) {
    const elements = new Map();
    const listeners = [];
    const appended = [];
    const groupClasses = new Set(['input-group']);
    const group = { classList: { contains: name => groupClasses.has(name), add: name => groupClasses.add(name) } };
    let picker = loading ? null : { parentElement: group };
    const head = { appendChild: element => { elements.set(element.id, element); appended.push(element); } };
    const document = {
      head: loading ? null : head,
      readyState: loading ? 'loading' : 'complete',
      getElementById: id => id === 'equipment_model_selection' ? picker : elements.get(id),
      createElement: tag => { assert.equal(tag, 'style', 'only presentation styles may be added'); return {}; },
      addEventListener: (event, callback, options) => { assert.equal(event, 'DOMContentLoaded'); assert.equal(options.once, true); listeners.push(callback); },
    };
    return { appended, groupClasses, detachPicker: () => { picker = null; }, attachPicker: () => { picker = { parentElement: group }; }, run: () => vm.runInNewContext(lgWarrantyLayoutScript, { window: { location: new URL(url) }, document }), ready: () => { picker = { parentElement: group }; document.head = head; document.readyState = 'complete'; listeners.forEach(fn => fn()); } };
  }
  for (const path of ['/register', '/register/?from=app']) {
    const f = fixture(`https://lg-dfs-warranty.com${path}`);
    f.run(); f.run();
    assert.equal(f.appended.length, 1);
    assert.match(f.appended[0].textContent, /@media \(max-width: 767px\)/);
    assert.match(f.appended[0].textContent, /body#page-register > \.container\.content/);
    assert.equal(f.groupClasses.has('hercules-model-picker'), true);
    assert.match(f.appended[0].textContent, /\.hercules-model-picker > \.select2-container \{ flex: 1 1 0; min-width: 0; width: 0 !important;/);
    assert.match(f.appended[0].textContent, /\.hercules-model-picker > \.input-group-btn \{ flex: 0 0 auto; width: auto;/);
    assert.doesNotMatch(f.appended[0].textContent, /overflow|transform|zoom|display: none|pointer-events/);
  }
  const early = fixture('https://lg-dfs-warranty.com/register', true);
  early.run(); assert.equal(early.appended.length, 0);
  early.ready(); early.run(); assert.equal(early.appended.length, 1);
  assert.equal(early.groupClasses.has('hercules-model-picker'), true);
  const latePicker = fixture('https://lg-dfs-warranty.com/register');
  latePicker.detachPicker(); latePicker.run();
  assert.equal(latePicker.groupClasses.has('hercules-model-picker'), false);
  latePicker.attachPicker(); latePicker.run();
  assert.equal(latePicker.appended.length, 1);
  assert.equal(latePicker.groupClasses.has('hercules-model-picker'), true, 'load fallback must mark a picker parsed after document-start injection');
  for (const url of ['http://lg-dfs-warranty.com/register', 'https://lg-dfs-warranty.com/login', 'https://lg-dfs-warranty.com/secure/dashboard', 'https://lg-dfs-warranty.com.example.com/register', 'https://form.jotform.com/register', 'https://media.us.lg.com/register']) {
    const f = fixture(url); f.run(); assert.equal(f.appended.length, 0, url); assert.equal(f.groupClasses.has('hercules-model-picker'), false, url);
  }
});

test('native viewer applies LG readability before and after loading without a messaging bridge', async () => {
  const f = await nativeWebFixture();
  try {
    assert.equal(f.web.contentMode, 'mobile');
    assert.equal(f.web.setBuiltInZoomControls, true);
    assert.equal(f.web.setDisplayZoomControls, false);
    assert.equal(f.web.injectedJavaScriptBeforeContentLoadedForMainFrameOnly, true);
    assert.equal(f.web.onMessage, undefined);
    f.web.onLoad();
    assert.equal(f.events.injections.length, 1);
    assert.equal(f.events.injections[0], f.web.injectedJavaScriptBeforeContentLoaded);
    assert.equal(f.events.ready.length, 1);
  } finally { await f.close(); }
});

test('native loading, redirect history and browser controls reflect the displayed page', async () => {
  const f = await nativeWebFixture();
  try {
    f.web.onLoadStart({ nativeEvent: { url: 'https://training.example.com/calendar' } });
    f.web.onLoadProgress({ nativeEvent: { progress: 0.5 } });
    f.web.onNavigationStateChange({ url: 'https://registration.example.com/step-2', canGoBack: true });
    f.web.onLoad(); f.web.onLoadEnd();
    assert.deepEqual(f.events.loading, [true, false]);
    assert.deepEqual(f.events.progress, [0.5]);
    assert.deepEqual(f.events.history, [true]);
    assert.deepEqual(f.events.locations, ['https://training.example.com/calendar', 'https://registration.example.com/step-2']);
    assert.equal(f.events.ready.length, 1);
    f.ref.current.goBack(); f.ref.current.reload();
    assert.deepEqual(f.commands, ['back', 'reload']);
  } finally { await f.close(); }
});

test('native page failures are recoverable and subresource errors do not hide a valid page', async () => {
  const f = await nativeWebFixture();
  try {
    f.web.onLoadStart({ nativeEvent: { url: 'https://training.example.com/calendar' } });
    f.web.onHttpError({ nativeEvent: { url: 'https://training.example.com/logo.svg', statusCode: 404 } });
    assert.equal(f.events.error.length, 0);
    // The redirected page can fail before its navigation-state event arrives.
    f.web.onLoadStart({ nativeEvent: { url: 'https://registration.example.com/step-2' } });
    f.web.onHttpError({ nativeEvent: { url: 'https://registration.example.com/step-2', statusCode: 503 } });
    assert.equal(f.events.error.length, 1);
    f.web.onLoad();
    assert.equal(f.events.ready.length, 0, 'Failed loads must not report successful content');
    f.web.onLoadStart({ nativeEvent: { url: 'https://registration.example.com/step-2' } }); f.web.onLoad();
    assert.equal(f.events.ready.length, 1, 'A later successful retry must clear the failed-load guard');
    f.web.onError({ nativeEvent: { description: 'Synthetic network failure' } });
    f.web.onContentProcessDidTerminate();
    f.web.onRenderProcessGone();
    assert.equal(f.events.error.length, 4);
    assert.equal(f.events.loading.at(-1), false);
  } finally { await f.close(); }
});

for (const callback of ['onRenderProcessGone', 'onContentProcessDidTerminate']) test(`${callback} recovery recreates the web renderer at the latest URL`, async () => {
  const f = await nativeWebFixture();
  try {
    const original = f.node;
    const destination = 'https://registration.example.com/step-2';
    f.web.onNavigationStateChange({ url: destination, canGoBack: true });
    f.web[callback]();
    assert.equal(f.events.history.at(-1), false, 'A terminated renderer cannot service Back navigation');
    assert.equal(f.node, original, 'The failed view stays until the user chooses retry');
    await act(async () => f.ref.current.reload());
    assert.notEqual(f.node, original, 'A terminated native renderer cannot be repaired with reload alone');
    assert.equal(f.web.source.uri, destination);
    assert.deepEqual(f.commands, []);
    f.web.onLoadStart({ nativeEvent: { url: destination } }); f.web.onLoad();
    assert.equal(f.events.ready.length, 1);
  } finally { await f.close(); }
});

test('web fallback stays framed and reloads locally without popup or top-navigation privileges', async () => {
  const events = [], ref = React.createRef();
  const { WebContent } = sourceLoader()('src/features/content/WebContent.web.tsx');
  let root;
  await act(async () => { root = create(React.createElement(WebContent, {
    ref, url: 'https://training.example.com/calendar', title: 'Synthetic training',
    onLoading: value => events.push(['loading', value]), onProgress() {}, onReady: () => events.push(['ready']),
    onError: value => events.push(['error', value]), onHistoryChange: value => events.push(['history', value]),
    onLocationChange() {}, onOpenLink() {},
  })); });
  try {
    const initial = root.root.findByType('iframe');
    assert.equal(initial.props.title, 'Synthetic training');
    assert.equal(initial.props.referrerPolicy, 'no-referrer');
    assert.ok(!initial.props.sandbox.includes('allow-top-navigation'));
    assert.ok(!initial.props.sandbox.includes('allow-popups'));
    initial.props.onLoad();
    assert.deepEqual(events.slice(-2), [['loading', false], ['ready']]);
    await act(async () => ref.current.reload());
    const reloaded = root.root.findByType('iframe');
    assert.notEqual(reloaded, initial);
    reloaded.props.onError();
    assert.match(events.at(-1)[1], /mobile app/);
  } finally { await act(async () => root.unmount()); }
});

async function providerFixture() {
  const alerts = [], backRequests = [], animations = [];
  const frames = new Map();
  let api, root, nextFrame = 0, session = 'synthetic-account';
  // Native timing is deliberately asynchronous: page removal must depend on
  // the real motion hook's completion and cancellation guards.
  function cancel(shared) {
    if (!shared.active) return;
    const animation = shared.active;
    shared.active = null;
    animation.cancelled = true;
    animation.callback?.(false);
  }
  function sharedValue(initial) {
    const shared = { current: initial, active: null };
    Object.defineProperty(shared, 'value', {
      get: () => shared.current,
      set(value) {
        cancel(shared);
        if (value?.kind === 'timing') {
          const animation = { ...value, shared, cancelled: false };
          animations.push(animation);
          shared.active = animation;
        } else shared.current = value;
      },
    });
    return shared;
  }
  const builder = new Proxy(function () {}, {
    apply: () => builder, construct: () => builder, get: () => () => builder,
  });
  const reanimated = {
    __esModule: true,
    default: { View: 'AnimatedView' },
    Easing: { bezier: (...points) => points },
    Keyframe: builder, LinearTransition: builder,
    ReduceMotion: { System: 'system' },
    cancelAnimation: cancel,
    runOnJS: fn => fn,
    useSharedValue(initial) {
      const value = React.useRef(null);
      if (!value.current) value.current = sharedValue(initial);
      return value.current;
    },
    useAnimatedStyle: factory => factory(),
    interpolate: (value, input, output) => output[0] + (value - input[0]) / (input[1] - input[0]) * (output[1] - output[0]),
    withTiming: (target, config, callback) => ({ kind: 'timing', target, config, callback }),
  };
  const ViewerBoundary = React.forwardRef((props, ref) => {
    const [formValue, onChangeForm] = React.useState('');
    React.useImperativeHandle(ref, () => ({ back: () => { backRequests.push(props.content.url); props.onBack(); } }), [props.content.url, props.onBack]);
    return React.createElement('ContentViewer', { ...props, formValue, onChangeForm });
  });
  const load = sourceLoader({
    'react-native': { Alert: { alert: (...args) => alerts.push(args) }, Modal: 'Modal', View: 'View',
      Platform: { OS: 'android' }, StyleSheet: { create: value => value, absoluteFill: {} } },
    'react-native-reanimated': reanimated,
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    './ContentViewer': { ContentViewer: ViewerBoundary },
  }, {
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const { InAppContentProvider, useInAppContent } = load('src/features/content/InAppContentProvider.tsx');
  const { contentViewerMotion, motionConfig } = load('src/lib/motion.ts');
  function Consumer() { api = useInAppContent(); return React.createElement('UnderlyingScreen'); }
  const tree = () => React.createElement(InAppContentProvider, { sessionKey: session }, React.createElement(Consumer));
  await act(async () => { root = create(tree()); });
  return { alerts, backRequests, animations, frames, contentViewerMotion, motionConfig,
    get api() { return api; }, get root() { return root.root; }, get viewers() { return root.root.findAllByType('ContentViewer'); },
    get active() { return animations.filter(animation => animation.shared.active === animation); },
    async frame() {
      await act(async () => {
        for (const [id, fn] of [...frames]) { frames.delete(id); fn(); }
      });
    },
    async finish(animation) {
      assert.equal(animation.shared.active, animation, 'only an active animation can finish');
      await act(async () => {
        animation.shared.current = animation.target;
        animation.shared.active = null;
        animation.callback?.(true);
      });
    },
    async finishMotion() {
      await this.frame();
      for (const animation of this.active) {
        if (animation.shared.active === animation) await this.finish(animation);
      }
    },
    async staleCompletion(animation) { await act(async () => animation.callback?.(true)); },
    async changeSession(value) { session = value; await act(async () => root.update(tree())); },
    close: () => act(async () => root.unmount()) };
}

test('provider opens in place, rejects unsupported links, and retains the parent page beneath a popup', async () => {
  const f = await providerFixture();
  try {
    assert.equal(f.root.findAllByType('Modal').length, 0);
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    await f.finishMotion();
    const parent = f.viewers[0];
    assert.equal(f.root.findAllByType('UnderlyingScreen').length, 1);
    assert.equal(f.viewers.length, 1);
    await act(async () => f.api.openContent({ url: 'javascript:alert(1)', title: 'Blocked' }));
    assert.equal(f.alerts.length, 1); assert.equal(f.viewers.length, 1);
    await act(async () => parent.props.onOpenLink('https://training.example.com/register'));
    await f.finishMotion();
    assert.equal(f.viewers.length, 2);
    assert.equal(f.viewers[0], parent, 'Parent form stays mounted while a linked page is displayed');
    await act(async () => f.root.findByType('Modal').props.onRequestClose());
    assert.deepEqual(f.backRequests, ['https://training.example.com/register']);
    await f.finishMotion();
    assert.equal(f.viewers.length, 1); assert.equal(f.viewers[0], parent);
    await act(async () => f.viewers[0].props.onClose());
    await f.finishMotion();
    assert.equal(f.root.findAllByType('Modal').length, 0);
  } finally { await f.close(); }
});

test('changing account or signing out disposes open content and its form state', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    await f.finishMotion();
    await f.changeSession('another-account');
    assert.equal(f.viewers.length, 0);
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    await f.finishMotion();
    await f.changeSession(null);
    assert.equal(f.viewers.length, 0);
  } finally { await f.close(); }
});

test('content modal measures its own safe area across linked pages and reopening', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    await f.finishMotion();
    const modal = f.root.findByType('Modal');
    const provider = modal.findByType('SafeAreaProvider');
    const safeArea = provider.findByType('SafeAreaView');
    assert.equal(provider.parent, modal, 'The safe-area provider must be inside the native modal boundary');
    assert.equal(provider.findAllByType('SafeAreaView').length, 1, 'Insets are applied once around the entire viewer');
    assert.equal(safeArea.findByType('ContentViewer'), f.viewers[0]);
    assert.equal(provider.props.initialMetrics, undefined, 'A reopened modal must measure current system insets');
    await act(async () => f.viewers[0].props.onOpenLink('https://training.example.com/register'));
    await f.finishMotion();
    assert.equal(modal.findByType('SafeAreaProvider'), provider, 'Linked pages share the modal safe-area measurement');
    assert.equal(safeArea.findAllByType('ContentViewer').length, 2);
    await act(async () => f.api.closeContent());
    await f.finishMotion();
    assert.equal(f.root.findAllByType('SafeAreaProvider').length, 0);
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    await f.finishMotion();
    assert.notEqual(f.root.findByType('SafeAreaProvider'), provider, 'Reopening gets a fresh native measurement');
  } finally { await f.close(); }
});

test('content remains mounted until its fade finishes and respects system reduced motion', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    const modal = f.root.findByType('Modal');
    assert.equal(modal.props.animationType, 'none', 'The native modal must not layer a second transition over the app motion');
    assert.equal(modal.props.transparent, true);
    assert.equal(modal.props.presentationStyle, 'overFullScreen');
    const surface = f.root.findAllByType('AnimatedView').find(node => node.props.accessibilityViewIsModal === true);
    assert.equal(surface.props.style.at(-1).opacity, 0);
    assert.equal(surface.props.style.at(-1).transform, undefined, 'The viewer fades without moving or scaling');
    await f.frame();
    assert.deepEqual(f.active.map(animation => animation.target), [1]);
    for (const animation of f.active) {
      assert.equal(animation.config, f.contentViewerMotion.enter);
      assert.equal(animation.config.reduceMotion, 'system');
      assert.equal(animation.config.duration, f.motionConfig.contentViewer.enterDuration);
      assert.equal(JSON.stringify(animation.config.easing), JSON.stringify(f.motionConfig.easing.enter));
    }
    await f.finishMotion();
    const viewer = f.viewers[0];
    await act(async () => viewer.props.onBack());
    assert.equal(f.viewers[0], viewer, 'Back must retain the actual page during its exit');
    assert.equal(f.root.findByType('Modal'), modal);
    assert.equal(surface.props.pointerEvents, 'none');
    assert.equal(surface.props.accessibilityElementsHidden, true);
    assert.deepEqual(f.active.map(animation => animation.target), [0]);
    for (const animation of f.active) {
      assert.equal(animation.config, f.contentViewerMotion.exit);
      assert.equal(animation.config.reduceMotion, 'system');
      assert.equal(animation.config.duration, f.motionConfig.contentViewer.exitDuration);
      assert.equal(JSON.stringify(animation.config.easing), JSON.stringify(f.motionConfig.easing.exit));
    }
    const exit = f.active.find(animation => animation.callback);
    assert.ok(exit, 'The fade completion controls when the page is removed');
    await f.finish(exit);
    assert.equal(f.viewers.length, 0);
    assert.equal(f.root.findAllByType('Modal').length, 0);
    await f.staleCompletion(exit);
    assert.equal(f.viewers.length, 0);
  } finally { await f.close(); }
});

test('nested Back preserves the parent form and ignores repeated Back and hardware Back during exit', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    await f.finishMotion();
    const parent = f.viewers[0];
    await act(async () => parent.props.onChangeForm('Unsubmitted registration'));
    await act(async () => parent.props.onOpenLink('https://training.example.com/register'));
    await f.finishMotion();
    const child = f.viewers[1];
    const back = child.props.onBack;
    await act(async () => f.root.findByType('Modal').props.onRequestClose());
    assert.deepEqual(f.backRequests, ['https://training.example.com/register']);
    const exiting = [...f.active];
    assert.equal(f.viewers.length, 2);
    assert.equal(parent.props.formValue, 'Unsubmitted registration');
    await act(async () => { back(); back(); f.root.findByType('Modal').props.onRequestClose(); });
    assert.deepEqual(f.backRequests, ['https://training.example.com/register'], 'Hardware Back must not be dispatched again during exit');
    assert.deepEqual(f.active, exiting, 'Repeated Back must not restart the exit');
    await f.finishMotion();
    assert.equal(f.viewers.length, 1);
    assert.equal(f.viewers[0], parent);
    assert.equal(parent.props.formValue, 'Unsubmitted registration');
    assert.equal(f.root.findAllByType('Modal').length, 1, 'A repeated Back must never also close the parent');
  } finally { await f.close(); }
});

test('opening another page during root exit survives the cancelled exit completion', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    await f.finishMotion();
    const first = f.viewers[0];
    await act(async () => f.api.closeContent());
    const exit = f.active.find(animation => animation.callback);
    assert.ok(exit);
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    assert.equal(exit.cancelled, true);
    assert.equal(f.viewers.length, 1, 'A new root replaces the dismissed stack');
    assert.notEqual(f.viewers[0], first);
    await f.staleCompletion(exit);
    await f.finishMotion();
    assert.equal(f.viewers[0].props.content.title, 'Warranty');
    await act(async () => f.api.closeContent());
    const latestExit = f.active.find(animation => animation.callback);
    await f.staleCompletion(exit);
    assert.equal(f.viewers.length, 1, 'An old completion must not finish a newer exit');
    await f.finishMotion();
    assert.equal(f.viewers.length, 0);
    assert.notEqual(latestExit, exit);
  } finally { await f.close(); }
});

test('opening and closing in one batch never leaves an invisible modal before the first frame', async () => {
  const f = await providerFixture();
  try {
    await act(async () => {
      f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' });
      f.api.closeContent();
    });
    assert.equal(f.viewers.length, 0);
    assert.equal(f.root.findAllByType('Modal').length, 0, 'An unpresented page must not block the app with an invisible modal');
    assert.equal(f.frames.size, 0);
    assert.equal(f.active.length, 0);
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    await f.finishMotion();
    assert.equal(f.viewers.length, 1, 'An immediate dismissal must not break the next open');
    assert.equal(f.viewers[0].props.content.title, 'Warranty');
    await act(async () => f.api.closeContent());
    await f.finishMotion();
    assert.equal(f.root.findAllByType('Modal').length, 0);
  } finally { await f.close(); }
});

test('account changes dispose pages immediately during both nested and root exits', async () => {
  const f = await providerFixture();
  try {
    for (const closing of ['nested', 'root']) {
      await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
      await f.finishMotion();
      await act(async () => f.viewers[0].props.onOpenLink('https://training.example.com/register'));
      await f.finishMotion();
      const previousPage = f.viewers[1];
      await act(async () => closing === 'nested' ? previousPage.props.onBack() : f.api.closeContent());
      const exit = f.active.find(animation => animation.callback);
      assert.ok(exit);
      await f.changeSession(closing === 'nested' ? 'another-account' : null);
      assert.equal(f.viewers.length, 0, 'Account state cannot wait for a closing animation');
      assert.equal(f.root.findAllByType('Modal').length, 0);
      assert.equal(exit.cancelled, true, 'Account changes must cancel a pending exit');
      assert.equal(f.active.length, 0);
      assert.equal(f.frames.size, 0);
      await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'New session' }));
      const surface = f.root.findAllByType('AnimatedView').find(node => node.props.accessibilityViewIsModal === true);
      assert.equal(surface.props.style.at(-1).opacity, 0, 'A new session begins its own entrance from hidden');
      assert.equal(surface.props.style.at(-1).transform, undefined, 'A new session also uses an opacity-only entrance');
      await f.staleCompletion(exit);
      assert.equal(f.viewers[0].props.content.title, 'New session', 'A previous session cannot dismiss a newly opening page');
      await f.finishMotion();
      assert.equal(f.viewers.length, 1);
      assert.equal(f.viewers[0].props.content.title, 'New session');
      assert.equal(f.viewers[0].props.formValue, '');
      await act(async () => f.api.closeContent());
      await f.finishMotion();
    }
  } finally { await f.close(); }
});

test('changing session before the entrance frame cancels it and reopening starts a fresh entrance', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    assert.equal(f.frames.size, 1);
    await f.changeSession('another-account');
    assert.equal(f.frames.size, 0, 'The previous session must not start its scheduled entrance');
    assert.equal(f.active.length, 0);
    assert.equal(f.root.findAllByType('Modal').length, 0);
    await act(async () => f.api.openContent({ url: 'https://warranty.example.com/register', title: 'Warranty' }));
    assert.equal(f.frames.size, 1);
    await f.frame();
    assert.equal(f.active.length, 1, 'Only the new session may animate');
    assert.deepEqual(f.active.map(animation => animation.target), [1]);
    for (const animation of f.active) assert.equal(animation.config, f.contentViewerMotion.enter);
    await f.finishMotion();
    assert.equal(f.viewers.length, 1);
    assert.equal(f.viewers[0].props.content.title, 'Warranty');
  } finally { await f.close(); }
});

test('hidden and closing pages cannot create new viewers from delayed popup events', async () => {
  const f = await providerFixture();
  try {
    await act(async () => f.api.openContent({ url: 'https://training.example.com/calendar', title: 'Training' }));
    await f.finishMotion();
    const parentLink = f.viewers[0].props.onOpenLink;
    await act(async () => parentLink('https://training.example.com/register'));
    await f.finishMotion();
    const childLink = f.viewers[1].props.onOpenLink;
    await act(async () => parentLink('https://files.example.com/background.pdf'));
    assert.equal(f.viewers.length, 2, 'Background pages must not open a popup above the active page');
    await act(async () => f.viewers[1].props.onBack());
    await act(async () => { childLink('https://files.example.com/closing.pdf'); parentLink('https://files.example.com/underlay.pdf'); });
    assert.equal(f.viewers.length, 2, 'Closing and covered pages must not interrupt an exit');
    await f.finishMotion();
    await act(async () => childLink('https://files.example.com/stale.pdf'));
    assert.equal(f.viewers.length, 1, 'A callback retained from a removed page must be ignored');
    await act(async () => f.api.closeContent());
    await act(async () => parentLink('https://files.example.com/root-exit.pdf'));
    assert.equal(f.viewers.length, 1);
    await f.finishMotion();
    assert.equal(f.viewers.length, 0);
    await act(async () => parentLink('https://files.example.com/after-close.pdf'));
    assert.equal(f.viewers.length, 0, 'A dismissed page must not reopen the modal');
  } finally { await f.close(); }
});

async function viewerFixture(kind = 'page', nativewind = false, platform = 'android') {
  const commands = [], links = [], externalLinks = [], timers = new Map();
  let nextTimer = 0, backs = 0, closes = 0, root;
  const ref = React.createRef();
  const WebBoundary = React.forwardRef((props, webRef) => {
    React.useImperativeHandle(webRef, () => ({ goBack: () => commands.push('back'), reload: () => commands.push('reload') }), []);
    return React.createElement('WebContent', props);
  });
  // Use the installed NativeWind JSX dispatcher: these StyleSheet callbacks must
  // reach React Native directly rather than its className/inline-style merger.
  const wrapJSX = nativewind ? sourceLoader({
    './api': { interopComponents: new Map([['Pressable', 'CssInterop.Pressable']]) },
    './third-party-libs/react-native-safe-area-context': { maybeHijackSafeAreaProvider: type => type },
  }, { process: { env: { NODE_ENV: 'test' } } })('node_modules/react-native-css-interop/src/runtime/wrap-jsx.ts').default : null;
  const { ContentViewer } = sourceLoader({
    ...(wrapJSX ? { 'react/jsx-runtime': { ...jsxRuntime, jsx: wrapJSX(jsxRuntime.jsx), jsxs: wrapJSX(jsxRuntime.jsxs) } } : {}),
    'react-native': { ActivityIndicator: 'ActivityIndicator', Platform: { OS: platform }, Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: value => value, absoluteFillObject: {} } },
    '../../lib/openExternalUrl': { openExternalUrl: async url => externalLinks.push(url) },
    'lucide-react-native': icons,
    './WebContent': { WebContent: WebBoundary }, './PdfDocument': { PdfDocument: 'PdfDocument' },
  }, {
    setTimeout: handler => { const key = ++nextTimer; timers.set(key, handler); return key; },
    clearTimeout: key => timers.delete(key),
  })('src/features/content/ContentViewer.tsx');
  await act(async () => { root = create(React.createElement(ContentViewer, { ref, content: { url: `https://content.example.com/${kind === 'pdf' ? 'claim.pdf' : 'page'}`, title: 'Synthetic content', kind }, onBack: () => backs++, onClose: () => closes++, onOpenLink: url => links.push(url) })); });
  return { ref, commands, timers, links, externalLinks, get backs() { return backs; }, get closes() { return closes; },
    get buttons() { return root.root.findAllByType('Pressable'); },
    get web() { return root.root.findByType('WebContent').props; }, get pdf() { return root.root.findByType('PdfDocument'); },
    texts: () => root.root.findAllByType('Text').map(node => node.props.children).filter(value => typeof value === 'string'),
    press: label => act(async () => root.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === label).props.onPress()),
    timeout: () => act(async () => { for (const [key, handler] of [...timers]) { timers.delete(key); handler(); } }),
    close: () => act(async () => root.unmount()) };
}

test('native viewer buttons retain visible styling and touch targets through NativeWind JSX interop', async () => {
  const f = await viewerFixture('page', true);
  const flatten = value => Object.assign({}, ...value.filter(Boolean));
  try {
    assert.equal(f.buttons.length, 2, 'Header buttons must bypass the inline-style merger');
    for (const button of f.buttons) {
      assert.equal(typeof button.props.style, 'function');
      const normal = flatten(button.props.style({ pressed: false }));
      const pressed = flatten(button.props.style({ pressed: true }));
      assert.equal(normal.width, 48);
      assert.equal(normal.height, 48);
      assert.equal(pressed.opacity, 0.6, 'Existing press feedback remains intact');
    }
    await act(async () => f.web.onError('Synthetic load failure'));
    const retry = f.buttons.find(button => button.props.accessibilityLabel === 'Try loading content again');
    assert.ok(retry, 'Recovery action must reach the native Pressable');
    const normal = flatten(retry.props.style({ pressed: false }));
    assert.equal(normal.backgroundColor, '#0A2D7F', 'White retry text needs its blue button background');
    assert.equal(normal.minHeight, 48);
    assert.equal(normal.flexDirection, 'row');
    await f.press('Try loading content again');
    assert.deepEqual(f.commands, ['reload']);
  } finally { await f.close(); }
});

test('failed embedded pages can open the latest page in a browser only when requested', async () => {
  const f = await viewerFixture();
  try {
    await act(async () => f.web.onLocationChange('https://content.example.com/registration'));
    await act(async () => f.web.onError('Embedded access unavailable'));
    assert.deepEqual(f.externalLinks, []);
    await f.press('Open content in browser');
    assert.deepEqual(f.externalLinks, ['https://content.example.com/registration']);
    assert.equal(f.closes, 0);
  } finally { await f.close(); }
});

test('PDF failures and silently blocked browser frames provide an explicit alternative', async () => {
  const pdf = await viewerFixture('pdf');
  try {
    await act(async () => pdf.pdf.props.onError('Viewer unavailable'));
    await pdf.press('Open content in browser');
    assert.deepEqual(pdf.externalLinks, ['https://content.example.com/claim.pdf']);
  } finally { await pdf.close(); }
  const web = await viewerFixture('page', false, 'web');
  try {
    await act(async () => web.web.onReady());
    await web.press('Open content in browser');
    assert.deepEqual(web.externalLinks, ['https://content.example.com/page']);
  } finally { await web.close(); }
});

test('viewer Back uses page history, Close exits, and retry preserves the displayed page', async () => {
  const f = await viewerFixture();
  try {
    assert.ok(f.texts().includes('Getting things ready'));
    await act(async () => f.web.onReady());
    assert.ok(!f.texts().includes('Getting things ready'));
    await act(async () => f.web.onHistoryChange(true));
    await f.press('Back');
    assert.deepEqual(f.commands, ['back']); assert.equal(f.backs, 0);
    await act(async () => f.ref.current.back());
    assert.deepEqual(f.commands, ['back', 'back']);
    await act(async () => f.web.onError('Synthetic failure'));
    assert.ok(f.texts().includes('Synthetic failure'));
    await f.press('Try loading content again');
    assert.equal(f.commands.at(-1), 'reload');
    assert.ok(!f.texts().includes('Synthetic failure'));
    await act(async () => f.web.onHistoryChange(false));
    await f.press('Back'); assert.equal(f.backs, 1);
    await f.press('Close resource'); assert.equal(f.closes, 1);
  } finally { await f.close(); }
  assert.equal(f.timers.size, 0, 'Timers are removed on unmount');
});

test('stalled loads show recovery and failed PDF retries mount a fresh document', async () => {
  const f = await viewerFixture('pdf');
  try {
    const original = f.pdf;
    assert.ok(f.texts().includes('Opening document'));
    await f.timeout();
    assert.ok(f.texts().some(value => /taking longer/.test(value)));
    await f.press('Try loading content again');
    assert.notEqual(f.pdf, original);
    assert.ok(f.texts().includes('Opening document'));
    await act(async () => f.pdf.props.onReady());
    assert.ok(!f.texts().includes('Opening document'));
  } finally { await f.close(); }
});

async function screenFixture(file, data, managerData) {
  const content = [], external = [], routes = [];
  const mocks = {
    '../../../features/auth/AuthProvider': { useAuth: () => ({ user: { id: 'verified-dealer', role: 'PROSPECT', onboarding: { restricted: false } }, refreshMe: async () => {} }) },
    '../../../features/onboarding/RestrictedSupport': { RestrictedSupport: 'RestrictedSupport' },
    'react-native': { Text: 'Text', View: 'View' },
    'lucide-react-native': icons,
    'expo-router': { router: { push: path => routes.push(path) } },
    '../../../features/content/InAppContentProvider': { useInAppContent: () => ({ openContent: item => content.push(item) }) },
    '../../../features/financing/FinancingCard': { FinancingCard: 'FinancingCard' },
    '../../../lib/openExternalUrl': { openExternalUrl: async url => external.push(url) },
    '../../../lib/api/endpoints': {},
    '../../../lib/hooks/useAsyncData': { useAsyncData: () => ({ data, error: null, loading: false, reload() {} }) },
    '../../../features/manager/ManagerDataProvider': { useManagerData: () => ({ support: { data: managerData, reload() {} } }) },
    '../../../components/layout/navigation': { prospectQuickLinks: [], managerQuickLinks: [] },
  };
  for (const name of ['AppScreen']) mocks[`../../../components/layout/${name}`] = { [name]: name };
  for (const name of ['AnimatedCard', 'AsyncContent', 'ListGroup', 'ListItem', 'ModalSheet', 'PageHero', 'PrimaryButton', 'SectionHeader', 'SkeletonReveal']) {
    mocks[`../../../components/ui/${name}`] = { [name]: name };
  }
  mocks['../../../components/ui/SkeletonPrimitives'] = { SkeletonLine: 'SkeletonLine', SkeletonListGroup: 'SkeletonListGroup', SkeletonSectionHeader: 'SkeletonSectionHeader' };
  mocks['../../../components/ui/StateViews'] = { ErrorState: 'ErrorState' };
  const Component = sourceLoader(mocks)(file).default;
  let root;
  await act(async () => { root = create(React.createElement(Component)); });
  return {
    content, external, routes,
    row: title => root.root.findAllByType('ListItem').find(row => row.props.title === title),
    async press(title) {
      const target = [...root.root.findAllByType('ListItem'), ...root.root.findAllByType('PrimaryButton')]
        .find(row => row.props.title === title || row.props.label === title);
      assert.ok(target, `Missing action: ${title}`);
      assert.equal(typeof target.props.onPress, 'function', `Inactive action: ${title}`);
      await act(async () => target.props.onPress());
    },
    close: () => act(async () => root.unmount()),
  };
}

test('training calendar and registration open together inside the app', async () => {
  const f = await screenFixture('src/app/(prospect)/prospect/classes.tsx', { classes: [] });
  try {
    await f.press('Training Calendar & Registration');
    assert.equal(f.content.length, 1);
    assert.equal(f.content[0].title, 'Training Calendar & Registration');
    assert.match(f.content[0].url, /\/eventcalendar$/);
    assert.deepEqual(f.external, []);
  } finally { await f.close(); }
});

test('warranty registration, claim document, and every resource category use the in-app viewer', async () => {
  const resources = [resource('registration', 'Registration'), resource('manual', 'Technical'), resource('app', 'Apps', 'APP'), resource('marketing', 'Marketing')];
  const f = await screenFixture('src/app/(prospect)/prospect/resources.tsx', { resources });
  try {
    await f.press('Register Your First LG System');
    await f.press('Parts Claim Form (PDF)');
    for (const entry of resources) await f.press(entry.title);
    assert.equal(f.content.length, 6);
    assert.equal(f.content[0].title, 'LG Warranty Registration');
    assert.equal(f.content[1].kind, 'pdf');
    assert.match(f.content[1].url, /\.pdf$/i);
    assert.deepEqual(f.content.slice(2).map(item => item.url), resources.map(item => item.url));
    assert.deepEqual(f.external, []);
  } finally { await f.close(); }
});

test('technical support calls, email composition, and app routes retain their existing actions', async () => {
  const f = await screenFixture('src/app/(prospect)/prospect/resources.tsx', { resources: [] });
  try {
    await f.press('Call Tech Support');
    await f.press('Email Tech Support');
    await f.press('Warranty Help');
    assert.equal(f.external.length, 2);
    assert.ok(f.external[0].startsWith('tel:'));
    assert.ok(f.external[1].startsWith('mailto:'));
    assert.deepEqual(f.routes, ['/prospect/benefits']);
    assert.deepEqual(f.content, []);
  } finally { await f.close(); }
});

for (const screen of ['benefits', 'rebates']) test(`${screen} links stay in the app and missing URLs are not actions`, async () => {
  const entries = [benefit('discount'), benefit('unavailable', null)];
  const data = screen === 'benefits' ? { benefits: entries, onboarding: { summary: {} } } : { benefits: entries };
  const f = await screenFixture(`src/app/(prospect)/prospect/${screen}.tsx`, data);
  try {
    await f.press(entries[0].title);
    assert.equal(f.content.length, 1);
    assert.equal(f.content[0].url, entries[0].url);
    assert.equal(f.row(entries[1].title).props.onPress, undefined);
    assert.deepEqual(f.external, []);
  } finally { await f.close(); }
});

test('manager resources and benefits share the same viewer without activating missing links', async () => {
  const resources = [resource('manager-guide', 'Technical')];
  const benefits = [benefit('manager-discount'), benefit('missing', null)];
  const f = await screenFixture('src/app/(manager)/manager/resources.tsx', null, { classes: { classes: [] }, resources: { resources }, benefits: { benefits } });
  try {
    await f.press(resources[0].title);
    await f.press(benefits[0].title);
    assert.deepEqual(f.content.map(item => item.url), [resources[0].url, benefits[0].url]);
    assert.equal(f.row(benefits[1].title).props.onPress, undefined);
    assert.deepEqual(f.external, []);
  } finally { await f.close(); }
});
