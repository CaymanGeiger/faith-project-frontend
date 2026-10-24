import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const icons = new Proxy({}, { get: (_, name) => String(name) });

test('Getting Started keeps verified email read-only and excludes legacy draft email from profile writes', async () => {
  let root, action, completed = 0;
  const writes = [], drafts = [], cleared = [], routes = [];
  const load = sourceLoader({
    'react-native': { View: 'View' },
    'expo-router': { router: { push: target => routes.push(target) } },
    'lucide-react-native': icons,
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../components/ui/TextInput': { TextInput: 'Input' },
    '../../components/ui/SecondaryButton': { SecondaryButton: 'Secondary' },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
    '../../lib/api/endpoints': { accountApi: { update: async body => writes.push(body) } },
    './gettingStarted': {
      clearGettingStartedDraftFields: async (...args) => cleared.push(args),
      saveGettingStartedDraft: async (...args) => drafts.push(args),
    },
  });
  const { ProfileSetupStep } = load('src/features/getting-started/ProfileSetupStep.tsx');
  await act(async () => {
    root = create(React.createElement(ProfileSetupStep, {
      user: { id: 'dealer', email: 'verified@example.com', firstName: 'Original', lastName: 'Dealer', prospectProfile: { companyName: 'Hercules Partner' } },
      userId: 'dealer',
      draft: { profile: { email: 'unverified@example.com', firstName: 'Draft', lastName: 'Dealer', phone: '555-0100', companyName: 'Draft Company' } },
      onComplete: async () => { completed++; },
      onActionChange: next => { action = next; },
    }));
  });
  const email = root.root.findAllByType('Input').find(input => input.props.label === 'Email');
  assert.equal(email.props.value, 'verified@example.com');
  assert.equal(email.props.editable, false);
  assert.equal(email.props.onChangeText, undefined);
  await act(async () => root.root.findByType('Secondary').props.onPress());
  assert.equal(drafts[0][1].profile.email, 'verified@example.com');
  assert.equal(drafts[0][1].profile.firstName, 'Draft');
  assert.deepEqual(routes, ['/prospect/account']);
  await act(async () => action.onPress());
  assert.equal(writes.length, 1);
  assert.equal(Object.hasOwn(writes[0], 'email'), false);
  assert.equal(writes[0].firstName, 'Draft');
  assert.deepEqual(cleared, [['dealer', 'profile']]);
  assert.equal(completed, 1);
  await act(async () => root.unmount());
});

const routeMocks = {
  '../../../features/financing/FinancingCard': { FinancingCard: 'FinancingCard' },
  '../../../features/onboarding/RestrictedHome': { RestrictedHome: 'RestrictedHome' },
  'react-native': { Text: 'Text', View: 'View' },
  'lucide-react-native': icons,
  '../../../components/layout/AppScreen': { AppScreen: 'Screen' },
  '../../../components/layout/navigation': { prospectQuickLinks: [] },
  '../../../components/ui/AnimatedCard': { AnimatedCard: 'Card' },
  '../../components/ui/AnimatedCard': { AnimatedCard: 'Card' },
  '../../../components/ui/AsyncContent': { AsyncContent: ({ ready, children, fallback }) => ready ? children : fallback },
  '../../../components/ui/PageHero': { PageHero: 'Hero' },
  '../../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
  '../../../components/ui/SectionHeader': { SectionHeader: 'SectionHeader' },
  '../../../components/ui/ListGroup': { ListGroup: 'ListGroup' },
  '../../../components/ui/ListItem': { ListItem: 'ListItem' },
  '../../../components/ui/SkeletonPrimitives': { SkeletonLine: 'SkeletonLine', SkeletonTextField: 'SkeletonTextField' },
  '../../../components/ui/SkeletonReveal': { SkeletonReveal: 'Skeleton' },
  '../../../components/ui/StateViews': { ErrorState: 'Error' },
  '../../../features/content/InAppContentProvider': { useInAppContent: () => ({ openContent() {} }) },
  '../../../lib/api/endpoints': {},
};

