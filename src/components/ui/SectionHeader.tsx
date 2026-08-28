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
    <View className="min-h-11 flex-row items-center justify-between">
      <Text className="text-lg font-bold leading-6 tracking-[-0.15px] text-hercules-ink">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          className="min-h-11 justify-center rounded-pill px-2 active:opacity-60"
        >
          <Text className="text-sm font-semibold text-hercules-blue">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
