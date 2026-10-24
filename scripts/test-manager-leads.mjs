import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
async function fixture({ refreshFails = false, saveFails = false } = {}) {
  let root, refreshes = 0;
  const saves = [];
  const load = sourceLoader({
    'react-native': { Text: 'Text', View: 'View', ScrollView: 'ScrollView' },
    '../../components/ui/PrimaryButton': { PrimaryButton: 'Primary' },
    '../../components/ui/SegmentedControl': { SegmentedControl: 'Status' },
    '../../components/ui/TextInput': { TextInput: 'Input' },
    '../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../lib/api/endpoints': { leadsApi: { updateLead: async (userId, body) => {
      saves.push({ userId, body });
      if (saveFails) throw new Error('The lead could not be saved.');
      return { lead: { id: 'lead', ...body }, sync: { synced: false } };
    } } },
  });
  const { LeadStatusEditor } = load('src/features/manager/LeadStatusEditor.tsx');
  function Parent() {
    const [lead, setLead] = React.useState({ id: 'lead', status: 'NEW', notes: '' });
    return React.createElement(LeadStatusEditor, {
      prospectUserId: 'dealer', lead,
      onSaved: async () => {
        refreshes++;
        if (refreshFails) throw new Error('The refresh is unavailable.');
        setLead({ id: 'lead', ...saves.at(-1).body });
        await Promise.resolve();
      },
    });
  }
  await act(async () => { root = create(React.createElement(Parent)); });
  return {
    saves, get refreshes() { return refreshes; },
    get notice() { return root.root.findAllByType('Text').map(node => node.props.children).join(' '); },
    get errors() { return root.root.findAllByType('Error'); },
    get notes() { return root.root.findByType('Input').props.value; },
    input: value => act(async () => root.root.findByType('Input').props.onChangeText(value)),
    save: () => act(async () => root.root.findByType('Primary').props.onPress()),
    close: () => act(async () => root.unmount()),
  };
}

test('a successful manager lead save retains the external-sync notice after fresh lead props arrive', async () => {
  const f = await fixture();
  await f.input('Contacted the dealer.'); await f.save();
  assert.equal(f.saves.length, 1); assert.equal(f.refreshes, 1);
  assert.match(f.notice, /Saved in Hercules Honors Rewards/);
  assert.match(f.notice, /External lead-system syncing is not configured/);
  assert.equal(f.errors.length, 0);
  await f.close();
});

test('failure refreshing a saved lead is explained without claiming the save failed', async () => {
  const f = await fixture({ refreshFails: true });
  await f.input('Persist this note.'); await f.save();
  assert.equal(f.saves.length, 1); assert.equal(f.refreshes, 1);
  assert.match(f.notice, /Saved in Hercules Honors Rewards/);
  assert.match(f.notice, /could not be refreshed/);
  assert.match(f.notice, /Reopen this dealer/);
  assert.equal(f.errors.length, 0);
  await f.close();
});

test('a failed lead mutation retains the draft, reports failure, and allows retry', async () => {
  const f = await fixture({ saveFails: true });
  await f.input('Keep this draft.'); await f.save();
  assert.equal(f.notes, 'Keep this draft.'); assert.equal(f.refreshes, 0);
  assert.equal(f.errors[0].props.message, 'The lead could not be saved.');
  assert.doesNotMatch(f.notice, /Saved in Hercules Honors Rewards/);
  await f.save(); assert.equal(f.saves.length, 2);
  await f.close();
});

