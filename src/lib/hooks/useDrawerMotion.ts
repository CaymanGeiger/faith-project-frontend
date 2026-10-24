import { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { cancelAnimation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { drawerMotion } from '../motion';

/** Own the drawer lifecycle, including interrupted closes and delayed unmount. */
export function useDrawerMotion(visible: boolean, onDismissed?: () => void) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const visibleRef = useRef(visible);
  const onDismissedRef = useRef(onDismissed);
  const revision = useRef(0);
  const progress = useSharedValue(0);
  const offset = useSharedValue<number>(drawerMotion.enterDistance);
  visibleRef.current = visible;
  onDismissedRef.current = onDismissed;

  const finishClosing = useCallback((closingRevision: number) => {
    if (visibleRef.current || revision.current !== closingRevision || !mountedRef.current) return;
    mountedRef.current = false;
    setMounted(false);
    onDismissedRef.current?.();
  }, []);

  useEffect(() => {
    const currentRevision = ++revision.current;
    let frame: number | undefined;
    cancelAnimation(progress);
    cancelAnimation(offset);
    if (visible) {
      const wasMounted = mountedRef.current;
      mountedRef.current = true;
      setMounted(true);
      if (!wasMounted) {
        progress.value = 0;
        offset.value = drawerMotion.enterDistance;
      }
      frame = requestAnimationFrame(() => {
        progress.value = withTiming(1, drawerMotion.enter);
        offset.value = withTiming(0, drawerMotion.enter);
      });
    } else if (mountedRef.current) {
      progress.value = withTiming(0, drawerMotion.exit);
      offset.value = withTiming(height * drawerMotion.exitViewportRatio, drawerMotion.exit, finished => {
        if (finished) runOnJS(finishClosing)(currentRevision);
      });
    }
    return () => {
      ++revision.current;
      if (frame !== undefined) cancelAnimationFrame(frame);
      cancelAnimation(progress);
      cancelAnimation(offset);
    };
  }, [visible, height, progress, offset, finishClosing]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, drawerMotion.opacityInput, drawerMotion.opacityOutput),
    transform: [{ translateY: offset.value }],
  }));
  return { mounted: visible || mounted, backdropStyle, sheetStyle };
}
