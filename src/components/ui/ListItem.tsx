import { Pressable, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type ListItemProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: LucideIcon;
  iconTone?: 'red' | 'blue';
  titleNumberOfLines?: number;
  subtitleNumberOfLines?: number;
  metaNumberOfLines?: 1 | 2;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'card' | 'row';
  isLast?: boolean;
  onPress?: () => void;
};

export function ListItem({
  title,
  subtitle,
  meta,
  icon: Icon,
  iconTone = 'red',
  titleNumberOfLines,
  subtitleNumberOfLines,
  metaNumberOfLines = 1,
  containerStyle,
  variant = 'card',
  isLast = false,
  onPress,
}: ListItemProps) {
  const iconBg = iconTone === 'blue' ? 'bg-hercules-blue' : 'bg-hercules-red';
  const iconColor = colors.white;
  const containerClass =
    variant === 'row'
      ? `min-h-[76px] flex-row items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-b border-hercules-blue/10'}`
      : 'min-h-[76px] flex-row items-center gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white px-4 py-3';

  const content = (
    <>
      {Icon ? (
        <View
          className={`h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${iconBg}`}
        >
          <Icon size={21} color={iconColor} strokeWidth={2.4} />
        </View>
      ) : null}
      <View className="min-w-0 flex-1 gap-1">
        <Text
          numberOfLines={titleNumberOfLines ?? 2}
          className="text-[16px] font-bold leading-5 text-hercules-ink"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={subtitleNumberOfLines ?? 2}
            className="text-sm leading-5 text-hercules-muted"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta || onPress ? (
        <View className="shrink-0 flex-row items-center justify-end gap-2">
          {meta ? (
            <Text
              numberOfLines={metaNumberOfLines}
              className="max-w-[88px] text-right text-xs font-semibold leading-4 text-hercules-muted"
            >
              {meta}
            </Text>
          ) : null}
          {onPress ? (
            <View className="h-6 w-4 items-center justify-center">
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        accessibilityRole="button"
        onPress={onPress}
        style={containerStyle}
        className={`${containerClass} active:opacity-70`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} className={containerClass}>
      {content}
    </View>
  );
}
