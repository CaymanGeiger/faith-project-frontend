import { router } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import type { JourneyStep } from './dealerJourney';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme/theme';

type NextStepCardProps = {
  step: JourneyStep;
};

export function NextStepCard({ step }: NextStepCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your next step: ${step.title}`}
      onPress={() => router.push(step.href)}
      className="gap-4 rounded-[20px] bg-hercules-blue px-5 py-5 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <Sparkles size={16} color={colors.white} strokeWidth={2.5} />
          <Text className="text-xs font-extrabold uppercase tracking-[1px] text-hercules-white/80">
            Your Next Step
          </Text>
        </View>
        {step.dueAt ? (
          <Text className="text-xs font-bold text-hercules-white/75">
            Due {formatShortDate(step.dueAt)}
          </Text>
        ) : null}
      </View>
      <View className="gap-2">
        <Text className="text-[24px] font-extrabold leading-7 text-hercules-white">
          {step.title}
        </Text>
        <Text className="text-[15px] leading-5 text-hercules-white/85">
          {step.description}
        </Text>
      </View>
      <View className="flex-row items-center justify-between gap-3 border-t border-hercules-white/20 pt-4">
        <Text className="min-w-0 flex-1 text-xs font-bold leading-4 text-hercules-white/75">
          {step.support}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-extrabold text-hercules-white">
            Continue
          </Text>
          <ArrowRight size={18} color={colors.white} strokeWidth={2.6} />
        </View>
      </View>
    </Pressable>
  );
}
