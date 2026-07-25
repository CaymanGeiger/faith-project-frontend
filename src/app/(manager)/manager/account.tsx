import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { AccountForm } from '../../../features/account/AccountForm';
import { useAuth } from '../../../features/auth/AuthProvider';
import { accountApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ManagerAccountScreen() {
  const { logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <AppScreen
      title="Account"
      quickLinks={managerQuickLinks}
    >
      {account.loading ? <LoadingState label="Loading account" /> : null}
      {account.error ? (
        <ErrorState message={account.error} onRetry={account.reload} />
      ) : null}
      {account.data ? (
        <AnimatedCard>
          <AccountForm
            user={account.data.user}
            onSaved={async () => {
              await Promise.all([account.reload(), refreshMe()]);
            }}
          />
        </AnimatedCard>
      ) : null}
      <AnimatedCard index={1}>
        <SecondaryButton label="Sign Out" icon={LogOut} onPress={signOut} />
      </AnimatedCard>
    </AppScreen>
  );
}
