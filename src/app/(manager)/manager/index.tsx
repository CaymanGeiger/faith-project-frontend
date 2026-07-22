import { router } from 'expo-router';
import { BookOpen, BriefcaseBusiness, MessageCircle, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Badge } from '../../../components/ui/Badge';
import { ListItem } from '../../../components/ui/ListItem';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { leadsApi } from '../../../lib/api/endpoints';
import { fullName } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ManagerHomeScreen() {
  const { user } = useAuth();
  const prospects = useAsyncData(() => leadsApi.prospects(), []);

  return (
    <AppScreen
      title="Hercules Internal"
      quickLinks={managerQuickLinks}
      alertHref="/manager/messages"
    >
      <AnimatedCard className="gap-4 rounded-[24px] bg-hercules-red p-5">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-2">
            <Text className="text-sm font-bold text-hercules-white/75">
              Sales Manager
            </Text>
            <Text className="text-3xl font-extrabold text-hercules-white">
              {user ? fullName(user) : 'Hercules'}
            </Text>
          </View>
          <View className="h-16 w-16 items-center justify-center rounded-full bg-hercules-white/20">
            <Users size={30} color="white" />
          </View>
        </View>
      </AnimatedCard>

      {prospects.loading ? <LoadingState label="Loading prospects" /> : null}
      {prospects.error ? (
        <ErrorState message={prospects.error} onRetry={prospects.reload} />
      ) : null}
      {prospects.data ? (
        <>
          <AnimatedCard index={1} className="flex-row gap-4">
            <View className="flex-1 gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
              <Text className="text-sm font-bold text-hercules-muted">
                Assigned Prospects
              </Text>
              <Text className="text-3xl font-extrabold text-hercules-ink">
                {prospects.data.prospects.length}
              </Text>
            </View>
            <View className="flex-1 gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
              <Text className="text-sm font-bold text-hercules-muted">
                Lead Scope
              </Text>
              <Text className="text-lg font-extrabold text-hercules-ink">
                Lightweight
              </Text>
              <Badge label="Status + notes" tone="blue" />
            </View>
          </AnimatedCard>

          <AnimatedCard index={2}>
            <SectionHeader
              title="Assigned Prospects"
              actionLabel="View All"
              onAction={() => router.push('/manager/prospects')}
            />
            <View className="gap-3">
              {prospects.data.prospects.slice(0, 3).map((prospect, index) => (
                <ListItem
                  key={prospect.id}
                  title={fullName(prospect.user)}
                  subtitle={prospect.companyName}
                  meta={prospect.certificationStatus.replaceAll('_', ' ')}
                  icon={index % 2 === 0 ? BriefcaseBusiness : MessageCircle}
                  iconTone={index % 2 === 0 ? 'red' : 'blue'}
                  onPress={() => router.push('/manager/prospects')}
                />
              ))}
            </View>
          </AnimatedCard>

          <AnimatedCard index={3}>
            <RelatedLinks
              title="Prospect Support"
              links={[
                {
                  title: 'Support Resources',
                  description: 'Review shared classes, LG resources, and dealer benefits.',
                  href: '/manager/resources',
                  icon: BookOpen,
                  tone: 'red',
                },
                {
                  title: 'Prospect Messages',
                  description: 'Open conversations with your assigned prospects.',
                  href: '/manager/messages',
                  icon: MessageCircle,
                  tone: 'blue',
                },
              ]}
            />
          </AnimatedCard>
        </>
      ) : null}
    </AppScreen>
  );
}
