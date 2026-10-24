import { Pressable, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';
import { componentStyles } from '../../lib/theme/componentStyles';

const styles = componentStyles.listItem;

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
  presentation?: 'editorial' | 'compact';
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
  presentation = 'editorial',
  isLast = false,
  onPress,
}: ListItemProps) {
  const iconBg = styles.iconTone[iconTone];
  const iconColor = colors.white;
  const editorial = presentation === 'editorial';
  const containerClass = editorial
    ? `${styles.editorial.container} ${
        variant === 'card'
          ? styles.editorial.cardDivider
          : isLast
            ? ''
            : styles.rowDivider
      }`
    : variant === 'row'
      ? `${styles.compact.row} ${isLast ? '' : styles.rowDivider}`
      : styles.compact.card;

  const content = (
    <>
      {Icon ? (
        <View
          className={`${editorial ? styles.editorial.icon : styles.compact.icon} ${styles.iconContainer} ${iconBg}`}
        >
          <Icon size={editorial ? styles.editorial.iconSize : styles.compact.iconSize} color={iconColor} strokeWidth={styles.iconStrokeWidth} />
        </View>
      ) : null}
      <View className={styles.content}>
        <Text
          numberOfLines={titleNumberOfLines ?? 2}
          className={editorial ? styles.editorial.title : styles.compact.title}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={subtitleNumberOfLines ?? 2}
            className={styles.subtitle}
          >
            {subtitle}
          </Text>
        ) : null}
        {editorial && meta ? (
          <Text
            numberOfLines={metaNumberOfLines}
            className={styles.meta}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      {(!editorial && meta) || onPress ? (
        <View className={styles.trailing}>
          {!editorial && meta ? (
            <Text
              numberOfLines={metaNumberOfLines}
              className={styles.trailingMeta}
            >
              {meta}
            </Text>
          ) : null}
          {onPress ? (
            <View className={styles.chevronContainer}>
              <ChevronRight size={styles.chevronSize} color={colors.muted} strokeWidth={styles.iconStrokeWidth} />
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
        className={`${containerClass} ${styles.pressed}`}
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
