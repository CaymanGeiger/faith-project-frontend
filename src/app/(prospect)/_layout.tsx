import { motionConfig } from '../../lib/motionConfig';
import { Redirect, Stack, usePathname } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import {
  getProspectHeaderTitle,
  prospectNavItems,
  prospectQuickLinks,
} from '../../components/layout/navigation';
import { useAuth } from '../../features/auth/AuthProvider';
import { accessibleLinks, canAccessProspectRoute, hasRestrictedAccess } from '../../features/onboarding/access';
import { DevelopmentTrainingToggle } from '../../features/onboarding/DevelopmentTrainingToggle';
import { canUseDevelopmentTraining } from '../../lib/development';

export default function ProspectLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <View className="flex-1 bg-hercules-white" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'PROSPECT') {
    return <Redirect href="/manager" />;
  }

  // Guard the entire authenticated stack, including deep links and retained screens.
  if (!canAccessProspectRoute(user, pathname)) {
    return <Redirect href="/prospect" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-hercules-red" edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}>
      <View className="flex-1 bg-hercules-white">
        <AppHeader
          title={getProspectHeaderTitle(pathname)}
          links={accessibleLinks(user, prospectQuickLinks)}
          messagesHref="/prospect/messages"
          menuHeader={canUseDevelopmentTraining(user) ? <DevelopmentTrainingToggle key={user.id} /> : undefined}
        />
        {hasRestrictedAccess(user) ? (
          <View className="border-b border-hercules-blue/15 bg-hercules-blue/5 px-5 py-2">
            <Text accessibilityLiveRegion="polite" className="text-sm text-hercules-ink">
              Initial training verification needed · Training, support and your profile are available.
            </Text>
          </View>
        ) : null}
        <View className="flex-1">
          <Stack
            screenOptions={{
              animation: motionConfig.native.tabNavigation,
              ...motionConfig.native.pageGestures,
              headerShown: false,
            }}
          >
            <Stack.Screen name="prospect/index" />
            <Stack.Screen name="prospect/already-a-dealer" />
            <Stack.Screen
              name="prospect/resources"
            />
            <Stack.Screen
              name="prospect/classes"
            />
            <Stack.Screen
              name="prospect/account"
            />
          </Stack>
        </View>
        <BottomNav items={accessibleLinks(user, prospectNavItems)} />
      </View>
    </SafeAreaView>
  );
}