for (const [file, component, label, expectedStep] of [
  ['marketing', 'Primary', 'Share Availability', 'marketing'],
  ['benefits', 'ListItem', 'Warranty Support', 'warranties'],
]) {
  test(`${label} opens the requested setup step even when other tasks are incomplete`, async () => {
    const routes = [];
    const load = sourceLoader({
      ...routeMocks,
      'expo-router': { router: { push: target => routes.push(target) } },
      '../../../lib/hooks/useAsyncData': { useAsyncData: () => ({ data: { benefits: [], onboarding: { summary: {} } }, loading: false }) },
    });
    const Screen = load(`src/app/(prospect)/prospect/${file}.tsx`).default;
    let root;
    await act(async () => { root = create(React.createElement(Screen)); });
    await act(async () => root.root.findAllByType(component).find(node => (node.props.label ?? node.props.title) === label).props.onPress());
    assert.equal(routes[0].pathname, '/prospect/getting-started');
    assert.equal(routes[0].params.step, expectedStep);
    await act(async () => root.unmount());
  });
}

async function guideFixture({ draft = null, requestedStep, fromChecklist, data = {}, canGoBack = true } = {}) {
  const auth = { user: { id: 'dealer', role: 'PROSPECT', onboarding: { state: 'TRAINING_VERIFIED', restricted: false } } };
  const storage = new Map(draft ? [['@hercules/getting-started-draft:dealer', JSON.stringify(draft)]] : []);
  const routes = [];
  let params = { step: requestedStep, fromChecklist }, focused = true, revision = 0;
  const native = {
    Dimensions: { get: () => ({ height: 900 }) },
    Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Platform: { OS: 'web' },
    Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View',
    StyleSheet: { create: styles => styles },
  };
  const guide = {
    data: {
      user: { id: 'dealer', email: 'dealer@example.com', firstName: 'Saved', lastName: 'Dealer', prospectProfile: { companyName: '' } },
      classes: [], equipment: [], todos: [], consultation: {},
      ...data,
    },
    loading: false, error: null, reload: async () => {},
  };
  const load = sourceLoader({
    ...routeMocks,
    'react-native': native,
    'expo-router': {
      router: {
        push: target => routes.push({ method: 'push', target }),
        replace: target => routes.push({ method: 'replace', target }),
        back: () => routes.push({ method: 'back' }),
        canGoBack: () => canGoBack,
      },
      useLocalSearchParams: () => params,
      useFocusEffect: callback => React.useEffect(() => focused ? callback() : undefined, [callback, focused]),
    },
    '@react-native-async-storage/async-storage': {
      getItem: async key => storage.get(key) ?? null,
      setItem: async (key, value) => storage.set(key, value),
      removeItem: async key => storage.delete(key),
    },
    'expo-secure-store': { isAvailableAsync: async () => false },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../../../features/auth/AuthProvider': { useAuth: () => auth },
    '../../../lib/hooks/useAsyncData': { useAsyncData: () => guide },
    ...Object.fromEntries(['Class', 'Equipment', 'Marketing', 'Profile', 'Review', 'Warranty'].map(name => [
      `../../../features/getting-started/${name}SetupStep`, { [`${name}SetupStep`]: `${name}Step` },
    ])),
  }, { requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  const Screen = load('src/app/(prospect)/prospect/getting-started.tsx').default;
  let root;
  await act(async () => { root = create(React.createElement(Screen)); });
  return {
    root, storage, guide, routes,
    helpers: load('src/features/getting-started/gettingStarted.ts'),
    navigate: async nextParams => {
      params = nextParams;
      await act(async () => root.update(React.createElement(Screen, { revision: ++revision })));
    },
    focus: async nextFocused => {
      focused = nextFocused;
      await act(async () => root.update(React.createElement(Screen, { revision: ++revision })));
    },
    press: async label => {
      const button = [...root.root.findAllByType('Pressable'), ...root.root.findAllByType('Primary')]
        .find(node => (node.props.accessibilityLabel ?? node.props.label) === label);
      assert.ok(button, `Missing button: ${label}`);
      assert.ok(!button.props.disabled, `Disabled button: ${label}`);
      await act(async () => button.props.onPress());
    },
    close: () => act(async () => root.unmount()),
  };
}

test('setup opens the checklist with one saved next action while an explicit shortcut opens its task', async () => {
  const resumed = await guideFixture({ draft: { currentStep: 3 } });
  assert.equal(resumed.root.root.findAllByType('MarketingStep').length, 0);
  const primary = resumed.root.root.findAllByType('Primary');
  assert.equal(primary.length, 1);
  assert.equal(primary[0].props.label, 'Continue');
  assert.ok(resumed.root.root.findAllByType('Pressable').some(node =>
    node.props.accessibilityLabel === 'Marketing Consultation, your next task'));
  await resumed.press('Continue');
  assert.equal(resumed.routes[0].method, 'push');
  assert.equal(resumed.routes[0].target.params.step, 'marketing');
  assert.equal(resumed.routes[0].target.params.fromChecklist, '1');
  await resumed.close();
  const targeted = await guideFixture({ draft: { currentStep: 3 }, requestedStep: 'warranties' });
  assert.equal(targeted.root.root.findAllByType('WarrantyStep').length, 1);
  assert.equal(targeted.helpers.getGettingStartedResumeStep([true, false], -1), 1);
  assert.equal(targeted.helpers.getGettingStartedResumeStep([true, false], 100), 1);
  assert.equal(targeted.helpers.getGettingStartedResumeStep([true, false], 1.5), 1);
  await targeted.close();
});

test('the checklist tucks completed tasks away and lets any remaining or completed task open', async () => {
  const f = await guideFixture({
    draft: { currentStep: 1 },
    data: {
      user: { id: 'dealer', email: 'dealer@example.com', firstName: 'Saved', lastName: 'Dealer',
        prospectProfile: { companyName: 'Saved Company' }, onboarding: { state: 'TRAINING_VERIFIED' } },
    },
  });
  try {
    assert.equal(f.root.root.findAllByType('Primary').length, 1);
    assert.equal(f.root.root.findAllByType('View').find(node => node.props.accessibilityRole === 'progressbar').props.accessibilityValue.now, 2);
    assert.equal(f.root.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel?.startsWith('Review ')).length, 0);
    assert.ok(f.root.root.findAllByType('Pressable').some(node => node.props.accessibilityLabel === 'JB Warranties, your next task'));
    await f.press('First LG System');
    assert.equal(f.routes.at(-1).target.params.step, 'equipment');
    await f.press('Completed tasks, 2');
    assert.equal(f.root.root.findAllByType('Pressable').find(node => node.props.accessibilityLabel === 'Completed tasks, 2').props.accessibilityState.expanded, true);
    await f.press('Review Business Profile, completed');
    assert.equal(f.routes.at(-1).target.params.step, 'profile');
    await f.press('Completed tasks, 2');
    assert.equal(f.root.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel?.startsWith('Review ')).length, 0);
  } finally { await f.close(); }
});

