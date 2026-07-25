import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { AccountForm } from '../../../features/account/AccountForm';
import { useAuth } from '../../../features/auth/AuthProvider';
import { accountApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectAccountScreen() {
  const { logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <AppScreen
      title="Profile"
      quickLinks={prospectQuickLinks}
    >
      {account.loading ? <LoadingState label="Loading account" /> : null}
      {account.error ? (
        <ErrorState message={account.error} onRetry={account.reload} />
      ) : null}
      {account.data ? (
        <AnimatedCard>
          <AccountForm
            user={account.data.user}
            companyName={account.data.user.prospectProfile?.companyName}
            onSaved={async () => {
              await Promise.all([account.reload(), refreshMe()]);
            }}
          />
        </AnimatedCard>
      ) : null}
      <AnimatedCard index={1} className="items-center py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() => void signOut()}
          className="py-2 active:opacity-70"
        >
          <Text className="text-sm font-extrabold text-hercules-red">
            Sign Out
          </Text>
        </Pressable>
      </AnimatedCard>
    </AppScreen>
  );
}
