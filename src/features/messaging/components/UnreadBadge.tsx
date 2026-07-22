import { Text, View } from 'react-native';

export function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null;

  return (
    <View className="min-w-7 items-center rounded-pill bg-hercules-red px-2 py-1">
      <Text className="text-xs font-extrabold text-hercules-white">{count}</Text>
    </View>
  );
}
