import { colors } from '../../lib/theme/theme';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { NativeModules, TurboModuleRegistry, View } from 'react-native';
import type { WebView as NativeWebView } from 'react-native-webview';
import { isAllowedContentUrl, isAppleAppStoreUrl, isPdfUrl } from './contentPolicy';
import type { WebContentHandle, WebContentProps } from './WebContent.types';
import { webPageReadabilityScript } from './webPageReadability';

export const WebContent = forwardRef<WebContentHandle, WebContentProps>(function WebContent(props, ref) {
  const web = useRef<NativeWebView<unknown>>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  const [WebView] = useState(() => {
    // Older installed binaries do not contain this native module. Keep the app usable
    // until a rebuilt binary is installed instead of failing during root imports.
    try {
      if (!(TurboModuleRegistry.get('RNCWebViewModule') ?? NativeModules.RNCWebViewModule)) return null;
      // WebView's default extra-props generic is undefined, which collapses its
      // props intersection to never when the component is loaded dynamically.
      return require('react-native-webview').WebView as typeof NativeWebView<unknown>;
    } catch { return null; }
  });
  const failed = useRef(false);
  const currentUrl = useRef(props.url);
  const terminated = useRef(false);
  const [instance, setInstance] = useState({ key: 0, url: props.url });
  useImperativeHandle(ref, () => ({
    goBack: () => web.current?.goBack(),
    reload: () => {
      if (!WebView) {
        callbacks.current.onLoading(false);
        callbacks.current.onError('In-app pages need an updated app build. Please update the app and try again.');
        return;
      }
      if (terminated.current) {
        terminated.current = false;
        setInstance((current) => ({ key: current.key + 1, url: currentUrl.current }));
      } else web.current?.reload();
    },
  }), []);
  useEffect(() => {
    if (!WebView) {
      callbacks.current.onLoading(false);
      callbacks.current.onError('In-app pages need an updated app build. Please update the app and try again.');
    }
  }, [WebView]);

  function fail(message: string) {
    failed.current = true;
    props.onLoading(false);
    props.onError(message);
  }

  function openLink(url: string) {
    if (isAllowedContentUrl(url)) props.onOpenLink(url);
    else fail('This link cannot be opened here. Use Back to return to the previous page.');
  }

  if (!WebView) return <View style={{ flex: 1 }} />;
  return <WebView
    key={instance.key}
    ref={web}
    source={{ uri: instance.url }}
    style={{ flex: 1, backgroundColor: colors.white }}
    // Apple's mobile listing redirects into an OS-only store scheme. Request
    // its web preview so linked app information can stay inside this viewer.
    contentMode={isAppleAppStoreUrl(instance.url) ? 'desktop' : 'mobile'}
    injectedJavaScriptBeforeContentLoaded={webPageReadabilityScript}
    injectedJavaScriptBeforeContentLoadedForMainFrameOnly
    setBuiltInZoomControls
    setDisplayZoomControls={false}
    // Catch all schemes ourselves; the WebView must never auto-launch another app.
    originWhitelist={['*']}
    onShouldStartLoadWithRequest={(request) => {
      if (!isAllowedContentUrl(request.url)) {
        if (request.isTopFrame !== false) props.onOpenLink(request.url);
        return false;
      }
      // Content mode is fixed when WKWebView is created. A same-frame store
      // link needs its own viewer just like a target=_blank link does.
      if (request.isTopFrame !== false && isAppleAppStoreUrl(request.url) && !isAppleAppStoreUrl(instance.url)) {
        props.onOpenLink(request.url);
        return false;
      }
      if (request.isTopFrame !== false && isPdfUrl(request.url)) {
        props.onOpenLink(request.url);
        return false;
      }
      return true;
    }}
    onOpenWindow={({ nativeEvent }) => openLink(nativeEvent.targetUrl)}
    setSupportMultipleWindows
    javaScriptCanOpenWindowsAutomatically={false}
    onFileDownload={({ nativeEvent }) => {
      if (isPdfUrl(nativeEvent.downloadUrl)) openLink(nativeEvent.downloadUrl);
      else fail('This download is not a viewable document. Use Back to return to the page.');
    }}
    onLoadStart={({ nativeEvent }) => {
      failed.current = false;
      if (isAllowedContentUrl(nativeEvent.url)) {
        currentUrl.current = nativeEvent.url;
        props.onLocationChange(nativeEvent.url);
      }
      props.onLoading(true);
    }}
    onLoadProgress={({ nativeEvent }) => props.onProgress(nativeEvent.progress)}
    onLoad={() => {
      if (!failed.current) {
        // Android's document-start injection is best-effort. Reapply after load
        // without enabling a page-to-app messaging bridge.
        web.current?.injectJavaScript(webPageReadabilityScript);
        props.onReady();
      }
    }}
    onLoadEnd={() => props.onLoading(false)}
    onNavigationStateChange={(state) => {
      props.onHistoryChange(state.canGoBack);
      if (isAllowedContentUrl(state.url)) {
        currentUrl.current = state.url;
        props.onLocationChange(state.url);
      }
    }}
    onError={() => fail('The page could not load. Check your connection and try again.')}
    onHttpError={({ nativeEvent }) => {
      // Android also reports errors for images and other subresources.
      if (nativeEvent.url === props.url || nativeEvent.url === currentUrl.current) {
        fail('This page is temporarily unavailable. Please try again.');
      }
    }}
    onContentProcessDidTerminate={() => { terminated.current = true; props.onHistoryChange(false); fail('The page closed unexpectedly. Tap Try again to reopen it.'); }}
    onRenderProcessGone={() => { terminated.current = true; props.onHistoryChange(false); fail('The page closed unexpectedly. Tap Try again to reopen it.'); }}
    allowsBackForwardNavigationGestures
    sharedCookiesEnabled={false}
    thirdPartyCookiesEnabled={false}
    mixedContentMode="never"
    allowFileAccess={false}
    allowFileAccessFromFileURLs={false}
    allowUniversalAccessFromFileURLs={false}
    geolocationEnabled={false}
    mediaPlaybackRequiresUserAction
    contentInsetAdjustmentBehavior="never"
  />;
});
