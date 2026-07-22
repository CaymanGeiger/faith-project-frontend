import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon: Icon,
}: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className="min-h-14 flex-row items-center justify-center gap-2 rounded-pill bg-hercules-red px-5 active:opacity-80 disabled:opacity-50"
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={colors.white} strokeWidth={2.4} /> : null}
          <Text className="text-center text-base font-bold text-hercules-white">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
