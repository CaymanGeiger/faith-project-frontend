import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ErrorState } from '../components/ui/StateViews';
import { useAuth } from '../features/auth/AuthProvider';
import { CURRENT_TERMS_VERSION } from '../features/legal/legal';
import { LegalCopy, LegalScreen, LegalSection } from '../features/legal/LegalScreen';

export default function TermsScreen() {
  const { user, acceptLegalTerms } = useAuth();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsAcceptance = Boolean(
    user &&
      (!user.termsAcceptedAt || user.termsVersion !== CURRENT_TERMS_VERSION),
  );

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await acceptLegalTerms();
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <LegalScreen title="Terms of Use">
      <View className="gap-1 rounded-[16px] border border-hercules-blue/15 bg-hercules-blue/5 p-4">
        <Text className="text-sm font-bold text-hercules-ink">
          Effective August 17, 2026
        </Text>
        <LegalCopy>
          These terms govern your use of the Hercules Honors Rewards business
          application.
        </LegalCopy>
      </View>

      <LegalSection title="Authorized business use">
        <LegalCopy>
          This app is for authorized Hercules dealers, partners, and sales
          managers. Use only the invitation and account assigned to you. Do not
          share credentials or try to access another user's account.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Professional messaging">
        <LegalCopy>
          Messages must be professional, lawful, and relevant to the dealer
          program. Do not post harassment, threats, discriminatory or sexually
          explicit material, confidential third-party information, malware, or
          content that infringes another person's rights. Hercules may remove
          content, suspend access, and investigate reports.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Reporting and blocking">
        <LegalCopy>
          You can report an incoming message or block a participant in the chat
          sheet. Reports are reviewed by Hercules. Blocking stops messages in that
          conversation until you choose to unblock the participant. For urgent
          support or a report, call Hercules at 1-800-356-5350.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Account and service">
        <LegalCopy>
          You are responsible for the information you submit. Links to external
          training, benefit, or product resources are provided for convenience and
          may have their own terms. Hercules may modify, suspend, or discontinue
          access for security, business, or policy reasons.
        </LegalCopy>
      </LegalSection>

      <LegalSection title="Privacy">
        <LegalCopy>
          Your use is also subject to the Privacy Notice. If another written
          dealer agreement applies, that agreement controls if there is a conflict.
        </LegalCopy>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}
          className="min-h-11 justify-center"
        >
          <Text className="font-bold text-hercules-blue">Read Privacy Notice</Text>
        </Pressable>
      </LegalSection>

      {needsAcceptance ? (
        <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
          <Text className="text-base font-extrabold text-hercules-ink">
            Accept to continue messaging
          </Text>
          <LegalCopy>
            Your acceptance is required before you can send private messages.
          </LegalCopy>
          {error ? <ErrorState message={error} /> : null}
          <PrimaryButton
            label="I Agree to the Terms"
            onPress={() => void accept()}
            loading={accepting}
            shape="rounded"
          />
        </View>
      ) : null}
    </LegalScreen>
  );
}
