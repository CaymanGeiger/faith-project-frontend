import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const restricted = { id: 'dealer', role: 'PROSPECT', onboarding: { state: 'TRAINING_REQUIRED', restricted: true, allowedFeatures: ['home', 'setup', 'training', 'support', 'messaging', 'account'] } };
const verified = { ...restricted, onboarding: { ...restricted.onboarding, state: 'TRAINING_VERIFIED', restricted: false, allowedFeatures: [...restricted.onboarding.allowedFeatures, 'benefits', 'equipment', 'marketing', 'warranty', 'rebates', 'dealer-registration', 'resources', 'financing'] } };

test('navigation fails closed and unlocks only server-returned features', () => {
  const { canAccessProspectRoute: route, canAccessFeature: feature, hasRestrictedAccess, accessibleLinks } = sourceLoader()('src/features/onboarding/access.ts');
  for (const href of ['/prospect', '/prospect/getting-started?step=equipment', '/prospect/classes/', '/prospect/resources', '/prospect/messages', '/prospect/account']) assert.equal(route(restricted, href), true);
  for (const href of ['/prospect/benefits', '/prospect/marketing', '/prospect/rebates', '/prospect/already-a-dealer', '/prospect/unknown']) assert.equal(route(restricted, href), false);
  assert.equal(feature({ id: 'old', role: 'PROSPECT' }, 'benefits'), false);
  assert.equal(hasRestrictedAccess({ id: 'old', role: 'PROSPECT' }), true);
  assert.equal(feature(verified, 'benefits'), true);
  assert.equal(route(verified, '/prospect/benefits'), true);
  assert.equal(route(null, '/prospect'), false);
  assert.equal(accessibleLinks(restricted, [{ href: '/prospect/classes' }, { href: '/prospect/benefits' }]).length, 1);
});

test('layout prevents mounting locked routes and changes navigation after verification', async () => {
  let user = restricted, pathname = '/prospect/benefits';
  const Stack = Object.assign(({ children }) => React.createElement('Stack', null, children), { Screen: 'StackScreen' });
  const load = sourceLoader({
    'expo-router': { Redirect: 'Redirect', Stack, usePathname: () => pathname },
    'react-native': { Platform: { OS: 'web' }, Text: 'Text', View: 'View' },
    'react-native-safe-area-context': { SafeAreaView: 'SafeArea' },
    '../../lib/motionConfig': { motionConfig: { native: {} } },
    '../../components/layout/AppHeader': { AppHeader: 'Header' },
    '../../components/layout/BottomNav': { BottomNav: 'Nav' },
    '../../components/layout/navigation': { getProspectHeaderTitle: () => 'Home', prospectNavItems: [{ href: '/prospect/classes' }], prospectQuickLinks: [{ href: '/prospect/classes' }, { href: '/prospect/benefits' }] },
    '../../features/auth/AuthProvider': { useAuth: () => ({ user, loading: false }) },
    '../../features/onboarding/DevelopmentTrainingToggle': { DevelopmentTrainingToggle: 'DevelopmentTrainingToggle' },
  });
  const Layout = load('src/app/(prospect)/_layout.tsx').default;
  let root;
  await act(async () => { root = create(React.createElement(Layout)); });
  assert.equal(root.root.findByType('Redirect').props.href, '/prospect');
  assert.equal(root.root.findAllByType('Stack').length, 0);
  pathname = '/prospect';
  await act(async () => root.update(React.createElement(Layout)));
  assert.equal(root.root.findByType('Header').props.links.length, 1);
  user = verified; pathname = '/prospect/benefits';
  await act(async () => root.update(React.createElement(Layout)));
  assert.equal(root.root.findAllByType('Redirect').length, 0);
  assert.equal(root.root.findByType('Header').props.links.length, 2);
  user = restricted;
  await act(async () => root.update(React.createElement(Layout)));
  assert.equal(root.root.findByType('Redirect').props.href, '/prospect');
  assert.equal(root.root.findAllByType('Stack').length, 0, 'revoking verification unmounts the previously allowed direct route');
  await act(async () => root.unmount());
});

const mocks = {
  'react-native': { Text: 'Text', View: 'View', Switch: 'Switch', Pressable: 'Pressable' },
  'expo-router': { router: { push() {}, replace() {} } },
  '../../features/auth/AuthShell': { AuthShell: 'Shell' },
  '../../components/ui/TextInput': { TextInput: 'Input' },
  '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
  '../../components/ui/SecondaryButton': { SecondaryButton: 'Secondary' },
  '../../components/ui/StateViews': { ErrorState: 'Error' },
};

test('activation binds email and code, requires matching passwords and consent, returns to sign-in', async () => {
  const requests = [];
  const load = sourceLoader({ ...mocks, '../../lib/api/client': { apiFetch: async (path, options) => { requests.push({ path, body: JSON.parse(options.body) }); return { message: 'Accepted' }; } } });
  const Screen = load('src/app/(auth)/activate.tsx').default;
  let root;
  await act(async () => { root = create(React.createElement(Screen)); });
  const set = async (label, value) => act(async () => root.root.findAllByType('Input').find(input => input.props.label === label).props.onChangeText(value));
  await set('Registration email', ' Dealer@Example.test ');
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.deepEqual(requests[0], { path: '/auth/activation/request', body: { email: 'dealer@example.test' } });
  assert.equal(root.root.findAllByType('Input')[0].props.editable, false);
  await set('8-digit activation code', '12345678');
  await set('First name', 'Test'); await set('Last name', 'Dealer');
  await set('Password (at least 12 characters)', 'Long-enough-password');
  await set('Confirm password', 'Wrong');
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(requests.length, 1);
  await set('Confirm password', 'Long-enough-password');
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(requests.length, 1);
  await act(async () => root.root.findByType('Switch').props.onValueChange(true));
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(requests[1].path, '/auth/activation/confirm');
  assert.equal(requests[1].body.code, '12345678');
  assert.equal(requests[1].body.termsAccepted, true);
  assert.equal(root.root.findAllByType('Input').length, 0);
  assert.equal(root.root.findAllByType('Primary').length, 0);
  await act(async () => root.unmount());
});

test('manager verification requires evidence and actual completion confirmation', async () => {
  const requests = []; let refreshed = 0;
  const load = sourceLoader({ ...mocks,
    '../../lib/hooks/useAsyncData': { useAsyncData: () => ({ data: { access: restricted.onboarding, verification: null, canVerifyTraining: true }, reload: async () => { refreshed++; } }) },
    '../../lib/api/client': { apiFetch: async (path, options) => requests.push({ path, body: JSON.parse(options.body) }) },
  });
  const { TrainingVerification } = load('src/features/onboarding/TrainingVerification.tsx');
  let root;
  await act(async () => { root = create(React.createElement(TrainingVerification, { prospectUserId: 'assigned', onVerified: async () => { refreshed++; } })); });
  assert.equal(root.root.findByType('Primary').props.disabled, true);
  const set = async (label, value) => act(async () => root.root.findAllByType('Input').find(input => input.props.label === label).props.onChangeText(value));
  await set('Training completion date (YYYY-MM-DD)', '2026-02-30');
  await set('Verification source', 'Approved training record'); await set('Evidence reference', 'TEST-record-123');
  await act(async () => root.root.findByType('Switch').props.onValueChange(true));
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(requests.length, 0);
  await set('Training completion date (YYYY-MM-DD)', '2026-01-15');
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(requests[0].path, '/onboarding/prospects/assigned/training-verification');
  assert.equal(requests[0].body.reference, 'TEST-record-123');
  assert.equal(refreshed, 2);
  await act(async () => root.unmount());
});
