import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import {
  SkeletonLine,
  SkeletonTextField,
} from '../../../components/ui/SkeletonPrimitives';
import { ErrorState } from '../../../components/ui/StateViews';
import { ClassSetupStep } from '../../../features/getting-started/ClassSetupStep';
import { EquipmentSetupStep } from '../../../features/getting-started/EquipmentSetupStep';
import {
  clearGettingStartedDraft,
  getGettingStartedDraft,
  getFirstIncompleteStep,
  getGettingStartedCompletion,
  GettingStartedAction,
  GettingStartedDraft,
  gettingStartedSteps,
  saveGettingStartedDraft,
} from '../../../features/getting-started/gettingStarted';
import { GettingStartedProgress } from '../../../features/getting-started/GettingStartedProgress';
import { MarketingSetupStep } from '../../../features/getting-started/MarketingSetupStep';
import { ProfileSetupStep } from '../../../features/getting-started/ProfileSetupStep';
import { ReviewSetupStep } from '../../../features/getting-started/ReviewSetupStep';
import { WarrantySetupStep } from '../../../features/getting-started/WarrantySetupStep';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  accountApi,
  classesApi,
  equipmentApi,
  marketingApi,
  todosApi,
} from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { colors } from '../../../lib/theme/theme';

export default function GettingStartedScreen() {
  const { user: authenticatedUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [primaryAction, setPrimaryAction] =
    useState<GettingStartedAction | null>(null);
  const [draft, setDraft] = useState<GettingStartedDraft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [savingForLater, setSavingForLater] = useState(false);
  const currentStepRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const initialized = useRef(false);
  const transitionInFlight = useRef(false);
  const scrollTargetRef = useRef<'top' | 'form' | null>(null);
  const guide = useAsyncData(async () => {
    const [account, classes, equipment, todos, marketing] = await Promise.all([
      accountApi.me(),
      classesApi.list(),
      equipmentApi.list(),
      todosApi.list(),
      marketingApi.get(),
    ]);

    return {
      user: account.user,
      classes: classes.classes,
      equipment: equipment.equipment,
      todos: todos.todos,
      consultation: marketing.consultation,
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!authenticatedUser) {
      setDraftLoaded(true);
      return;
    }

    void (async () => {
      try {
        const savedDraft = await getGettingStartedDraft(authenticatedUser.id);
        if (active) {
          setDraft(savedDraft);
        }
      } finally {
        if (active) {
          setDraftLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    if (guide.data && draftLoaded && !initialized.current) {
      const firstStep = getFirstIncompleteStep(
        getGettingStartedCompletion(guide.data),
      );
      currentStepRef.current = firstStep;
      setCurrentStep(firstStep);
      initialized.current = true;
    }
  }, [draftLoaded, guide.data]);

  // Scroll to the form after an intentional Continue, Previous, or Edit
  // navigation. Initial load should always preserve the top view.
  useEffect(() => {
    const scrollTarget = scrollTargetRef.current;
    if (!scrollTarget) {
      return;
    }

    scrollTargetRef.current = null;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: scrollTarget === 'form' ? 220 : 0,
        animated: scrollTarget === 'form',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentStep]);

  useEffect(() => {
    const updateKeyboardInset = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get('window').height;
      setKeyboardInset(
        Math.max(0, windowHeight - event.endCoordinates.screenY),
      );
    };
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(
      showEvent,
      updateKeyboardInset,
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const moveToStep = useCallback((step: number, alignStep = false) => {
    const nextStep = Math.max(
      0,
      Math.min(step, gettingStartedSteps.length - 1),
    );
    scrollTargetRef.current = alignStep
      ? nextStep < gettingStartedSteps.length - 1
        ? 'form'
        : 'top'
      : null;
    currentStepRef.current = nextStep;
    setCurrentStep(nextStep);
  }, []);

  const continueToNextStep = useCallback(async (fromStep: number) => {
    if (
      transitionInFlight.current ||
      currentStepRef.current !== fromStep
    ) {
      return;
    }

    transitionInFlight.current = true;
    setTransitioning(true);
    try {
      if (currentStepRef.current === fromStep) {
        const nextStep = Math.min(
          fromStep + 1,
          gettingStartedSteps.length - 1,
        );
        moveToStep(nextStep, true);
      }
      await guide.reload();
    } finally {
      transitionInFlight.current = false;
      setTransitioning(false);
    }
  }, [guide.reload, moveToStep]);

  const goBack = useCallback(() => {
    if (transitionInFlight.current) {
      return;
    }
    if (currentStep === 0) {
      router.back();
      return;
    }
    moveToStep(currentStep - 1, true);
  }, [currentStep, moveToStep]);

  const returnToStep = useCallback(
    (step: number) => moveToStep(step, true),
    [moveToStep],
  );

  const completeProfile = useCallback(
    () => continueToNextStep(0),
    [continueToNextStep],
  );
  const completeEquipment = useCallback(
    () => continueToNextStep(4),
    [continueToNextStep],
  );
  const completeClass = useCallback(
    () => continueToNextStep(1),
    [continueToNextStep],
  );
  const completeWarranty = useCallback(
    () => continueToNextStep(2),
    [continueToNextStep],
  );
  const completeMarketing = useCallback(
    () => continueToNextStep(3),
    [continueToNextStep],
  );
  const finishGuide = useCallback(async () => {
    if (authenticatedUser) {
      await clearGettingStartedDraft(authenticatedUser.id);
    }
    router.replace('/prospect');
  }, [authenticatedUser]);
  const updatePrimaryAction = useCallback((action: GettingStartedAction) => {
    setPrimaryAction(action);
  }, []);
  const saveForLater = useCallback(async () => {
    if (!primaryAction || savingForLater || transitioning) {
      return;
    }

    setSavingForLater(true);
    try {
      await primaryAction.onSaveForLater?.();
      if (authenticatedUser) {
        await saveGettingStartedDraft(authenticatedUser.id, { currentStep });
      }
      router.replace('/prospect');
    } finally {
      setSavingForLater(false);
    }
  }, [authenticatedUser, currentStep, primaryAction, savingForLater, transitioning]);

  const completion = guide.data
    ? getGettingStartedCompletion(guide.data)
    : [];
  const warrantyTodo = guide.data?.todos.find(
    (todo) => todo.type === 'JB_WARRANTIES',
  );
  const enrolledClass = guide.data?.classes.find(
    (session) =>
      session.enrollmentStatus === 'ENROLLED' ||
      session.enrollmentStatus === 'COMPLETED',
  );
  const initialLoading = !draftLoaded || (guide.loading && !guide.data);
  const fatalError = !guide.data ? guide.error : null;

  return (
    <AppScreen
      title="Getting Started"
      quickLinks={prospectQuickLinks}
      scroll={false}
      contentContainerClassName=""
    >
      <View className="flex-1">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="gap-3 px-4 pb-40 pt-3"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {initialLoading ? (
            <GettingStartedSkeleton
              step={draft?.currentStep ?? currentStep}
            />
          ) : fatalError ? (
            <ErrorState message={fatalError} onRetry={guide.reload} />
          ) : guide.data && draftLoaded ? (
            <>
              <JourneyIntro />
              <GettingStartedProgress
                currentStep={currentStep}
              />

              <AnimatedCard key={currentStep}>
                {currentStep === 0 ? (
                  <ProfileSetupStep
                    user={guide.data.user}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeProfile}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 1 ? (
                  <ClassSetupStep
                    classes={guide.data.classes}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeClass}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 2 ? (
                  <WarrantySetupStep
                    todo={warrantyTodo}
                    onComplete={completeWarranty}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 3 ? (
                  <MarketingSetupStep
                    consultation={guide.data.consultation}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeMarketing}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 4 ? (
                  <EquipmentSetupStep
                    equipment={guide.data.equipment}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeEquipment}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 5 ? (
                  <ReviewSetupStep
                    user={guide.data.user}
                    equipment={guide.data.equipment[0]}
                    classSession={enrolledClass}
                    warrantyComplete={Boolean(completion[2])}
                    marketingComplete={Boolean(completion[3])}
                    onEdit={returnToStep}
                    onFinish={finishGuide}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
              </AnimatedCard>

            </>
          ) : (
            <GettingStartedSkeleton
              step={draft?.currentStep ?? currentStep}
            />
          )}
        </ScrollView>

        {initialLoading ? (
          <View
            pointerEvents="none"
            style={[styles.fixedActionBar, { bottom: 0 }]}
          >
            <GettingStartedActionSkeleton />
          </View>
        ) : guide.data && primaryAction ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.fixedActionBar,
              { bottom: keyboardInset },
            ]}
          >
            <GettingStartedActionBar
              action={primaryAction}
              currentStep={currentStep}
              bottomInset={
                keyboardInset > 0 ? 10 : 12
              }
              onBack={goBack}
              onSaveForLater={() => void saveForLater()}
              savingForLater={savingForLater}
              saveForLaterDisabled={transitioning || Boolean(primaryAction.loading)}
            />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

function JourneyIntro() {
  const phases = [
    {
      number: '1',
      title: 'Set Up Your Dealer Profile',
      details: ['Complete your business profile'],
    },
    {
      number: '2',
      title: 'Sign Up for LG Classes',
      details: ['Complete training and review current program information'],
    },
    {
      number: '3',
      title: 'Continue Your Setup',
      details: ['Warranties, marketing, and equipment records'],
    },
  ];

  return (
    <View className="gap-3 rounded-[20px] bg-hercules-blue p-4">
      <View className="gap-1.5">
        <Text className="text-xs font-extrabold uppercase tracking-[1px] text-hercules-white/75">
          Getting Started
        </Text>
        <Text className="text-[22px] font-extrabold leading-6 text-hercules-white">
          Set up your profile. Find resources. Keep growing.
        </Text>
        <Text className="text-xs leading-4 text-hercules-white/80">
          Three milestones to get started with LG.
        </Text>
      </View>
      <View className="gap-2 border-t border-hercules-white/20 pt-3">
        {phases.map((phase) => (
          <View key={phase.number} className="flex-row items-center gap-2.5">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-hercules-red">
              <Text className="text-xs font-extrabold text-hercules-white">
                {phase.number}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[13px] font-extrabold leading-4 text-hercules-white">
                {phase.title}
              </Text>
              {phase.details.map((detail) => (
                <Text
                  key={detail}
                  className="text-[11px] leading-[14px] text-hercules-white/70"
                >
                  • {detail}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function GettingStartedSkeleton({ step }: { step: number }) {
  return (
    <SkeletonReveal
      label="Preparing your Getting Started checklist"
      className="gap-4"
    >
      <GettingStartedIntroSkeleton />
      <View className="gap-3 border-b border-hercules-blue/15 px-1 pb-5 pt-2">
        <View className="flex-row items-center justify-between">
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-3 w-1/3" subtle />
        </View>
        <SkeletonLine className="h-2.5 w-full" subtle />
      </View>
      <GettingStartedStepSkeleton step={step} />
    </SkeletonReveal>
  );
}

function GettingStartedIntroSkeleton() {
  return (
    <View className="gap-3 rounded-[20px] bg-hercules-blue/15 p-4">
      <View className="gap-1.5">
        <SkeletonLine className="h-3 w-1/2" />
        <SkeletonLine className="h-5 w-4/5" />
        <SkeletonLine className="h-5 w-3/5" />
        <SkeletonLine className="h-3 w-4/5" subtle />
      </View>
      <View className="gap-2 border-t border-hercules-blue/10 pt-3">
        {Array.from({ length: 3 }, (_, index) => (
          <View
            key={`journey-intro-phase-skeleton-${index}`}
            className="flex-row items-center gap-2.5"
          >
            <View
              className={`h-7 w-7 rounded-full ${
                index === 0
                  ? 'bg-hercules-red/15'
                  : 'bg-hercules-blue/15'
              }`}
            />
            <View className="min-w-0 flex-1 gap-1">
              <SkeletonLine className="h-3 w-2/5" />
              <View className="gap-1">
                <SkeletonLine className="h-3 w-3/5" subtle />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function GettingStartedStepSkeleton({ step }: { step: number }) {
  const normalizedStep = Math.max(
    0,
    Math.min(step, gettingStartedSteps.length - 1),
  );
  const titleLines = normalizedStep === 3 ? 2 : 1;
  const descriptionLines = [3, 4, 2, 3, 2, 3][normalizedStep];

  return (
    <View className="gap-5 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 rounded-[12px] bg-hercules-red/15" />
        <View className="min-w-0 flex-1 gap-1">
          <View>
            {Array.from({ length: titleLines }, (_, index) => (
              <View
                key={`journey-step-title-skeleton-${index}`}
                className="h-6 justify-center"
              >
                <SkeletonLine
                  className={`h-5 ${index === titleLines - 1 ? 'w-4/5' : 'w-full'}`}
                />
              </View>
            ))}
          </View>
          <View>
            {Array.from({ length: descriptionLines }, (_, index) => (
              <View
                key={`journey-step-description-skeleton-${index}`}
                className="h-5 justify-center"
              >
                <SkeletonLine
                  className={`h-3 ${index === descriptionLines - 1 ? 'w-3/5' : 'w-full'}`}
                  subtle
                />
              </View>
            ))}
          </View>
        </View>
      </View>
      <GettingStartedStepBodySkeleton step={normalizedStep} />
    </View>
  );
}

function GettingStartedStepBodySkeleton({ step }: { step: number }) {
  if (step === 1) {
    return (
      <View className="gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <View
            key={`training-choice-skeleton-${index}`}
            className="flex-row items-start gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4"
          >
            <View className="h-6 w-6 rounded-full bg-hercules-blue/15" />
            <View className="min-w-0 flex-1 gap-1">
              <View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-4 w-full" />
                </View>
                {index <= 1 ? (
                  <View className="h-5 justify-center">
                    <SkeletonLine className="h-4 w-3/5" />
                  </View>
                ) : null}
              </View>
              <View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-3 w-full" subtle />
                </View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-3 w-4/5" subtle />
                </View>
              </View>
              <View className="h-4 justify-center">
                <SkeletonLine className="h-3 w-2/5" />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (step === 2) {
    return (
      <View className="gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-6 w-6 rounded-full bg-hercules-red/15" />
          <SkeletonLine className="h-5 flex-1" />
        </View>
        <View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-full" subtle />
          </View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-full" subtle />
          </View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-full" subtle />
          </View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-3/5" subtle />
          </View>
        </View>
        <View className="h-4 justify-center">
          <SkeletonLine className="h-3 w-1/4" />
        </View>
      </View>
    );
  }

  if (step === 3) {
    return (
      <View className="gap-4">
        <View className="rounded-[18px] border border-hercules-blue/20 bg-hercules-white p-4">
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-full" subtle />
          </View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-4/5" subtle />
          </View>
        </View>
        <SkeletonTextField labelWidthClassName="w-[136px]" />
        <SkeletonTextField labelWidthClassName="w-[138px]" />
        <SkeletonTextField labelWidthClassName="w-[138px]" />
      </View>
    );
  }

  if (step === 4) {
    return (
      <View className="gap-4">
        <View className="flex-row items-start gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
          <View className="h-6 w-6 rounded-full bg-hercules-blue/15" />
          <View className="min-w-0 flex-1 gap-1">
            <View className="h-5 justify-center">
              <SkeletonLine className="h-5 w-4/5" />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-2/5" />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-4/5" subtle />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (step >= 5) {
    return (
      <View className="gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <View
            key={`journey-review-row-skeleton-${index}`}
            className="flex-row items-center gap-3 rounded-[18px] border border-hercules-blue/20 bg-hercules-white p-4"
          >
            <View
              className={`h-10 w-10 rounded-full ${
                index % 2 === 0
                  ? 'bg-hercules-blue/15'
                  : 'bg-hercules-red/15'
              }`}
            />
            <View className="min-w-0 flex-1 gap-1">
              <View className="h-5 justify-center">
                <SkeletonLine className="h-4 w-2/5" />
              </View>
              <View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-3 w-4/5" subtle />
                </View>
                {index === 1 ? (
                  <View className="h-5 justify-center">
                    <SkeletonLine className="h-3 w-3/5" subtle />
                  </View>
                ) : null}
              </View>
            </View>
            <SkeletonLine className="h-3 w-8" subtle />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <SkeletonTextField labelWidthClassName="w-[37px]" />
      <SkeletonTextField labelWidthClassName="w-[75px]" />
      <SkeletonTextField labelWidthClassName="w-[73px]" />
      <SkeletonTextField labelWidthClassName="w-[43px]" />
      <SkeletonTextField labelWidthClassName="w-[109px]" />
    </View>
  );
}

function GettingStartedActionSkeleton() {
  return (
    <SkeletonReveal
      className="border-t border-hercules-blue/20 bg-hercules-white px-4 pb-3 pt-3"
      style={styles.actionBar}
    >
      <SkeletonLine className="mb-3 h-4 w-1/3 self-center" subtle />
      <View className="flex-row gap-3">
        <View className="h-14 w-[36%] rounded-full bg-hercules-blue/15" />
        <View className="h-14 flex-1 rounded-full bg-hercules-red/15" />
      </View>
    </SkeletonReveal>
  );
}

type GettingStartedActionBarProps = {
  action: GettingStartedAction;
  currentStep: number;
  bottomInset: number;
  onBack: () => void;
  onSaveForLater: () => void;
  savingForLater: boolean;
  saveForLaterDisabled: boolean;
};

function GettingStartedActionBar({
  action,
  currentStep,
  bottomInset,
  onBack,
  onSaveForLater,
  savingForLater,
  saveForLaterDisabled,
}: GettingStartedActionBarProps) {
  return (
    <View
      className="border-t border-hercules-blue/20 bg-hercules-white px-4 pt-3"
      style={[styles.actionBar, { paddingBottom: bottomInset }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save and finish later"
        disabled={saveForLaterDisabled || savingForLater}
        onPress={onSaveForLater}
        className="items-center pb-3 active:opacity-70 disabled:opacity-50"
      >
        <Text className="text-center text-sm font-extrabold text-hercules-blue">
          {savingForLater ? 'Saving your progress…' : 'Save & finish later'}
        </Text>
      </Pressable>
      <View className="flex-row items-center gap-3">
        <View className="w-[36%]">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={currentStep === 0 ? 'Back' : 'Previous'}
            onPress={onBack}
            disabled={action.loading}
            className="relative min-h-14 items-center justify-center rounded-pill bg-hercules-blue px-5 active:opacity-80 disabled:opacity-50"
          >
            <ChevronLeft
              size={17}
              color={colors.white}
              strokeWidth={2.3}
              style={styles.backIcon}
            />
            <Text className="text-center text-base font-bold text-hercules-white">
              {currentStep === 0 ? 'Back' : 'Previous'}
            </Text>
          </Pressable>
        </View>
        <View className="flex-1">
          <PrimaryButton
            label={action.label}
            onPress={action.onPress}
            loading={action.loading}
            disabled={action.disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  actionBar: {
    shadowColor: '#001F5B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  backIcon: {
    position: 'absolute',
    left: 18,
  },
});