test('a completed task returns to the checklist and does not restore its old draft when reopened', async () => {
  const f = await guideFixture({ requestedStep: 'profile', fromChecklist: '1',
    draft: { currentStep: 0, profile: { firstName: 'Old draft' }, marketing: { optionOne: 'Keep this draft' } } });
  const profileStep = f.root.root.findByType('ProfileStep');
  assert.equal(profileStep.props.draft.profile.firstName, 'Old draft');
  // Successful profile saving clears only its own stored draft before onComplete.
  await f.helpers.clearGettingStartedDraftFields('dealer', 'profile');
  f.guide.data.user.prospectProfile.companyName = 'Saved Company';
  await act(async () => profileStep.props.onComplete());
  assert.equal(f.routes.at(-1).method, 'back');
  assert.equal((await f.helpers.getGettingStartedDraft('dealer')).currentStep, undefined);
  await f.navigate({});
  await f.press('Continue');
  assert.equal(f.routes.at(-1).target.params.step, 'training');
  await f.press('Completed tasks, 1');
  await f.press('Review Business Profile, completed');
  await f.navigate(f.routes.at(-1).target.params);
  assert.equal(f.root.root.findByType('ProfileStep').props.draft.profile, undefined);
  assert.equal(f.root.root.findByType('ProfileStep').props.draft.marketing.optionOne, 'Keep this draft');
  await f.close();
});

