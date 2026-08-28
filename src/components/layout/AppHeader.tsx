import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import { motionDuration } from '../../lib/motion';
import { AnimatedMenuButton } from './AnimatedMenuButton';
import { AnimatedNotificationButton } from './AnimatedNotificationButton';
import { NotificationsMenu } from './NotificationsMenu';
import { QuickLinksMenu } from './QuickLinksMenu';
import type { QuickLink } from './QuickLinksMenu';

type AppHeaderProps = {
  title: string;
  links: QuickLink[];
  messagesHref: '/prospect/messages' | '/manager/messages';
};

const overlayExitDuration = 220;

export function AppHeader({ title, links, messagesHref }: AppHeaderProps) {
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const overlayOpen = quickLinksOpen || notificationsOpen;
  const shouldRenderOverlay = overlayOpen || overlayMounted;

  const closeOverlays = useCallback(() => {
    setQuickLinksOpen(false);
    setNotificationsOpen(false);
  }, []);

  const openLink = (href: string) => {
    closeOverlays();
    router.push(href);
  };

  const toggleNotifications = () => {
    setQuickLinksOpen(false);
    setNotificationsOpen((value) => !value);
  };

  const handleNotificationsLoading = useCallback((loading: boolean) => {
    setNotificationsLoading(loading);
  }, []);

  const measureHeader = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  useEffect(() => {
    closeOverlays();
  }, [closeOverlays, pathname]);

  useEffect(() => {
    if (overlayOpen) {
      setOverlayMounted(true);
      return;
    }

    if (!overlayMounted) {
      return;
    }

    const timer = setTimeout(() => {
      setOverlayMounted(false);
    }, overlayExitDuration);

    return () => clearTimeout(timer);
  }, [overlayMounted, overlayOpen]);

  return (
    <View
      className="z-30 bg-hercules-red px-3 py-3"
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
        <View
          className="flex-1 items-center justify-center"
          style={styles.centerSlot}
        >
          <Animated.View
            key={title}
            collapsable={false}
            entering={FadeIn.duration(motionDuration.subtleEnter).reduceMotion(
              ReduceMotion.System,
            )}
            exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.System)}
            className="absolute inset-0 items-center justify-center"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              className="text-center text-lg font-bold text-hercules-white"
            >
              {title}
            </Text>
          </Animated.View>
        </View>
        <AnimatedNotificationButton
          onPress={toggleNotifications}
          open={notificationsOpen}
          loading={notificationsLoading}
        />
      </View>
      <Modal
        animationType="none"
        navigationBarTranslucent
        onRequestClose={closeOverlays}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={shouldRenderOverlay}
      >
        <View style={styles.overlayRoot}>
          {overlayOpen ? (
            <Animated.View
              entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)}
              exiting={FadeOut.duration(overlayExitDuration).reduceMotion(
                ReduceMotion.System,
              )}
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.overlayScrim]}
            />
          ) : null}
          <Pressable
            accessible={false}
            onPress={closeOverlays}
            pointerEvents={overlayOpen ? 'auto' : 'none'}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <QuickLinksMenu
              links={links}
              open={quickLinksOpen}
              topOffset={insets.top + headerHeight}
              onSelect={openLink}
            />
            <NotificationsMenu
              open={notificationsOpen}
              topOffset={insets.top + headerHeight}
              messagesHref={messagesHref}
              onLoadingChange={handleNotificationsLoading}
              onClose={closeOverlays}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    height: 44,
  },
  overlayRoot: {
    flex: 1,
  },
  overlayScrim: {
    backgroundColor: 'rgba(10, 45, 127, 0.12)',
  },
});
