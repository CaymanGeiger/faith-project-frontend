import { router } from 'expo-router';
import { ArrowRight, GraduationCap } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme/theme';

type TrainingHomeCardProps = {
  selected: boolean;
  completed: boolean;
  dueAt?: string;
};

export function TrainingHomeCard({
  selected,
  completed,
  dueAt,
}: TrainingHomeCardProps) {
  const title = completed
    ? 'Continue Your LG Training'
    : selected
      ? 'View Your LG Training'
      : 'Choose Your LG Training';
  const description = completed
    ? 'Explore additional sessions and keep building your product expertise.'
    : selected
      ? 'Review your selected session and prepare to complete your training.'
      : 'Choose a preferred session; Hercules will confirm enrollment and logistics.';
  const status = completed
    ? 'Training completed'
    : selected
      ? 'Session selected'
      : 'Selection needed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${status}`}
      onPress={() => router.push('/prospect/classes')}
      className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5 active:opacity-70"
    >
      <View className="flex-row items-start gap-4">
        <View className="h-11 w-11 items-center justify-center rounded-[13px] bg-hercules-red">
          <GraduationCap size={24} color={colors.white} strokeWidth={2.6} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-xs font-extrabold uppercase tracking-[1.2px] text-hercules-red">
              LG Training
            </Text>
            {dueAt && !selected ? (
              <Text className="text-xs font-bold text-hercules-muted">
                Due {formatShortDate(dueAt)}
              </Text>
            ) : null}
          </View>
          <Text className="text-xl font-extrabold text-hercules-ink">
            {title}
          </Text>
          <Text className="text-sm leading-5 text-hercules-muted">
            {description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-3 border-t border-hercules-blue/10 pt-4">
        <Text className="min-w-0 flex-1 text-xs font-bold text-hercules-muted">
          {status}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-extrabold text-hercules-blue">
            View training
          </Text>
          <ArrowRight size={18} color={colors.blue} strokeWidth={2.6} />
        </View>
      </View>
    </Pressable>
  );
}
