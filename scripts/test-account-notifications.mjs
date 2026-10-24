import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function fixture({ granted = true, available = true, platform = 'android' } = {}) {
  let state, root, cleanup;
  const calls = [], storage = new Map();
  const notifications = {
    AndroidImportance: { DEFAULT: 3 },
    setNotificationChannelAsync: async () => calls.push('channel'),
    getPermissionsAsync: async () => ({ granted }),
    requestPermissionsAsync: async () => { calls.push('permission'); return { granted }; },
    getExpoPushTokenAsync: async () => { calls.push('token'); return { data: 'ExpoPushToken[test]' }; },
    setNotificationHandler: () => {},
    addNotificationResponseReceivedListener: () => ({ remove() {} }),
    addPushTokenListener: () => ({ remove() {} }),
    getLastNotificationResponseAsync: async () => null,
  };
  const auth = { user: { id: 'dealer', role: 'PROSPECT' }, token: 'auth-token' };
  const load = sourceLoader({
    'react-native': { Platform: { OS: platform }, AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-constants': { executionEnvironment: 'standalone', easConfig: { projectId: 'project' } },
    'expo-device': { isDevice: true },
    'expo-notifications': notifications,
    'expo-router': { router: { push: () => {} } },
    '@react-native-async-storage/async-storage': { getItem: async key => storage.get(key) ?? null, setItem: async (key, value) => storage.set(key, value), removeItem: async key => storage.delete(key) },
    '../auth/AuthProvider': { useAuth: () => auth },
    '../auth/signOutCleanup': { registerSignOutCleanup: handler => { cleanup = handler; return () => {}; } },
    '../../lib/api/client': { apiFetch: async path => { calls.push(path); return { available }; } },
  });
  const { PushNotificationsProvider, usePushNotifications } = load('src/features/notifications/PushNotificationsProvider.tsx');
  function Consumer() { state = usePushNotifications(); return null; }
  await act(async () => { root = create(React.createElement(PushNotificationsProvider, null, React.createElement(Consumer))); });
  return { get state() { return state; }, calls, storage, cleanup: () => cleanup(), close: () => act(async () => root.unmount()) };
}

test('notifications do not prompt or register without an explicit opt-in', async () => {
  const f = await fixture(); assert.equal(f.state.enabled, false); assert.deepEqual(f.calls, []); await f.close();
});
for (const platform of ['ios', 'android']) test(`${platform} opt-in registers and opt-out removes the device`, async () => {
  const f = await fixture({ platform });
  await act(async () => f.state.setEnabled(true));
  assert.equal(f.state.enabled, true); assert.ok(f.calls.includes('/push/register'));
  if (platform === 'android') assert.ok(f.calls.indexOf('channel') < f.calls.indexOf('token'));
  else assert.ok(!f.calls.includes('channel'));
  await act(async () => f.state.setEnabled(false));
  assert.ok(f.calls.includes('/push/unregister')); assert.equal(f.state.enabled, false); assert.equal(f.storage.size, 0);
  await f.close();
});
test('denied permission explains recovery without registering a device', async () => {
  const f = await fixture({ granted: false }); await act(async () => f.state.setEnabled(true));
  assert.equal(f.state.enabled, false); assert.match(f.state.error, /phone settings/); assert.ok(!f.calls.includes('/push/register')); await f.close();
});
test('unconfigured delivery does not claim alerts are enabled', async () => {
  const f = await fixture({ available: false }); await act(async () => f.state.setEnabled(true));
  assert.equal(f.state.enabled, false); assert.match(f.state.error, /not available/); assert.ok(!f.calls.includes('token')); await f.close();
});
test('signing out unregisters alerts for this installation', async () => {
  const f = await fixture(); await act(async () => f.state.setEnabled(true)); await f.cleanup();
  assert.ok(f.calls.includes('/push/unregister')); await f.close();
});

async function formFixture(file) {
  const calls = []; let logouts = 0, root;
  const load = sourceLoader({
    'react-native': { Text: 'Text', View: 'View' },
    'expo-router': { router: { replace: () => {} } },
    '../../features/auth/AuthShell': { AuthShell: 'Shell' },
    '../auth/AuthProvider': { useAuth: () => ({ logout: async () => { logouts++; } }) },
    '../../components/ui/TextInput': { TextInput: 'Input' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../../components/ui/SecondaryButton': { SecondaryButton: 'Secondary' },
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../lib/api/client': { apiFetch: async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return { message: 'Confirmation' }; } },
  });
  const module = load(file); const Component = module.default ?? module.EmailChangeForm;
  await act(async () => { root = create(React.createElement(Component)); });
  return {
    calls, get logouts() { return logouts; },
    input: (label, value) => act(async () => root.root.findAllByType('Input').find(input => input.props.label === label).props.onChangeText(value)),
    press: label => act(async () => [...root.root.findAllByType('Primary'), ...root.root.findAllByType('Secondary')].find(button => button.props.label === label).props.onPress()),
    close: () => act(async () => root.unmount()),
  };
}
test('recovery requests a code, rejects mismatched passwords, then confirms the reset', async () => {
  const f = await formFixture('src/app/(auth)/forgot-password.tsx');
  await f.input('Account email', ' Dealer@Example.com '); await f.press('Send Verification Code');
  assert.deepEqual(f.calls[0], { path: '/auth/password-recovery', body: { email: 'dealer@example.com' } });
  await f.input('8-digit verification code', '12345678'); await f.input('New password (at least 12 characters)', 'new-password-value');
  await f.input('Confirm new password', 'wrong'); await f.press('Update Password'); assert.equal(f.calls.length, 1);
  await f.input('Confirm new password', 'new-password-value'); await f.press('Update Password');
  assert.equal(f.calls[1].path, '/auth/password-recovery/confirm'); assert.equal(f.calls[1].body.code, '12345678');
  await f.close();
});
test('email change keeps the session until the new address is confirmed', async () => {
  const f = await formFixture('src/features/account/EmailChangeForm.tsx');
  await f.press('Change Email Address'); await f.input('New email address', ' New@Example.com '); await f.input('Current password', 'current-password');
  await f.press('Send Verification Code'); assert.equal(f.logouts, 0);
  assert.deepEqual(f.calls[0], { path: '/auth/email-change', body: { email: 'new@example.com', currentPassword: 'current-password' } });
  await f.input('8-digit verification code', '12345678'); await f.press('Verify Email & Sign Out');
  assert.equal(f.calls[1].path, '/auth/email-change/confirm'); assert.equal(f.logouts, 1); await f.close();
});

async function deletionFixture({ role = 'PROSPECT', request, cleanupFails = false } = {}) {
  const calls = [];
  let root;
  const load = sourceLoader({
    // Alert is deliberately unavailable, as it is a no-op in React Native Web.
    'react-native': { Text: 'Text', View: 'View', Pressable: 'Pressable' },
    'expo-router': { router: { push: () => {} } },
    '../../components/ui/ModalSheet': { ModalSheet: props => props.visible ? React.createElement('Sheet', props) : null },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../../components/ui/SecondaryButton': { SecondaryButton: 'Secondary' },
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../lib/api/endpoints': { accountApi: { requestDeletion: async () => {
      calls.push('request');
      return request ? request() : { completed: role === 'PROSPECT', message: 'Your account deletion request was received.' };
    } } },
    '../getting-started/gettingStarted': { clearGettingStartedDraft: async () => {
      calls.push('clear-draft');
      if (cleanupFails) throw new Error('Local storage unavailable');
    } },
  });
  const { AccountComplianceActions } = load('src/features/account/AccountComplianceActions.tsx');
  await act(async () => { root = create(React.createElement(AccountComplianceActions, {
    user: { id: 'account-1', role },
    onDeleted: async () => { calls.push('sign-out'); },
  })); });
  const button = label => [...root.root.findAllByType('Primary'), ...root.root.findAllByType('Secondary')].find(node => node.props.label === label);
  return {
    calls, root, button,
    open: () => act(async () => root.root.findByProps({ accessibilityLabel: 'Request account deletion' }).props.onPress()),
    press: label => act(async () => button(label).props.onPress()),
    dismiss: () => act(async () => root.root.findByType('Sheet').props.onClose()),
    close: () => act(async () => root.unmount()),
  };
}