test('changing a task route resets the old primary action before the new form registers its action', async () => {
  const f = await guideFixture({ requestedStep: 'profile' });
  let oldSaves = 0;
  try {
    await act(async () => f.root.root.findByType('ProfileStep').props.onActionChange({
      label: 'Save profile', onPress() { oldSaves++; },
    }));
    assert.equal(f.root.root.findByType('Primary').props.label, 'Save profile');
    await f.navigate({ step: 'marketing' });
    assert.equal(f.root.root.findAllByType('ProfileStep').length, 0);
    assert.equal(f.root.root.findAllByType('MarketingStep').length, 1);
    assert.equal(f.root.root.findAllByType('Primary').length, 0);
    assert.equal(oldSaves, 0);
    await f.navigate({});
    assert.equal(f.root.root.findByType('Primary').props.label, 'Continue');
    assert.equal(f.root.root.findAllByType('MarketingStep').length, 0);
  } finally { await f.close(); }
});

test('checklist navigation keeps edits on a failed draft save and returns only after a successful retry', async () => {
  const f = await guideFixture({ requestedStep: 'marketing', fromChecklist: '1' });
  let fail = true;
  try {
    await act(async () => f.root.root.findByType('MarketingStep').props.onActionChange({
      label: 'Save & Continue', onPress() {},
      onSaveForLater: async () => {
        if (fail) throw new Error('Synthetic storage failure');
        await f.helpers.saveGettingStartedDraft('dealer', { marketing: { optionOne: 'Keep my edits' } });
      },
    }));
    await f.press('Back to checklist');
    assert.equal(f.routes.length, 0);
    assert.equal(f.root.root.findAllByType('MarketingStep').length, 1);
    assert.match(f.root.root.findByType('Error').props.message, /Your edits are still here/);
    fail = false;
    await f.press('Save and finish later');
    assert.equal(f.routes.at(-1).method, 'back');
    const draft = await f.helpers.getGettingStartedDraft('dealer');
    assert.equal(draft.currentStep, 3);
    assert.equal(draft.marketing.optionOne, 'Keep my edits');
    await f.navigate({});
    await f.press('Continue');
    assert.equal(f.routes.at(-1).target.params.step, 'marketing');
  } finally { await f.close(); }
});

test('leaving a task through native navigation preserves its draft for the next visit', async () => {
  const f = await guideFixture({ requestedStep: 'profile' });
  try {
    await act(async () => f.root.root.findByType('ProfileStep').props.onActionChange({
      label: 'Save & Continue', onPress() {},
      onSaveForLater: () => f.helpers.saveGettingStartedDraft('dealer', { profile: { firstName: 'Unsaved edits' } }),
    }));
    await f.focus(false);
    const draft = await f.helpers.getGettingStartedDraft('dealer');
    assert.equal(draft.currentStep, 0);
    assert.equal(draft.profile.firstName, 'Unsaved edits');
    assert.equal(f.routes.length, 0);
  } finally { await f.close(); }
});

test('a task save finishing after native navigation does not take the user back to the checklist', async () => {
  const f = await guideFixture({ requestedStep: 'profile', fromChecklist: '1' });
  let releaseSave, pendingSave;
  try {
    const complete = f.root.root.findByType('ProfileStep').props.onComplete;
    const serverSave = new Promise(resolve => { releaseSave = resolve; });
    await act(async () => f.root.root.findByType('ProfileStep').props.onActionChange({
      label: 'Save & Continue',
      onPress() { pendingSave = serverSave.then(complete); },
      loading: false,
    }));
    await f.press('Save & Continue');
    await act(async () => f.root.root.findByType('ProfileStep').props.onActionChange({
      label: 'Save & Continue', onPress() {}, loading: true,
    }));
    await f.focus(false);
    await act(async () => { releaseSave(); await pendingSave; });
    assert.equal(f.routes.length, 0);
  } finally { await f.close(); }
});

