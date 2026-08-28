import { router } from 'expo-router';
import {
  Award,
  BookOpen,
  FileText,
  MessageCircle,
  PackagePlus,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { PageHero } from '../../../components/ui/PageHero';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import type { RelatedLink } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  SkeletonLine,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { resourcesApi } from '../../../lib/api/endpoints';
import type { Resource } from '../../../lib/api/types';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { openExternalUrl } from '../../../lib/openExternalUrl';

const dealerSupportLinks = [
  {
    title: 'Warranty Help',
    description: 'Find warranty resources and JB Warranties guidance.',
    href: '/prospect/benefits',
    icon: ShieldCheck,
    tone: 'red',
  },
  {
    title: 'Marketing Resources',
    description: 'Plan your consultation and find business-growth support.',
    href: '/prospect/marketing',
    icon: Award,
    tone: 'blue',
  },
  {
    title: 'Contact Your Hercules Representative',
    description: 'Start a chat when you need help with Getting Started.',
    href: '/prospect/messages',
    icon: MessageCircle,
    tone: 'red',
  },
] satisfies RelatedLink[];

export default function ProspectResourcesScreen() {
  const resources = useAsyncData(() => resourcesApi.list(), []);
  const resourceList = resources.data?.resources ?? [];
  const registrationResources = resourceList.filter(
    (resource) =>
      resource.resourceType === 'REGISTRATION_OVERVIEW' ||
      /registration/i.test(resource.category),
  );
  const appResources = resourceList.filter(
    (resource) => resource.resourceType === 'APP',
  );
  const marketingResources = resourceList.filter((resource) =>
    /marketing/i.test(resource.category),
  );
  const technicalResources = resourceList.filter(
    (resource) =>
      resource.resourceType !== 'APP' &&
      resource.resourceType !== 'REGISTRATION_OVERVIEW' &&
      !/registration|marketing/i.test(resource.category),
  );

  return (
    <AppScreen
      title="Technical Support"
      quickLinks={prospectQuickLinks}
    >
      <PageHero
        title="Technical Support"
        subtitle="Find product tools, technical resources, registration help, warranty support, and your Hercules contact."
      />

      {resources.error && !resources.data ? (
        <ErrorState message={resources.error} onRetry={resources.reload} />
      ) : (
        <AsyncContent
          ready={Boolean(resources.data)}
          fallback={<DealerSupportSkeleton />}
          className="gap-6"
        >
          {resources.data ? (
            <>
              <AnimatedCard index={1} className="gap-3">
                <SectionHeader title="Register Equipment" />
                <ListGroup>
                  <ListItem
                    title="Register Your First LG System"
                    subtitle="Add your first equipment record and begin using your dealer tools."
                    icon={PackagePlus}
                    iconTone="red"
                    variant="row"
                    isLast={registrationResources.length === 0}
                    onPress={() => router.push('/prospect/getting-started')}
                  />
                  {registrationResources.map((resource, index) => (
                    <ListItem
                      key={resource.id}
                      title={resource.title}
                      subtitle={resource.description}
                      meta="Guide"
                      icon={FileText}
                      iconTone="blue"
                      variant="row"
                      isLast={index === registrationResources.length - 1}
                      onPress={() => void openExternalUrl(resource.url)}
                    />
                  ))}
                </ListGroup>
              </AnimatedCard>

              <AnimatedCard index={2} className="gap-3">
                <SectionHeader title="Technical Manuals & Catalogs" />
                <ResourceList
                  resources={technicalResources}
                  emptyMessage="No technical manuals or catalogs are available right now."
                />
              </AnimatedCard>

              <AnimatedCard index={3} className="gap-3">
                <SectionHeader title="LG Apps" />
                <ResourceList
                  resources={appResources}
                  emptyMessage="No LG app resources are available right now."
                />
              </AnimatedCard>

              {marketingResources.length > 0 ? (
                <AnimatedCard index={4} className="gap-3">
                  <SectionHeader title="Marketing Resources" />
                  <ResourceList resources={marketingResources} />
                </AnimatedCard>
              ) : null}

              <AnimatedCard index={5}>
                <RelatedLinks
                  title="More Technical Support"
                  links={dealerSupportLinks}
                />
              </AnimatedCard>
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

function DealerSupportSkeleton() {
  return (
    <SkeletonReveal
      label="Loading technical support"
      className="gap-6"
    >
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[169px]" />
        <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
          <DealerSupportSkeletonRow
            titleLines={1}
            subtitleLines={2}
            iconTone="red"
          />
          <DealerSupportSkeletonRow
            titleLines={1}
            subtitleLines={2}
            metaWidthClassName="w-[34px]"
            iconTone="blue"
            isLast
          />
        </View>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[256px]" />
        <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
          <DealerSupportSkeletonRow
          titleLines={1}
          subtitleLines={2}
            metaWidthClassName="w-[71px]"
            iconTone="red"
            isLast
          />
        </View>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[72px]" />
        <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
          {Array.from({ length: 3 }, (_, index) => (
            <DealerSupportSkeletonRow
              key={`dealer-app-resource-skeleton-${index}`}
              titleLines={1}
              subtitleLines={2}
              metaWidthClassName="w-[24px]"
              iconTone={index % 2 === 0 ? 'red' : 'blue'}
              isLast={index === 2}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[178px]" />
        <View className="gap-3">
          <DealerSupportSkeletonRow
            titleLines={1}
            subtitleLines={2}
            variant="card"
            iconTone="red"
            isLast
          />
          <DealerSupportSkeletonRow
            titleLines={1}
            subtitleLines={2}
            variant="card"
            iconTone="blue"
            isLast
          />
          <DealerSupportSkeletonRow
            titleLines={2}
            subtitleLines={2}
            variant="card"
            iconTone="red"
            isLast
          />
        </View>
      </View>
    </SkeletonReveal>
  );
}

type DealerSupportSkeletonRowProps = {
  iconTone: 'red' | 'blue';
  isLast?: boolean;
  metaWidthClassName?: string;
  subtitleLines: 1 | 2;
  titleLines: 1 | 2;
  variant?: 'card' | 'row';
};

function DealerSupportSkeletonRow({
  iconTone,
  isLast = false,
  metaWidthClassName,
  subtitleLines,
  titleLines,
  variant = 'row',
}: DealerSupportSkeletonRowProps) {
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
        <View>
          {Array.from({ length: titleLines }, (_, index) => (
            <View
              key={`dealer-support-title-skeleton-${index}`}
              className="h-5 justify-center"
            >
              <SkeletonLine
                className={`h-4 ${
                  index === 0 ? 'w-4/5' : 'w-3/5'
                }`}
              />
            </View>
          ))}
        </View>
        <View>
          {Array.from({ length: subtitleLines }, (_, index) => (
            <View
              key={`dealer-support-subtitle-skeleton-${index}`}
              className="h-5 justify-center"
            >
              <SkeletonLine
                className={`h-3 ${
                  index === 0 ? 'w-3/5' : 'w-2/5'
                }`}
                subtle
              />
            </View>
          ))}
        </View>
      </View>
      <View className="shrink-0 flex-row items-center justify-end gap-2">
        {metaWidthClassName ? (
          <SkeletonLine
            className={`h-3 ${metaWidthClassName}`}
            subtle
          />
        ) : null}
        <View className="h-6 w-4 items-center justify-center">
          <SkeletonLine className="h-5 w-4" subtle />
        </View>
      </View>
    </View>
  );
}

type ResourceListProps = {
  resources: Resource[];
  emptyMessage?: string;
};

function ResourceList({ resources, emptyMessage }: ResourceListProps) {
  if (resources.length === 0) {
    return (
      <ListGroup>
        <ListItem
          title={emptyMessage ?? 'No resources are available right now.'}
          icon={BookOpen}
          iconTone="blue"
          variant="row"
          isLast
        />
      </ListGroup>
    );
  }

  return (
    <ListGroup>
      {resources.map((resource, index) => (
        <ListItem
          key={resource.id}
          title={resource.title}
          subtitle={resource.description}
          meta={resource.resourceType === 'APP' ? 'App' : resource.category}
          icon={resource.resourceType === 'APP' ? Smartphone : BookOpen}
          iconTone={index % 2 === 0 ? 'red' : 'blue'}
          variant="row"
          isLast={index === resources.length - 1}
          onPress={() => void openExternalUrl(resource.url)}
        />
      ))}
    </ListGroup>
  );
}
