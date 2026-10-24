import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'node:events';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const message = (id, conversationId = 'a') => ({ id: String(id), conversationId, senderId: 'other', body: `message ${id}`, clientMessageId: `client-${id}`, createdAt: new Date(Number(id) * 1000).toISOString() });
class ApiError extends Error { constructor(status) { super(`HTTP ${status}`); this.status = status; } }
async function authFixture(fetchMe, strict = false) {
  let saved = 'valid-token', deletes = 0, auth, root;
  const load = sourceLoader({
    'react-native': { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } },
    'expo-secure-store': { isAvailableAsync: async () => true, getItemAsync: async () => saved, deleteItemAsync: async () => { saved = null; deletes++; }, setItemAsync: async (_, value) => { saved = value; } },
    '@react-native-async-storage/async-storage': { removeItem: async () => {} },
    '../../lib/api/client': { ApiError, setApiToken: () => {}, apiFetch: (url) => url === '/auth/me' ? fetchMe() : Promise.resolve() },
    '../getting-started/gettingStarted': { clearGettingStartedDraft: async () => {} },
  });
  const { AuthProvider, useAuth } = load('src/features/auth/AuthProvider.tsx');
  function Consumer() { auth = useAuth(); return null; }
  await act(async () => { root = create(React.createElement(strict ? React.StrictMode : React.Fragment, null, React.createElement(AuthProvider, null, React.createElement(Consumer)))); });
  return { get auth() { return auth; }, get saved() { return saved; }, get deletes() { return deletes; }, close: () => act(async () => root.unmount()) };
}

test('offline and server-failure startup preserve credentials and retry verifies access', async () => {
  for (const failure of [new Error('offline'), new ApiError(503)]) {
    let online = false;
    const f = await authFixture(() => online ? Promise.resolve({ user: { id: 'dealer' } }) : Promise.reject(failure), true);
    assert.equal(f.saved, 'valid-token'); assert.equal(f.deletes, 0);
    assert.equal(f.auth.user, null); assert.equal(f.auth.token, null); assert.ok(f.auth.restoreError); assert.equal(f.auth.loading, false);
    online = true;
    await act(async () => f.auth.retrySession());
    assert.equal(f.auth.user.id, 'dealer'); assert.equal(f.auth.token, 'valid-token'); assert.equal(f.auth.restoreError, null);
    await f.close();
  }
});
test('rejected and deleted accounts clear the saved credential', async () => {
  for (const status of [401, 403]) {
    const f = await authFixture(() => Promise.reject(new ApiError(status)));
    assert.equal(f.saved, null); assert.equal(f.deletes, 1); assert.equal(f.auth.user, null); assert.equal(f.auth.restoreError, null);
    await f.close();
  }
});
test('late session recovery cannot sign a user back in after logout', async () => {
  const response = deferred(); const f = await authFixture(() => response.promise);
  await act(async () => f.auth.logout());
  await act(async () => response.resolve({ user: { id: 'old-user' } }));
  assert.equal(f.auth.user, null); assert.equal(f.auth.token, null); assert.equal(f.saved, null);
  await f.close();
});
test('a rejected active session clears credentials without a restart', async () => {
  let expired = false;
  const f = await authFixture(() => expired ? Promise.reject(new ApiError(401)) : Promise.resolve({ user: { id: 'dealer' } }));
  expired = true;
  await act(async () => { await assert.rejects(f.auth.refreshMe()); });
  assert.equal(f.auth.user, null); assert.equal(f.auth.token, null); assert.equal(f.saved, null);
  await f.close();
});
class Socket extends EventEmitter {
  connected = true;
  sent = [];
  emit(name, ...args) { this.sent.push({ name, args }); return true; }
  fire(name, payload) { super.emit(name, payload); }
}
async function chatFixture(fetchMessages) {
  const socket = new Socket(); const app = new EventEmitter(); const timers = new Map(); let timerId = 0;
  const appState = { currentState: 'active', addEventListener: (_, fn) => { app.on('change', fn); return { remove: () => app.off('change', fn) }; } };
  const load = sourceLoader({
    'react-native': { AppState: appState },
    '../../lib/api/endpoints': { conversationsApi: { messages: fetchMessages } },
    '../../lib/messagingSocket': {},
  }, { setTimeout: (fn) => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: (id) => timers.delete(id) });
  const hooks = load('src/features/messaging/hooks.ts');
  let chat, root, id = 'a';
  function Consumer() { chat = hooks.useConversationMessages(id, socket); return null; }
  await act(async () => { root = create(React.createElement(Consumer)); });
  await act(async () => socket.fire('conversation:joined', { conversationId: id }));
  return { socket, app, hooks, appState, get chat() { return chat; }, async select(next) { id = next; await act(async () => root.update(React.createElement(Consumer))); }, async timeout() { await act(async () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } }); }, close: () => act(async () => root.unmount()) };
}

