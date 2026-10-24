import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const message = (id = 'message-1') => ({ id, conversationId: 'chat', senderId: 'other', createdAt: '2026-10-19T12:00:00.000Z', body: 'Hello' });
class Socket extends EventEmitter {
  connected = true;
  sent = [];
  emit(event, ...args) { this.sent.push({ event, payload: args[0], acknowledge: args[1] }); return true; }
  fire(event) { super.emit(event); }
}

async function readerFixture() {
  const socket = new Socket();
  const app = new EventEmitter();
  app.currentState = 'active';
  app.addEventListener = (event, callback) => { app.on(event, callback); return { remove: () => app.off(event, callback) }; };
  const timers = new Map();
  let nextTimer = 0, root, conversationId = 'chat', messages = [message()];
  const { useReadReceipts } = sourceLoader({
    'react-native': { AppState: app }, '../../lib/api/endpoints': {}, '../../lib/messagingSocket': {},
  }, {
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
  })('src/features/messaging/hooks.ts');
  function Consumer() { useReadReceipts(conversationId, socket, messages); return null; }
  await act(async () => { root = create(React.createElement(Consumer)); });
  return {
    socket, app, timers,
    async run(delay) {
      const timer = [...timers].find(([, item]) => item.delay === delay);
      assert.ok(timer, `Expected a ${delay}ms timer`);
      timers.delete(timer[0]);
      await act(async () => timer[1].callback());
    },
    async select(id) { conversationId = id; messages = id ? [{ ...message(id), conversationId: id }] : []; await act(async () => root.update(React.createElement(Consumer))); },
    close: () => act(async () => root.unmount()),
  };
}

test('read receipts retry rejection and stop after the server acknowledges persistence', async () => {
  const f = await readerFixture();
  await f.run(500);
  assert.equal(f.socket.sent.length, 1);
  assert.equal(f.socket.sent[0].payload.lastMessageId, 'message-1');
  await act(async () => f.socket.sent[0].acknowledge({ ok: false, message: 'Temporary failure' }));
  await f.run(1000);
  assert.equal(f.socket.sent.length, 2);
  await act(async () => f.socket.sent[1].acknowledge({ ok: true }));
  assert.equal(f.timers.size, 0);
  await act(async () => f.app.emit('change', 'active'));
  assert.equal(f.socket.sent.length, 2);
  await f.close();
});

test('unacknowledged reads retry after timeout and wait for foreground or reconnection', async () => {
  const f = await readerFixture();
  await f.run(500);
  await f.run(5000);
  f.app.currentState = 'background';
  await f.run(1000);
  assert.equal(f.socket.sent.length, 1);
  f.app.currentState = 'active';
  await act(async () => f.app.emit('change', 'active'));
  assert.equal(f.socket.sent.length, 2);
  f.socket.connected = false;
  await act(async () => f.socket.fire('disconnect'));
  assert.equal(f.timers.size, 0);
  f.socket.connected = true;
  await act(async () => f.socket.fire('connect'));
  assert.equal(f.socket.sent.length, 3);
  await act(async () => f.socket.sent[2].acknowledge({ ok: true }));
  await f.close();
});

test('changing or closing a conversation cancels reads and ignores old acknowledgments', async () => {
  const f = await readerFixture();
  await f.run(500);
  const old = f.socket.sent[0];
  await f.select('next-chat');
  await act(async () => old.acknowledge({ ok: false, message: 'Late failure' }));
  await f.run(500);
  assert.equal(f.socket.sent[1].payload.conversationId, 'next-chat');
  await f.select(null);
  await act(async () => f.socket.sent[1].acknowledge({ ok: false, message: 'Closed' }));
  assert.equal(f.timers.size, 0);
  assert.equal(f.socket.listenerCount('connect'), 0);
  assert.equal(f.socket.listenerCount('disconnect'), 0);
  await f.close();
});

