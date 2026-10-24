import { Pressable, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';
import { componentStyles } from '../../lib/theme/componentStyles';

const styles = componentStyles.button.secondary;

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
      className={styles.container}
    >
      {Icon ? <Icon size={styles.iconSize} color={colors.white} strokeWidth={styles.iconStrokeWidth} /> : null}
      <Text className={componentStyles.button.label}>
        {label}
      </Text>
    </Pressable>
  );
}