test('reconnect fills a multi-page offline gap, merges live messages, and resets readiness', async () => {
  let onlineHistory = false; const cursors = [];
  const f = await chatFixture(async (_, cursor) => {
    cursors.push(cursor);
    if (!onlineHistory) return { messages: [message(1)], nextCursor: null };
    return cursor ? { messages: [message(1), message(2)], nextCursor: null } : { messages: [message(3), message(4)], nextCursor: 'older' };
  });
  assert.equal(f.chat.readyToSend, true);
  await act(async () => { f.socket.connected = false; f.socket.fire('disconnect'); });
  assert.equal(f.chat.readyToSend, false);
  onlineHistory = true;
  await act(async () => { f.socket.connected = true; f.socket.fire('connect'); f.socket.fire('conversation:joined', { conversationId: 'a' }); f.socket.fire('message:created', message(5)); });
  assert.deepEqual(Array.from(f.chat.messages, m => m.id), ['1', '2', '3', '4', '5']);
  assert.ok(cursors.includes('older')); assert.equal(f.chat.readyToSend, true);
  await f.close();
});
test('a late send acknowledgement cannot overwrite a different conversation', async () => {
  const f = await chatFixture(async id => ({ messages: [message(id === 'a' ? 1 : 9, id)], nextCursor: null }));
  let send;
  await act(async () => { send = f.chat.sendMessage('hello', 'stable-id'); });
  const emitted = f.socket.sent.find(item => item.name === 'message:send');
  await f.select('b');
  await act(async () => { emitted.args[1]({ ok: true, message: message(2, 'a') }); await send; });
  assert.deepEqual(Array.from(f.chat.messages, m => m.id), ['9']);
  await f.close();
});
test('timed-out send reuses the caller operation ID on retry', async () => {
  const f = await chatFixture(async () => ({ messages: [message(1)], nextCursor: null }));
  let first;
  await act(async () => { first = f.chat.sendMessage('same text', 'retry-operation').catch(error => error); });
  await f.timeout(); assert.match((await first).message, /timed out/);
  let retry;
  await act(async () => { retry = f.chat.sendMessage('same text', 'retry-operation'); });
  const sends = f.socket.sent.filter(item => item.name === 'message:send');
  assert.equal(sends[0].args[0].clientMessageId, sends[1].args[0].clientMessageId);
  await act(async () => { sends[1].args[1]({ ok: true, message: message(2) }); await retry; });
  await f.close();
});
test('composer retains retry identity after failure and clears it after success', async () => {
  const calls = []; let fail = true; let root;
  const load = sourceLoader({
    'react-native': { View: 'View', TextInput: 'TextInput', Pressable: 'Pressable' },
    'lucide-react-native': { ArrowUp: 'ArrowUp' },
    '../../../components/ui/inputStyles': { inputStyles: { multiline: {} } },
    '../../../lib/theme/theme': { colors: {} },
  });
  const { MessageComposer } = load('src/features/messaging/components/MessageComposer.tsx');
  await act(async () => { root = create(React.createElement(MessageComposer, { onSend: async (body, id) => { calls.push({ body, id }); if (fail) throw new Error('offline'); }, onTypingStart() {}, onTypingStop() {} })); });
  await act(async () => root.root.findByType('TextInput').props.onChangeText('hello'));
  await act(async () => root.root.findByType('Pressable').props.onPress());
  assert.equal(root.root.findByType('TextInput').props.value, 'hello');
  fail = false;
  await act(async () => root.root.findByType('Pressable').props.onPress());
  assert.equal(calls[0].id, calls[1].id); assert.equal(root.root.findByType('TextInput').props.value, '');
  await act(async () => root.root.findByType('TextInput').props.onChangeText('hello'));
  await act(async () => root.root.findByType('Pressable').props.onPress());
  assert.notEqual(calls[1].id, calls[2].id);
  await act(async () => root.unmount());
});

