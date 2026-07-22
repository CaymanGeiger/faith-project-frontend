import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="mb-3 min-h-8 flex-row items-center justify-between">
      <Text className="text-xl font-extrabold text-hercules-ink">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} className="rounded-pill px-2 py-1 active:opacity-60">
          <Text className="text-sm font-bold text-hercules-blue">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
