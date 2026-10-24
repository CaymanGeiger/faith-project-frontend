import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dealer = { id: 'local-dealer', email: 'prospect@hercules.local', role: 'PROSPECT', onboarding: { state: 'TRAINING_REQUIRED', restricted: true } };
const verified = { ...dealer, onboarding: { state: 'TRAINING_VERIFIED', restricted: false } };

async function fixture(options = {}) {
  const { dev = true, identity = dealer, send, refresh } = options;
  const flag = Object.hasOwn(options, 'flag') ? options.flag : 'true';
  const features = Object.hasOwn(options, 'features') ? options.features : 'true';
  const environment = Object.hasOwn(options, 'environment') ? options.environment : 'development';
  let user = identity;
  let refreshes = 0;
  const requests = [];
  const load = sourceLoader({
    'react-native': { Switch: 'Switch', Text: 'Text', View: 'View' },
    '../auth/AuthProvider': { useAuth: () => ({ user, refreshMe: async () => {
      refreshes++;
      if (refresh) await refresh();
      user = requests.at(-1)?.body.completed ? verified : dealer;
    } }) },
    '../../lib/api/client': { apiFetch: async (path, options) => {
      requests.push({ path, method: options.method, body: JSON.parse(options.body) });
      if (send) await send();
    } },
  }, { __DEV__: dev, process: { env: { EXPO_PUBLIC_APP_ENV: environment, EXPO_PUBLIC_DEV_FEATURES_ENABLED: features, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: flag } } });
  const { DevelopmentTrainingToggle } = load('src/features/onboarding/DevelopmentTrainingToggle.tsx');
  let root;
  await act(async () => { root = create(React.createElement(DevelopmentTrainingToggle)); });
  return { root, requests, get refreshes() { return refreshes; }, unmount: () => act(async () => root.unmount()) };
}

test('temporary toggle requires a testing environment, both explicit env opt-ins and dealer identity', async () => {
  for (const config of [
    ...[undefined, '', 'production', 'staging', 'PREVIEW'].flatMap(environment => [{ environment, dev: true }, { environment, dev: false }]),
    ...[undefined, '', 'false', 'TRUE', '1', ' true '].flatMap(value => [{ flag: value }, { features: value }]),
    { identity: null },
    { identity: { ...dealer, role: 'SALES_MANAGER' } },
  ]) {
    const f = await fixture(config);
    assert.equal(f.root.toJSON(), null);
    assert.equal(f.requests.length, 0);
    await f.unmount();
  }
  const legacy = await fixture({ identity: { ...dealer, onboarding: { state: 'EXISTING_ACCESS', restricted: false } } });
  assert.equal(legacy.root.root.findByType('Switch').props.value, false, 'existing access is not verified training');
  await legacy.unmount();
});

test('on and off update backend access and use refreshed server identity', async () => {
  const f = await fixture({ environment: 'preview', dev: false });
  assert.equal(f.root.root.findByType('Switch').props.value, false);
  await act(async () => { f.root.root.findByType('Switch').props.onValueChange(true); });
  assert.equal(f.root.root.findByType('Switch').props.value, true);
  await act(async () => { f.root.root.findByType('Switch').props.onValueChange(false); });
  assert.equal(f.root.root.findByType('Switch').props.value, false);
  assert.equal(f.refreshes, 2);
  assert.deepEqual(f.requests, [true, false].map(completed => ({ path: '/onboarding/development/training', method: 'PATCH', body: { completed } })));
  await f.unmount();
});

test('hosted preview training shortcuts are restricted to synthetic dealers, while local test databases retain their controls', async () => {
  for (const email of [undefined, '', 'dealer@company.test', 'dealer@hercules.local.example.com']) {
    const f = await fixture({ environment: 'preview', dev: false, identity: { ...dealer, email } });
    try {
      assert.equal(f.root.toJSON(), null);
      assert.equal(f.requests.length, 0);
    } finally { await f.unmount(); }
  }
  for (const [environment, email] of [
    ['development', 'dealer@company.test'],
    ['preview', ' Prospect@Demo.Hercules.Local '],
  ]) {
    const f = await fixture({ environment, dev: false, identity: { ...dealer, email } });
    try { assert.equal(f.root.root.findByType('Switch').props.value, false); }
    finally { await f.unmount(); }
  }
});

test('pending toggle disables repeat actions and does not optimistically unlock', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const f = await fixture({ send: () => pending });
  const change = f.root.root.findByType('Switch').props.onValueChange;
  await act(async () => { change(true); change(true); });
  assert.equal(f.requests.length, 1);
  assert.equal(f.root.root.findByType('Switch').props.disabled, true);
  assert.equal(f.root.root.findByType('Switch').props.value, false);
  await act(async () => { finish(); await pending; });
  assert.equal(f.root.root.findByType('Switch').props.disabled, false);
  assert.equal(f.root.root.findByType('Switch').props.value, true);
  await f.unmount();
});