async function rosterFixture({ firstLoadFails = false } = {}) {
  let root, loads = 0;
  let roster = [{ id: 'profile', userId: 'dealer', companyName: 'Original Company', certificationStatus: 'IN_PROGRESS', signupDate: '2026-10-01', jbWarrantiesDueAt: '2026-11-01', marketingConsultationDueAt: '2026-11-01', user: { id: 'dealer', firstName: 'Taylor', lastName: 'Dealer', email: 'dealer@example.test' } }];
  const load = sourceLoader({
    'lucide-react-native': { Building2: 'Icon' },
    'react-native': { Text: 'Text', View: 'View', ScrollView: 'ScrollView' },
    '../../../components/layout/AppScreen': { AppScreen: 'Screen' },
    '../../../components/layout/navigation': { managerQuickLinks: [] },
    '../../../components/ui/AnimatedCard': { AnimatedCard: 'Card' },
    '../../../components/ui/AsyncContent': { AsyncContent: 'AsyncContent' },
    '../../../components/ui/Badge': { Badge: 'Badge' },
    '../../../components/ui/ListItem': { ListItem: 'DealerRow' },
    '../../../components/ui/ListGroup': { ListGroup: 'List' },
    '../../../components/ui/ModalSheet': { ModalSheet: 'Modal' },
    '../../../components/ui/PageHero': { PageHero: 'Hero' },
    '../../../components/ui/SkeletonPrimitives': { SkeletonLine: 'Skeleton', SkeletonListRow: 'Skeleton', SkeletonPrimaryButton: 'Skeleton', SkeletonTextField: 'Skeleton' },
    '../../../components/ui/SkeletonReveal': { SkeletonReveal: 'SkeletonReveal' },
    '../../../components/ui/StateViews': { ErrorState: 'Error' },
    '../../../features/onboarding/TrainingVerification': { TrainingVerification: 'TrainingVerification' },
    '../../../features/manager/LeadStatusEditor': { LeadStatusEditor: 'LeadEditor' },
    '../../../features/manager/ManagerDataProvider': { useManagerData: () => ({ prospects: { data: { prospects: roster }, loading: false, error: null, reload: async () => {} } }) },
    '../../../lib/api/endpoints': { leadsApi: { lead: async userId => {
      loads++;
      if (firstLoadFails && loads === 1) throw new Error('Lead load failed.');
      return { lead: { id: `lead-${userId}`, status: 'NEW', notes: '' } };
    } } },
    '../../../lib/format': { fullName: user => `${user.firstName} ${user.lastName}`, formatShortDate: value => value },
  });
  const Screen = load('src/app/(manager)/manager/prospects.tsx').default;
  await act(async () => { root = create(React.createElement(Screen)); });
  return {
    get root() { return root; }, get loads() { return loads; },
    open: () => act(async () => root.root.findByType('DealerRow').props.onPress()),
    async updateProfile(patch) { roster = roster.map(profile => ({ ...profile, ...patch })); await act(async () => root.update(React.createElement(Screen))); },
    async removeProfile() { roster = []; await act(async () => root.update(React.createElement(Screen))); },
    close: () => act(async () => root.unmount()),
  };
}

test('a failed initial dealer lead load has an immediate retry without closing the detail sheet', async () => {
  const f = await rosterFixture({ firstLoadFails: true });
  await f.open();
  assert.equal(f.root.root.findByType('Modal').props.visible, true);
  assert.equal(f.root.root.findByType('Error').props.message, 'Lead load failed.');
  await act(async () => f.root.root.findByType('Error').props.onRetry());
  assert.equal(f.loads, 2);
  assert.equal(f.root.root.findAllByType('Error').length, 0);
  assert.equal(f.root.root.findByType('LeadEditor').props.prospectUserId, 'dealer');
  await f.close();
});

test('open dealer details follow roster refreshes and close if the dealer is no longer assigned', async () => {
  const f = await rosterFixture();
  await f.open();
  await f.updateProfile({ companyName: 'Updated Company', certificationStatus: 'CERTIFIED', jbWarrantiesDueAt: '2026-12-01' });
  assert.equal(f.root.root.findByType('Modal').props.visible, true);
  assert.equal(f.root.root.findByType('Badge').props.label, 'CERTIFIED');
  assert.ok(f.root.root.findAllByType('Text').some(node => node.props.children === 'Updated Company'));
  assert.equal(f.root.root.findByType('LeadEditor').props.prospectUserId, 'dealer');
  assert.equal(f.loads, 1);
  await f.removeProfile();
  assert.equal(f.root.root.findByType('Modal').props.visible, false);
  assert.equal(f.root.root.findAllByType('LeadEditor').length, 0);
  await f.close();
});


test('verified initial training updates manager guidance after refresh while certification remains separate', async () => {
  const f = await rosterFixture();
  await f.open();
  assert.ok(f.root.root.findByType('DealerRow').props.subtitle.includes('Follow up on LG training'));
  const selectedUser = { id: 'dealer', firstName: 'Taylor', lastName: 'Dealer', email: 'dealer@example.test', status: 'ACTIVE' };
  await f.updateProfile({ user: { ...selectedUser, initialTrainingVerifiedAt: '2026-10-20T12:00:00.000Z' } });
  assert.ok(f.root.root.findByType('DealerRow').props.subtitle.includes('Review remaining dealer milestones'));
  const detailText = f.root.root.findAllByType('Text').map(node => node.props.children).join(' ');
  assert.match(detailText, /Initial training is verified and dealer features are available/);
  assert.doesNotMatch(detailText, /Follow up on LG training|help the dealer complete required training/);
  assert.match(detailText, /Certification stage/);
  assert.equal(f.root.root.findByType('Badge').props.label, 'IN PROGRESS');
  await f.updateProfile({ user: { ...selectedUser, initialTrainingVerifiedAt: null } });
  assert.ok(f.root.root.findByType('DealerRow').props.subtitle.includes('Follow up on LG training'));
  await f.close();
});
