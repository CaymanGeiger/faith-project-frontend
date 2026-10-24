import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../lib/theme/theme';
import { gettingStartedStepKeys } from './gettingStarted';

type GettingStartedProgressProps = {
  currentStep: number;
  disabled?: boolean;
  onBack: () => void;
};

export function GettingStartedProgress({ currentStep, disabled = false, onBack }: GettingStartedProgressProps) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3">
      <Pressable accessibilityRole="button" accessibilityLabel="Back to checklist"
        accessibilityState={{ disabled }} disabled={disabled} onPress={onBack}
        className="min-h-12 flex-row items-center gap-1 pr-3 active:opacity-70 disabled:opacity-50">
        <ChevronLeft size={20} color={colors.blue} strokeWidth={2.4} />
        <Text className="text-sm font-bold text-hercules-blue">Checklist</Text>
      </Pressable>
      <Text className="text-xs font-semibold text-hercules-muted">
        Task {currentStep + 1} of {gettingStartedStepKeys.length}
      </Text>
    </View>
  );
}
