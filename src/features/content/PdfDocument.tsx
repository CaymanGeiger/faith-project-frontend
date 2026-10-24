import { nativeStyles } from '../../lib/theme/nativeStyles';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, Platform, Pressable, StyleSheet, Text, TurboModuleRegistry, UIManager, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { PdfProps, PdfRef } from 'react-native-pdf';
import { colors } from '../../lib/theme/theme';
import { isAllowedContentUrl } from './contentPolicy';
import { downloadPdfFile } from './pdfDownload';

export type PdfDocumentProps = {
  url: string;
  onReady: () => void;
  onError: (message: string) => void;
  onOpenLink?: (url: string) => void;
};

const unavailableMessage = 'Document viewing needs an updated app build. Please update the app and try again.';

// Loading these modules at app startup would crash Expo Go or an older installed build.
function loadNativeViewer() {
  const blobModule = TurboModuleRegistry.get('ReactNativeBlobUtil') ?? NativeModules.ReactNativeBlobUtil;
  if (!blobModule || !UIManager.hasViewManagerConfig('RNPDFPdfView')) throw new Error(unavailableMessage);
  return {
    Pdf: require('react-native-pdf').default as React.ComponentType<PdfProps & React.RefAttributes<PdfRef>>,
    files: require('react-native-blob-util').default as typeof import('react-native-blob-util').default,
  };
}

export function PdfDocument({ url, onReady, onError, onOpenLink }: PdfDocumentProps) {
  const callbacks = useRef({ onReady, onError, onOpenLink });
  callbacks.current = { onReady, onError, onOpenLink };
  const pdfRef = useRef<PdfRef>(null);
  const ready = useRef(false);
  const [document, setDocument] = useState<{ Pdf: ReturnType<typeof loadNativeViewer>['Pdf']; path: string } | null>(null);
  const [FallbackViewer, setFallbackViewer] = useState<typeof import('react-native-webview').WebView | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let active = true;
    let cleanup = () => {};
    ready.current = false;
    setDocument(null);
    setFallbackViewer(null);
    setPage(1);
    setPageCount(0);
    if (!isAllowedContentUrl(url)) {
      callbacks.current.onError('This document link is not supported.');
      return;
    }
    try {
      const { Pdf, files } = loadNativeViewer();
      const path = `${files.fs.dirs.CacheDir}/hercules-document-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
      const download = downloadPdfFile(files, url, path);
      download.promise.then(() => {
        if (active) setDocument({ Pdf, path });
        else void files.fs.unlink(path).catch(() => {});
      }).catch(() => {
        if (active) callbacks.current.onError('The document could not be opened. Please try again.');
      });
      cleanup = () => {
        void download.cancel().then(() => files.fs.unlink(path)).catch(() => {});
      };
    } catch {
      // WKWebView can display PDFs in iOS builds that lack the dedicated PDF module.
      if (Platform.OS === 'ios') {
        try {
          const WebView = require('react-native-webview').WebView as typeof import('react-native-webview').WebView;
          setFallbackViewer(() => WebView);
        } catch { callbacks.current.onError(unavailableMessage); }
      } else callbacks.current.onError(unavailableMessage);
    }
    return () => { active = false; cleanup(); };
  }, [url]);

  const source = useMemo(() => ({ uri: document ? `file://${document.path}` : '', cache: false }), [document]);
  if (FallbackViewer) return <FallbackViewer
    source={{ uri: url }}
    style={styles.document}
    originWhitelist={['*']}
    onShouldStartLoadWithRequest={(request) => isAllowedContentUrl(request.url)}
    onLoad={() => callbacks.current.onReady()}
    onError={() => callbacks.current.onError('The document could not be displayed. Please try again.')}
    onHttpError={() => callbacks.current.onError('The document is temporarily unavailable. Please try again.')}
    onContentProcessDidTerminate={() => callbacks.current.onError('The document closed unexpectedly. Please try again.')}
    onOpenWindow={({ nativeEvent }) => callbacks.current.onOpenLink?.(nativeEvent.targetUrl)}
    sharedCookiesEnabled={false}
    thirdPartyCookiesEnabled={false}
    allowFileAccess={false}
    allowFileAccessFromFileURLs={false}
    allowUniversalAccessFromFileURLs={false}
    javaScriptEnabled={false}
    contentInsetAdjustmentBehavior="never"
  />;
  if (!document) return <View style={styles.container} />;
  const { Pdf } = document;
  return (
    <View style={styles.container}>
      <Pdf
        ref={pdfRef}
        source={source}
        style={styles.document}
        trustAllCerts={false}
        fitPolicy={0}
        minScale={1}
        maxScale={4}
        enableDoubleTapZoom
        enableTextSelection
        enableAnnotationRendering
        renderActivityIndicator={() => <View />}
        onLoadComplete={(count) => {
          setPageCount(count);
          if (!ready.current) { ready.current = true; callbacks.current.onReady(); }
        }}
        onPageChanged={(current, count) => { setPage(current); setPageCount(count); }}
        onError={() => callbacks.current.onError('The document could not be displayed. Please try again.')}
        onPressLink={(link) => callbacks.current.onOpenLink?.(link)}
      />
      {pageCount > 0 ? (
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous PDF page" accessibilityState={{ disabled: page <= 1 }} disabled={page <= 1} onPress={() => pdfRef.current?.setPage(page - 1)} style={[styles.pageButton, page <= 1 && styles.disabled]}>
            <ChevronLeft size={22} color={colors.blue} />
          </Pressable>
          <View style={styles.pageDetails}>
            <Text accessibilityLiveRegion="polite" style={styles.pageLabel}>Page {page} of {pageCount}</Text>
            <Text style={styles.hint}>Pinch or double-tap to zoom</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Next PDF page" accessibilityState={{ disabled: page >= pageCount }} disabled={page >= pageCount} onPress={() => pdfRef.current?.setPage(page + 1)} style={[styles.pageButton, page >= pageCount && styles.disabled]}>
            <ChevronRight size={22} color={colors.blue} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(nativeStyles.pdfDocument);
