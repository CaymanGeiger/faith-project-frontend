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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
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

export default function GettingStartedScreen() {
  const { user: authenticatedUser } = useAuth();
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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

  const moveToStep = useCallback((step: number) => {
    const nextStep = Math.max(
      0,
      Math.min(step, gettingStartedSteps.length - 1),
    );
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
        moveToStep(fromStep + 1);
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
    moveToStep(currentStep - 1);
  }, [currentStep, moveToStep]);

  const completeProfile = useCallback(
    () => continueToNextStep(0),
    [continueToNextStep],
  );
  const completeEquipment = useCallback(
    () => continueToNextStep(1),
    [continueToNextStep],
  );
  const completeClass = useCallback(
    () => continueToNextStep(2),
    [continueToNextStep],
  );
  const completeWarranty = useCallback(
    () => continueToNextStep(3),
    [continueToNextStep],
  );
  const completeMarketing = useCallback(
    () => continueToNextStep(4),
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
    (session) => session.isEnrolled,
  );

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
          {(!draftLoaded || (guide.loading && !guide.data)) ? (
            <LoadingState label="Preparing your onboarding guide" />
          ) : null}
          {guide.error ? (
            <ErrorState message={guide.error} onRetry={guide.reload} />
          ) : null}

          {guide.data && draftLoaded ? (
            <>
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
                  <EquipmentSetupStep
                    equipment={guide.data.equipment}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeEquipment}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 2 ? (
                  <ClassSetupStep
                    classes={guide.data.classes}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeClass}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 3 ? (
                  <WarrantySetupStep
                    todo={warrantyTodo}
                    onComplete={completeWarranty}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 4 ? (
                  <MarketingSetupStep
                    consultation={guide.data.consultation}
                    userId={authenticatedUser?.id ?? guide.data.user.id}
                    draft={draft}
                    onComplete={completeMarketing}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
                {currentStep === 5 ? (
                  <ReviewSetupStep
                    user={guide.data.user}
                    equipment={guide.data.equipment[0]}
                    classSession={enrolledClass}
                    warrantyComplete={Boolean(completion[3])}
                    marketingComplete={Boolean(completion[4])}
                    onEdit={moveToStep}
                    onFinish={finishGuide}
                    onActionChange={updatePrimaryAction}
                  />
                ) : null}
              </AnimatedCard>

              {primaryAction ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save and finish later"
                  disabled={transitioning || primaryAction.loading || savingForLater}
                  onPress={() => void saveForLater()}
                  className="items-center py-2 active:opacity-70 disabled:opacity-50"
                >
                  <Text className="text-sm font-extrabold text-hercules-blue">
                    {savingForLater
                      ? 'Saving your progress…'
                      : 'Save & finish later'}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        {guide.data && primaryAction ? (
          <View
            pointerEvents="box-none"
            style={[styles.fixedActionBar, { bottom: keyboardInset }]}
          >
            <GettingStartedActionBar
              action={primaryAction}
              currentStep={currentStep}
              bottomInset={
                keyboardInset > 0 ? 10 : Math.max(insets.bottom, 12)
              }
              onBack={goBack}
            />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

type GettingStartedActionBarProps = {
  action: GettingStartedAction;
  currentStep: number;
  bottomInset: number;
  onBack: () => void;
};

function GettingStartedActionBar({
  action,
  currentStep,
  bottomInset,
  onBack,
}: GettingStartedActionBarProps) {
  return (
    <View
      className="border-t border-hercules-blue/20 bg-hercules-white px-4 pt-3"
      style={[styles.actionBar, { paddingBottom: bottomInset }]}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-[36%]">
          <SecondaryButton
            label={currentStep === 0 ? 'Back' : 'Previous'}
            icon={ChevronLeft}
            onPress={onBack}
            disabled={action.loading}
          />
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
});
