import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function fixture(loader, strict = false) {
  let focused = true, value, root;
  const { useAsyncData } = sourceLoader({
    'react-native': { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    'expo-router': { useFocusEffect: callback => React.useEffect(() => focused ? callback() : undefined, [callback, focused]) },
  })('src/lib/hooks/useAsyncData.ts');
  function Consumer() { value = useAsyncData(loader); return null; }
  const render = () => React.createElement(strict ? React.StrictMode : React.Fragment, null, React.createElement(Consumer));
  await act(async () => { root = create(render()); });
  return {
    get value() { return value; },
    async focus(next) { focused = next; await act(async () => root.update(render())); },
    close: () => act(async () => root.unmount()),
  };
}

test('returning to a retained screen refreshes saved progress without remounting', async () => {
  let saved = 0, calls = 0;
  const f = await fixture(async () => { calls++; return saved; });
  assert.equal(f.value.data, 0);
  assert.equal(calls, 1);
  await f.focus(false);
  saved = 1;
  await f.focus(true);
  assert.equal(f.value.data, 1);
  assert.equal(calls, 2);
  await f.close();
});

test('an old request cannot overwrite fresh data after returning to a screen', async () => {
  let first = true, finish;
  const pending = new Promise(resolve => { finish = resolve; });
  const f = await fixture(() => { if (first) { first = false; return pending; } return Promise.resolve('saved'); });
  await f.focus(false);
  await f.focus(true);
  assert.equal(f.value.data, 'saved');
  await act(async () => finish('stale'));
  assert.equal(f.value.data, 'saved');
  assert.equal(f.value.loading, false);
  await f.close();
});

test('focus refresh recovers a failed first load and survives strict effect replay', async () => {
  let fail = true;
  const f = await fixture(async () => { if (fail) throw new Error('offline'); return 'recovered'; }, true);
  assert.equal(f.value.error, 'offline');
  fail = false;
  await f.focus(false);
  await f.focus(true);
  assert.equal(f.value.data, 'recovered');
  assert.equal(f.value.error, null);
  assert.equal(f.value.loading, false);
  await f.close();
});
