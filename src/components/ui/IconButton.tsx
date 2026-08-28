import { Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  tone?: 'red' | 'blue' | 'plain';
  selected?: boolean;
};

export function IconButton({
  icon: Icon,
  onPress,
  label,
  tone = 'plain',
  selected = false,
}: IconButtonProps) {
  const background =
    tone === 'red'
      ? selected
        ? 'bg-hercules-white/20'
        : 'bg-hercules-white/10'
      : tone === 'blue'
        ? 'bg-hercules-blue'
        : 'bg-hercules-white';
  const iconColor = tone === 'plain' ? colors.ink : colors.white;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full ${background} active:opacity-75`}
    >
      <Icon size={22} color={iconColor} strokeWidth={2.4} />
    </Pressable>
  );
}