test('Android registration Back dismisses keyboard, returns a stage, and detaches when unfocused', async () => {
  let focused = true, keyboard = false, loginExits = 0, handler, root;
  const viewport = { resetViewport() {}, setBrandVisible() {} };
  const auth = { getInviteDetails: async () => ({ accountType: 'PROSPECT' }), registerFromInvite: async () => ({}) };
  const load = sourceLoader({
    'expo-router': {
      router: { dismissTo: () => loginExits++, push() {} }, useLocalSearchParams: () => ({}),
      useFocusEffect: callback => React.useEffect(() => focused ? callback() : undefined, [callback, focused]),
    },
    'react-native': { Platform: { OS: 'android' }, Keyboard: { isVisible: () => keyboard, dismiss: () => { keyboard = false; } }, BackHandler: { addEventListener: (_, fn) => { handler = fn; return { remove: () => { handler = undefined; } }; } }, Pressable: 'Pressable', Text: 'Text', View: 'View' },
    'react-native-reanimated': { View: 'AnimatedView' }, 'lucide-react-native': { Check: 'Check' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'PrimaryButton' },
    '../../components/ui/TextInput': { TextInput: 'TextInput' },
    '../../components/ui/StateViews': { ErrorState: 'ErrorState' },
    '../../features/auth/AuthShell': { AuthShell: 'AuthShell' },
    '../../features/auth/AuthProvider': { useAuth: () => auth },
    '../../features/auth/AuthViewport': { useAuthViewport: () => viewport },
    '../../lib/motion': { authMotion: {} }, '../../lib/theme/theme': { colors: {} },
  });
  const Screen = load('src/app/(auth)/register.tsx').default;
  await act(async () => { root = create(React.createElement(Screen)); });
  await act(async () => root.root.findByType('TextInput').props.onChangeText('invite'));
  await act(async () => root.root.findByType('PrimaryButton').props.onPress());
  assert.equal(root.root.findByType('AuthShell').props.title, 'Create your account');
  keyboard = true; await act(async () => handler());
  assert.equal(keyboard, false); assert.equal(root.root.findByType('AuthShell').props.title, 'Create your account');
  await act(async () => handler());
  assert.equal(loginExits, 0); assert.equal(root.root.findByType('AuthShell').props.title, 'Set up your account');
  focused = false; await act(async () => root.update(React.createElement(Screen)));
  assert.equal(handler, undefined);
  focused = true; await act(async () => root.update(React.createElement(Screen)));
  await act(async () => handler()); assert.equal(loginExits, 1);
  await act(async () => root.unmount());
});

