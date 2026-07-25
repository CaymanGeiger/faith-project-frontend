import { BadgeDollarSign } from 'lucide-react-native';
import { Linking, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { benefitsApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectRebatesScreen() {
  const benefits = useAsyncData(() => benefitsApi.list(), []);
  const rebates = (benefits.data?.benefits ?? []).filter((benefit) =>
    /rebate|discount/i.test(`${benefit.title} ${benefit.benefitType}`),
  );

  return (
    <AppScreen title="Rebates" quickLinks={prospectQuickLinks}>
      <PageHero
        title="Rebates"
        subtitle="Current LG dealer incentives and savings."
      />

      {benefits.loading ? <LoadingState label="Loading rebates" /> : null}
      {benefits.error ? (
        <ErrorState message={benefits.error} onRetry={benefits.reload} />
      ) : null}
      {benefits.data && rebates.length === 0 ? (
        <AnimatedCard index={1}>
          <View className="rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-5">
            <Text className="font-bold text-hercules-muted">
              There are no rebate programs available right now.
            </Text>
          </View>
        </AnimatedCard>
      ) : null}
      {rebates.map((rebate, index) => (
        <AnimatedCard key={rebate.id} index={index + 1}>
          <ListItem
            title={rebate.title}
            subtitle={rebate.description}
            meta="Available"
            icon={BadgeDollarSign}
            iconTone={index % 2 === 0 ? 'red' : 'blue'}
            onPress={() => void Linking.openURL(rebate.url)}
          />
        </AnimatedCard>
      ))}
    </AppScreen>
  );
}