test('equipment corrections save as a draft, reopen for editing and update the existing record', async () => {
  const existing = { id: 'system', status: 'PENDING', equipmentName: 'Existing system', modelNumber: 'OLD-MODEL', serialNumber: 'OLD-SERIAL' };
  const writes = [], cleared = [];
  let root, action, savedDraft, completed = 0;
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable' },
    'lucide-react-native': icons,
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../components/ui/TextInput': { TextInput: 'Input' },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
    './gettingStarted': {
      saveGettingStartedDraft: async (_userId, draft) => { savedDraft = draft; },
      clearGettingStartedDraftFields: async (...args) => cleared.push(args),
    },
    '../../lib/api/endpoints': {
      equipmentApi: {
        update: async (id, body) => writes.push({ id, body }),
        create: async () => { throw new Error('A correction must not create a duplicate record'); },
      },
    },
  });
  const { EquipmentSetupStep } = load('src/features/getting-started/EquipmentSetupStep.tsx');
  const props = { equipment: [existing], userId: 'dealer',
    onComplete: async () => { completed++; }, onActionChange: next => { action = next; } };
  await act(async () => { root = create(React.createElement(EquipmentSetupStep, props)); });
  try {
    assert.equal(action.onSaveForLater, undefined);
    assert.equal(root.root.findAllByType('Input').length, 0);
    await act(async () => root.root.findByType('Pressable').props.onPress());
    await act(async () => root.root.findAllByType('Input').find(node => node.props.label === 'Model Number').props.onChangeText('CORRECTED-MODEL'));
    await action.onSaveForLater();
    assert.equal(savedDraft.equipment.modelNumber, 'CORRECTED-MODEL');
    assert.equal(savedDraft.equipment.serialNumber, 'OLD-SERIAL');
    await act(async () => root.unmount());
    await act(async () => { root = create(React.createElement(EquipmentSetupStep, { ...props, draft: savedDraft })); });
    assert.equal(root.root.findAllByType('Input').find(node => node.props.label === 'Model Number').props.value, 'CORRECTED-MODEL');
    assert.equal(typeof action.onSaveForLater, 'function');
    await act(async () => action.onPress());
    assert.equal(writes.length, 1);
    assert.equal(writes[0].id, 'system');
    assert.equal(writes[0].body.modelNumber, 'CORRECTED-MODEL');
    assert.deepEqual(cleared, [['dealer', 'equipment']]);
    assert.equal(completed, 1);
    await act(async () => root.unmount());
    await act(async () => { root = create(React.createElement(EquipmentSetupStep, {
      ...props, equipment: [{ ...existing, status: 'APPROVED' }], draft: savedDraft,
    })); });
    assert.equal(root.root.findAllByType('Input').length, 0, 'A draft cannot reopen an approved record for correction');
    assert.equal(action.onSaveForLater, undefined);
  } finally { await act(async () => root.unmount()); }
});

test('an all-complete checklist offers Home, keeps tasks reviewable and clears the remaining draft', async () => {
  const f = await guideFixture({
    draft: { currentStep: 4 },
    data: {
      user: { id: 'dealer', email: 'dealer@example.com', firstName: 'Saved', lastName: 'Dealer',
        prospectProfile: { companyName: 'Saved Company' }, onboarding: { state: 'TRAINING_VERIFIED' } },
      todos: [{ id: 'warranty', type: 'JB_WARRANTIES', status: 'COMPLETED' }],
      consultation: { submittedAt: '2026-10-20T00:00:00Z' },
      equipment: [{ id: 'system' }],
    },
  });
  try {
    assert.equal(f.root.root.findAllByType('Primary').length, 1);
    assert.equal(f.root.root.findByType('Primary').props.label, 'Back to Home');
    await f.press('Completed tasks, 5');
    assert.equal(f.root.root.findAllByType('Pressable').filter(node => node.props.accessibilityLabel?.startsWith('Review ')).length, 5);
    await f.press('Back to Home');
    assert.equal(f.routes.at(-1).target, '/prospect');
    assert.equal(await f.helpers.getGettingStartedDraft('dealer'), null);
  } finally { await f.close(); }
});