test('Terms navigation occurs only after the chat sheet has closed', async () => {
  const destinations = []; let closes = 0, root;
  const load = sourceLoader({
    'expo-router': { router: { push: path => destinations.push(path) } },
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) }, Alert: {}, useWindowDimensions: () => ({ height: 800 }) },
    '../../../lib/api/endpoints': { conversationsApi: {} },
    '../../../components/ui/ModalSheet': { ModalSheet: 'ModalSheet' },
    '../../../components/ui/PrimaryButton': { PrimaryButton: 'PrimaryButton' },
    '../../../components/ui/SecondaryButton': { SecondaryButton: 'SecondaryButton' },
    '../../../components/ui/StateViews': { ErrorState: 'ErrorState' },
    '../../../lib/format': { fullName: () => 'Dealer' },
    '../hooks': { useConversationMessages: () => ({ messages: [], sendMessage() {} }), useTypingIndicator: () => ({}), useReadReceipts() {} },
    './MessageThread': { MessageThread: 'MessageThread' },
  });
  const { MessagingModal } = load('src/features/messaging/components/MessagingModal.tsx');
  const props = { conversation: { id: 'a', participants: [] }, currentUser: { id: 'user' }, socket: null, onClose: () => closes++ };
  await act(async () => { root = create(React.createElement(MessagingModal, props)); });
  await act(async () => root.root.findByType('MessageThread').props.onReviewTerms());
  assert.equal(closes, 1); assert.deepEqual(destinations, []);
  await act(async () => root.root.findByType('ModalSheet').props.onDismissed());
  assert.deepEqual(destinations, ['/terms']);
  await act(async () => root.root.findByType('ModalSheet').props.onDismissed());
  assert.equal(destinations.length, 1);
  await act(async () => root.unmount());
});

test('read receipts use displayed server messages, ignore background delivery, and clean up on close', async () => {
  const socket = new Socket(); const app = new EventEmitter(); const timers = new Map(); let nextTimer = 0;
  const appState = { currentState: 'active', addEventListener: (_, fn) => { app.on('change', fn); return { remove: () => app.off('change', fn) }; } };
  const load = sourceLoader({ 'react-native': { AppState: appState }, '../../lib/api/endpoints': {}, '../../lib/messagingSocket': {} }, {
    setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
  });
  const { useReadReceipts } = load('src/features/messaging/hooks.ts');
  let root; let visible = [];
  function Consumer() { useReadReceipts('a', socket, visible); return null; }
  const count = () => socket.sent.filter(item => item.name === 'message:read').length;
  const flush = () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } };
  await act(async () => { root = create(React.createElement(Consumer)); }); flush();
  assert.equal(count(), 0);
  visible = [message(1)]; await act(async () => root.update(React.createElement(Consumer))); flush();
  assert.equal(count(), 1); assert.equal(socket.sent.at(-1).args[0].lastMessageId, '1');
  socket.fire('message:created', message(2)); flush(); assert.equal(count(), 1);
  appState.currentState = 'background'; visible = [message(1), message(2)]; await act(async () => root.update(React.createElement(Consumer))); flush(); assert.equal(count(), 1);
  appState.currentState = 'active'; app.emit('change', 'active'); assert.equal(count(), 2);
  await act(async () => root.unmount()); flush(); assert.equal(count(), 2); assert.equal(app.listenerCount('change'), 0);
});

test('older pages load and authoritative refresh removes moderated messages without losing live arrivals', async () => {
  let removed = false;
  const f = await chatFixture(async (_, cursor) => cursor ? { messages: removed ? [message(1)] : [message(1), message(2)], nextCursor: null } : { messages: [message(3), message(4)], nextCursor: '3' });
  assert.equal(f.chat.hasOlder, true);
  await act(async () => f.chat.loadOlder());
  assert.deepEqual(Array.from(f.chat.messages, m => m.id), ['1', '2', '3', '4']);
  removed = true;
  await act(async () => f.chat.reload());
  assert.deepEqual(Array.from(f.chat.messages, m => m.id), ['1', '3', '4']);
  assert.equal(f.chat.hasOlder, false); await f.close();
});


test('shared data refreshes on foreground and while active, skips background polling and detaches', async () => {
  const events = new EventEmitter(); let poll; let calls = 0; let value; let root;
  const app = { currentState: 'active', addEventListener: (_, fn) => { events.on('change', fn); return { remove: () => events.off('change', fn) }; } };
  const load = sourceLoader({ 'react-native': { AppState: app }, 'expo-router': { useFocusEffect: callback => React.useEffect(callback, [callback]) } }, { setInterval: fn => { poll = fn; return 1; }, clearInterval: () => { poll = undefined; } });
  const { useAsyncData } = load('src/lib/hooks/useAsyncData.ts');
  function Consumer() { value = useAsyncData(async () => ++calls, [], 60000); return null; }
  await act(async () => { root = create(React.createElement(Consumer)); }); assert.equal(value.data, 1);
  app.currentState = 'background'; await act(async () => poll()); assert.equal(calls, 1);
  app.currentState = 'active'; await act(async () => events.emit('change', 'active')); assert.equal(value.data, 2);
  await act(async () => poll()); assert.equal(value.data, 3);
  await act(async () => root.unmount()); assert.equal(events.listenerCount('change'), 0); assert.equal(poll, undefined);
});


