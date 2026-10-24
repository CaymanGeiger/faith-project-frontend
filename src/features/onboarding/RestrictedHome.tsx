import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AppScreen } from '../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../components/layout/navigation';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { PageHero } from '../../components/ui/PageHero';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';
import { useAuth } from '../auth/AuthProvider';
import { accountApi } from '../../lib/api/endpoints';
import { useAsyncData } from '../../lib/hooks/useAsyncData';
import { accessibleLinks } from './access';

export function RestrictedHome() {
  const { user, refreshMe } = useAuth();
  const status = useAsyncData(() => accountApi.onboarding(), [user?.id]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trainingSelected = status.data?.summary.trainingSelected;

  const refresh = async () => {
    setChecking(true);
    setError(null);
    try { await Promise.all([refreshMe(), status.reload()]); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to check your access.'); }
    finally { setChecking(false); }
  };

  return (
    <AppScreen title="Getting Started" quickLinks={accessibleLinks(user, prospectQuickLinks)}>
      <PageHero title={`Welcome${user?.firstName ? `, ${user.firstName}` : ''}`} subtitle="Your account is active. Complete your initial training and have it verified to unlock dealer features." />
      {error || status.error ? <ErrorState message={error ?? status.error!} onRetry={() => void refresh()} /> : null}
      <AnimatedCard index={1} className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <Text className="text-xl font-extrabold text-hercules-ink">{trainingSelected ? 'Training verification pending' : 'Start with initial training'}</Text>
        <Text className="text-base leading-6 text-hercules-muted">
          {trainingSelected ? 'Your training preference is saved. Attend the required initial training, then ask your representative to arrange verification.' : 'Visit Training to choose a session and review registration details with your representative.'}
          {' '}Saving a preference or registering for a class does not verify completion.
        </Text>
        <PrimaryButton label="Open Training" onPress={() => router.push('/prospect/classes')} />
        <SecondaryButton label="Check Training Verification" disabled={checking} onPress={() => void refresh()} />
      </AnimatedCard>
      <AnimatedCard index={2} className="gap-3 rounded-[16px] border border-hercules-blue/15 p-5">
        <Text className="text-lg font-extrabold text-hercules-ink">Available now</Text>
        <SecondaryButton label="Review Your Profile" onPress={() => router.push('/prospect/account')} />
        <SecondaryButton label="Chat with Your Representative" onPress={() => router.push('/prospect/messages')} />
        <SecondaryButton label="Contact Support" onPress={() => router.push('/prospect/resources')} />
      </AnimatedCard>
      <AnimatedCard index={3} className="gap-2 rounded-[16px] bg-hercules-blue/5 p-5">
        <Text className="text-lg font-extrabold text-hercules-ink">Available after verification</Text>
        <Text className="text-base leading-6 text-hercules-muted">Dealer benefits, rebates, financing information, equipment records, warranty setup and marketing resources.</Text>
        <Text className="text-sm leading-5 text-hercules-muted">App access does not issue an LG Pro Dealer number or confirm eligibility for a financing, warranty or incentive program. Your representative can explain any additional requirements.</Text>
      </AnimatedCard>
    </AppScreen>
  );
}
