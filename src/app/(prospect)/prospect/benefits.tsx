import { router } from 'expo-router';
import {
  Award,
  CalendarDays,
  ChevronRight,
  Folder,
  Megaphone,
  ShieldCheck,
} from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { HeroSparkles } from '../../../components/ui/HeroSparkles';
import { benefitsApi } from '../../../lib/api/endpoints';
import { Benefit } from '../../../lib/api/types';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { colors } from '../../../lib/theme/theme';

type BenefitAction = {
  title: string;
  description: string;
  icon: typeof CalendarDays;
  tone: 'red' | 'blue';
  onPress: () => void;
};

export default function ProspectBenefitsScreen() {
  const benefits = useAsyncData(() => benefitsApi.list(), []);
  const benefitList = benefits.data?.benefits ?? [];
  const firstBenefit = benefitList[0];
  const warrantyBenefit = benefitList.find(
    (benefit) => benefit.benefitType === 'WARRANTY',
  );

  const actions: BenefitAction[] = [
    {
      title: 'Class Sign-Up',
      description: 'Access training sessions and certifications to grow your skills.',
      icon: CalendarDays,
      tone: 'red',
      onPress: () => router.push('/prospect/classes'),
    },
    {
      title: 'Product Registration',
      description: 'Register products quickly and easily for extended protection.',
      icon: ShieldCheck,
      tone: 'blue',
      onPress: () => router.push('/prospect/getting-started'),
    },
    {
      title: 'Warranty Support',
      description: 'Fast, reliable warranty assistance when you need it most.',
      icon: ShieldCheck,
      tone: 'red',
      onPress: () => openBenefitUrl(warrantyBenefit),
    },
    {
      title: 'Marketing Consultation',
      description: 'Get expert advice and tools to promote your business.',
      icon: Megaphone,
      tone: 'blue',
      onPress: () => router.push('/prospect/marketing'),
    },
    {
      title: 'Technical Support',
      description: 'Access sales tools, manuals, and brand assets anytime.',
      icon: Folder,
      tone: 'blue',
      onPress: () => router.push('/prospect/resources'),
    },
  ];

  return (
    <AppScreen
      title="Benefits"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-28 pt-4"
    >
      <AnimatedCard className="rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
        <View className="relative items-center gap-3 py-1" style={styles.hero}>
          <HeroSparkles emphasis="blue" />
          <Award size={34} color={colors.red} strokeWidth={2.6} />
          <View className="items-center gap-1">
            <Text className="text-center text-3xl font-extrabold text-hercules-ink">
              Dealer Benefits
            </Text>
            <Text className="text-center text-base font-bold text-hercules-ink">
              Everything you need to grow
            </Text>
          </View>
          <Pressable
            disabled={!firstBenefit}
            onPress={() => openBenefitUrl(firstBenefit)}
            className="mt-1 min-h-12 w-52 flex-row items-center justify-center gap-3 rounded-pill active:opacity-80 disabled:opacity-50"
            style={styles.exploreButton}
          >
            <Text className="text-center text-sm font-extrabold text-hercules-white">
              Explore Benefits
            </Text>
            <ChevronRight size={18} color={colors.white} strokeWidth={2.8} />
          </Pressable>
        </View>
      </AnimatedCard>

      <View className="gap-4">
        {actions.map((action, index) => (
          <AnimatedCard
            key={action.title}
            index={index + 1}
            className="rounded-[20px] border border-hercules-blue/20 bg-hercules-white px-2 py-1"
          >
            <BenefitRow action={action} />
          </AnimatedCard>
        ))}
      </View>

      {benefits.loading ? <LoadingState label="Loading benefits" /> : null}
      {benefits.error ? (
        <ErrorState message={benefits.error} onRetry={benefits.reload} />
      ) : null}
    </AppScreen>
  );
}

function BenefitRow({ action }: { action: BenefitAction }) {
  const Icon = action.icon;
  const toneStyle = iconToneStyles[action.tone];

  return (
    <Pressable
      onPress={action.onPress}
      className="min-h-[68px] flex-row items-center gap-4 rounded-[16px] px-2 py-1 active:opacity-80"
    >
      <View style={[styles.iconTile, { backgroundColor: toneStyle.background }]}>
        <Icon size={22} color={toneStyle.foreground} strokeWidth={2.6} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-extrabold text-hercules-ink">
          {action.title}
        </Text>
        <Text className="text-sm leading-5 text-hercules-ink">
          {action.description}
        </Text>
      </View>
      <ChevronRight size={24} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
}

function openBenefitUrl(benefit?: Benefit) {
  if (benefit?.url) {
    void Linking.openURL(benefit.url);
  }
}

const iconToneStyles = {
  red: {
    background: colors.red,
    foreground: colors.white,
  },
  blue: {
    background: colors.blue,
    foreground: colors.white,
  },
};

const styles = StyleSheet.create({
  hero: {
    minHeight: 160,
  },
  exploreButton: {
    backgroundColor: colors.blue,
  },
  iconTile: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
