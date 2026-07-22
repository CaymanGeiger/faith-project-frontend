import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type ListItemProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: LucideIcon;
  iconTone?: 'red' | 'blue';
  titleNumberOfLines?: number;
  subtitleNumberOfLines?: number;
  containerStyle?: StyleProp<ViewStyle>;
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
  containerStyle,
  onPress,
}: ListItemProps) {
  const iconBg = iconTone === 'blue' ? 'bg-hercules-blue' : 'bg-hercules-red';
  const iconColor = colors.white;

  const content = (
    <>
      {Icon ? (
        <View
          className={`h-11 w-11 items-center justify-center rounded-full ${iconBg}`}
        >
          <Icon size={21} color={iconColor} strokeWidth={2.4} />
        </View>
      ) : null}
      <View className="flex-1 gap-1">
        <Text
          numberOfLines={titleNumberOfLines ?? 2}
          className="text-base font-extrabold leading-5 text-hercules-ink"
        >
          {title}
        </Text>
        {subtitle || meta ? (
          <View className="flex-row items-start gap-2">
            {subtitle ? (
              <Text
                numberOfLines={subtitleNumberOfLines ?? 2}
                className="flex-1 text-sm leading-[19px] text-hercules-muted"
              >
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                className="w-[72px] shrink-0 text-right text-[10px] font-extrabold uppercase leading-4 text-hercules-blue"
              >
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {onPress ? <ChevronRight size={20} color={colors.ink} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={containerStyle}
        className="min-h-[88px] flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white px-4 py-3 active:opacity-80"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={containerStyle}
      className="min-h-[88px] flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white px-4 py-3"
    >
      {content}
    </View>
  );
}
