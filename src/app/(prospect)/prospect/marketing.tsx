import { Award, ExternalLink, Megaphone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState } from '../../../components/ui/StateViews';
import { colors } from '../../../lib/theme/theme';

const marketingConsultationFormUrl = 'https://form.jotform.com/262005957430050';

export default function ProspectMarketingScreen() {
  const [error, setError] = useState<string | null>(null);

  const openConsultationForm = async () => {
    setError(null);
    try {
      await Linking.openURL(marketingConsultationFormUrl);
    } catch {
      setError('Unable to open the marketing consultation form.');
    }
  };

  return (
    <AppScreen
      title="Marketing"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <PageHero
        icon={Award}
        title="Marketing Consultation"
        subtitle="Complete the required onboarding consultation."
      />

      {error ? <ErrorState message={error} /> : null}

      <AnimatedCard index={1} className="gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-hercules-blue">
            <Megaphone size={22} color={colors.white} strokeWidth={2.4} />
          </View>
          <Text className="text-2xl font-extrabold text-hercules-ink">
            Schedule Your Consultation
          </Text>
        </View>
        <View className="gap-3">
          <Text className="text-base font-semibold leading-6 text-hercules-muted">
            Use the marketing consultation form to share the details needed for
            your onboarding consultation. The form collects your contact
            information, dealership context, and preferred next steps so the
            marketing team can follow up.
          </Text>
        </View>
        <PrimaryButton
          label="Open Marketing Form"
          icon={ExternalLink}
          onPress={openConsultationForm}
        />
      </AnimatedCard>
    </AppScreen>
  );
}
