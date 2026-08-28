import { Redirect, Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import {
  getProspectHeaderTitle,
  prospectNavItems,
  prospectQuickLinks,
} from '../../components/layout/navigation';
import { useAuth } from '../../features/auth/AuthProvider';

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

  return (
    <SafeAreaView className="flex-1 bg-hercules-red" edges={['top']}>
      <View className="flex-1 bg-hercules-white">
        <AppHeader
          title={getProspectHeaderTitle(pathname)}
          links={prospectQuickLinks}
          messagesHref="/prospect/messages"
        />
        <View className="flex-1">
          <Stack
            screenOptions={{
              animation: 'none',
              gestureEnabled: true,
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
        <BottomNav items={prospectNavItems} />
      </View>
    </SafeAreaView>
  );
}
