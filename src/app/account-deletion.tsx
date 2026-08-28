import { useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ErrorState } from '../components/ui/StateViews';
import { TextInput } from '../components/ui/TextInput';
import { LegalCopy, LegalScreen, LegalSection } from '../features/legal/LegalScreen';
import { accountApi } from '../lib/api/endpoints';

export default function AccountDeletionScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await accountApi.requestExternalDeletion(email.trim());
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LegalScreen title="Account Deletion">
      <LegalCopy>
        If you cannot sign in to request deletion from the app, use this form.
        We will verify your identity before completing the request. Hercules aims
        to complete verified requests within 30 days and will confirm when it is
        complete.
      </LegalCopy>
      {submitted ? (
        <View className="rounded-[16px] border border-hercules-blue/15 bg-hercules-blue/5 p-4">
          <Text className="text-base font-extrabold text-hercules-ink">
            Request received
          </Text>
          <Text className="mt-1 text-[15px] leading-6 text-hercules-muted">
            If an account matches this email address, Hercules will contact you to
            verify and complete the deletion request. For help, call Hercules at
            1-800-356-5350.
          </Text>
        </View>
      ) : (
        <View className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
          {error ? <ErrorState message={error} /> : null}
          <TextInput
            label="Account email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PrimaryButton
            label="Request Account Deletion"
            onPress={() => void submit()}
            loading={submitting}
            disabled={!email.includes('@')}
            shape="rounded"
          />
        </View>
      )}
      <LegalSection title="What happens next">
        <LegalCopy>
          A dealer deletion removes the account and associated app data once
          verified. A sales manager deletion closes access immediately and is
          completed after assigned dealer records are safely reassigned. Hercules
          aims to complete verified requests within 30 days. Limited records may
          be retained only where required by law.
        </LegalCopy>
      </LegalSection>
    </LegalScreen>
  );
}