async function modalFixture({ failBlock = false, blockRequest } = {}) {
  const calls = [];
  let root;
  const conversation = id => ({ id, participants: [{ userId: 'other', user: { firstName: 'Taylor', lastName: 'Dealer', role: 'PROSPECT' } }] });
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    'expo-router': { router: { push() {} } },
    '../../../components/ui/ModalSheet': { ModalSheet: 'ModalSheet' },
    '../../../components/ui/PrimaryButton': { PrimaryButton: 'PrimaryButton' },
    '../../../components/ui/SecondaryButton': { SecondaryButton: 'SecondaryButton' },
    '../../../components/ui/StateViews': { ErrorState: 'ErrorState' },
    '../../../lib/format': { fullName: user => `${user.firstName} ${user.lastName}` },
    '../hooks': {
      useConversationMessages: () => ({ messages: [], readyToSend: true }),
      useTypingIndicator: () => ({}), useReadReceipts() {},
    },
    './MessageThread': { MessageThread: 'MessageThread' },
    '../../../lib/api/endpoints': { conversationsApi: {
      get: async id => ({ conversation: conversation(id) }),
      blockParticipant: async id => { calls.push(['block', id]); if (blockRequest) await blockRequest; if (failBlock) throw new Error('Please retry blocking.'); },
      unblockParticipant: async id => { calls.push(['unblock', id]); },
      reportMessage: async (id, messageId) => { calls.push(['report', id, messageId]); },
    } },
  }, { setInterval: () => 1, clearInterval() {} });
  const { MessagingModal } = load('src/features/messaging/components/MessagingModal.tsx');
  const props = { conversation: conversation('chat'), currentUser: { id: 'me' }, socket: null, onClose() {} };
  await act(async () => { root = create(React.createElement(MessagingModal, props)); });
  return {
    calls, get thread() { return root.root.findByType('MessageThread'); },
    get errors() { return root.root.findAllByType('ErrorState'); },
    get root() { return root; },
    async startBlock() { await act(async () => root.root.findByType('Pressable').props.onPress()); },
    async confirm() { await act(async () => root.root.findByType('PrimaryButton').props.onPress()); },
    async cancel() { await act(async () => root.root.findByType('SecondaryButton').props.onPress()); },
    async select(id) { await act(async () => root.update(React.createElement(MessagingModal, { ...props, conversation: id ? conversation(id) : null }))); },
    close: () => act(async () => root.unmount()),
  };
}

test('blocking requires confirmation and success updates chat controls; unblocking restores them', async () => {
  const f = await modalFixture();
  await f.startBlock();
  assert.equal(f.calls.length, 0);
  await f.cancel();
  assert.equal(f.calls.length, 0);
  await f.startBlock();
  await f.confirm();
  assert.deepEqual(f.calls, [['block', 'chat']]);
  assert.equal(f.thread.props.blockedByCurrentUser, true);
  await act(async () => f.thread.props.onUnblockParticipant());
  assert.deepEqual(f.calls, [['block', 'chat'], ['unblock', 'chat']]);
  assert.equal(f.thread.props.blockedByCurrentUser, false);
  await f.close();
});

test('failed blocking remains retryable and never claims the participant is blocked', async () => {
  const f = await modalFixture({ failBlock: true });
  await f.startBlock(); await f.confirm();
  assert.equal(f.thread.props.blockedByCurrentUser, false);
  assert.equal(f.errors[0].props.message, 'Please retry blocking.');
  await f.confirm();
  assert.equal(f.calls.length, 2);
  await f.close();
});

test('message reporting has a rendered confirmation and success notice without native Alert', async () => {
  const f = await modalFixture();
  await act(async () => f.thread.props.onReportMessage(message()));
  assert.equal(f.root.root.findByType('PrimaryButton').props.label, 'Report Message');
  assert.equal(f.calls.length, 0);
  await f.confirm();
  assert.deepEqual(f.calls, [['report', 'chat', 'message-1']]);
  assert.ok(f.root.root.findAllByType('Text').some(node => String(node.props.children).includes('Report received')));
  await f.close();
});

