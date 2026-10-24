import { NotificationSettings } from '../../../features/notifications/NotificationSettings';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
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

export default function ProspectAccountScreen() {
  const { user, logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);

  const signOut = async () => {
    await logout();
  };

  return (
    <AppScreen
      title="Profile"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-6 pt-4"
    >
      <PageHero
        title="Your Profile"
        subtitle="Keep your business profile current."
      />
      {account.error && !account.data ? (
        <>
          <ErrorState message={account.error} onRetry={account.reload} />
          <AccountSignOut onPress={() => void signOut()} />
        </>
      ) : (
        <AsyncContent
          ready={Boolean(account.data)}
          fallback={<AccountSkeleton includeCompany />}
          className="gap-3"
        >
          {account.data ? (
            <>
              <AnimatedCard index={1}>
                <AccountForm
                  user={account.data.user}
                  companyName={
                    account.data.user.prospectProfile?.companyName
                  }
                  onSaved={async () => {
                    await Promise.all([account.reload(), refreshMe()]);
                  }}
                />
              </AnimatedCard>
              <AnimatedCard index={2}>
                <NotificationSettings />
              </AnimatedCard>
              {user ? (
                <AnimatedCard index={3}>
                  <AccountComplianceActions
                    user={user}
                    onDeleted={signOut}
                  />
                </AnimatedCard>
              ) : null}
              <AccountSignOut
                index={4}
                onPress={() => void signOut()}
              />
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}
