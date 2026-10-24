import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { KeyboardViewport } from '../../../components/layout/KeyboardViewport';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SkeletonLine, SkeletonTextField } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ClassSetupStep } from '../../../features/getting-started/ClassSetupStep';
import { EquipmentSetupStep } from '../../../features/getting-started/EquipmentSetupStep';
import { GettingStartedChecklist } from '../../../features/getting-started/GettingStartedChecklist';
import { GettingStartedProgress } from '../../../features/getting-started/GettingStartedProgress';
import { MarketingSetupStep } from '../../../features/getting-started/MarketingSetupStep';
import { ProfileSetupStep } from '../../../features/getting-started/ProfileSetupStep';
import { WarrantySetupStep } from '../../../features/getting-started/WarrantySetupStep';
import {
  clearGettingStartedDraft,
  clearGettingStartedDraftFields,
  getFirstIncompleteStep,
  getGettingStartedCompletion,
  getGettingStartedDraft,
  getGettingStartedResumeStep,
  getGettingStartedStepIndex,
  gettingStartedStepKeys,
  saveGettingStartedDraft,
  type GettingStartedAction,
  type GettingStartedDraft,
} from '../../../features/getting-started/gettingStarted';
import { RestrictedHome } from '../../../features/onboarding/RestrictedHome';
import { hasRestrictedAccess } from '../../../features/onboarding/access';
import { accountApi, classesApi, equipmentApi, marketingApi, todosApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function GettingStartedScreen() {
  const { user } = useAuth();
  const activeUserId = useRef(user?.id);
  activeUserId.current = user?.id;
  const { step, fromChecklist } = useLocalSearchParams<{ step?: string; fromChecklist?: string }>();
  const currentStep = getGettingStartedStepIndex(step);
  if (hasRestrictedAccess(user)) return <RestrictedHome />;

  // A task gets its own form/action state, including when a retained route's
  // query changes. Existing marketing and warranty shortcuts keep working.
  return <FullGettingStartedScreen key={`${user?.id}:${currentStep ?? 'checklist'}`}
    currentStep={currentStep} fromChecklist={fromChecklist === '1'} activeUserId={activeUserId} />;
}

function FullGettingStartedScreen({ currentStep, fromChecklist, activeUserId }: {
  currentStep: number | null;
  fromChecklist: boolean;
  activeUserId: RefObject<string | undefined>;
}) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<GettingStartedDraft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [primaryAction, setPrimaryAction] = useState<GettingStartedAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const actionRef = useRef<GettingStartedAction | null>(null);
  const busyRef = useRef(false);
  const draftHandled = useRef(false);
  const focused = useRef(false);
  const guide = useAsyncData(async () => {
    const [account, classes, equipment, todos, marketing] = await Promise.all([
      accountApi.me(), classesApi.list(), equipmentApi.list(), todosApi.list(), marketingApi.get(),
    ]);
    return {
      user: account.user,
      classes: classes.classes,
      equipment: equipment.equipment,
      todos: todos.todos,
      consultation: marketing.consultation,
    };
  }, []);

  // Refresh drafts on return as well as first entry; native stacks retain the hub.
  useFocusEffect(useCallback(() => {
    let active = true;
    focused.current = true;
    if (!user?.id) {
      setDraftLoaded(true);
      return;
    }
    draftHandled.current = false;
    void getGettingStartedDraft(user.id).then(saved => {
      if (active) setDraft(saved);
    }).catch(() => {
      if (active) setNavigationError('Unable to load your saved edits. Please reopen this checklist to try again.');
    }).finally(() => {
      if (active) setDraftLoaded(true);
    });
    return () => { active = false; focused.current = false; };
  }, [user?.id]));

  const persistDraft = useCallback(async () => {
    if (currentStep === null || !user?.id || activeUserId.current !== user.id) return;
    await actionRef.current?.onSaveForLater?.();
    if (activeUserId.current === user.id) await saveGettingStartedDraft(user.id, { currentStep });
  }, [activeUserId, currentStep, user?.id]);

  // System Back, swipe-back and the app's tabs also keep unsaved task edits.
  useFocusEffect(useCallback(() => () => {
    if (!draftHandled.current && !busyRef.current && !actionRef.current?.loading) {
      void persistDraft().catch(() => {});
    }
  }, [persistDraft]));

  const returnToChecklist = useCallback(() => {
    if (!focused.current) return;
    Keyboard.dismiss();
    if (fromChecklist && router.canGoBack()) router.back();
    else router.replace('/prospect/getting-started');
  }, [fromChecklist]);

  const saveForLater = useCallback(async () => {
    if (busyRef.current || actionRef.current?.loading) return;
    busyRef.current = true;
    setBusy(true);
    setNavigationError(null);
    try {
      await persistDraft();
      draftHandled.current = true;
      returnToChecklist();
    } catch {
      setNavigationError('Unable to save your progress. Your edits are still here; please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [persistDraft, returnToChecklist]);

  const completeTask = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    draftHandled.current = true;
    setBusy(true);
    try {
      if (user?.id) await clearGettingStartedDraftFields(user.id, 'currentStep');
      returnToChecklist();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [returnToChecklist, user?.id]);

  const updatePrimaryAction = useCallback((action: GettingStartedAction) => {
    actionRef.current = action;
    setPrimaryAction(action);
  }, []);

  const selectStep = useCallback((index: number) => {
    const step = gettingStartedStepKeys[index];
    if (!step || busyRef.current) return;
    router.push({ pathname: '/prospect/getting-started', params: { step, fromChecklist: '1' } });
  }, []);

  const finishGuide = useCallback(async () => {
    if (!guide.data || busyRef.current || !getGettingStartedCompletion(guide.data).every(Boolean)) return;
    busyRef.current = true;
    setBusy(true);
    setNavigationError(null);
    try {
      if (user?.id) await clearGettingStartedDraft(user.id);
      if (focused.current) router.replace('/prospect');
    } catch {
      setNavigationError('Unable to finish right now. Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [guide.data, user?.id]);

  const completion = guide.data ? getGettingStartedCompletion(guide.data) : [];
  const resumeStep = getGettingStartedResumeStep(completion, draft?.currentStep);
  const nextStep = resumeStep < gettingStartedStepKeys.length && !completion[resumeStep]
    ? resumeStep : getFirstIncompleteStep(completion);
  const initialLoading = !draftLoaded || (guide.loading && !guide.data);
  const error = navigationError ?? guide.error;
  const disabled = busy || Boolean(primaryAction?.loading);

  if (currentStep === null) {
    return (
      <AppScreen title="Getting Started" quickLinks={prospectQuickLinks}>
        {error ? <ErrorState message={error} onRetry={navigationError ? undefined : guide.reload} /> : null}
        <AsyncContent ready={!initialLoading} fallback={<GettingStartedSkeleton />}>
          {!initialLoading && guide.data ? (
            <GettingStartedChecklist completion={completion} nextStep={nextStep}
              onSelectStep={selectStep} onFinish={() => void finishGuide()} finishing={busy} />
          ) : null}
        </AsyncContent>
      </AppScreen>
    );
  }

  const warrantyTodo = guide.data?.todos.find(todo => todo.type === 'JB_WARRANTIES');
  const taskProps = { draft, onComplete: completeTask, onActionChange: updatePrimaryAction };
  return (
    <AppScreen title="Getting Started" quickLinks={prospectQuickLinks} scroll={false} contentContainerClassName="">
      <KeyboardViewport>
        <ScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-5 pt-2"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <GettingStartedProgress currentStep={currentStep} disabled={disabled}
            onBack={() => void saveForLater()} />
          {error ? <ErrorState message={error} onRetry={navigationError ? undefined : guide.reload} /> : null}
          <AsyncContent ready={!initialLoading} fallback={<GettingStartedSkeleton task />}>
            {!initialLoading && guide.data ? (
              <>
                {currentStep === 0 ? <ProfileSetupStep {...taskProps} user={guide.data.user}
                  userId={user?.id ?? guide.data.user.id} /> : null}
                {currentStep === 1 ? <ClassSetupStep {...taskProps} classes={guide.data.classes}
                  trainingVerified={guide.data.user.onboarding?.state === 'TRAINING_VERIFIED'}
                  userId={user?.id ?? guide.data.user.id} /> : null}
                {currentStep === 2 ? <WarrantySetupStep todo={warrantyTodo}
                  onComplete={completeTask} onActionChange={updatePrimaryAction}
                  onTodoUpdated={updatedTodo => guide.setData(current => current ? {
                    ...current,
                    todos: current.todos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo),
                  } : current)} /> : null}
                {currentStep === 3 ? <MarketingSetupStep {...taskProps} consultation={guide.data.consultation}
                  userId={user?.id ?? guide.data.user.id} /> : null}
                {currentStep === 4 ? <EquipmentSetupStep {...taskProps} equipment={guide.data.equipment}
                  userId={user?.id ?? guide.data.user.id} /> : null}
              </>
            ) : null}
          </AsyncContent>
        </ScrollView>
        {!initialLoading && primaryAction ? (
          <View className="border-t border-hercules-blue/10 bg-hercules-white px-4 pt-3">
            <PrimaryButton label={primaryAction.label} onPress={() => {
              if (!busyRef.current && !primaryAction.loading) primaryAction.onPress();
            }} loading={disabled} disabled={disabled || primaryAction.disabled} />
            <Pressable accessibilityRole="button" accessibilityLabel="Save and finish later"
              accessibilityState={{ disabled }} disabled={disabled} onPress={() => void saveForLater()}
              className="min-h-12 items-center justify-center px-4 active:opacity-70 disabled:opacity-50">
              <Text className="text-sm font-semibold text-hercules-blue">Save & finish later</Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardViewport>
    </AppScreen>
  );
}

function GettingStartedSkeleton({ task = false }: { task?: boolean }) {
  return (
    <SkeletonReveal label={task ? 'Preparing your setup task' : 'Preparing your Getting Started checklist'} className="gap-5">
      <View className="gap-3">
        <SkeletonLine className="h-6 w-3/5" />
        <SkeletonLine className="h-4 w-4/5" subtle />
      </View>
      {task ? (
        <View className="gap-5 rounded-[20px] border border-hercules-blue/15 p-5">
          <SkeletonTextField labelWidthClassName="w-24" />
          <SkeletonTextField labelWidthClassName="w-32" />
          <SkeletonTextField labelWidthClassName="w-24" />
        </View>
      ) : [0, 1].map(group => (
        <View key={group} className="gap-3">
          <SkeletonLine className="h-4 w-24" />
          <View className="gap-5 rounded-[20px] border border-hercules-blue/15 p-5">
            <SkeletonLine className="h-5 w-3/5" />
            <SkeletonLine className="h-5 w-4/5" subtle />
          </View>
        </View>
      ))}
    </SkeletonReveal>
  );
}
