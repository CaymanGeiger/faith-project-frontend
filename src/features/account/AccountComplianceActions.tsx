import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';
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
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const deletionInFlight = useRef(false);

  const submitDeletionRequest = async () => {
    if (deletionInFlight.current || deletionMessage) return;
    deletionInFlight.current = true;
    setRequestingDeletion(true);
    setDeletionError(null);
    try {
      const result = await accountApi.requestDeletion();
      setDeletionMessage(result.message);
      if (user.role === 'PROSPECT') {
        // Local cleanup cannot turn a completed server deletion into a failure.
        await clearGettingStartedDraft(user.id).catch(() => undefined);
      }
    } catch (caught) {
      setDeletionError(
        caught instanceof Error
          ? caught.message
          : 'Please try again or use the Account Deletion page.',
      );
    } finally {
      deletionInFlight.current = false;
      setRequestingDeletion(false);
    }
  };

  const closeDeletion = async () => {
    if (deletionInFlight.current) return;
    if (deletionMessage) {
      deletionInFlight.current = true;
      setRequestingDeletion(true);
      try {
        await onDeleted();
      } catch {
        setDeletionError('Your request was received. Please try signing out again.');
        return;
      } finally {
        deletionInFlight.current = false;
        setRequestingDeletion(false);
      }
    }
    setConfirmingDeletion(false);
  };

  const detail = user.role === 'PROSPECT'
    ? 'This will close your access and permanently delete your account and associated app data. Imported records may require ownership verification before deletion is complete.'
    : 'This will immediately close your access and submit your account for deletion after active dealer accounts are reassigned.';

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
        onPress={() => {
          setDeletionError(null);
          setDeletionMessage(null);
          setConfirmingDeletion(true);
        }}
        className="min-h-11 self-start justify-center disabled:opacity-50"
      >
        <Text className="text-sm font-extrabold text-hercules-red">
          {requestingDeletion ? 'Submitting request...' : 'Request account deletion'}
        </Text>
      </Pressable>
      <ModalSheet
        visible={confirmingDeletion}
        title={deletionMessage ? 'Account deletion' : 'Delete account?'}
        onClose={() => void closeDeletion()}
      >
        <View className="gap-4 px-4 pb-4">
          <Text accessibilityRole={deletionMessage ? 'alert' : undefined} className="text-base leading-6 text-hercules-ink">
            {deletionMessage ?? detail}
          </Text>
          {deletionError ? <ErrorState message={deletionError} /> : null}
          {deletionMessage ? (
            <PrimaryButton label="Done" loading={requestingDeletion} onPress={() => void closeDeletion()} />
          ) : (
            <>
              <PrimaryButton label="Request deletion" loading={requestingDeletion} onPress={() => void submitDeletionRequest()} />
              <SecondaryButton label="Cancel" disabled={requestingDeletion} onPress={() => void closeDeletion()} />
            </>
          )}
        </View>
      </ModalSheet>
    </View>
  );
}
