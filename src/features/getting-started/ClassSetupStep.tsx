import { CalendarDays, CheckCircle2, Circle } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
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
  draft?: GettingStartedDraft | null;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function ClassSetupStep({
  classes,
  userId,
  draft,
  onComplete,
  onActionChange,
}: ClassSetupStepProps) {
  const enrolled = classes.find((session) => session.isEnrolled);
  const [selectedId, setSelectedId] = useState(
    enrolled?.id ?? draft?.classSessionId ?? classes[0]?.id ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enroll = useCallback(async () => {
    if (enrolled) {
      await onComplete();
      return;
    }
    if (!selectedId) {
      setError('Choose a certification class before continuing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await classesApi.enroll(selectedId);
      await clearGettingStartedDraftFields(userId, 'classSessionId');
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to enroll in the class');
    } finally {
      setSaving(false);
    }
  }, [enrolled, onComplete, selectedId, userId]);

  const saveForLater = useCallback(
    () => saveGettingStartedDraft(userId, { classSessionId: selectedId }),
    [selectedId, userId],
  );

  useLayoutEffect(() => {
    onActionChange({
      label: 'Save & Continue',
      onPress: () => void enroll(),
      onSaveForLater: enrolled ? undefined : saveForLater,
      loading: saving,
      disabled: classes.length === 0,
    });
  }, [classes.length, enroll, enrolled, onActionChange, saveForLater, saving]);

  return (
    <GettingStartedStepCard
      icon={CalendarDays}
      title="Choose Your Certification Class"
      description="Certification sessions are virtual. Select the upcoming class that works best for your schedule."
    >
      <View className="gap-3">
        {error ? <ErrorState message={error} /> : null}
        {classes.map((session) => {
          const selected = session.id === selectedId;
          const complete = Boolean(session.isEnrolled);
          const Icon = complete ? CheckCircle2 : selected ? CheckCircle2 : Circle;
          return (
            <Pressable
              key={session.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
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
                  {complete ? ' · Enrolled' : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {classes.length === 0 ? (
          <ErrorState message="No certification classes are currently available." />
        ) : null}
      </View>
    </GettingStartedStepCard>
  );
}
