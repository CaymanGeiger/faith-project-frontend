import { router } from 'expo-router';
import { AppScreen } from '../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../components/layout/navigation';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { PageHero } from '../../components/ui/PageHero';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { useAuth } from '../auth/AuthProvider';
import { openExternalUrl } from '../../lib/openExternalUrl';
import { accessibleLinks } from './access';

export function RestrictedSupport() {
  const { user } = useAuth();
  return (
    <AppScreen title="Support" quickLinks={accessibleLinks(user, prospectQuickLinks)}>
      <PageHero title="Here to Help" subtitle="Contact your representative for help with your registration, initial training or completion verification." />
      <AnimatedCard index={1}>
        <PrimaryButton label="Chat with Your Representative" onPress={() => router.push('/prospect/messages')} />
      </AnimatedCard>
      <AnimatedCard index={2}>
        <SecondaryButton label="Open Training" onPress={() => router.push('/prospect/classes')} />
      </AnimatedCard>
      <AnimatedCard index={3}>
        <SecondaryButton label="Call Hercules Support" onPress={() => void openExternalUrl('tel:18003565350')} />
      </AnimatedCard>
    </AppScreen>
  );
}
