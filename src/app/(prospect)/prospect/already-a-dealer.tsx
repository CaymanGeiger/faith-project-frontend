import { router } from 'expo-router';
import {
  BadgeDollarSign,
  CalendarDays,
  Megaphone,
  MessageCircle,
  PackagePlus,
  ShieldCheck,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { ListGroup } from '../../../components/ui/ListGroup';
import { ListItem } from '../../../components/ui/ListItem';
import { PageHero } from '../../../components/ui/PageHero';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import type { RelatedLink } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  SkeletonListGroup,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { accountApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function AlreadyADealerScreen() {
  const page = useAsyncData(() => accountApi.onboarding(), []);
  const summary = page.data?.summary;

  return (
    <AppScreen title="Existing Dealer" quickLinks={prospectQuickLinks}>
      <PageHero
        title="Existing Dealer"
        subtitle="Keep track of training, resources, and dealer program tasks with Hercules."
      />

      {page.error && !page.data ? (
        <ErrorState message={page.error} onRetry={page.reload} />
      ) : (
        <AsyncContent
          ready={Boolean(summary)}
          fallback={<AlreadyDealerSkeleton />}
          className="gap-6"
        >
          {summary ? (
            <>
              <AnimatedCard index={1} className="gap-3">
                <SectionHeader title="Your dealer success plan" />
                <ListGroup>
                  <ListItem
                    title="Complete LG Training"
                    subtitle="Review current training requirements and confirm your next step with Hercules."
                    meta={trainingStatus(summary)}
                    icon={CalendarDays}
                    iconTone="red"
                    variant="row"
                    onPress={() => router.push('/prospect/classes')}
                  />
                  <ListItem
                    title="Record Your JB Warranties Setup"
                    subtitle="Record completed JB Warranties setup for your Hercules onboarding."
                    meta={summary.jbWarrantiesCompleted ? 'Completion recorded' : 'Action needed'}
                    icon={ShieldCheck}
                    iconTone="blue"
                    variant="row"
                    onPress={() =>
                      router.push({
                        pathname: '/prospect/getting-started',
                        params: { step: 'warranties' },
                      })
                    }
                  />
                  <ListItem
                    title="Share Marketing Availability"
                    subtitle="Share availability, then contact Hercules about available marketing support."
                    meta={summary.marketingConsultationSubmitted ? 'Availability saved' : 'Action needed'}
                    icon={Megaphone}
                    iconTone="red"
                    variant="row"
                    onPress={() => router.push('/prospect/marketing')}
                  />
                  <ListItem
                    title="Add Your First LG System"
                    subtitle="Save your first equipment record for dealer onboarding."
                    meta={summary.firstEquipmentRegistered ? 'Record saved' : 'Next step'}
                    icon={PackagePlus}
                    iconTone="blue"
                    variant="row"
                    isLast
                    onPress={() =>
                      router.push({
                        pathname: '/prospect/getting-started',
                        params: { step: 'equipment' },
                      })
                    }
                  />
                </ListGroup>
              </AnimatedCard>

              <AnimatedCard index={2}>
                <RelatedLinks
                  title="Keep your benefits working"
                  links={dealerLinks}
                />
              </AnimatedCard>
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

const dealerLinks = [
  {
    title: 'Benefits',
    description: 'See what is available now and what to do next.',
    href: '/prospect/benefits',
    icon: BadgeDollarSign,
    tone: 'red',
  },
  {
    title: 'Dealer support',
    description: 'Find technical resources, warranty help, and your Hercules contact.',
    href: '/prospect/resources',
    icon: ShieldCheck,
    tone: 'blue',
  },
  {
    title: 'Chat',
    description: 'Talk with your Hercules representative about your next step.',
    href: '/prospect/messages',
    icon: MessageCircle,
    tone: 'red',
  },
] satisfies RelatedLink[];

function trainingStatus(summary: {
  trainingCompleted: boolean;
  trainingSelected: boolean;
}) {
  if (summary.trainingCompleted) return 'Complete';
  if (summary.trainingSelected) return 'Preference saved';
  return 'Next step';
}

function AlreadyDealerSkeleton() {
  return (
    <SkeletonReveal label="Loading dealer success plan" className="gap-4">
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[190px]" />
        <SkeletonListGroup
          rows={4}
          titleLines={1}
          subtitleLines={2}
          trailing="meta-chevron"
        />
      </View>
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[210px]" />
        <SkeletonListGroup
          rows={3}
          titleLines={1}
          subtitleLines={2}
          trailing="chevron"
        />
      </View>
    </SkeletonReveal>
  );
}
