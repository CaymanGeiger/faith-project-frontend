import { Pressable, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
};

export function SecondaryButton({
  label,
  onPress,
  disabled,
  icon: Icon,
}: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      className="min-h-14 flex-row items-center justify-center gap-2 rounded-pill bg-hercules-blue px-5 active:opacity-80 disabled:opacity-50"
    >
      {Icon ? <Icon size={17} color={colors.white} strokeWidth={2.3} /> : null}
      <Text className="text-center text-base font-bold text-hercules-white">
        {label}
      </Text>
    </Pressable>
  );
}