test('a block completing after conversation selection cannot block the new conversation', async () => {
  let release;
  const blockRequest = new Promise(resolve => { release = resolve; });
  const f = await modalFixture({ blockRequest });
  await f.startBlock(); await f.confirm();
  await f.select('next-chat');
  await act(async () => release());
  assert.equal(f.thread.props.conversationId, 'next-chat');
  assert.equal(f.thread.props.blockedByCurrentUser, false);
  await f.close();
});

async function pushFixture() {
  let state, root, foreground, tokenChanged, holdRead = false, holdWrite = false, releaseRead, releaseWrite;
  const storage = new Map(), calls = [];
  const auth = { user: { id: 'dealer', role: 'PROSPECT' }, token: 'auth-token' };
  const load = sourceLoader({
    'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: (_, callback) => { foreground = callback; return { remove() {} }; } } },
    'expo-constants': { executionEnvironment: 'standalone', easConfig: { projectId: 'project' } },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      AndroidImportance: { DEFAULT: 3 }, setNotificationChannelAsync: async () => {},
      getPermissionsAsync: async () => ({ granted: true }), getExpoPushTokenAsync: async () => ({ data: 'ExpoPushToken[test]' }),
      setNotificationHandler() {}, addNotificationResponseReceivedListener: () => ({ remove() {} }),
      addPushTokenListener: callback => { tokenChanged = callback; return { remove() {} }; },
      getLastNotificationResponseAsync: async () => null,
    },
    'expo-router': { router: { push() {} } },
    '@react-native-async-storage/async-storage': {
      getItem: async key => {
        const value = storage.get(key) ?? null;
        if (holdRead) { holdRead = false; return new Promise(resolve => { releaseRead = () => resolve(value); }); }
        return value;
      },
      setItem: async (key, value) => {
        if (holdWrite) { holdWrite = false; await new Promise(resolve => { releaseWrite = resolve; }); }
        storage.set(key, value);
      },
      removeItem: async key => { storage.delete(key); },
    },
    '../auth/AuthProvider': { useAuth: () => auth },
    '../auth/signOutCleanup': { registerSignOutCleanup: () => () => {} },
    '../../lib/api/client': { apiFetch: async path => { calls.push(path); return { available: true }; } },
  });
  const { PushNotificationsProvider, usePushNotifications } = load('src/features/notifications/PushNotificationsProvider.tsx');
  function Consumer() { state = usePushNotifications(); return null; }
  await act(async () => { root = create(React.createElement(PushNotificationsProvider, null, React.createElement(Consumer))); });
  return {
    get state() { return state; }, storage, calls,
    delayRead: () => { holdRead = true; }, delayWrite: () => { holdWrite = true; },
    releaseRead: () => releaseRead(), releaseWrite: () => releaseWrite(),
    refresh: source => source === 'foreground' ? foreground('active') : tokenChanged(),
    close: () => act(async () => root.unmount()),
  };
}

for (const source of ['foreground', 'token rotation']) test(`a delayed ${source} preference read cannot re-enable alerts after opt-out`, async () => {
  const f = await pushFixture();
  await act(async () => f.state.setEnabled(true));
  f.delayRead();
  await act(async () => f.refresh(source));
  await act(async () => f.state.setEnabled(false));
  assert.equal(f.state.enabled, false);
  await act(async () => f.releaseRead());
  assert.equal(f.state.enabled, false);
  assert.equal(f.storage.size, 0);
  assert.equal(f.calls.filter(path => path === '/push/register').length, 1);
  await f.close();
});

test('opting out waits for an in-flight preference write before removing registration and consent', async () => {
  const f = await pushFixture();
  await act(async () => f.state.setEnabled(true));
  f.delayWrite();
  await act(async () => f.refresh('foreground'));
  let optingOut;
  await act(async () => { optingOut = f.state.setEnabled(false); });
  await act(async () => { f.releaseWrite(); await optingOut; });
  assert.equal(f.state.enabled, false);
  assert.equal(f.storage.size, 0);
  assert.equal(f.calls.at(-1), '/push/unregister');
  await f.close();
});
