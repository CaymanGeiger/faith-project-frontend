import { UserRound } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
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
  const [email, setEmail] = useState(draft?.profile?.email ?? user.email);
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
    if (![email, firstName, lastName, phone, companyName].every((value) => value.trim())) {
      setError('Complete every field before continuing.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await accountApi.update({ email, firstName, lastName, phone, companyName });
      await clearGettingStartedDraftFields(userId, 'profile');
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your profile');
    } finally {
      setSaving(false);
    }
  }, [companyName, email, firstName, lastName, onComplete, phone, userId]);

  const saveForLater = useCallback(
    () =>
      saveGettingStartedDraft(userId, {
        profile: { email, firstName, lastName, phone, companyName },
      }),
    [companyName, email, firstName, lastName, phone, userId],
  );

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
      description="Keep your business and contact details up to date."
    >
      <View className="gap-4">
        {error ? <ErrorState message={error} /> : null}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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
          label="Phone"
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