test('message day labels use local calendar dates across month boundaries', () => {
  const { messageDayLabel, isSameMessageDay } = sourceLoader({})('src/features/messaging/messageDates.ts');
  const now = new Date(2026, 10, 1, 0, 15);
  assert.equal(messageDayLabel(new Date(2026, 10, 1, 0, 1).toISOString(), now), 'Today');
  assert.equal(messageDayLabel(new Date(2026, 9, 31, 23, 59).toISOString(), now), 'Yesterday');
  assert.equal(isSameMessageDay(new Date(2026, 9, 31, 0, 1).toISOString(), new Date(2026, 9, 31, 23, 59).toISOString()), true);
  assert.equal(isSameMessageDay(new Date(2026, 9, 31, 23, 59).toISOString(), now.toISOString()), false);
  assert.notEqual(messageDayLabel(new Date(2026, 9, 29).toISOString(), now), 'Today');
});

test('incoming message reporting remains available by long press and accessibility action', async () => {
  const reported = []; let root;
  const load = sourceLoader({ 'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable' } });
  const { MessageBubble } = load('src/features/messaging/components/MessageBubble.tsx');
  const incoming = message(1);
  await act(async () => { root = create(React.createElement(MessageBubble, { message: incoming, mine: false, senderName: 'Morgan', onReport: value => reported.push(value.id) })); });
  const bubble = root.root.findByType('Pressable');
  bubble.props.onLongPress();
  bubble.props.onAccessibilityAction({ nativeEvent: { actionName: 'report' } });
  assert.deepEqual(reported, [incoming.id, incoming.id]);
  await act(async () => root.unmount());
});

for (const role of ['prospect', 'manager']) test(`${role} bottom navigation resets nested history while ordinary Back preserves the previous page`, async () => {
  const { StackRouter, StackActions } = await import('../node_modules/expo-router/build/react-navigation/routers/StackRouter.js');
  const { canGoBackWithinTab, getTabResetAction } = sourceLoader()('src/lib/tabHistory.ts');
  const options = { routeNames: [`${role}/index`, `${role}/resources`, `${role}/account`], routeParamList: {}, routeGetIdList: {} };
  const router = StackRouter({ initialRouteName: `${role}/index` });
  let stack = router.getInitialState(options);
  const root = () => ({ type: 'stack', key: 'root', index: 1, routes: [{ name: '(auth)' }, { name: `(${role})`, state: stack }] });
  assert.equal(canGoBackWithinTab(root()), false, 'authentication history must not expose Back');
  stack = router.getStateForAction(stack, StackActions.push(`${role}/resources`), options);
  assert.equal(canGoBackWithinTab(root()), true);
  stack = router.getStateForAction(stack, { type: 'GO_BACK' }, options);
  assert.equal(stack.routes[stack.index].name, `${role}/index`);
  assert.equal(canGoBackWithinTab(root()), false);
  stack = router.getStateForAction(stack, StackActions.push(`${role}/resources`), options);
  stack = router.getStateForAction(stack, StackActions.push(`${role}/account`), options);
  for (const href of [`/${role}`, `/${role}/resources`, `/${role}/account`, `/${role}/account`]) {
    const action = getTabResetAction(root(), href);
    assert.equal(action.target, stack.key);
    stack = router.getRehydratedState(router.getStateForAction(stack, action, options), options);
    assert.equal(stack.routes.length, 1, 'tab taps must discard previous pages, including reselecting the active tab');
    assert.equal(canGoBackWithinTab(root()), false);
    assert.equal(router.getStateForAction(stack, { type: 'GO_BACK' }, options), null);
  }
  assert.equal(getTabResetAction(root(), '/unknown'), null);
});
