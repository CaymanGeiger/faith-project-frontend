import { router } from 'expo-router';
import { CalendarCheck, Megaphone } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { PageHero } from '../../../components/ui/PageHero';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { colors } from '../../../lib/theme/theme';

export default function ProspectMarketingScreen() {
  return (
    <AppScreen title="Marketing Consultation" quickLinks={prospectQuickLinks}>
      <PageHero
        title="Marketing Support"
        subtitle="Connect with Hercules for marketing resources, growth planning, and practical next steps for your business."
      />

      <AnimatedCard
        index={1}
        className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5"
      >
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-hercules-red">
            <Megaphone size={21} color={colors.white} strokeWidth={2.4} />
          </View>
          <View className="min-w-0 flex-1 gap-2">
            <SectionHeader title="Why It Matters" />
            <Text className="text-[15px] leading-5 text-hercules-muted">
              Use this space to tell Hercules when you are available to discuss
              sales tools, marketing resources, and business-growth support that
              may be available.
            </Text>
          </View>
        </View>
      </AnimatedCard>

      <AnimatedCard
        index={2}
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
          onPress={() => router.push('/prospect/getting-started')}
        />
      </AnimatedCard>
    </AppScreen>
  );
}
