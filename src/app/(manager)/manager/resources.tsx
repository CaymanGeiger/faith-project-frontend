import { BookOpen, CalendarDays, Gift, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { PageHero } from '../../../components/ui/PageHero';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  SkeletonLine,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { formatShortDate } from '../../../lib/format';
import { openExternalUrl } from '../../../lib/openExternalUrl';

export default function ManagerResourcesScreen() {
  const { support } = useManagerData();
  const supportData = support.data;

  return (
    <AppScreen
      title="Support Resources"
      quickLinks={managerQuickLinks}
    >
      <PageHero
        title="Shared Dealer Resources"
        subtitle="Training, technical resources, and benefit information for dealer support."
        reveal={false}
      />

      {support.error && !supportData ? (
        <ErrorState message={support.error} onRetry={support.reload} />
      ) : (
        <AsyncContent
          ready={Boolean(supportData)}
          fallback={<ManagerResourcesSkeleton />}
          className="gap-6"
        >
          {supportData ? (
            <>
              <AnimatedCard reveal={false} className="gap-3">
                <SectionHeader title="Training" />
                <ListGroup>
                  {supportData.classes.classes.map((session, index) => (
                    <ListItem
                      key={session.id}
                      title={session.title}
                      subtitle={formatShortDate(session.startsAt)}
                      meta={session.status}
                      icon={CalendarDays}
                      iconTone="red"
                      variant="row"
                      isLast={
                        index === supportData.classes.classes.length - 1
                      }
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>

              <AnimatedCard reveal={false} className="gap-3">
                <SectionHeader title="Resources" />
                <ListGroup>
                  {supportData.resources.resources.map((resource, index) => (
                    <ListItem
                      key={resource.id}
                      title={resource.title}
                      subtitle={resource.description}
                      meta={resource.category}
                      icon={
                        resource.resourceType === 'APP' ? Smartphone : BookOpen
                      }
                      iconTone="blue"
                      variant="row"
                      isLast={
                        index === supportData.resources.resources.length - 1
                      }
                      subtitleNumberOfLines={1}
                      onPress={() => void openExternalUrl(resource.url)}
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>

              <AnimatedCard reveal={false} className="gap-3">
                <SectionHeader title="Benefits" />
                <ListGroup>
                  {supportData.benefits.benefits.map((benefit, index) => (
                    <ListItem
                      key={benefit.id}
                      title={benefit.title}
                      subtitle={benefit.description}
                      meta={benefit.benefitType.replaceAll('_', ' ')}
                      icon={Gift}
                      iconTone="red"
                      variant="row"
                      isLast={
                        index === supportData.benefits.benefits.length - 1
                      }
                      subtitleNumberOfLines={1}
                      onPress={() => void openExternalUrl(benefit.url)}
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

function ManagerResourcesSkeleton() {
  return (
    <SkeletonReveal label="Loading support resources" className="gap-6">
      <ManagerResourceSectionSkeleton
        rows={2}
        titleWidthClassName="w-1/4"
        iconTone="red"
        trailing="meta"
        metadataWidths={[75, 75]}
        twoLineTitleIndexes={[0, 1]}
      />
      <ManagerResourceSectionSkeleton
        rows={5}
        titleWidthClassName="w-1/3"
        iconTone="blue"
        trailing="meta-chevron"
        metadataWidths={[72, 72, 50, 50, 50]}
      />
      <ManagerResourceSectionSkeleton
        rows={3}
        titleWidthClassName="w-1/4"
        iconTone="red"
        trailing="meta-chevron"
        metadataWidths={[65, 70, 88]}
      />
    </SkeletonReveal>
  );
}

type ManagerResourceSectionSkeletonProps = {
  rows: number;
  titleWidthClassName: string;
  iconTone: 'red' | 'blue';
  trailing: 'meta' | 'meta-chevron';
  metadataWidths: readonly number[];
  twoLineTitleIndexes?: readonly number[];
};

function ManagerResourceSectionSkeleton({
  rows,
  titleWidthClassName,
  iconTone,
  trailing,
  metadataWidths,
  twoLineTitleIndexes = [],
}: ManagerResourceSectionSkeletonProps) {
  return (
    <View className="gap-3">
      <SkeletonSectionHeader widthClassName={titleWidthClassName} />
      <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
        {Array.from({ length: rows }, (_, index) => (
          <ManagerResourceRowSkeleton
            key={`manager-resource-row-${iconTone}-${index}`}
            iconTone={iconTone}
            isLast={index === rows - 1}
            titleLines={twoLineTitleIndexes.includes(index) ? 2 : 1}
            metadataWidth={metadataWidths[index] ?? 64}
            showChevron={trailing === 'meta-chevron'}
          />
        ))}
      </View>
    </View>
  );
}

type ManagerResourceRowSkeletonProps = {
  iconTone: 'red' | 'blue';
  isLast: boolean;
  titleLines: 1 | 2;
  metadataWidth: number;
  showChevron: boolean;
};

function ManagerResourceRowSkeleton({
  iconTone,
  isLast,
  titleLines,
  metadataWidth,
  showChevron,
}: ManagerResourceRowSkeletonProps) {
  return (
    <View
      className={`min-h-[76px] flex-row items-center gap-3 px-4 py-3 ${
        isLast ? '' : 'border-b border-hercules-blue/10'
      }`}
    >
      <View
        className={`h-10 w-10 shrink-0 rounded-[12px] ${
          iconTone === 'red'
            ? 'bg-hercules-red/15'
            : 'bg-hercules-blue/15'
        }`}
      />
      <View className="min-w-0 flex-1 gap-1">
        <View>
          {Array.from({ length: titleLines }, (_, index) => (
            <View
              key={`manager-resource-title-${index}`}
              className="h-5 justify-center"
            >
              <SkeletonLine
                className={`h-4 ${index === 0 ? 'w-4/5' : 'w-3/5'}`}
              />
            </View>
          ))}
        </View>
        <View className="h-5 justify-center">
          <SkeletonLine className="h-3 w-3/5" subtle />
        </View>
      </View>
      <View className="shrink-0 flex-row items-center justify-end gap-2">
        <View
          className="h-4 justify-center"
          style={{ width: metadataWidth }}
        >
          <SkeletonLine className="h-3 w-full" subtle />
        </View>
        {showChevron ? (
          <View className="h-6 w-4 items-center justify-center">
            <SkeletonLine className="h-5 w-2" subtle />
          </View>
        ) : null}
      </View>
    </View>
  );
}
