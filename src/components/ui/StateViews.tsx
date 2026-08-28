import { Text, View } from 'react-native';
import { SecondaryButton } from './SecondaryButton';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      className="gap-4 rounded-[16px] border border-hercules-red/20 bg-hercules-white p-5"
    >
      <Text className="text-base font-extrabold text-hercules-red">{message}</Text>
      {onRetry ? <SecondaryButton label="Retry" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
      <Text className="text-lg font-extrabold text-hercules-ink">{title}</Text>
      <Text className="text-sm leading-5 text-hercules-muted">{body}</Text>
    </View>
  );
}
