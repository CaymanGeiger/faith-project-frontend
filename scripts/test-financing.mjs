import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function fixture(request) {
  const opened = [];
  let retries = 0;
  const mocks = {
    'lucide-react-native': { BadgeDollarSign: 'BadgeDollarSign' },
    '../../lib/hooks/useAsyncData': {
      useAsyncData: () => ({ loading: false, error: null, reload: () => { retries++; }, ...request }),
    },
    '../content/InAppContentProvider': { useInAppContent: () => ({ openContent: value => opened.push(value) }) },
    './financingApi': { financingApi: { get() {} } },
    '../../components/ui/SkeletonPrimitives': { SkeletonListRow: 'SkeletonListRow' },
    '../../components/ui/StateViews': { ErrorState: 'ErrorState' },
  };
  for (const name of ['AnimatedCard', 'ListGroup', 'ListItem', 'SectionHeader']) {
    mocks[`../../components/ui/${name}`] = { [name]: name };
  }
  const { FinancingCard } = sourceLoader(mocks)('src/features/financing/FinancingCard.tsx');
  let root;
  await act(async () => { root = create(React.createElement(FinancingCard)); });
  return {
    root, opened, get retries() { return retries; },
    get row() { return root.root.findByType('ListItem'); },
    close: () => act(async () => root.unmount()),
  };
}

test('missing approved financing content is discoverable without a speculative destination or rates', async () => {
  const f = await fixture({ data: { financing: { available: false, description: null, url: null } } });
  try {
    assert.equal(f.row.props.title, 'Synchrony Financing');
    assert.equal(f.row.props.meta, 'Details unavailable');
    assert.match(f.row.props.subtitle, /not available in the app yet/);
    assert.equal(f.row.props.onPress, undefined);
    assert.deepEqual(f.opened, []);
    assert.doesNotMatch(f.row.props.subtitle, /\d+%|APR|interest|approved/i);
  } finally { await f.close(); }
});

test('configured financing preserves all supplied copy and opens through the existing content viewer', async () => {
  const url = 'https://finance.example.com/program?partner=fixture';
  const description = 'Synthetic program information.\nSecond paragraph supplied by the test owner.';
  const f = await fixture({ data: { financing: { available: true, description, url } } });
  try {
    assert.equal(f.row.props.subtitle, description);
    assert.equal(f.row.props.subtitleNumberOfLines, 0, 'Program copy must not truncate disclosures');
    assert.equal(f.row.props.meta, 'View financing information');
    await act(async () => f.row.props.onPress());
    assert.equal(f.opened.length, 1);
    assert.equal(f.opened[0].url, url);
    assert.equal(f.opened[0].title, 'Synchrony Financing');
  } finally { await f.close(); }
});

test('unsafe or incomplete responses never turn financing into an active action', async () => {
  for (const financing of [
    { available: true, url: 'https://finance.example.com', description: '' },
    { available: true, url: 'https://user:secret@finance.example.com', description: 'Fixture' },
    { available: true, url: 'javascript:alert(1)', description: 'Fixture' },
    { available: true, url: 'https://127.0.0.1', description: 'Fixture' },
  ]) {
    const f = await fixture({ data: { financing } });
    try {
      assert.equal(f.row.props.onPress, undefined);
      assert.equal(f.row.props.meta, 'Details unavailable');
      assert.deepEqual(f.opened, []);
    } finally { await f.close(); }
  }
});

test('loading and network failures remain distinct from missing approved information, with retry', async () => {
  const loading = await fixture({ loading: true, data: null });
  try {
    assert.equal(loading.root.root.findAllByType('SkeletonListRow').length, 1);
    assert.equal(loading.root.root.findAllByType('ListItem').length, 0);
  } finally { await loading.close(); }
  const error = await fixture({ error: 'Offline', data: null });
  try {
    const retry = error.root.root.findByType('ErrorState');
    assert.match(retry.props.message, /could not be loaded/);
    assert.equal(error.root.root.findAllByType('ListItem').length, 0);
    await act(async () => retry.props.onRetry());
    assert.equal(error.retries, 1);
  } finally { await error.close(); }
});

test('financing uses the authenticated API client', async () => {
  const paths = [];
  const response = { financing: { available: false, description: null, url: null } };
  const { financingApi } = sourceLoader({
    '../../lib/api/client': { apiFetch: async route => { paths.push(route); return response; } },
  })('src/features/financing/financingApi.ts');
  assert.equal(await financingApi.get(), response);
  assert.deepEqual(paths, ['/benefits/financing']);
});
