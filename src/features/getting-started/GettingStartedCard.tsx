import { ArrowRight, ListChecks } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../lib/theme/theme';

type GettingStartedCardProps = {
  completed: number;
  total: number;
  onPress: () => void;
};

export function GettingStartedCard({
  completed,
  total,
  onPress,
}: GettingStartedCardProps) {
  const finished = completed === total;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${finished ? 'Review' : 'Continue'} Getting Started`}
      onPress={onPress}
      className="gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5 active:opacity-80"
    >
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-hercules-red">
          <ListChecks size={24} color={colors.white} strokeWidth={2.6} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-xs font-extrabold uppercase tracking-[1.2px] text-hercules-red">
            {finished ? 'Setup complete' : `${completed} of ${total} complete`}
          </Text>
          <Text className="text-2xl font-extrabold text-hercules-ink">
            Getting Started
          </Text>
          <Text className="text-sm font-semibold leading-5 text-hercules-muted">
            One guided path for your dealer profile, equipment, certification,
            warranty, and marketing setup.
          </Text>
        </View>
        <ArrowRight size={23} color={colors.blue} strokeWidth={2.6} />
      </View>
      <View className="h-2 overflow-hidden rounded-pill bg-hercules-blue/15">
        <View
          className="h-full rounded-pill bg-hercules-blue"
          style={{ width: `${Math.round((completed / total) * 100)}%` }}
        />
      </View>
    </Pressable>
  );
}
