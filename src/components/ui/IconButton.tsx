import { Pressable } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  tone?: 'red' | 'blue' | 'plain';
};

export function IconButton({
  icon: Icon,
  onPress,
  label,
  tone = 'plain',
}: IconButtonProps) {
  const background =
    tone === 'red'
      ? 'bg-hercules-red'
      : tone === 'blue'
        ? 'bg-hercules-blue'
        : 'bg-hercules-white';
  const iconColor = tone === 'plain' ? colors.ink : colors.white;

  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full ${background} active:opacity-80`}
    >
      <Icon size={22} color={iconColor} strokeWidth={2.4} />
    </Pressable>
  );
}
