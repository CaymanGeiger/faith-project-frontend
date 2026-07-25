import { router } from 'expo-router';
import { BookOpen, CalendarDays, Gift, LifeBuoy } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Badge } from '../../../components/ui/Badge';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { GettingStartedCard } from '../../../features/getting-started/GettingStartedCard';
import { ProspectProfileCard } from '../../../features/prospect/ProspectProfileCard';
import { QuickActionGrid } from '../../../features/prospect/QuickActionGrid';
import { accountApi, classesApi, todosApi } from '../../../lib/api/endpoints';
import { formatShortDate } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectHomeScreen() {
  const dashboard = useAsyncData(async () => {
    const [me, onboarding, todos, classes] = await Promise.all([
      accountApi.me(),
      accountApi.onboarding(),
      todosApi.list(),
      classesApi.list(),
    ]);
    return { me, onboarding, todos, classes };
  }, []);

  return (
    <AppScreen
      title="LG Dealer Portal"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-[23px] pb-28 pt-4"
    >
      {dashboard.loading ? <LoadingState label="Loading portal" /> : null}
      {dashboard.error ? (
        <ErrorState message={dashboard.error} onRetry={dashboard.reload} />
      ) : null}
      {dashboard.data ? (
        <>
          <AnimatedCard index={1}>
            <ProspectProfileCard
              user={dashboard.data.me.user}
              companyName={dashboard.data.me.user.prospectProfile?.companyName}
            />
          </AnimatedCard>

          <AnimatedCard index={2}>
            <QuickActionGrid
              actions={[
                { label: 'Tech Support', href: '/prospect/resources', icon: BookOpen, tone: 'red' },
                { label: 'Benefits', href: '/prospect/benefits', icon: Gift, tone: 'blue' },
                { label: 'Classes', href: '/prospect/classes', icon: CalendarDays, tone: 'red' },
                { label: 'Support', href: '/prospect/messages', icon: LifeBuoy, tone: 'blue' },
              ]}
            />
          </AnimatedCard>

          <AnimatedCard index={3}>
            <GettingStartedCard
              completed={gettingStartedCompletionCount(dashboard.data)}
              total={5}
              onPress={() => router.push('/prospect/getting-started')}
            />
          </AnimatedCard>

          <AnimatedCard index={4} className="flex-row gap-4">
            <View className="flex-1 gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
              <Text className="text-sm font-bold text-hercules-muted">
                Upcoming Classes
              </Text>
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {dashboard.data.classes.classes.length} Available
              </Text>
              {dashboard.data.classes.classes[0] ? (
                <Text className="text-xs font-bold text-hercules-blue">
                  Next {formatShortDate(dashboard.data.classes.classes[0].startsAt)}
                </Text>
              ) : null}
            </View>
            <View className="flex-1 gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
              <Text className="text-sm font-bold text-hercules-muted">
                Certifications
              </Text>
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {dashboard.data.onboarding.profile.certificationStatus === 'CERTIFIED'
                  ? 'Active'
                  : 'In Progress'}
              </Text>
              <Badge
                label={dashboard.data.onboarding.profile.certificationStatus}
                tone="blue"
              />
            </View>
          </AnimatedCard>
        </>
      ) : null}
    </AppScreen>
  );
}

type DashboardData = {
  me: Awaited<ReturnType<typeof accountApi.me>>;
  onboarding: Awaited<ReturnType<typeof accountApi.onboarding>>;
  todos: Awaited<ReturnType<typeof todosApi.list>>;
  classes: Awaited<ReturnType<typeof classesApi.list>>;
};

function gettingStartedCompletionCount(data: DashboardData) {
  const profile = data.me.user.prospectProfile;
  const summary = data.onboarding.summary;
  const profileComplete = Boolean(
    data.me.user.email &&
      data.me.user.firstName &&
      data.me.user.lastName &&
      data.me.user.phone &&
      profile?.companyName,
  );
  const warrantyComplete = data.todos.todos.some(
    (todo) =>
      todo.type === 'JB_WARRANTIES' && todo.status === 'COMPLETED',
  );

  return [
    profileComplete,
    Number(summary.equipmentRegistrations ?? 0) > 0,
    Number(summary.classEnrollments ?? 0) > 0,
    warrantyComplete,
    summary.marketingConsultationStatus !== 'NOT_SUBMITTED',
  ].filter(Boolean).length;
}
