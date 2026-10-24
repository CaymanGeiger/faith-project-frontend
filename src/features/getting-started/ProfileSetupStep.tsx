import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { accountApi } from '../../lib/api/endpoints';
import { ProspectProfile, User } from '../../lib/api/types';
import {
  clearGettingStartedDraftFields,
  GettingStartedActionChange,
  GettingStartedDraft,
  saveGettingStartedDraft,
} from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type ProfileSetupStepProps = {
  user: User & { prospectProfile?: ProspectProfile };
  userId: string;
  draft?: GettingStartedDraft | null;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function ProfileSetupStep({
  user,
  userId,
  draft,
  onComplete,
  onActionChange,
}: ProfileSetupStepProps) {
  const [firstName, setFirstName] = useState(
    draft?.profile?.firstName ?? user.firstName,
  );
  const [lastName, setLastName] = useState(
    draft?.profile?.lastName ?? user.lastName,
  );
  const [phone, setPhone] = useState(draft?.profile?.phone ?? user.phone ?? '');
  const [companyName, setCompanyName] = useState(
    draft?.profile?.companyName ?? user.prospectProfile?.companyName ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (![firstName, lastName, companyName].every((value) => value.trim())) {
      setError('Complete every field before continuing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await accountApi.update({ firstName, lastName, phone, companyName });
      await clearGettingStartedDraftFields(userId, 'profile');
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your profile');
    } finally {
      setSaving(false);
    }
  }, [companyName, firstName, lastName, onComplete, phone, userId]);

  const saveForLater = useCallback(
    () =>
      saveGettingStartedDraft(userId, {
        profile: { email: user.email, firstName, lastName, phone, companyName },
      }),
    [companyName, firstName, lastName, phone, user.email, userId],
  );

  const openEmailSettings = async () => {
    setError(null);
    try {
      await saveForLater();
      router.push('/prospect/account');
    } catch {
      setError('Unable to save your draft. Try again before changing your email.');
    }
  };

  useLayoutEffect(() => {
    onActionChange({
      label: 'Save & Continue',
      onPress: () => void save(),
      onSaveForLater: saveForLater,
      loading: saving,
    });
  }, [onActionChange, save, saveForLater, saving]);

  return (
    <GettingStartedStepCard
      icon={UserRound}
      title="Confirm Your Business Profile"
      description="Confirm your contact and company details so Hercules can support every step of Getting Started."
    >
      <View className="gap-4">
        {error ? <ErrorState message={error} /> : null}
        <TextInput
          label="Email"
          value={user.email}
          editable={false}
          keyboardType="email-address"
        />
        <SecondaryButton
          label="Change Email in Profile"
          onPress={() => void openEmailSettings()}
          disabled={saving}
        />
        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          label="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
        />
      </View>
    </GettingStartedStepCard>
  );
}
