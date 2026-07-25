import { Megaphone } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { TextInput } from '../../components/ui/TextInput';
import { marketingApi } from '../../lib/api/endpoints';
import { MarketingConsultation } from '../../lib/api/types';
import {
  clearGettingStartedDraftFields,
  GettingStartedActionChange,
  GettingStartedDraft,
  saveGettingStartedDraft,
} from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type MarketingSetupStepProps = {
  consultation: MarketingConsultation;
  userId: string;
  draft?: GettingStartedDraft | null;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function MarketingSetupStep({
  consultation,
  userId,
  draft,
  onComplete,
  onActionChange,
}: MarketingSetupStepProps) {
  const [optionOne, setOptionOne] = useState(
    draft?.marketing?.optionOne ?? consultation.availabilityOptionOne ?? '',
  );
  const [optionTwo, setOptionTwo] = useState(
    draft?.marketing?.optionTwo ?? consultation.availabilityOptionTwo ?? '',
  );
  const [optionThree, setOptionThree] = useState(
    draft?.marketing?.optionThree ?? consultation.availabilityOptionThree ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (![optionOne, optionTwo, optionThree].every((value) => value.trim())) {
      setError('Provide three availability options before continuing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await marketingApi.handoff({
        availabilityOptionOne: optionOne,
        availabilityOptionTwo: optionTwo,
        availabilityOptionThree: optionThree,
      });
      await clearGettingStartedDraftFields(userId, 'marketing');
      await onComplete();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to submit consultation availability',
      );
    } finally {
      setSaving(false);
    }
  }, [onComplete, optionOne, optionThree, optionTwo, userId]);

  const saveForLater = useCallback(
    () =>
      saveGettingStartedDraft(userId, {
        marketing: { optionOne, optionTwo, optionThree },
      }),
    [optionOne, optionThree, optionTwo, userId],
  );

  useLayoutEffect(() => {
    onActionChange({
      label: consultation.submittedAt ? 'Update & Continue' : 'Submit & Continue',
      onPress: () => void save(),
      onSaveForLater: saveForLater,
      loading: saving,
    });
  }, [consultation.submittedAt, onActionChange, save, saveForLater, saving]);

  return (
    <GettingStartedStepCard
      icon={Megaphone}
      title="Plan Your Marketing Consultation"
      description="Share three times that work for your required onboarding consultation. Hercules will use these preferences for the Lead Smart handoff."
    >
      <View className="gap-4">
        {error ? <ErrorState message={error} /> : null}
        <View className="rounded-[18px] border border-hercules-blue/20 bg-hercules-white p-4">
          <Text className="text-sm font-semibold leading-5 text-hercules-muted">
            Include a date, time, and time zone—for example, “August 12 at
            10:00 AM Mountain.”
          </Text>
        </View>
        <TextInput
          label="Availability Option 1"
          value={optionOne}
          onChangeText={setOptionOne}
          placeholder="Date, time, and time zone"
        />
        <TextInput
          label="Availability Option 2"
          value={optionTwo}
          onChangeText={setOptionTwo}
          placeholder="Date, time, and time zone"
        />
        <TextInput
          label="Availability Option 3"
          value={optionThree}
          onChangeText={setOptionThree}
          placeholder="Date, time, and time zone"
        />
      </View>
    </GettingStartedStepCard>
  );
}
