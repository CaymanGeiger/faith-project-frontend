import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const initialFeatures = ['home', 'setup', 'training', 'support', 'messaging', 'account'];
const restricted = { id: 'dealer', firstName: 'Test', role: 'PROSPECT', onboarding: { state: 'TRAINING_REQUIRED', restricted: true, allowedFeatures: initialFeatures } };
const verified = { ...restricted, onboarding: { state: 'TRAINING_VERIFIED', restricted: false, allowedFeatures: [...initialFeatures, 'benefits', 'resources', 'equipment', 'marketing', 'warranty', 'rebates', 'financing'] } };
const icons = new Proxy({}, { get: (_, name) => String(name) });

// Keep real screen wrappers, restricted components, access policy, React hooks,
// and useAsyncData. Replace native/view boundaries and record every API call.
async function screenFixture(screen, initialUser = restricted) {
  const requests = [], routes = [], external = [];
  let root, serverUser = initialUser, refreshFailure = null, refreshes = 0;
  const Context = React.createContext(null);
  const summary = { trainingSelected: true, trainingCompleted: false, openTodos: 0, completedTodos: 0 };
  const user = { ...initialUser, email: 'dealer@example.com', prospectProfile: { companyName: 'Synthetic dealer' } };
  const request = (name, result) => async () => { requests.push(name); return result; };
  const endpoints = {
    accountApi: { onboarding: request('account.onboarding', { summary, access: initialUser?.onboarding }), me: request('account.me', { user }) },
    todosApi: { list: request('todos.list', { todos: [] }) },
    resourcesApi: { list: request('resources.list', { resources: [] }) },
    equipmentApi: { list: request('equipment.list', { equipment: [] }) },
    marketingApi: { get: request('marketing.get', { consultation: {} }) },
    classesApi: { list: request('classes.list', { classes: [] }) },
  };
  function AuthBoundary({ children }) {
    const [user, setUser] = React.useState(initialUser);
    const refreshMe = async () => {
      refreshes++;
      if (refreshFailure) throw refreshFailure;
      setUser(serverUser);
    };
    return React.createElement(Context.Provider, { value: { user, refreshMe } }, children);
  }
  const native = {
    View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
    Platform: { OS: 'web' }, StyleSheet: { create: value => value },
    AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
  };
  const mocks = {
    'react-native': native,
    'lucide-react-native': icons,
    'expo-router': {
      router: { push: route => routes.push(route) },
      useLocalSearchParams: () => ({ step: 'equipment' }),
      useFocusEffect: callback => React.useEffect(callback, [callback]),
    },
    '@react-native-async-storage/async-storage': { getItem: request('draft.read', null), setItem: request('draft.write', null) },
    'expo-secure-store': { isAvailableAsync: async () => false },
    '../auth/AuthProvider': { useAuth: () => React.useContext(Context) },
    '../../../features/auth/AuthProvider': { useAuth: () => React.useContext(Context) },
    '../../../features/content/InAppContentProvider': { useInAppContent: () => ({ openContent: item => external.push(item) }) },
    '../../../lib/theme/nativeStyles': { nativeStyles: {} },
    '../../../lib/motionConfig': { motionConfig: { native: {}, page: {} } },
  };
  const visualComponents = ['AnimatedCard', 'AsyncContent', 'CoBrandLockup', 'ListGroup', 'ListItem', 'RelatedLinks', 'SectionHeader', 'SkeletonReveal', 'PageHero', 'PrimaryButton', 'SecondaryButton'];
  for (const prefix of ['../../', '../../../']) {
    mocks[`${prefix}lib/api/endpoints`] = endpoints;
    mocks[`${prefix}lib/openExternalUrl`] = { openExternalUrl: async url => external.push(url) };
    mocks[`${prefix}components/layout/AppScreen`] = { AppScreen: 'Screen' };
    mocks[`${prefix}components/layout/KeyboardViewport`] = { KeyboardViewport: 'KeyboardViewport' };
    mocks[`${prefix}components/layout/navigation`] = { prospectQuickLinks: [
      { href: '/prospect/classes' }, { href: '/prospect/benefits' }, { href: '/prospect/resources' }, { href: '/prospect/marketing' },
    ] };
    for (const component of visualComponents) mocks[`${prefix}components/ui/${component}`] = { [component]: component };
    mocks[`${prefix}components/ui/StateViews`] = { ErrorState: 'ErrorState' };
    mocks[`${prefix}components/ui/SkeletonPrimitives`] = new Proxy({}, { get: (_, name) => String(name) });
  }
  for (const component of ['NextStepCard', 'ProspectProfileCard', 'QuickActionGrid', 'TrainingHomeCard']) {
    mocks[`../../../features/prospect/${component}`] = { [component]: component };
  }
  for (const name of ['Class', 'Equipment', 'Marketing', 'Profile', 'Review', 'Warranty']) {
    mocks[`../../../features/getting-started/${name}SetupStep`] = { [`${name}SetupStep`]: `${name}Step` };
  }
  mocks['../../../features/getting-started/GettingStartedProgress'] = { GettingStartedProgress: 'Progress' };
  const Screen = sourceLoader(mocks)(`src/app/(prospect)/prospect/${screen}.tsx`).default;
  await act(async () => { root = create(React.createElement(AuthBoundary, null, React.createElement(Screen))); });
  return {
    root, requests, routes, external,
    get refreshes() { return refreshes; },
    setServerUser(value) { serverUser = value; },
    failRefresh() { refreshFailure = new Error('Synthetic offline state'); },
    async press(label) {
      const button = [...root.root.findAllByType('PrimaryButton'), ...root.root.findAllByType('SecondaryButton')]
        .find(node => node.props.label === label);
      assert.ok(button, `Missing button: ${label}`);
      await act(async () => { button.props.onPress(); });
    },
    close: () => act(async () => root.unmount()),
  };
}

