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
import { LoadingState } from '../../components/ui/StateViews';
import { useAuth } from '../../features/auth/AuthProvider';

export default function ProspectLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const gettingStartedOpen = pathname === '/prospect/getting-started';

  if (loading) {
    return (
      <View className="flex-1 justify-center bg-hercules-white px-5">
        <LoadingState label="Opening prospect portal" />
      </View>
    );
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
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        {gettingStartedOpen ? null : <BottomNav items={prospectNavItems} />}
      </View>
    </SafeAreaView>
  );
}
