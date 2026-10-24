import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const enabledEnv = { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_DEV_FEATURES_ENABLED: 'true' };
const previewEnv = { ...enabledEnv, EXPO_PUBLIC_APP_ENV: 'preview' };
const productionEnv = { ...enabledEnv, EXPO_PUBLIC_APP_ENV: 'production' };
const disabledConfigurations = [
  ...[true, false].flatMap(dev => [
    ...[undefined, '', 'production', 'staging', 'PREVIEW', ' preview '].map(environment => ({
      dev, env: { EXPO_PUBLIC_APP_ENV: environment, EXPO_PUBLIC_DEV_FEATURES_ENABLED: 'true' },
    })),
    ...[undefined, '', 'false', 'TRUE', '1', ' true '].map(value => ({
      dev, env: { ...previewEnv, EXPO_PUBLIC_DEV_FEATURES_ENABLED: value },
    })),
  ]),
];
const viewport = { resetViewport() {}, setBrandVisible() {} };
const authMocks = {
  'react-native': {
    Platform: { OS: 'web' }, BackHandler: {}, Keyboard: {},
    Pressable: 'Pressable', Text: 'Text', View: 'View',
  },
  'react-native-reanimated': { View: 'AnimatedView' },
  'lucide-react-native': { Check: 'Check' },
  '../../components/ui/PrimaryButton': { PrimaryButton: 'PrimaryButton' },
  '../../components/ui/SecondaryButton': { SecondaryButton: 'SecondaryButton' },
  '../../components/ui/TextInput': { TextInput: 'TextInput' },
  '../../components/ui/StateViews': { ErrorState: 'ErrorState' },
  '../../features/auth/AuthShell': { AuthShell: 'AuthShell' },
  '../../features/auth/AuthViewport': { useAuthViewport: () => viewport },
  '../../features/content/InAppContentProvider': { useInAppContent: () => ({ openContent() {} }) },
  '../../lib/motion': { standardLayoutTransition: {} },
  '../../lib/theme/theme': { colors: {} },
};

async function authFixture(screen, { dev = true, env = {}, params = {} } = {}) {
  const logins = [];
  const invitations = [];
  const load = sourceLoader({
    ...authMocks,
    'expo-router': {
      router: { push() {}, dismissTo() {} },
      useLocalSearchParams: () => params,
      useFocusEffect: callback => React.useEffect(callback, [callback]),
    },
    '../../features/auth/AuthProvider': { useAuth: () => ({
      login: async (...args) => { logins.push(args); },
      getInviteDetails: async token => { invitations.push(token); return { accountType: 'PROSPECT' }; },
      registerFromInvite: async () => ({}),
    }) },
  }, { __DEV__: dev, process: { env } });
  const Screen = load(`src/app/(auth)/${screen}.tsx`).default;
  let root;
  await act(async () => { root = create(React.createElement(Screen)); });
  return {
    root, logins, invitations,
    input: label => root.root.findAllByType('TextInput').find(input => input.props.label === label),
    setInput: (label, value) => act(async () => root.root.findAllByType('TextInput').find(input => input.props.label === label).props.onChangeText(value)),
    unmount: () => act(async () => root.unmount()),
  };
}

test('demo logins require an explicit testing environment and master opt-in in every bundle mode', async () => {
  for (const config of disabledConfigurations) {
    const f = await authFixture('login', config);
    try {
      assert.equal(f.root.root.findAllByType('SecondaryButton').length, 0, JSON.stringify(config));
      assert.equal(f.input('Email').props.value, '');
      assert.equal(f.input('Password').props.value, '');
      assert.deepEqual(f.logins, []);
    } finally { await f.unmount(); }
  }
});

test('ordinary login still submits entered credentials with development features disabled', async () => {
  for (const config of [{ dev: true, env: {} }, { dev: false, env: productionEnv }]) {
    const f = await authFixture('login', config);
    try {
      await f.setInput('Email', 'dealer@company.test');
      await f.setInput('Password', 'user-entered-password');
      await act(async () => f.root.root.findByType('PrimaryButton').props.onPress());
      assert.deepEqual(f.logins, [['dealer@company.test', 'user-entered-password']]);
    } finally { await f.unmount(); }
  }
});