for (const screen of ['index', 'getting-started']) {
  test(`${screen} mounts the real restricted home and never requests privileged data, even with an equipment shortcut`, async () => {
    const f = await screenFixture(screen);
    try {
      assert.deepEqual(f.requests, ['account.onboarding']);
      assert.equal(f.root.root.findByType('Screen').props.title, 'Getting Started');
      assert.ok(f.root.root.findAllByType('Text').some(node => JSON.stringify(node.props.children).includes('registering for a class does not verify completion')));
      const links = f.root.root.findByType('Screen').props.quickLinks;
      assert.deepEqual(links.map(link => link.href), ['/prospect/classes', '/prospect/resources']);
      await f.press('Open Training');
      assert.deepEqual(f.routes, ['/prospect/classes']);
      assert.deepEqual(f.requests, ['account.onboarding']);
    } finally { await f.close(); }
  });
}

test('restricted Support mounts contact actions without fetching resources or opening dealer warranty links', async () => {
  const f = await screenFixture('resources');
  try {
    assert.deepEqual(f.requests, []);
    assert.equal(f.root.root.findByType('Screen').props.title, 'Support');
    assert.equal(f.root.root.findAllByType('ListItem').length, 0);
    await f.press('Chat with Your Representative');
    await f.press('Open Training');
    await f.press('Call Hercules Support');
    assert.deepEqual(f.routes, ['/prospect/messages', '/prospect/classes']);
    assert.deepEqual(f.external, ['tel:18003565350']);
    assert.deepEqual(f.requests, []);
  } finally { await f.close(); }
});

test('missing onboarding metadata never mounts full Home, setup or Support feature loaders', async () => {
  for (const initialUser of [{ id: 'older-response', role: 'PROSPECT' }, null]) {
    for (const screen of ['index', 'getting-started', 'resources']) {
      const f = await screenFixture(screen, initialUser);
      try {
        assert.ok(f.requests.every(name => name === 'account.onboarding'));
        assert.equal(f.root.root.findAllByType('QuickActionGrid').length, 0);
        assert.equal(f.root.root.findAllByType('EquipmentStep').length, 0);
      } finally { await f.close(); }
    }
  }
});