test('canceled saved training stays visible but cannot complete setup, and a replacement draft is retained', async () => {
  const sessions = [
    { id: 'canceled', title: 'Canceled session', status: 'CANCELED', enrollmentStatus: 'ENROLLED', startsAt: new Date(Date.now() + 86400000).toISOString() },
    { id: 'saved', title: 'Saved session', status: 'SCHEDULED', enrollmentStatus: 'ENROLLED', startsAt: new Date(Date.now() + 86400000).toISOString() },
    { id: 'new', title: 'New preference', status: 'SCHEDULED', startsAt: new Date(Date.now() + 172800000).toISOString() },
  ];
  const drafts = [];
  let action, root;
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable' },
    'lucide-react-native': icons,
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../content/InAppContentProvider': { useInAppContent: () => ({ openContent() {} }) },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
    '../../lib/api/endpoints': { classesApi: {} },
    './gettingStarted': { saveGettingStartedDraft: async (...args) => drafts.push(args) },
  });
  const { ClassSetupStep } = load('src/features/getting-started/ClassSetupStep.tsx');
  const helpers = load('src/features/getting-started/trainingAvailability.ts');
  assert.equal(helpers.isSavedTraining(sessions[0]), true);
  assert.equal(helpers.isValidTrainingSelection(sessions[0]), false);
  assert.equal(helpers.isValidTrainingSelection({ ...sessions[0], enrollmentStatus: 'COMPLETED' }), true);
  await act(async () => { root = create(React.createElement(ClassSetupStep, {
    classes: sessions, userId: 'dealer', draft: { classSessionId: 'new' },
    onComplete: async () => {}, onActionChange: next => { action = next; },
  })); });
  const choices = root.root.findAllByType('Pressable');
  assert.equal(choices[0].props.disabled, true);
  assert.equal(choices[2].props.accessibilityState.checked, true);
  assert.ok(root.root.findAllByType('Text').some(node => JSON.stringify(node.props.children).includes('Canceled')));
  await action.onSaveForLater();
  assert.equal(drafts[0][1].classSessionId, 'new');
  await act(async () => root.update(React.createElement(ClassSetupStep, {
    classes: [sessions[0]], userId: 'dealer',
    onComplete: async () => {}, onActionChange: next => { action = next; },
  })));
  assert.equal(action.disabled, true);
  await act(async () => root.unmount());
  const f = await guideFixture();
  assert.equal(f.helpers.getGettingStartedCompletion({ ...f.guide.data, classes: [sessions[0]] })[1], false);
  await f.close();
});

