import { nativeStyles } from '../../lib/theme/nativeStyles';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, FileText, RefreshCw, X } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';
import { contentHost, type ContentRequest } from './contentPolicy';
import { PdfDocument } from './PdfDocument';
import { WebContent } from './WebContent';
import type { WebContentHandle } from './WebContent.types';
import { openExternalUrl } from '../../lib/openExternalUrl';

export type ContentViewerHandle = { back: () => void };
type Props = { content: Required<ContentRequest>; onBack: () => void; onClose: () => void; onOpenLink: (url: string) => void };

export const ContentViewer = forwardRef<ContentViewerHandle, Props>(function ContentViewer({ content, onBack, onClose, onOpenLink }, ref) {
  const web = useRef<WebContentHandle>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [location, setLocation] = useState(content.url);
  const back = useCallback(() => {
    if (canGoBack && web.current) { setError(null); web.current.goBack(); }
    else onBack();
  }, [canGoBack, onBack]);
  useImperativeHandle(ref, () => ({ back }), [back]);

  useEffect(() => {
    if (!loading || error) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setError('This is taking longer than expected. Check your connection and try again.');
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading, error, revision]);

  const onReady = useCallback(() => { setReady(true); setLoading(false); setError(null); }, []);
  const onError = useCallback((message: string) => { setLoading(false); setError(message); }, []);
  function retry() {
    setError(null); setReady(false); setLoading(true); setProgress(0);
    // Retain page history and URL for a normal refresh; remount a failed PDF download.
    if (web.current) web.current.reload();
    else setRevision((n) => n + 1);
  }

  return <View style={styles.root} accessibilityViewIsModal>
    <View style={styles.header}>
      {/* NativeWind's inline-style merger does not preserve Pressable style callbacks. */}
      <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <ArrowLeft size={23} color={colors.blue} />
      </Pressable>
      <View style={styles.heading}>
        <Text accessibilityRole="header" accessibilityLabel={content.title} numberOfLines={1} ellipsizeMode="tail" style={styles.title}>{content.title}</Text>
        <Text numberOfLines={1} style={styles.host}>{contentHost(location)}</Text>
      </View>
      <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Close resource" onPress={onClose} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <X size={22} color={colors.blue} />
      </Pressable>
    </View>
    <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={loading ? 'Loading content' : 'Content loaded'} accessibilityValue={{ min: 0, max: 100, now: loading ? Math.round(progress * 100) : 100 }}>
      <View style={[styles.progress, { width: loading ? `${Math.max(8, Math.min(100, progress * 100))}%` : '0%' }]} />
    </View>
    <View style={styles.body}>
      <View style={styles.document} accessibilityElementsHidden={!!error} importantForAccessibility={error ? 'no-hide-descendants' : 'auto'}>
        {content.kind === 'pdf' ? <PdfDocument key={revision} url={content.url} onReady={onReady} onError={onError} onOpenLink={onOpenLink} /> :
          <WebContent ref={web} url={content.url} title={content.title} onLoading={setLoading} onProgress={setProgress} onReady={onReady} onError={onError} onHistoryChange={setCanGoBack} onLocationChange={setLocation} onOpenLink={onOpenLink} />}
      </View>
      {!ready && loading && !error ? <View style={styles.overlay}>
        <View style={styles.loadingCard}>
          {content.kind === 'pdf' ? <FileText color={colors.blue} size={32} /> : <ActivityIndicator color={colors.red} size="large" />}
          <Text style={styles.stateTitle}>{content.kind === 'pdf' ? 'Opening document' : 'Getting things ready'}</Text>
          <Text style={styles.stateText}>You’ll stay right here in the app.</Text>
        </View>
        <View style={styles.skeleton}><View style={styles.skeletonLine} /><View style={[styles.skeletonLine, { width: '72%' }]} /><View style={styles.skeletonBlock} /></View>
      </View> : null}
      {error ? <View style={styles.overlay}>
        <View style={styles.errorCard}>
          <Text accessibilityRole="header" style={styles.stateTitle}>Unable to load</Text>
          <Text accessibilityRole="alert" style={styles.stateText}>{error}</Text>
          <Pressable cssInterop={false} accessibilityRole="button" accessibilityLabel="Try loading content again" onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <RefreshCw color={colors.white} size={18} /><Text style={styles.retryText}>Try again</Text>
          </Pressable>
          <Pressable cssInterop={false} accessibilityRole="link" accessibilityLabel="Open content in browser" onPress={() => void openExternalUrl(location)} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <Text style={styles.retryText}>Open in browser</Text>
          </Pressable>
        </View>
      </View> : null}
    </View>
    {Platform.OS === 'web' ? <Pressable accessibilityRole="link" accessibilityLabel="Open content in browser" onPress={() => void openExternalUrl(location)}>
      <Text style={styles.webHint}>Page not displaying? Open in browser</Text>
    </Pressable> : null}
  </View>;
});

const styles = StyleSheet.create(nativeStyles.contentViewer);
