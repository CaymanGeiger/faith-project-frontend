import { PropsWithChildren } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nativeMeasurements } from '../../lib/theme/nativeStyles';
import { Keyboard, Platform, ScrollView, View } from 'react-native';
import { PageEntrance } from './PageEntrance';
import { QuickLink } from './QuickLinksMenu';
import { componentStyles } from '../../lib/theme/componentStyles';

const styles = componentStyles.screen;

type AppScreenProps = PropsWithChildren<{
  title: string;
  quickLinks: QuickLink[];
  scroll?: boolean;
  contentContainerClassName?: string;
}>;

export function AppScreen({
  scroll = true,
  contentContainerClassName = styles.content,
  children,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const nav = nativeMeasurements.bottomNav;
  const navClearance = nav.dockHeight + nav.topSpacing + Math.max(insets.bottom, nav.minimumBottomInset);
  return (
    <PageEntrance
      className={styles.root}
      style={scroll ? undefined : { paddingBottom: navClearance }}
    >
      {scroll ? (
        <ScrollView
          automaticallyAdjustKeyboardInsets
          className={styles.fill}
          contentContainerClassName={contentContainerClassName}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          {children}
          <View style={{ height: navClearance }} pointerEvents="none" />
        </ScrollView>
      ) : (
        <View className={`${styles.fill} ${contentContainerClassName}`}>
          {children}
        </View>
      )}
    </PageEntrance>
  );
}
