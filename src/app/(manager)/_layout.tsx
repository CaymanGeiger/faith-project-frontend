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
import { LoadingState } from '../../components/ui/StateViews';
import { useAuth } from '../../features/auth/AuthProvider';

export default function ManagerLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View className="flex-1 justify-center bg-hercules-white px-5">
        <LoadingState label="Opening Hercules internal" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'SALES_MANAGER') {
    return <Redirect href="/prospect" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-hercules-red" edges={['top']}>
      <View className="flex-1 bg-hercules-white">
        <AppHeader
          title={getManagerHeaderTitle(pathname)}
          links={managerQuickLinks}
          alertHref="/manager/messages"
        />
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        <BottomNav items={managerNavItems} />
      </View>
    </SafeAreaView>
  );
}
