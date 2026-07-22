import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../../lib/theme/theme';
import { SecondaryButton } from './SecondaryButton';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View className="items-center gap-3 rounded-[20px] bg-hercules-white p-6">
      <ActivityIndicator color={colors.red} />
      <Text className="font-bold text-hercules-muted">{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="gap-4 rounded-[20px] bg-hercules-white p-5">
      <Text className="text-base font-extrabold text-hercules-red">{message}</Text>
      {onRetry ? <SecondaryButton label="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-2 rounded-[20px] bg-hercules-white p-5">
      <Text className="text-lg font-extrabold text-hercules-ink">{title}</Text>
      <Text className="text-sm leading-5 text-hercules-muted">{body}</Text>
    </View>
  );
}
