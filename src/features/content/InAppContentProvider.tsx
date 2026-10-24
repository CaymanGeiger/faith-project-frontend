import { colors, shades } from '../../lib/theme/theme';
import { motionConfig } from '../../lib/motionConfig';
import { useContentMotion } from '../../lib/hooks/useContentMotion';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Alert, Modal, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ContentViewer, type ContentViewerHandle } from './ContentViewer';
import { normalizeContent, type ContentRequest } from './contentPolicy';

type ContentContextValue = { openContent: (content: ContentRequest) => void; closeContent: () => void };
const Context = createContext<ContentContextValue | null>(null);
type ContentPage = Required<ContentRequest> & { key: number };
type Navigation = { pages: ContentPage[]; closing: 'all' | number | null };
const emptyNavigation: Navigation = { pages: [], closing: null };

export function InAppContentProvider({ children, sessionKey }: PropsWithChildren<{ sessionKey?: string | null }>) {
  const [navigation, setNavigation] = useState<Navigation>(emptyNavigation);
  const { pages, closing } = navigation;
  const nextKey = useRef(0);
  const activeViewer = useRef<ContentViewerHandle>(null);
  const closeContent = useCallback(() => {
    setNavigation(current => current.pages.length ? { ...current, closing: 'all' } : current);
  }, []);
  // Account changes must dispose form state immediately, even during an exit.
  useEffect(() => setNavigation(emptyNavigation), [sessionKey]);
  const dismiss = useCallback(() => {
    setNavigation(current => current.closing === 'all' ? emptyNavigation : current);
  }, []);
  const visible = pages.length > 0 && closing !== 'all';
  const { backdropStyle, surfaceStyle } = useContentMotion(visible, dismiss, pages.length > 0);

  const openContent = useCallback((request: ContentRequest, sourceKey?: number) => {
    const content = normalizeContent(request);
    if (!content) {
      Alert.alert('Unable to open link', 'This link is not a supported secure web page or document.');
      return;
    }
    const key = ++nextKey.current;
    setNavigation(current => {
      // Background or closing web pages can still emit popup/download events.
      if (sourceKey !== undefined && (current.closing !== null || current.pages.at(-1)?.key !== sourceKey)) return current;
      const retained = current.closing === 'all' ? [] : current.pages.filter(page => page.key !== current.closing);
      return { pages: [...retained, { ...content, key }], closing: null };
    });
  }, []);
  const back = useCallback(() => {
    setNavigation(current => {
      if (current.closing !== null || !current.pages.length) return current;
      return { ...current, closing: current.pages.length === 1 ? 'all' : current.pages.at(-1)!.key };
    });
  }, []);
  const dismissPage = useCallback((key: number) => {
    setNavigation(current => current.closing === key
      ? { pages: current.pages.filter(page => page.key !== key), closing: null }
      : current);
  }, []);
  const value = useMemo(() => ({ openContent, closeContent }), [openContent, closeContent]);
  const isAndroid = Platform.OS === 'android';

  return <Context.Provider value={value}>
    {children}
    {pages.length ? <Modal visible animationType={motionConfig.native.modalAnimation} transparent presentationStyle="overFullScreen"
      statusBarTranslucent={isAndroid ? true : undefined}
      navigationBarTranslucent={isAndroid ? true : undefined}
      onRequestClose={() => { if (closing === null) activeViewer.current?.back(); }}>
      {/* Native modals have their own view hierarchy and must measure their own safe area. */}
      <SafeAreaProvider style={styles.container}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
        <Animated.View style={[styles.surface, surfaceStyle]} pointerEvents={visible ? 'auto' : 'none'}
          accessibilityViewIsModal={visible} accessibilityElementsHidden={!visible}
          importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}>
          <SafeAreaView style={styles.surface}>
            <StatusBar style="dark" />
            <View style={styles.container}>
              {pages.map((content, index) => {
                const active = index === pages.length - 1 && closing === null;
                return <ContentLayer key={content.key} nested={index > 0} visible={closing !== content.key}
                  active={active} onDismissed={() => dismissPage(content.key)}>
                  <ContentViewer ref={index === pages.length - 1 ? activeViewer : undefined} content={content}
                    onBack={() => { if (active) back(); }} onClose={() => { if (active) closeContent(); }}
                    onOpenLink={(url) => openContent({ url, title: content.title }, content.key)} />
                </ContentLayer>;
              })}
            </View>
          </SafeAreaView>
        </Animated.View>
      </SafeAreaProvider>
    </Modal> : null}
  </Context.Provider>;
}

function ContentLayer({ children, nested, visible, active, onDismissed }: PropsWithChildren<{
  nested: boolean;
  visible: boolean;
  active: boolean;
  onDismissed: () => void;
}>) {
  const { surfaceStyle } = useContentMotion(nested && visible, onDismissed);
  return <Animated.View style={[StyleSheet.absoluteFill, styles.surface, nested ? surfaceStyle : undefined]}
    pointerEvents={active ? 'auto' : 'none'} accessibilityElementsHidden={!active}
    importantForAccessibility={active ? 'yes' : 'no-hide-descendants'}>
    {children}
  </Animated.View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  surface: { flex: 1, backgroundColor: colors.white },
  backdrop: { backgroundColor: shades.drawerBackdrop },
});

export function useInAppContent() {
  const value = useContext(Context);
  if (!value) throw new Error('In-app content requires InAppContentProvider.');
  return value;
}
