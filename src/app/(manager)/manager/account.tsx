import { NotificationSettings } from '../../../features/notifications/NotificationSettings';
import { AvailabilitySettings } from '../../../features/availability/AvailabilitySettings';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState } from '../../../components/ui/StateViews';
import { AccountForm } from '../../../features/account/AccountForm';
import { AccountSkeleton, AccountSignOut } from '../../../features/account/AccountScreenParts';
import { AccountComplianceActions } from '../../../features/account/AccountComplianceActions';
import { useAuth } from '../../../features/auth/AuthProvider';
import { accountApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ManagerAccountScreen() {
  const { user, logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);
  const accountUser = account.data?.user ?? user;

  const signOut = async () => {
    await logout();
  };

  return (
    <AppScreen
      title="Account"
      quickLinks={managerQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-6 pt-4"
    >
      <PageHero
        title="Your Account"
        subtitle="Keep your contact details current."
      />
      {account.error && !accountUser ? (
        <>
          <ErrorState message={account.error} onRetry={account.reload} />
          <AccountSignOut onPress={() => void signOut()} />
        </>
      ) : (
        <AsyncContent
          ready={Boolean(accountUser)}
          fallback={<AccountSkeleton />}
          className="gap-3"
        >
          {accountUser ? (
            <>
              <AnimatedCard index={1}>
                <AccountForm
                  user={accountUser}
                  onSaved={async () => {
                    await Promise.all([account.reload(), refreshMe()]);
                  }}
                />
              </AnimatedCard>
              <AnimatedCard index={2}>
                <NotificationSettings />
              </AnimatedCard>
              <AnimatedCard index={3}>
                <AvailabilitySettings />
              </AnimatedCard>
              <AnimatedCard index={4}>
                <AccountComplianceActions
                  user={accountUser}
                  onDeleted={signOut}
                />
              </AnimatedCard>
              <AccountSignOut
                index={5}
                onPress={() => void signOut()}
              />
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}
