import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { accountApi } from '../../lib/api/endpoints';
import { User } from '../../lib/api/types';
import { clearGettingStartedDraft } from '../getting-started/gettingStarted';

type AccountComplianceActionsProps = {
  user: User;
  onDeleted: () => Promise<void>;
};

export function AccountComplianceActions({
  user,
  onDeleted,
}: AccountComplianceActionsProps) {
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const submitDeletionRequest = async () => {
    setRequestingDeletion(true);
    try {
      const result = await accountApi.requestDeletion();
      if (user.role === 'PROSPECT') {
        await clearGettingStartedDraft(user.id);
      }
      Alert.alert('Account deletion', result.message, [
        {
          text: 'Done',
          onPress: () => void onDeleted(),
        },
      ]);
    } catch (caught) {
      Alert.alert(
        'Unable to submit request',
        caught instanceof Error
          ? caught.message
          : 'Please try again or use the Account Deletion page.',
      );
    } finally {
      setRequestingDeletion(false);
    }
  };

  const requestDeletion = () => {
    const detail =
      user.role === 'PROSPECT'
        ? 'This will permanently delete your Hercules Honors Rewards account and associated app data.'
        : 'This will immediately close your access and submit your account for deletion after active dealer accounts are reassigned.';
    Alert.alert('Delete account?', detail, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request deletion',
        style: 'destructive',
        onPress: () => void submitDeletionRequest(),
      },
    ]);
  };

  return (
    <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
      <Text className="text-lg font-extrabold text-hercules-ink">
        Privacy and account
      </Text>
      <View className="flex-row flex-wrap gap-x-5 gap-y-1">
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-bold text-hercules-blue">
            Privacy Notice
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/terms')}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-bold text-hercules-blue">
            Terms of Use
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/account-deletion')}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-bold text-hercules-blue">
            Deletion help
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Request account deletion"
        accessibilityState={{ busy: requestingDeletion }}
        disabled={requestingDeletion}
        onPress={requestDeletion}
        className="min-h-11 self-start justify-center disabled:opacity-50"
      >
        <Text className="text-sm font-extrabold text-hercules-red">
          {requestingDeletion ? 'Submitting request...' : 'Request account deletion'}
        </Text>
      </Pressable>
    </View>
  );
}