test('local development and release-mode Expo preview enable both matching demo accounts', async () => {
  for (const config of [{ dev: true, env: enabledEnv }, { dev: false, env: previewEnv }]) {
    const f = await authFixture('login', config);
    try {
      const shortcuts = () => f.root.root.findAllByType('SecondaryButton');
      assert.deepEqual(shortcuts().map(button => button.props.label), ['Log In as Dealer', 'Log In as Sales Manager']);
      await act(async () => shortcuts()[0].props.onPress());
      await act(async () => shortcuts()[1].props.onPress());
      assert.deepEqual(f.logins, [
        ['prospect@hercules.local', 'password123'],
        ['manager@hercules.local', 'password123'],
      ]);
    } finally { await f.unmount(); }
  }
});

test('registration starts empty without development opt-in and never validates a demo invitation automatically', async () => {
  for (const config of disabledConfigurations) {
    const f = await authFixture('register', config);
    try {
      assert.equal(f.input('Invitation Code').props.value, '', JSON.stringify(config));
      assert.equal(f.root.root.findByType('PrimaryButton').props.disabled, true);
      assert.deepEqual(f.invitations, []);
    } finally { await f.unmount(); }
  }
});

test('release-mode Expo preview invitation fallback preserves an explicitly empty token', async () => {
  for (const [params, expected] of [[{}, 'prospect-demo-token'], [{ token: '' }, '']]) {
    const f = await authFixture('register', { dev: false, env: previewEnv, params });
    try {
      assert.equal(f.input('Invitation Code').props.value, expected);
      assert.deepEqual(f.invitations, []);
      if (expected) {
        await act(async () => f.root.root.findByType('PrimaryButton').props.onPress());
        assert.deepEqual(f.invitations, [expected]);
      }
    } finally { await f.unmount(); }
  }
});

test('real invitation links retain their token in development and production', async () => {
  for (const config of [{ dev: false, env: productionEnv }, { dev: false, env: previewEnv }, { dev: true, env: {} }, { dev: true, env: enabledEnv }]) {
    const f = await authFixture('register', { ...config, params: { token: 'actual-one-use-invitation' } });
    try {
      assert.deepEqual(f.invitations, ['actual-one-use-invitation']);
      assert.equal(f.root.root.findByType('AuthShell').props.title, 'Create your account');
    } finally { await f.unmount(); }
  }
});

test('dealer navigation offers the training control only when both development flags are enabled', async () => {
  for (const config of [
    ...disabledConfigurations.map(config => ({ ...config, env: { ...config.env, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'true' }, enabled: false })),
    { dev: true, env: enabledEnv, enabled: false },
    { dev: true, env: { ...enabledEnv, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'false' }, enabled: false },
    { dev: true, env: { ...enabledEnv, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'true' }, enabled: true },
    { dev: false, env: { ...previewEnv, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'true' }, enabled: true },
    { dev: false, env: { ...previewEnv, EXPO_PUBLIC_DEV_TRAINING_TOGGLE: 'true' }, user: { id: 'real', role: 'PROSPECT', email: 'dealer@company.test' }, enabled: false },
  ]) {
    const Stack = Object.assign(({ children }) => React.createElement('Stack', null, children), { Screen: 'StackScreen' });
    const load = sourceLoader({
      'expo-router': { Redirect: 'Redirect', Stack, usePathname: () => '/prospect' },
      'react-native': { Platform: { OS: 'web' }, Text: 'Text', View: 'View' },
      'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
      '../../lib/motionConfig': { motionConfig: { native: {} } },
      '../../components/layout/AppHeader': { AppHeader: 'Header' },
      '../../components/layout/BottomNav': { BottomNav: 'Nav' },
      '../../components/layout/navigation': { getProspectHeaderTitle: () => 'Home', prospectNavItems: [], prospectQuickLinks: [] },
      '../../features/auth/AuthProvider': { useAuth: () => ({ user: config.user ?? { id: 'dealer', role: 'PROSPECT', email: 'prospect@hercules.local' }, loading: false }) },
      '../../features/onboarding/DevelopmentTrainingToggle': { DevelopmentTrainingToggle: 'DevelopmentTrainingToggle' },
    }, { __DEV__: config.dev, process: { env: config.env } });
    const Layout = load('src/app/(prospect)/_layout.tsx').default;
    let root;
    await act(async () => { root = create(React.createElement(Layout)); });
    try {
      assert.equal(Boolean(root.root.findByType('Header').props.menuHeader), config.enabled, JSON.stringify(config));
    } finally { await act(async () => root.unmount()); }
  }
});
