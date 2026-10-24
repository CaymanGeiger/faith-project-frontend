import { RestrictedHome } from '../../../features/onboarding/RestrictedHome';
import { hasRestrictedAccess } from '../../../features/onboarding/access';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  BadgeDollarSign,
  BookOpen,
  Gift,
  GraduationCap,
  Megaphone,
  MessageCircle,
  PackageOpen,
  ShieldCheck,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { CoBrandLockup } from '../../../components/ui/CoBrandLockup';
import { ListGroup } from '../../../components/ui/ListGroup';
import { ListItem } from '../../../components/ui/ListItem';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import {
  SkeletonLine,
  SkeletonListCards,
  SkeletonListRow,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { ErrorState } from '../../../components/ui/StateViews';
import { deriveDealerJourney } from '../../../features/prospect/dealerJourney';
import { NextStepCard } from '../../../features/prospect/NextStepCard';
import { ProspectProfileCard } from '../../../features/prospect/ProspectProfileCard';
import { QuickActionGrid } from '../../../features/prospect/QuickActionGrid';
import { TrainingHomeCard } from '../../../features/prospect/TrainingHomeCard';
import { accountApi, todosApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

const homeQuickActionSkeletonWidths = [
  'w-[49px]',
  'w-[49px]',
  'w-[50px]',
  'w-[29px]',
] as const;

export default function ProspectHomeScreen() {
  const { user } = useAuth();
  return hasRestrictedAccess(user) ? <RestrictedHome /> : <FullProspectHomeScreen />;
}

function FullProspectHomeScreen() {
  const dashboard = useAsyncData(async () => {
    const [me, onboarding, todos] = await Promise.all([
      accountApi.me(),
      accountApi.onboarding(),
      todosApi.list(),
    ]);
    return { me, onboarding, todos };
  }, []);

  const journey = dashboard.data
    ? deriveDealerJourney({
        user: dashboard.data.me.user,
        summary: dashboard.data.onboarding.summary,
        todos: dashboard.data.todos.todos,
      })
    : null;

  return (
    <AppScreen
      title="LG Dealer Portal"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-[23px] pb-8 pt-4"
    >
      <CoBrandLockup variant="home" />

      {dashboard.error && !dashboard.data ? (
        <ErrorState message={dashboard.error} onRetry={dashboard.reload} />
      ) : (
        <AsyncContent
          ready={Boolean(dashboard.data && journey)}
          fallback={<ProspectHomeSkeleton />}
          className="gap-4"
        >
          {dashboard.data && journey ? (
            <>
              <AnimatedCard index={1}>
                <ProspectProfileCard
                  user={dashboard.data.me.user}
                  companyName={
                    dashboard.data.me.user.prospectProfile?.companyName
                  }
                />
              </AnimatedCard>

              <AnimatedCard index={2}>
                <NextStepCard
                  step={{
                    title: 'Getting Started',
                    description:
                      journey.completed === journey.total
                        ? 'Review your completed dealer setup and keep your information current.'
                        : 'Continue your setup for training, activation, and your first LG system.',
                    support: `${journey.completed} of ${journey.total} milestones complete.`,
                    href: '/prospect/getting-started',
                  }}
                />
              </AnimatedCard>

              <AnimatedCard index={3} className="gap-3">
                <SectionHeader title="Quick Access" />
                <QuickActionGrid
                  actions={[
                    {
                      label: 'Support',
                      href: '/prospect/resources',
                      icon: BookOpen,
                      tone: 'red',
                    },
                    {
                      label: 'Training',
                      href: '/prospect/classes',
                      icon: GraduationCap,
                      tone: 'blue',
                    },
                    {
                      label: 'Benefits',
                      href: '/prospect/benefits',
                      icon: ShieldCheck,
                      tone: 'red',
                    },
                    {
                      label: 'Chat',
                      href: '/prospect/messages',
                      icon: MessageCircle,
                      tone: 'blue',
                    },
                  ]}
                />
              </AnimatedCard>

              <AnimatedCard index={4}>
                <TrainingHomeCard
                  selected={
                    dashboard.data.onboarding.summary.trainingSelected
                  }
                  completed={
                    dashboard.data.onboarding.summary.trainingCompleted
                  }
                  dueAt={
                    dashboard.data.todos.todos.find(
                      (todo) => todo.type === 'CLASS_SIGNUP',
                    )?.dueAt
                  }
                />
              </AnimatedCard>

              <AnimatedCard index={5}>
                <RelatedLinks
                  title="Benefits & Resources"
                  links={[
                    {
                      title: 'Dealer Benefits',
                      description:
                        'Explore pricing, rewards, leads, warranty, and business support.',
                      href: '/prospect/benefits',
                      icon: Gift,
                      tone: 'red',
                    },
                    {
                      title: 'Rebates',
                      description:
                        'Review current program savings and available offers.',
                      href: '/prospect/rebates',
                      icon: BadgeDollarSign,
                      tone: 'blue',
                    },
                  ]}
                />
              </AnimatedCard>

              <AnimatedCard index={6} className="gap-3">
                <SectionHeader title="Offers & Updates" />
                <ListGroup>
                  <ListItem
                    title="Product Updates & Launches"
                    subtitle="Stay current on LG products, resources, and launch invitations."
                    meta="Ongoing"
                    icon={PackageOpen}
                    iconTone="blue"
                    variant="row"
                  />
                  <ListItem
                    title="Promotions & Training"
                    subtitle="Watch for new offers and continuing training opportunities."
                    meta="Ongoing"
                    icon={Megaphone}
                    iconTone="red"
                    variant="row"
                    isLast
                  />
                </ListGroup>
              </AnimatedCard>
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

function ProspectHomeSkeleton() {
  return (
    <SkeletonReveal
      label="Preparing your dashboard"
      className="gap-4"
    >
      <View className="gap-4 rounded-[20px] bg-hercules-red/15 px-5 py-6">
        <View className="gap-2">
          <View className="h-4 justify-center">
            <SkeletonLine className="h-3 w-[206px]" />
          </View>
          <View className="h-8 justify-center">
            <SkeletonLine className="h-7 w-[199px]" />
          </View>
          <View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-4 w-[330px]" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-4 w-[54px]" subtle />
            </View>
          </View>
          <View className="h-5 justify-center">
            <SkeletonLine className="h-3 w-[161px]" subtle />
          </View>
        </View>
      </View>

      <View className="gap-4 rounded-[20px] bg-hercules-blue/15 px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <View className="h-4 w-4 rounded-full bg-hercules-blue/15" />
            <SkeletonLine className="h-3 w-[120px]" />
          </View>
          <SkeletonLine className="h-3 w-[104px]" subtle />
        </View>
        <View className="gap-2">
          <View className="h-7 justify-center">
            <SkeletonLine className="h-6 w-[278px]" />
          </View>
          <View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-[303px]" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-[168px]" subtle />
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-3 border-t border-hercules-blue/10 pt-4">
          <View className="min-w-0 flex-1">
            <View className="h-4 justify-center">
              <SkeletonLine className="h-3 w-[220px]" subtle />
            </View>
            <View className="h-4 justify-center">
              <SkeletonLine className="h-3 w-[85px]" subtle />
            </View>
          </View>
          <SkeletonLine className="h-4 w-20" />
        </View>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[116px]" />
        <View className="flex-row justify-between gap-3 border-y border-hercules-blue/10 py-5">
          {Array.from({ length: 4 }, (_, index) => (
            <View
              key={`home-quick-action-skeleton-${index}`}
              className="flex-1 items-center gap-2"
            >
              <View
                className={`h-14 w-14 rounded-[18px] ${
                  index % 2 === 0
                    ? 'bg-hercules-red/15'
                    : 'bg-hercules-blue/15'
              }`}
              />
              <View className="h-4 justify-center">
                <SkeletonLine
                  className={`h-3 ${homeQuickActionSkeletonWidths[index]}`}
                  subtle
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <View className="gap-1">
          <View className="flex-row items-start gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <View className="h-4 justify-center">
                <SkeletonLine className="h-3 w-[92px]" />
              </View>
              <View className="h-6 justify-center">
                <SkeletonLine className="h-5 w-full max-w-[210px]" />
              </View>
            </View>
            <View className="h-11 w-11 shrink-0 rounded-[13px] bg-hercules-red/15" />
          </View>
          <View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-full" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-2/3" subtle />
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-between gap-3 border-t border-hercules-blue/10 pt-4">
          <SkeletonLine className="h-3 w-[96px]" subtle />
          <SkeletonLine className="h-4 w-[104px]" />
        </View>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[210px]" />
        <SkeletonListCards
          rows={2}
          titleLines={1}
          subtitleLines={2}
          trailing="chevron"
        />
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[148px]" />
        <ListGroup>
          {Array.from({ length: 2 }, (_, index) => (
            <SkeletonListRow
              key={`home-offer-row-skeleton-${index}`}
              titleLines={1}
              subtitleLines={2}
              metaWidthClassName="w-[50px]"
              trailing="meta"
              iconTone={index === 0 ? 'blue' : 'red'}
              isLast={index === 1}
            />
          ))}
        </ListGroup>
      </View>
    </SkeletonReveal>
  );
}
