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
  SkeletonListRow,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useInAppContent } from '../../../features/content/InAppContentProvider';
import { FinancingCard } from '../../../features/financing/FinancingCard';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { formatShortDate } from '../../../lib/format';

export default function ManagerResourcesScreen() {
  const { openContent } = useInAppContent();
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
              <AnimatedCard index={1} className="gap-3">
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

              <AnimatedCard index={2} className="gap-3">
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
                      onPress={() => openContent({ url: resource.url, title: resource.title })}
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>

              <AnimatedCard index={3} className="gap-3">
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
                      onPress={benefit.url
                        ? () => openContent({ url: benefit.url, title: benefit.title })
                        : undefined}
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>
              <FinancingCard />
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
      <ListGroup>
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonListRow
            key={`manager-resource-row-${iconTone}-${index}`}
            iconTone={iconTone}
            isLast={index === rows - 1}
            titleLines={twoLineTitleIndexes.includes(index) ? 2 : 1}
            metaWidth={metadataWidths[index] ?? 64}
            trailing={trailing}
            chevronWidthClassName="w-2"
          />
        ))}
      </ListGroup>
    </View>
  );
}
