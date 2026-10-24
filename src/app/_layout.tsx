import { motionConfig } from '../lib/motionConfig';
import { PushNotificationsProvider } from '../features/notifications/PushNotificationsProvider';
import '../global.css';
import 'react-native-gesture-handler';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandLaunchScreen,
  brandLaunchExitDuration,
} from '../components/ui/BrandLaunchScreen';
import {
  BrandAssetsProvider,
  usePreparedBrandAssets,
} from '../features/brand/BrandAssetsProvider';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { useReducedMotion } from 'react-native-reanimated';
import { InAppContentProvider } from '../features/content/InAppContentProvider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash may already be hidden during a fast refresh in Expo Go.
});


export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-hercules-white px-6">
      <View className="w-full max-w-[420px] gap-3 rounded-[20px] border border-hercules-blue/15 bg-hercules-white p-6">
        <Text className="text-xs font-extrabold uppercase tracking-[1px] text-hercules-red">
          Hercules Honors Rewards
        </Text>
        <Text className="text-2xl font-extrabold text-hercules-ink">
          Something did not load correctly
        </Text>
        <Text className="text-[15px] leading-6 text-hercules-muted">
          Please try again. If this continues, contact Hercules support at{' '}
          1-800-356-5350.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try loading the app again"
          onPress={() => void retry()}
          className="min-h-12 items-center justify-center rounded-[14px] bg-hercules-blue px-5 active:opacity-85"
        >
          <Text className="text-base font-extrabold text-hercules-white">
            Try Again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AppNavigator() {
  const { loading, restoreError, restoring, retrySession } = useAuth();
  const reduceMotion = useReducedMotion();
  const launchStartedAt = useRef(Date.now());
  const [launchState, setLaunchState] = useState<
    'showing' | 'leaving' | 'hidden'
  >('showing');

  useEffect(() => {
    if (loading || launchState !== 'showing') {
      return;
    }

    const elapsed = Date.now() - launchStartedAt.current;
    const remaining = Math.max(0, motionConfig.launch.minimumDuration - elapsed);
    const timer = setTimeout(() => {
      setLaunchState('leaving');
    }, remaining);

    return () => clearTimeout(timer);
  }, [launchState, loading]);

  useEffect(() => {
    if (launchState !== 'leaving') {
      return;
    }

    const timer = setTimeout(() => {
      setLaunchState('hidden');
    }, reduceMotion ? motionConfig.feedback.launch.reducedDuration : brandLaunchExitDuration);

    return () => clearTimeout(timer);
  }, [launchState, reduceMotion]);

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: motionConfig.native.rootNavigation }} />
      {restoreError ? (
        <SafeAreaView accessibilityViewIsModal importantForAccessibility="yes" className="absolute inset-0 items-center justify-center bg-hercules-white px-6">
          <StatusBar style="dark" />
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-hercules-ink">
            Unable to connect
          </Text>
          <Text accessibilityRole="alert" className="my-4 text-center text-base text-hercules-muted">
            {restoreError}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: restoring, busy: restoring }}
            disabled={restoring}
            onPress={() => void retrySession()}
            className="min-h-12 justify-center rounded-[14px] bg-hercules-blue px-6"
          >
            <Text className="font-bold text-hercules-white">{restoring ? 'Connecting…' : 'Try again'}</Text>
          </Pressable>
        </SafeAreaView>
      ) : null}
      {launchState !== 'hidden' ? (
        <BrandLaunchScreen leaving={launchState === 'leaving'} />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const preparedBrandAssets = usePreparedBrandAssets();

  useEffect(() => {
    if (!preparedBrandAssets) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => {
      // The splash may already be hidden during a fast refresh in Expo Go.
    });
  }, [preparedBrandAssets]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AuthProvider>
          {preparedBrandAssets ? (
            <BrandAssetsProvider assets={preparedBrandAssets}>
              <PushNotificationsProvider><ContentNavigation /></PushNotificationsProvider>
            </BrandAssetsProvider>
          ) : null}
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ContentNavigation() {
  const { user } = useAuth();
  return <InAppContentProvider sessionKey={user ? `${user.id}:${user.onboarding?.state ?? 'unknown'}` : null}><AppNavigator /></InAppContentProvider>;
}