for (const role of ['PROSPECT', 'SALES_MANAGER']) {
  test(`${role} account deletion requires confirmation and supports cancellation without native Alert`, async () => {
    const f = await deletionFixture({ role });
    await f.open();
    assert.equal(f.root.root.findByType('Sheet').props.title, 'Delete account?');
    assert.deepEqual(f.calls, []);
    await f.press('Cancel');
    assert.equal(f.root.root.findAllByType('Sheet').length, 0);
    assert.deepEqual(f.calls, []);
    await f.close();
  });

  test(`${role} confirmed deletion shows the server result and signs out on dismissal`, async () => {
    const f = await deletionFixture({ role });
    await f.open();
    await f.press('Request deletion');
    assert.equal(f.calls.filter(value => value === 'request').length, 1);
    assert.equal(f.calls.includes('clear-draft'), role === 'PROSPECT');
    assert.equal(f.calls.includes('sign-out'), false);
    assert.equal(f.root.root.findByType('Sheet').props.title, 'Account deletion');
    assert.ok(JSON.stringify(f.root.toJSON()).includes('Your account deletion request was received.'));
    await f.dismiss();
    assert.equal(f.calls.includes('sign-out'), true);
    await f.close();
  });
}

test('pending deletion cannot be duplicated or dismissed, and a failure can be retried', async () => {
  let rejectRequest;
  let attempt = 0;
  const f = await deletionFixture({ request: () => {
    if (attempt++ === 0) return new Promise((_, reject) => { rejectRequest = reject; });
    return { completed: false, message: 'Ownership verification is pending.' };
  } });
  await f.open();
  await act(async () => { f.button('Request deletion').props.onPress(); f.button('Request deletion').props.onPress(); });
  assert.equal(f.calls.filter(value => value === 'request').length, 1);
  assert.equal(f.button('Cancel').props.disabled, true);
  await f.dismiss();
  assert.equal(f.root.root.findAllByType('Sheet').length, 1);
  await act(async () => rejectRequest(new Error('Connection interrupted')));
  assert.equal(f.root.root.findByType('Error').props.message, 'Connection interrupted');
  assert.equal(f.calls.includes('sign-out'), false);
  await f.press('Request deletion');
  assert.equal(f.calls.filter(value => value === 'request').length, 2);
  assert.ok(JSON.stringify(f.root.toJSON()).includes('Ownership verification is pending.'));
  await f.press('Done');
  assert.equal(f.calls.includes('sign-out'), true);
  await f.close();
});

test('local draft cleanup failure does not hide a successful account deletion', async () => {
  const f = await deletionFixture({ cleanupFails: true });
  await f.open();
  await f.press('Request deletion');
  assert.equal(f.root.root.findAllByType('Error').length, 0);
  assert.ok(f.button('Done'));
  await f.press('Done');
  assert.equal(f.calls.includes('sign-out'), true);
  await f.close();
});
