import { useCallback, useEffect, useRef } from 'react';
import { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { contentViewerMotion } from '../motion';

/** Keep the viewer alive until its exit finishes, including interrupted transitions. */
export function useContentMotion(visible: boolean, onDismissed: () => void, rendered = true) {
  const visibleRef = useRef(visible);
  const onDismissedRef = useRef(onDismissed);
  const revision = useRef(0);
  const presented = useRef(false);
  const progress = useSharedValue(0);
  visibleRef.current = visible;
  onDismissedRef.current = onDismissed;

  const finishClosing = useCallback((closingRevision: number) => {
    if (visibleRef.current || revision.current !== closingRevision || !presented.current) return;
    presented.current = false;
    onDismissedRef.current();
  }, []);

  useEffect(() => {
    const currentRevision = ++revision.current;
    let frame: number | undefined;
    cancelAnimation(progress);
    if (!rendered) {
      presented.current = false;
      progress.value = 0;
    } else if (visible) {
      if (!presented.current) {
        progress.value = 0;
      }
      presented.current = true;
      frame = requestAnimationFrame(() => {
        progress.value = withTiming(1, contentViewerMotion.enter);
      });
    } else if (presented.current) {
      progress.value = withTiming(0, contentViewerMotion.exit, finished => {
        if (finished) runOnJS(finishClosing)(currentRevision);
      });
    } else {
      // An open and close can be batched before the first frame is presented.
      onDismissedRef.current();
    }
    return () => {
      ++revision.current;
      if (frame !== undefined) cancelAnimationFrame(frame);
      cancelAnimation(progress);
    };
  }, [visible, rendered, progress, finishClosing]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const surfaceStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  return { backdropStyle, surfaceStyle };
}
