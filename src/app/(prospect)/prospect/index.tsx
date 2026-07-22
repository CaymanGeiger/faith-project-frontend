import { router } from 'expo-router';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Gift,
  LifeBuoy,
  PackagePlus,
} from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Badge } from '../../../components/ui/Badge';
import { ListItem } from '../../../components/ui/ListItem';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
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
      alertHref="/prospect/inbox"
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
                { label: 'Register', href: '/prospect/inbox', icon: PackagePlus, tone: 'red' },
                { label: 'Resources', href: '/prospect/resources', icon: BookOpen, tone: 'blue' },
                { label: 'Classes', href: '/prospect/classes', icon: CalendarDays, tone: 'red' },
                { label: 'Support', href: '/prospect/messages', icon: LifeBuoy, tone: 'blue' },
              ]}
            />
          </AnimatedCard>

          <AnimatedCard index={3}>
            <RelatedLinks
              title="Your Dealer Journey"
              links={[
                {
                  title: 'To-Do',
                  description: 'See your required onboarding actions and deadlines.',
                  href: '/prospect/todos',
                  icon: CheckSquare,
                  tone: 'red',
                },
                {
                  title: 'Dealer Benefits',
                  description: 'Explore discounts, warranty support, and dealer programs.',
                  href: '/prospect/benefits',
                  icon: Gift,
                  tone: 'blue',
                },
                {
                  title: 'Marketing Consultation',
                  description: 'Schedule the consultation required for your onboarding.',
                  href: '/prospect/marketing',
                  icon: Award,
                  tone: 'blue',
                },
              ]}
            />
          </AnimatedCard>

          <AnimatedCard index={4}>
            <SectionHeader
              title="Inbox"
              actionLabel="See All"
              onAction={() => router.push('/prospect/inbox')}
            />
            <View className="gap-3">
              {dashboard.data.todos.todos.slice(0, 3).map((todo, index) => (
                <ListItem
                  key={todo.id}
                  title={todo.title}
                  subtitle={todo.description}
                  meta={todo.status === 'OPEN' ? 'New' : 'Done'}
                  icon={index === 1 ? PackagePlus : CalendarDays}
                  iconTone={index === 1 ? 'blue' : 'red'}
                  onPress={() => router.push('/prospect/todos')}
                />
              ))}
            </View>
          </AnimatedCard>

          <AnimatedCard index={5} className="flex-row gap-4">
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
