import { router } from 'expo-router';
import { BookOpen, BriefcaseBusiness, MessageCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { Badge } from '../../../components/ui/Badge';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import {
  SkeletonLine,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { ErrorState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { fullName } from '../../../lib/format';

export default function ManagerHomeScreen() {
  const { user } = useAuth();
  const { prospects } = useManagerData();
  const prospectData = prospects.data;

  return (
    <AppScreen
      title="Hercules Internal"
      quickLinks={managerQuickLinks}
    >
      <AnimatedCard
        reveal={false}
        className="gap-4 rounded-[20px] bg-hercules-red px-5 py-6"
      >
        <View className="gap-2">
          <Text className="text-xs font-extrabold uppercase tracking-[0.8px] text-hercules-white/75">
            Dealer Success
          </Text>
          <Text className="text-3xl font-extrabold text-hercules-white">
            {user ? fullName(user) : 'Hercules'}
          </Text>
          <Text className="text-sm font-semibold leading-5 text-hercules-white/80">
            Guide each dealer from training through activation and long-term
            growth.
          </Text>
        </View>
      </AnimatedCard>

      {prospects.error && !prospectData ? (
        <>
          <ErrorState message={prospects.error} onRetry={prospects.reload} />
          <ManagerSupportLinks />
        </>
      ) : (
        <AsyncContent
          ready={Boolean(prospectData)}
          fallback={<ManagerHomeSkeleton />}
          className="gap-6"
        >
          {prospectData ? (
            <>
              <AnimatedCard reveal={false} className="flex-row gap-4">
                <View className="flex-1 gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
                  <Text className="text-xs font-extrabold uppercase tracking-[0.3px] text-hercules-muted">
                    Assigned Dealers
                  </Text>
                  <Text className="text-3xl font-extrabold text-hercules-ink">
                    {prospectData.prospects.length}
                  </Text>
                </View>
                <View className="flex-1 gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
                  <Text className="text-xs font-extrabold uppercase tracking-[0.3px] text-hercules-muted">
                    Needs Follow-Up
                  </Text>
                  <Text className="text-3xl font-extrabold text-hercules-ink">
                    {
                      prospectData.prospects.filter(
                        (prospect) =>
                          prospect.certificationStatus !== 'CERTIFIED',
                      ).length
                    }
                  </Text>
                  <Badge label="Training or setup" tone="blue" />
                </View>
              </AnimatedCard>

              <AnimatedCard reveal={false} className="gap-3">
                <SectionHeader
                  title="Dealers to Support"
                  actionLabel="View All"
                  onAction={() => router.push('/manager/prospects')}
                />
                <ListGroup>
                  {prospectData.prospects
                    .slice(0, 3)
                    .map((prospect, index) => (
                      <ListItem
                        key={prospect.id}
                        title={fullName(prospect.user)}
                        subtitle={`${prospect.companyName} · ${managerNextStep(
                          prospect.certificationStatus,
                        )}`}
                        meta={prospect.certificationStatus.replaceAll('_', ' ')}
                        icon={
                          index % 2 === 0
                            ? BriefcaseBusiness
                            : MessageCircle
                        }
                        iconTone={index % 2 === 0 ? 'red' : 'blue'}
                        variant="row"
                        isLast={
                          index ===
                          Math.min(prospectData.prospects.length, 3) - 1
                        }
                        onPress={() => router.push('/manager/prospects')}
                      />
                  ))}
                </ListGroup>
              </AnimatedCard>

              <ManagerSupportLinks />
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

function ManagerSupportLinks() {
  return (
    <AnimatedCard reveal={false}>
      <RelatedLinks
          title="Technical Support"
        links={[
          {
            title: 'Shared Dealer Resources',
            description:
              'Review training, LG resources, and dealer benefits.',
            href: '/manager/resources',
            icon: BookOpen,
            tone: 'red',
          },
          {
            title: 'Dealer Chat',
            description: 'Open conversations with your assigned dealers.',
            href: '/manager/messages',
            icon: MessageCircle,
            tone: 'blue',
          },
        ]}
      />
    </AnimatedCard>
  );
}

function managerNextStep(certificationStatus: string) {
  if (certificationStatus === 'CERTIFIED') {
    return 'Support ongoing growth';
  }
  if (certificationStatus === 'IN_PROGRESS') {
    return 'Follow up on training';
  }
  return 'Choose LG training';
}

function ManagerHomeSkeleton() {
  return (
    <SkeletonReveal
      label="Loading manager dashboard"
      className="gap-6"
    >
      <View className="flex-row gap-4">
        <View className="h-[112px] flex-1 gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
          <SkeletonLine className="h-3 w-4/5" subtle />
          <SkeletonLine className="h-8 w-1/2" />
        </View>
        <View className="h-[112px] flex-1 gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
          <SkeletonLine className="h-3 w-3/4" subtle />
          <SkeletonLine className="h-8 w-1/2" />
          <View className="h-5 w-4/5 rounded-full bg-hercules-blue/15" />
        </View>
      </View>
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-2/5" showAction />
        <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
          {Array.from({ length: 2 }, (_, index) => (
            <ManagerHomeListRowSkeleton
              key={`manager-home-dealer-${index}`}
              iconTone={index === 0 ? 'red' : 'blue'}
              subtitleLines={2}
              metaWidth={83}
              showChevron
              isLast={index === 1}
            />
          ))}
        </View>
      </View>
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-1/3" />
        <View className="gap-3">
          <ManagerHomeListRowSkeleton
            variant="card"
            iconTone="red"
            subtitleLines={2}
            showChevron
          />
          <ManagerHomeListRowSkeleton
            variant="card"
            iconTone="blue"
            subtitleLines={2}
            showChevron
          />
        </View>
      </View>
    </SkeletonReveal>
  );
}

type ManagerHomeListRowSkeletonProps = {
  iconTone: 'red' | 'blue';
  subtitleLines: 1 | 2;
  variant?: 'card' | 'row';
  metaWidth?: number;
  showChevron?: boolean;
  isLast?: boolean;
};

function ManagerHomeListRowSkeleton({
  iconTone,
  subtitleLines,
  variant = 'row',
  metaWidth,
  showChevron = false,
  isLast = false,
}: ManagerHomeListRowSkeletonProps) {
  const containerClassName =
    variant === 'card'
      ? 'min-h-[76px] flex-row items-center gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white px-4 py-3'
      : `min-h-[76px] flex-row items-center gap-3 px-4 py-3 ${
          isLast ? '' : 'border-b border-hercules-blue/10'
        }`;

  return (
    <View className={containerClassName}>
      <View
        className={`h-10 w-10 shrink-0 rounded-[12px] ${
          iconTone === 'red'
            ? 'bg-hercules-red/15'
            : 'bg-hercules-blue/15'
        }`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View className="h-5 justify-center">
          <SkeletonLine className="h-4 w-4/5" />
        </View>
        <View>
          {Array.from({ length: subtitleLines }, (_, index) => (
            <View
              key={`manager-home-subtitle-${index}`}
              className="h-5 justify-center"
            >
              <SkeletonLine
                className={`h-3 ${index === 0 ? 'w-4/5' : 'w-3/5'}`}
                subtle
              />
            </View>
          ))}
        </View>
      </View>
      {metaWidth || showChevron ? (
        <View className="shrink-0 flex-row items-center justify-end gap-2">
          {metaWidth ? (
            <View
              className="h-4 justify-center"
              style={{ width: metaWidth }}
            >
              <SkeletonLine className="h-3 w-full" subtle />
            </View>
          ) : null}
          {showChevron ? (
            <View className="h-6 w-4 items-center justify-center">
              <SkeletonLine className="h-5 w-2" subtle />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
