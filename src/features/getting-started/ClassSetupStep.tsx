import { isUpcomingTraining, isSavedTraining, isValidTrainingSelection } from './trainingAvailability';
import { CalendarDays, CheckCircle2, Circle } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useInAppContent } from '../content/InAppContentProvider';
import { classesApi } from '../../lib/api/endpoints';
import { ClassSession } from '../../lib/api/types';
import { formatShortDate, formatTime } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import {
  clearGettingStartedDraftFields,
  GettingStartedActionChange,
  GettingStartedDraft,
  saveGettingStartedDraft,
} from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type ClassSetupStepProps = {
  classes: ClassSession[];
  userId: string;
  trainingVerified?: boolean;
  draft?: GettingStartedDraft | null;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function ClassSetupStep({
  classes,
  userId,
  trainingVerified = false,
  draft,
  onComplete,
  onActionChange,
}: ClassSetupStepProps) {
  const { openContent } = useInAppContent();
  const available = useMemo(() => classes.filter(session => isUpcomingTraining(session) || isSavedTraining(session)), [classes]);
  const enrolled = available.find(isValidTrainingSelection);
  const draftSelection = available.find(
    (session) => session.id === draft?.classSessionId &&
      (isUpcomingTraining(session) || isValidTrainingSelection(session)),
  );
  const hasSelection = available.some(
    (session) => isUpcomingTraining(session) || isValidTrainingSelection(session),
  );
  const [selectedId, setSelectedId] = useState(
    draftSelection?.id ?? enrolled?.id ?? available.find(isUpcomingTraining)?.id ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = useCallback(async () => {
    if (trainingVerified) { await onComplete(); return; }
    if (enrolled && selectedId === enrolled.id) {
      await onComplete();
      return;
    }
    const selected = available.find(session => session.id === selectedId);
    if (selected && isValidTrainingSelection(selected)) { await onComplete(); return; }
    if (!selected || !isUpcomingTraining(selected)) {
      setError('Choose an LG training session before continuing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await classesApi.enroll(selectedId);
      await clearGettingStartedDraftFields(userId, 'classSessionId');
      await onComplete();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to save your training preference',
      );
    } finally {
      setSaving(false);
    }
  }, [available, enrolled, onComplete, selectedId, userId, trainingVerified]);

  const saveForLater = useCallback(
    () => saveGettingStartedDraft(userId, { classSessionId: selectedId }),
    [selectedId, userId],
  );

  useLayoutEffect(() => {
    onActionChange({
      label: trainingVerified ? 'Continue' : 'Save & Continue',
      onPress: () => void enroll(),
      onSaveForLater: saveForLater,
      loading: saving,
      disabled: !trainingVerified && !hasSelection,
    });
  }, [enroll, hasSelection, onActionChange, saveForLater, saving, trainingVerified]);

  return (
    <GettingStartedStepCard
      icon={CalendarDays}
      title={trainingVerified ? 'Initial Training Verified' : 'Choose Your LG Training'}
      description={trainingVerified ? 'Your initial training completion is verified. Continue your dealer setup, or browse the calendar for additional training.' : 'Choose a session that works for your schedule. Hercules will confirm final enrollment and class logistics. Completing training may help you meet current program requirements; eligibility is confirmed separately.'}
    >
      <View className="gap-3">
        {error ? <ErrorState message={error} /> : null}
        <PrimaryButton
          label="Training Calendar & Registration"
          icon={CalendarDays}
          onPress={() => openContent({
            url: 'https://www.herculesindustries.com/eventcalendar',
            title: 'Training Calendar & Registration',
          })}
        />
        {!trainingVerified ? <Text className="text-sm leading-5 text-hercules-muted">
          Register through the Hercules calendar. Saving a preference below
          does not register you for a class.
        </Text> : null}
        {!trainingVerified ? available.map((session) => {
          const selected = session.id === selectedId;
          const complete = isValidTrainingSelection(session);
          const unavailable = !complete && !isUpcomingTraining(session);
          const Icon = complete ? CheckCircle2 : selected ? CheckCircle2 : Circle;
          return (
            <Pressable
              key={session.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: unavailable }}
              disabled={unavailable}
              onPress={() => setSelectedId(session.id)}
              className={`flex-row items-start gap-3 rounded-[20px] border p-4 active:opacity-80 ${
                selected ? 'border-hercules-blue bg-hercules-white' : 'border-hercules-blue/20 bg-hercules-white'
              }`}
            >
              <Icon
                size={24}
                color={selected || complete ? colors.blue : colors.muted}
                strokeWidth={2.5}
              />
              <View className="flex-1 gap-1">
                <Text className="text-base font-extrabold text-hercules-ink">
                  {session.title}
                </Text>
                <Text className="text-sm leading-5 text-hercules-muted">
                  {session.description}
                </Text>
                <Text className="text-xs font-extrabold text-hercules-blue">
                  {formatShortDate(session.startsAt)} · {formatTime(session.startsAt)}
                  {session.enrollmentStatus === 'COMPLETED'
                    ? ' · Completed'
                    : session.status === 'CANCELED'
                      ? ' · Canceled'
                    : complete
                      ? ' · Preference saved'
                      : ''}
                </Text>
              </View>
            </Pressable>
          );
        }) : null}
        {!trainingVerified && !hasSelection ? (
          <ErrorState message="No LG training sessions are currently available." />
        ) : null}
      </View>
    </GettingStartedStepCard>
  );
}
