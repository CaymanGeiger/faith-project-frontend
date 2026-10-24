import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { pageEnterMotion } from '../../lib/motion';

type PageEntranceProps = PropsWithChildren<{
  className?: string;
  style?: StyleProp<ViewStyle>;
}>;

// Keep every page on the same entrance used by Home and Support.
// Ordinary data updates retain the view and do not restart the animation.
export function PageEntrance({ children, className, style }: PageEntranceProps) {
  return (
    <Animated.View
      collapsable={false}
      entering={pageEnterMotion}
      className={className}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
