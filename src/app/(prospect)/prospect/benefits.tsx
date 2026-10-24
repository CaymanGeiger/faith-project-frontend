import { router } from 'expo-router';
import {
  BadgeDollarSign,
  CalendarDays,
  Gift,
  Handshake,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListGroup } from '../../../components/ui/ListGroup';
import { ListItem } from '../../../components/ui/ListItem';
import { PageHero } from '../../../components/ui/PageHero';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  SkeletonListRow,
  SkeletonListGroup,
  SkeletonSectionHeader,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useInAppContent } from '../../../features/content/InAppContentProvider';
import { FinancingCard } from '../../../features/financing/FinancingCard';
import { accountApi, benefitsApi } from '../../../lib/api/endpoints';
import type { Benefit } from '../../../lib/api/types';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectBenefitsScreen() {
  const { openContent } = useInAppContent();
  const page = useAsyncData(async () => {
    const [benefits, onboarding] = await Promise.all([
      benefitsApi.list(),
      accountApi.onboarding(),
    ]);
    return { benefits: benefits.benefits, onboarding };
  }, []);

  const summary = page.data?.onboarding.summary;
  const benefitList = page.data?.benefits ?? [];

  return (
    <AppScreen
      title="Benefits"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-8 pt-4"
    >
      <PageHero
        title="Your Dealer Benefits"
        subtitle="See the programs, support, and tools available through Hercules, plus your next steps."
      />

      {page.error && !page.data ? (
        <ErrorState message={page.error} onRetry={page.reload} />
      ) : page.data && summary ? (
        <>
          <AnimatedCard index={1} className="gap-3">
            <SectionHeader title="Your Getting Started Progress" />
            <ListGroup>
              <ListItem
                title="Training & Product Support"
                subtitle="Build your skills with LG training, technical resources, and product updates."
                meta={
                  summary.trainingCompleted
                    ? 'Completed'
                    : summary.trainingSelected
                      ? 'In progress'
                      : 'Next step'
                }
                icon={CalendarDays}
                iconTone="red"
                variant="row"
                onPress={() => router.push('/prospect/classes')}
              />
              <ListItem
                title="Warranty Support"
                subtitle="Find warranty resources and complete your JB Warranties setup."
                meta={
                  summary.jbWarrantiesCompleted
                    ? 'Setup complete'
                    : 'Action required'
                }
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
                title="Marketing Consultation"
                subtitle="Find marketing tools and support for growing your business."
                meta={
                  summary.marketingConsultationSubmitted
                    ? 'Availability saved'
                    : 'Action required'
                }
                icon={Megaphone}
                iconTone="red"
                variant="row"
                onPress={() => router.push('/prospect/marketing')}
              />
              <ListItem
                title="Rebates"
                subtitle="Review current program savings, promotions, and eligibility details."
                meta="Learn more"
                icon={BadgeDollarSign}
                iconTone="blue"
                variant="row"
                isLast
                onPress={() => router.push('/prospect/rebates')}
              />
            </ListGroup>
          </AnimatedCard>

          <AnimatedCard index={2} className="gap-3">
            <SectionHeader title="Program Benefits" />
            <ListGroup>
              {benefitList.map((benefit, index) => (
                <ListItem
                  key={benefit.id}
                  title={benefit.title}
                  subtitle={benefit.description}
                  meta="Learn more"
                  icon={benefitIcon(benefit)}
                  iconTone={index % 2 === 0 ? 'red' : 'blue'}
                  variant="row"
                  isLast={index === benefitList.length - 1}
                  onPress={benefit.url
                    ? () => openContent({ url: benefit.url, title: benefit.title })
                    : undefined}
                />
              ))}
              {benefitList.length === 0 ? (
                <ListItem
                  title="Benefit details are being prepared"
                  subtitle="Your Hercules representative can help with current program availability."
                  icon={Gift}
                  iconTone="blue"
                  variant="row"
                  isLast
                  onPress={() => router.push('/prospect/messages')}
                />
              ) : null}
            </ListGroup>
          </AnimatedCard>

          <AnimatedCard index={3} className="gap-3">
            <SectionHeader title="Keep Growing" />
            <ListGroup>
              <ListItem
                title="Lead & Business Support"
                subtitle="Ask your Hercules representative about current lead and growth support."
                icon={Handshake}
                iconTone="red"
                variant="row"
                onPress={() => router.push('/prospect/messages')}
              />
              <ListItem
                title="Hercules Honors Rewards"
                subtitle="Keep up with training, resources, promotions, and dealer support."
                icon={Sparkles}
                iconTone="blue"
                variant="row"
                isLast
                onPress={() => router.push('/prospect/getting-started')}
              />
            </ListGroup>
          </AnimatedCard>

          <FinancingCard />
        </>
      ) : (
        <BenefitsSkeleton />
      )}
    </AppScreen>
  );
}

function BenefitsSkeleton() {
  return (
    <SkeletonReveal label="Loading benefits" className="gap-4">
      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[187px]" />
        <ListGroup>
          <SkeletonListRow
            subtitleLines={2}
            titleLines={2}
            metaWidthClassName="w-[57px]"
            iconTone="red"
          />
          <SkeletonListRow
            subtitleLines={2}
            titleLines={1}
            metaWidthClassName="w-[88px]"
            iconTone="blue"
          />
          <SkeletonListRow
            subtitleLines={2}
            titleLines={2}
            metaWidthClassName="w-[88px]"
            iconTone="red"
          />
          <SkeletonListRow
            subtitleLines={2}
            titleLines={1}
            metaWidthClassName="w-[66px]"
            iconTone="blue"
            isLast
          />
        </ListGroup>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[150px]" />
        <ListGroup>
          <SkeletonListRow
            titleLines={1}
            subtitleLines={2}
            metaWidthClassName="w-[66px]"
            iconTone="red"
          />
          <SkeletonListRow
            titleLines={1}
            subtitleLines={2}
            metaWidthClassName="w-[66px]"
            iconTone="blue"
          />
          <SkeletonListRow
            titleLines={1}
            subtitleLines={1}
            metaWidthClassName="w-[66px]"
            iconTone="red"
            isLast
          />
        </ListGroup>
      </View>

      <View className="gap-3">
        <SkeletonSectionHeader widthClassName="w-[120px]" />
        <SkeletonListGroup
          rows={2}
          titleLines={1}
          subtitleLines={2}
          trailing="chevron"
        />
      </View>
    </SkeletonReveal>
  );
}

function benefitIcon(benefit: Benefit) {
  if (benefit.benefitType === 'WARRANTY') {
    return ShieldCheck;
  }
  if (benefit.benefitType === 'LEAD_GENERATION') {
    return Handshake;
  }
  if (benefit.benefitType === 'DISCOUNT') {
    return BadgeDollarSign;
  }
  return Gift;
}
