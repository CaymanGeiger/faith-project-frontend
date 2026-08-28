import { PropsWithChildren } from 'react';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { pageEnterMotion } from '../../lib/motion';
import { QuickLink } from './QuickLinksMenu';

type AppScreenProps = PropsWithChildren<{
  title: string;
  quickLinks: QuickLink[];
  scroll?: boolean;
  contentContainerClassName?: string;
}>;

export function AppScreen({
  scroll = true,
  contentContainerClassName = 'gap-6 px-5 pb-8 pt-6',
  children,
}: AppScreenProps) {
  const backgroundClass = 'bg-hercules-white';

  return (
    <Animated.View
      entering={pageEnterMotion}
      className={`flex-1 ${backgroundClass}`}
    >
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={contentContainerClassName}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${contentContainerClassName}`}>
          {children}
        </View>
      )}
    </Animated.View>
  );
}
