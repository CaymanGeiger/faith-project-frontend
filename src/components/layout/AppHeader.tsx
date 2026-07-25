import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Bell } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppLogo } from '../ui/AppLogo';
import { IconButton } from '../ui/IconButton';
import { colors } from '../../lib/theme/theme';
import { AnimatedMenuButton } from './AnimatedMenuButton';
import { NotificationsMenu } from './NotificationsMenu';
import { QuickLink, QuickLinksMenu } from './QuickLinksMenu';

type AppHeaderProps = {
  title: string;
  links: QuickLink[];
  messagesHref: '/prospect/messages' | '/manager/messages';
};

export function AppHeader({ title, links, messagesHref }: AppHeaderProps) {
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const pathname = usePathname();
  const showingHomeLogo = title === 'LG Dealer Portal';

  const openLink = (href: string) => {
    setQuickLinksOpen(false);
    setNotificationsOpen(false);
    router.push(href);
  };

  const toggleNotifications = () => {
    setQuickLinksOpen(false);
    setNotificationsOpen((value) => !value);
  };

  const measureHeader = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  useEffect(() => {
    setQuickLinksOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  return (
    <View
      className="z-30 bg-hercules-red px-5 pb-3 pt-2"
      onLayout={measureHeader}
    >
      <View className="flex-row items-center justify-between">
        <AnimatedMenuButton
          open={quickLinksOpen}
          onPress={() => {
            setNotificationsOpen(false);
            setQuickLinksOpen((value) => !value);
          }}
        />
        <View className="flex-1 items-center justify-center" style={styles.centerSlot}>
          <View
            pointerEvents="none"
            style={[styles.centerContent, { opacity: showingHomeLogo ? 1 : 0 }]}
          >
            <View style={styles.logoMarkBacking}>
              <AppLogo size="header" />
            </View>
          </View>
          {!showingHomeLogo ? (
            <Animated.View
              key={title}
              entering={FadeIn.duration(150)}
              style={styles.centerContent}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-center text-xl font-extrabold text-hercules-white"
              >
                {title}
              </Text>
            </Animated.View>
          ) : null}
        </View>
        <IconButton
          icon={Bell}
          label="Notifications"
          onPress={toggleNotifications}
          tone="red"
        />
      </View>
      <QuickLinksMenu
        links={links}
        open={quickLinksOpen}
        topOffset={headerHeight}
        onSelect={openLink}
      />
      <NotificationsMenu
        open={notificationsOpen}
        topOffset={headerHeight}
        messagesHref={messagesHref}
        onClose={() => setNotificationsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    height: 44,
  },
  centerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkBacking: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.white,
  },
});