test('refreshing still-pending training keeps restrictions; a fresh verified server identity unlocks the current Home screen', async () => {
  const f = await screenFixture('index');
  try {
    await f.press('Check Training Verification');
    assert.equal(f.refreshes, 1);
    assert.ok(f.requests.every(name => name === 'account.onboarding'));
    assert.equal(f.root.root.findByType('Screen').props.title, 'Getting Started');
    f.setServerUser(verified);
    await f.press('Check Training Verification');
    assert.equal(f.refreshes, 2);
    assert.equal(f.root.root.findByType('Screen').props.title, 'LG Dealer Portal');
    assert.ok(f.requests.includes('todos.list'));
    assert.ok(f.requests.includes('account.me'));
  } finally { await f.close(); }
});

test('failed verification refresh keeps the restricted screen and offers retry without privileged requests', async () => {
  const f = await screenFixture('index');
  try {
    f.setServerUser(verified);
    f.failRefresh();
    await f.press('Check Training Verification');
    assert.equal(f.root.root.findByType('Screen').props.title, 'Getting Started');
    assert.equal(f.root.root.findByType('ErrorState').props.message, 'Synthetic offline state');
    assert.equal(typeof f.root.root.findByType('ErrorState').props.onRetry, 'function');
    assert.ok(f.requests.every(name => name === 'account.onboarding'));
  } finally { await f.close(); }
});

test('external verified training completes the setup milestone and continues without inventing an enrollment', async () => {
  const writes = [];
  let completed = 0, action, root;
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable' },
    'lucide-react-native': icons,
    '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async (...args) => writes.push(args), removeItem: async (...args) => writes.push(args) },
    'expo-secure-store': { isAvailableAsync: async () => false },
    '../../components/ui/StateViews': { ErrorState: 'ErrorState' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'PrimaryButton' },
    '../content/InAppContentProvider': { useInAppContent: () => ({ openContent() {} }) },
    '../../lib/api/endpoints': { classesApi: { enroll: async id => writes.push(id) } },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
  });
  const { getGettingStartedCompletion } = load('src/features/getting-started/gettingStarted.ts');
  const data = { user: { ...verified, prospectProfile: { companyName: 'Fixture' } }, classes: [], equipment: [], todos: [], consultation: {} };
  assert.equal(getGettingStartedCompletion(data)[1], true);
  assert.equal(getGettingStartedCompletion({ ...data, user: restricted })[1], false);
  const { ClassSetupStep } = load('src/features/getting-started/ClassSetupStep.tsx');
  const props = { classes: [], userId: 'dealer', trainingVerified: true, onComplete: async () => { completed++; }, onActionChange: next => { action = next; } };
  await act(async () => { root = create(React.createElement(ClassSetupStep, props)); });
  try {
    assert.equal(root.root.findByType('Card').props.title, 'Initial Training Verified');
    assert.equal(action.label, 'Continue');
    assert.equal(action.disabled, false);
    assert.equal(root.root.findAllByType('ErrorState').length, 0);
    await act(async () => { action.onPress(); });
    assert.equal(completed, 1);
    assert.deepEqual(writes, [], 'Verified external completion must not create a class enrollment or overwrite a draft');
    await act(async () => root.update(React.createElement(ClassSetupStep, { ...props, trainingVerified: false })));
    assert.equal(action.disabled, true);
    assert.equal(root.root.findByType('ErrorState').props.message, 'No LG training sessions are currently available.');
  } finally { await act(async () => root.unmount()); }

  const { ReviewSetupStep } = load('src/features/getting-started/ReviewSetupStep.tsx');
  await act(async () => { root = create(React.createElement(ReviewSetupStep, {
    user: data.user, warrantyComplete: false, marketingComplete: false, canFinish: false,
    onEdit() {}, onFinish() {}, onActionChange() {},
  })); });
  try {
    const text = root.root.findAllByType('Text').map(node => JSON.stringify(node.props.children)).join(' ');
    assert.match(text, /Initial training completion verified/);
    assert.doesNotMatch(text, /Training selection needed/);
  } finally { await act(async () => root.unmount()); }
});
