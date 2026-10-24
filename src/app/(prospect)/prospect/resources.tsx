import { RestrictedSupport } from '../../../features/onboarding/RestrictedSupport';
import { hasRestrictedAccess } from '../../../features/onboarding/access';
import { useAuth } from '../../../features/auth/AuthProvider';
import { router } from 'expo-router';
import {
  Award,
  BookOpen,
  FileText,
  Mail,
  MessageCircle,
  PackagePlus,
  Phone,
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
import type { RelatedLink } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  SkeletonListRow,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useInAppContent } from '../../../features/content/InAppContentProvider';
import { resourcesApi } from '../../../lib/api/endpoints';
import type { Resource } from '../../../lib/api/types';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { openExternalUrl } from '../../../lib/openExternalUrl';

const dealerSupportLinks = [
  {
    title: 'Marketing Resources',
    description: 'Consultations and business-growth support.',
    href: '/prospect/marketing',
    icon: Award,
    tone: 'blue',
  },
  {
    title: 'Chat with Your Representative',
    description: 'Get help with Getting Started.',
    href: '/prospect/messages',
    icon: MessageCircle,
    tone: 'red',
  },
] satisfies RelatedLink[];

const lgWarrantyRegistrationUrl = 'https://lg-dfs-warranty.com/register';
const equipmentSupportPhoneUrl = 'tel:8443362753';
const equipmentSupportEmailUrl = 'mailto:equipsupport@hercmail.com';
const warrantyPartsClaimFormUrl =
  'https://www.herculesindustries.com/ASSETS/DOCUMENTS/CMS/EN/Warranty/Warranty%20Claim%20Form%202025.pdf';

export default function ProspectResourcesScreen() {
  const { user } = useAuth();
  return hasRestrictedAccess(user) ? <RestrictedSupport /> : <FullProspectResourcesScreen />;
}

function FullProspectResourcesScreen() {
  const resources = useAsyncData(() => resourcesApi.list(), []);
  const resourceList = resources.data?.resources ?? [];
  const registrationResources = resourceList.filter(
    (resource) =>
      resource.resourceType !== 'REGISTRATION_OVERVIEW' &&
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

      <RegisterEquipmentCard resources={registrationResources} />

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
            </>
          ) : null}
        </AsyncContent>
      )}

      <SupportSections />
    </AppScreen>
  );
}

function RegisterEquipmentCard({ resources }: { resources: Resource[] }) {
  const { openContent } = useInAppContent();

  return (
    <AnimatedCard index={1} className="gap-3">
      <SectionHeader title="Register Equipment" />
      <ListGroup>
        <ListItem
          title="Register Your First LG System"
          subtitle="Complete LG warranty registration for your equipment."
          icon={PackagePlus}
          iconTone="red"
          variant="row"
          isLast={resources.length === 0}
          onPress={() =>
            openContent({ url: lgWarrantyRegistrationUrl, title: 'LG Warranty Registration' })
          }
        />
        {resources.map((resource, index) => (
          <ListItem
            key={resource.id}
            title={resource.title}
            subtitle={resource.description}
            meta="Guide"
            icon={FileText}
            iconTone="blue"
            variant="row"
            isLast={index === resources.length - 1}
            onPress={() => openContent({ url: resource.url, title: resource.title })}
          />
        ))}
      </ListGroup>
    </AnimatedCard>
  );
}

function SupportSections() {
  const { openContent } = useInAppContent();

  return (
    <>
      <AnimatedCard index={5} className="gap-3">
        <SectionHeader title="Equipment Support" />
        <ListGroup>
          <ListItem
            title="Call Tech Support"
            subtitle="(844) 336-2753"
            icon={Phone}
            iconTone="red"
            variant="row"
            onPress={() => void openExternalUrl(equipmentSupportPhoneUrl)}
          />
          <ListItem
            title="Email Tech Support"
            subtitle="equipsupport@hercmail.com"
            icon={Mail}
            iconTone="blue"
            variant="row"
            isLast
            onPress={() => void openExternalUrl(equipmentSupportEmailUrl)}
          />
        </ListGroup>
      </AnimatedCard>

      <AnimatedCard index={6} className="gap-3">
        <SectionHeader title="Warranty & Claims" />
        <ListGroup>
          <ListItem
            title="Parts Claim Form (PDF)"
            subtitle="Warranty paperwork for replacement parts."
            icon={FileText}
            iconTone="red"
            variant="row"
            onPress={() =>
              openContent({
                url: warrantyPartsClaimFormUrl,
                title: 'Warranty Parts Claim Form',
                kind: 'pdf',
              })
            }
          />
          <ListItem
            title="Warranty Help"
            subtitle="Warranty resources and JB Warranties guidance."
            icon={ShieldCheck}
            iconTone="red"
            variant="row"
            isLast
            onPress={() => router.push('/prospect/benefits')}
          />
        </ListGroup>
      </AnimatedCard>

      <AnimatedCard index={7} className="gap-3">
        <SectionHeader title="Dealer Support" />
        <ListGroup>
          {dealerSupportLinks.map((link, index) => (
            <ListItem
              key={link.title}
              title={link.title}
              subtitle={link.description}
              icon={link.icon}
              iconTone={link.tone}
              variant="row"
              isLast={index === dealerSupportLinks.length - 1}
              onPress={() => router.push(link.href)}
            />
          ))}
        </ListGroup>
      </AnimatedCard>
    </>
  );
}

function DealerSupportSkeleton() {
  return (
    <SkeletonReveal
      label="Loading technical support"
      className="gap-6"
    >
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[256px]" />
        <ListGroup>
          <SkeletonListRow
            titleLines={1}
            subtitleLines={2}
            metaWidthClassName="w-[71px]"
            iconTone="red"
            isLast
          />
        </ListGroup>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[72px]" />
        <ListGroup>
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonListRow
              key={`dealer-app-resource-skeleton-${index}`}
              titleLines={1}
              subtitleLines={2}
              metaWidthClassName="w-[24px]"
              iconTone={index % 2 === 0 ? 'red' : 'blue'}
              isLast={index === 2}
            />
          ))}
        </ListGroup>
      </View>
    </SkeletonReveal>
  );
}

type ResourceListProps = {
  resources: Resource[];
  emptyMessage?: string;
};

function ResourceList({ resources, emptyMessage }: ResourceListProps) {
  const { openContent } = useInAppContent();

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
          onPress={() => openContent({ url: resource.url, title: resource.title })}
        />
      ))}
    </ListGroup>
  );
}
