import { router } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { PageHero } from '../../../components/ui/PageHero';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SectionHeader } from '../../../components/ui/SectionHeader';

export default function ProspectMarketingScreen() {
  return (
    <AppScreen title="Marketing Consultation" quickLinks={prospectQuickLinks}>
      <PageHero
        title="Marketing Support"
        subtitle="Talk with Hercules about marketing resources, growth planning, and next steps for your business."
      />

      <AnimatedCard
        index={1}
        className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5"
      >
        <View className="gap-2">
          <SectionHeader title="Save Your Availability" />
          <Text className="text-[15px] leading-5 text-hercules-muted">
            Add three times that work for you in Getting Started. Contact your
            Hercules representative to confirm availability and next steps.
          </Text>
        </View>
        <PrimaryButton
          label="Share Availability"
          icon={CalendarCheck}
          onPress={() =>
            router.push({
              pathname: '/prospect/getting-started',
              params: { step: 'marketing' },
            })
          }
        />
      </AnimatedCard>
    </AppScreen>
  );
}
