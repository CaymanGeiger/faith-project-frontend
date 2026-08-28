import { Redirect, Stack, usePathname } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import {
  getManagerHeaderTitle,
  managerNavItems,
  managerQuickLinks,
} from '../../components/layout/navigation';
import { useAuth } from '../../features/auth/AuthProvider';
import { ManagerDataProvider } from '../../features/manager/ManagerDataProvider';

export default function ManagerLayout() {
  const { user, token, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <View className="flex-1 bg-hercules-white" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'SALES_MANAGER') {
    return <Redirect href="/prospect" />;
  }

  return (
    <ManagerDataProvider key={user.id} userId={user.id} token={token}>
      <SafeAreaView className="flex-1 bg-hercules-red" edges={['top']}>
        <View className="flex-1 bg-hercules-white">
          <AppHeader
            title={getManagerHeaderTitle(pathname)}
            links={managerQuickLinks}
            messagesHref="/manager/messages"
          />
          <View className="flex-1">
            <Stack
              screenOptions={{
                animation: 'none',
                gestureEnabled: true,
                headerShown: false,
              }}
            >
              <Stack.Screen name="manager/index" />
              <Stack.Screen
                name="manager/prospects"
              />
              <Stack.Screen
                name="manager/messages"
              />
              <Stack.Screen
                name="manager/account"
              />
            </Stack>
          </View>
          <BottomNav items={managerNavItems} />
        </View>
      </SafeAreaView>
    </ManagerDataProvider>
  );
}
