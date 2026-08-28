import '../global.css';
import 'react-native-gesture-handler';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

void SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash may already be hidden during a fast refresh in Expo Go.
});

const minimumLaunchDuration = 1050;

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
  const { loading } = useAuth();
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
    const remaining = Math.max(0, minimumLaunchDuration - elapsed);
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
    }, reduceMotion ? 1 : brandLaunchExitDuration);

    return () => clearTimeout(timer);
  }, [launchState, reduceMotion]);

  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
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
              <AppNavigator />
            </BrandAssetsProvider>
          ) : null}
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
