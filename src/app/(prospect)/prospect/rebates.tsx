import { BadgeDollarSign } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { PageHero } from '../../../components/ui/PageHero';
import { SkeletonListGroup } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { benefitsApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { openExternalUrl } from '../../../lib/openExternalUrl';

export default function ProspectRebatesScreen() {
  const benefits = useAsyncData(() => benefitsApi.list(), []);
  const rebates = (benefits.data?.benefits ?? []).filter((benefit) =>
    /rebate|discount/i.test(`${benefit.title} ${benefit.benefitType}`),
  );

  return (
    <AppScreen title="Rebates" quickLinks={prospectQuickLinks}>
      <PageHero
        title="Rebates"
        subtitle="Review current dealer savings, promotions, and program-specific offers."
      />

      <AnimatedCard index={1}>
        {benefits.error && !benefits.data ? (
          <ErrorState message={benefits.error} onRetry={benefits.reload} />
        ) : benefits.data && rebates.length === 0 ? (
          <View className="rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-5">
            <Text className="font-bold text-hercules-muted">
              There are no rebate programs available right now.
              Your Hercules representative can help with current eligibility.
            </Text>
          </View>
        ) : rebates.length > 0 ? (
          <ListGroup>
            {rebates.map((rebate, index) => (
              <ListItem
                key={rebate.id}
                title={rebate.title}
                subtitle={rebate.description}
                meta="Learn more"
                icon={BadgeDollarSign}
                iconTone={index % 2 === 0 ? 'red' : 'blue'}
                variant="row"
                isLast={index === rebates.length - 1}
                onPress={() => void openExternalUrl(rebate.url)}
              />
            ))}
          </ListGroup>
        ) : benefits.loading && !benefits.data ? (
          <RebatesSkeleton />
        ) : null}
      </AnimatedCard>
    </AppScreen>
  );
}

function RebatesSkeleton() {
  return (
    <SkeletonReveal label="Loading rebates">
      <SkeletonListGroup
        rows={1}
        titleLines={1}
        subtitleLines={2}
        trailing="meta-chevron"
      />
    </SkeletonReveal>
  );
}