test('request or identity-refresh failures show an error and keep the verified UI unchanged', async () => {
  for (const boundary of ['send', 'refresh']) {
    const f = await fixture({ [boundary]: async () => { throw new Error('Local preview unavailable'); } });
    await act(async () => { f.root.root.findByType('Switch').props.onValueChange(true); });
    assert.equal(f.root.root.findByType('Switch').props.value, false);
    assert.equal(f.root.root.findByType('Switch').props.disabled, false);
    assert.match(f.root.root.findByProps({ accessibilityRole: 'alert' }).props.children, /Local preview unavailable/);
    await f.unmount();
  }
});

async function menuFixture({ open = true } = {}) {
  const animations = [];
  const queuedCompletions = [];
  const load = sourceLoader({
    'react-native': { Platform: { OS: 'ios' }, Pressable: 'Pressable', ScrollView: 'ScrollView', View: 'View', Text: 'Text', StyleSheet: { create: v => v }, useWindowDimensions: () => ({ width: 320, height: 568 }) },
    'react-native-reanimated': {
      View: 'AnimatedView',
      interpolate: value => value,
      useAnimatedStyle: fn => fn(),
      useSharedValue: value => React.useRef({ value }).current,
      withTiming(value, config, completion) {
        animations.push({ value, config, completion, completed: false });
        return value;
      },
      cancelAnimation() {
        const active = animations.at(-1);
        if (active && !active.completed) {
          active.completed = true;
          active.completion?.(false);
        }
      },
      runOnJS: fn => (...args) => queuedCompletions.push(() => fn(...args)),
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }) },
    '../../lib/headerMotion': { headerMotion: { quickLinksEnter: { duration: 180 }, quickLinksExit: { duration: 140 } }, headerMotionConfig: { quickLinks: { initialScale: 1 } } },
  });
  const { QuickLinksMenu } = load('src/components/layout/QuickLinksMenu.tsx');
  const props = { links: [], topOffset: 100, open, onSelect() {}, headerContent: React.createElement('DevelopmentControl') };
  let root;
  await act(async () => { root = create(React.createElement(QuickLinksMenu, props)); });
  return {
    root,
    get headerCount() { return root.root.findAllByType('DevelopmentControl').length; },
    get latestAnimation() { return animations.at(-1); },
    async update(nextOpen) {
      await act(async () => root.update(React.createElement(QuickLinksMenu, { ...props, open: nextOpen })));
    },
    async complete(animation = animations.at(-1), finished = true) {
      assert.equal(typeof animation.completion, 'function', 'menu cleanup waits for animation completion');
      animation.completed = true;
      await act(async () => animation.completion(finished));
    },
    async flushCompletions() {
      await act(async () => {
        while (queuedCompletions.length) queuedCompletions.shift()();
      });
    },
    unmount: () => act(async () => root.unmount()),
  };
}

test('development menu header remains reachable on a small iPhone and stays mounted through the close animation', async () => {
  const f = await menuFixture({ open: false });
  try {
    assert.equal(f.headerCount, 0, 'closed menus do not mount the development control');
    await f.update(true);
    assert.equal(f.root.root.findByType('ScrollView').props.style.maxHeight, 420);
    assert.equal(f.headerCount, 1);
    assert.equal(f.root.root.findByType('AnimatedView').props.pointerEvents, 'auto');

    await f.update(false);
    assert.equal(f.headerCount, 1, 'closing preserves the header and panel height during the fade');
    assert.equal(f.root.root.findByType('AnimatedView').props.pointerEvents, 'none', 'closing disables interactions immediately');
    await f.complete();
    await f.flushCompletions();
    assert.equal(f.headerCount, 0, 'the header unmounts after the close animation completes');
  } finally {
    await f.unmount();
  }
});

test('reopening the menu ignores interrupted and stale close completions', async () => {
  const f = await menuFixture();
  try {
    await f.update(false);
    await f.update(true);
    await f.flushCompletions();
    assert.equal(f.headerCount, 1, 'canceling a close does not remove the reopened header');

    await f.update(false);
    await f.complete();
    await f.update(true);
    await f.flushCompletions();
    assert.equal(f.headerCount, 1, 'a queued completion cannot remove an open header');

    await f.update(false);
    await f.complete();
    await f.update(true);
    await f.update(false);
    await f.flushCompletions();
    assert.equal(f.headerCount, 1, 'an old close completion cannot shorten a later close animation');
    await f.complete();
    await f.flushCompletions();
    assert.equal(f.headerCount, 0);
  } finally {
    await f.unmount();
  }
});