test('notifications exclude canceled or completed sessions from upcoming class notices', async () => {
  const user = { id: 'dealer', role: 'PROSPECT' };
  const sessions = ['SCHEDULED', 'CANCELED', 'COMPLETED'].map((status, index) => ({
    id: String(index), title: status, status, enrollmentStatus: 'ENROLLED',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
  }));
  const load = sourceLoader({
    'react-native': { Platform: { OS: 'web' }, Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: value => value }, Text: 'Text', View: 'View', useWindowDimensions: () => ({ height: 900 }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    'react-native-reanimated': { View: 'AnimatedView' },
    'expo-router': { router: { push() {} } },
    'lucide-react-native': icons,
    '../../features/auth/AuthProvider': { useAuth: () => ({ user }) },
    '../../lib/api/endpoints': { classesApi: { list: async () => ({ classes: sessions }) }, conversationsApi: { list: async () => ({ conversations: [] }) } },
    '../../lib/headerMotion': { headerMotion: {}, headerMotionConfig: { spinner: { showDelay: 1000, minimumDuration: 0 } } },
    '../ui/ListItem': { ListItem: 'ListItem' },
    './floatingPanel': { floatingPanelStyles: {} },
  }, { AbortController });
  const { NotificationsMenu } = load('src/components/layout/NotificationsMenu.tsx');
  let root;
  await act(async () => { root = create(React.createElement(NotificationsMenu, { open: true, topOffset: 0, messagesHref: '/prospect/messages', onLoadingChange() {}, onClose() {} })); });
  assert.deepEqual(root.root.findAllByType('ListItem').map(node => node.props.title), ['SCHEDULED']);
  await act(async () => root.unmount());
});

test('setup training opens the official registration calendar without saving a preference or advancing', async () => {
  const opened = [], writes = [];
  let advanced = 0, root;
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable' },
    'lucide-react-native': icons,
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../content/InAppContentProvider': { useInAppContent: () => ({ openContent: value => opened.push(value) }) },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
    '../../lib/api/endpoints': { classesApi: { enroll: async id => writes.push(id) } },
    './gettingStarted': {},
  });
  const { ClassSetupStep } = load('src/features/getting-started/ClassSetupStep.tsx');
  await act(async () => { root = create(React.createElement(ClassSetupStep, { classes: [], userId: 'dealer', onComplete: async () => { advanced++; }, onActionChange() {} })); });
  await act(async () => root.root.findByType('Primary').props.onPress());
  assert.equal(opened[0].url, 'https://www.herculesindustries.com/eventcalendar');
  assert.equal(opened[0].title, 'Training Calendar & Registration');
  assert.equal(writes.length, 0);
  assert.equal(advanced, 0);
  await act(async () => root.unmount());
});

test('warranty correction keeps completed state during failure, then reopens without advancing', async () => {
  const calls = [];
  let action, root, fail = true, resolveWrite, advanced = 0;
  const load = sourceLoader({
    'react-native': { View: 'View', Text: 'Text' },
    'lucide-react-native': icons,
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../components/ui/SecondaryButton': { SecondaryButton: 'Secondary' },
    './GettingStartedStepCard': { GettingStartedStepCard: 'Card' },
    '../../lib/api/endpoints': { todosApi: { update: async (id, completed) => {
      calls.push({ id, completed });
      if (fail) throw new Error('Connection unavailable');
      await new Promise(resolve => { resolveWrite = resolve; });
      return { todo: { id, status: 'OPEN', dueAt: '2027-01-01T00:00:00Z' } };
    } } },
  });
  const { WarrantySetupStep } = load('src/features/getting-started/WarrantySetupStep.tsx');
  function Parent() {
    const [todo, setTodo] = React.useState({ id: 'warranty', status: 'COMPLETED', dueAt: '2027-01-01T00:00:00Z' });
    return React.createElement(WarrantySetupStep, { todo, onTodoUpdated: setTodo, onComplete: async () => { advanced++; }, onActionChange: next => { action = next; } });
  }
  await act(async () => { root = create(React.createElement(Parent)); });
  await act(async () => root.root.findByType('Secondary').props.onPress());
  assert.equal(root.root.findByType('Error').props.message, 'Connection unavailable');
  assert.equal(root.root.findByType('Secondary').props.label, 'Mark Setup Incomplete');
  assert.equal(advanced, 0);
  fail = false;
  await act(async () => root.root.findByType('Secondary').props.onPress());
  assert.equal(action.loading, true);
  assert.equal(root.root.findByType('Secondary').props.disabled, true);
  await act(async () => resolveWrite());
  assert.equal(action.loading, false);
  assert.equal(root.root.findAllByType('Secondary').length, 0);
  assert.ok(root.root.findAllByType('Text').some(node => node.props.accessibilityRole === 'alert' && node.props.children.includes('marked incomplete')));
  assert.deepEqual(calls, [{ id: 'warranty', completed: false }, { id: 'warranty', completed: false }]);
  assert.equal(advanced, 0);
  await act(async () => root.unmount());
});
