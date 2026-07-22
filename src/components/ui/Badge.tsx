import { Text, View } from 'react-native';

type BadgeProps = {
  label: string;
  tone?: 'red' | 'blue' | 'neutral';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const toneClass =
    tone === 'red'
      ? 'bg-hercules-red'
      : tone === 'blue'
        ? 'bg-hercules-blue'
        : 'border border-hercules-blue bg-hercules-white';
  const textClass = tone === 'neutral' ? 'text-hercules-blue' : 'text-hercules-white';

  return (
    <View className={`self-start rounded-pill px-3 py-1 ${toneClass}`}>
      <Text className={`text-xs font-bold ${textClass}`}>{label}</Text>
    </View>
  );
}
