import { BookOpen, LogOut, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
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
      alertHref="/prospect/inbox"
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
      <AnimatedCard index={1}>
        <RelatedLinks
          title="Help & Resources"
          links={[
            {
              title: 'Dealer Resources',
              description: 'Open LG catalogs, registration guides, and dealer apps.',
              href: '/prospect/resources',
              icon: BookOpen,
              tone: 'red',
            },
            {
              title: 'Message Your Sales Manager',
              description: 'Continue a conversation with your assigned Hercules contact.',
              href: '/prospect/messages',
              icon: MessageCircle,
              tone: 'blue',
            },
          ]}
        />
      </AnimatedCard>
      <AnimatedCard index={2}>
        <SecondaryButton label="Sign Out" icon={LogOut} onPress={signOut} />
      </AnimatedCard>
    </AppScreen>
  );
}
