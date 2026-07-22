import { Text } from 'react-native';

export function TypingIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Text className="px-2 text-sm font-bold text-hercules-blue">Typing...</Text>
  );
}
