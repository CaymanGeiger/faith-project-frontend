import { BookOpen, CalendarDays, Gift, Smartphone } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { PageHero } from '../../../components/ui/PageHero';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { benefitsApi, classesApi, resourcesApi } from '../../../lib/api/endpoints';
import { formatShortDate } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ManagerResourcesScreen() {
  const support = useAsyncData(async () => {
    const [resources, classes, benefits] = await Promise.all([
      resourcesApi.list(),
      classesApi.list(),
      benefitsApi.list(),
    ]);
    return { resources, classes, benefits };
  }, []);

  return (
    <AppScreen
      title="Support Resources"
      quickLinks={managerQuickLinks}
    >
      <PageHero
        title="Shared Resources"
        subtitle="Classes, resources, and benefits for prospect support."
      />

      {support.loading ? <LoadingState label="Loading support items" /> : null}
      {support.error ? (
        <ErrorState message={support.error} onRetry={support.reload} />
      ) : null}
      {support.data ? (
        <>
          <AnimatedCard index={1}>
            <SectionHeader title="Classes" />
            <View className="gap-3">
              {support.data.classes.classes.map((session) => (
                <ListItem
                  key={session.id}
                  title={session.title}
                  subtitle={formatShortDate(session.startsAt)}
                  meta={session.status}
                  icon={CalendarDays}
                  iconTone="red"
                />
              ))}
            </View>
          </AnimatedCard>

          <AnimatedCard index={2}>
            <SectionHeader title="Resources" />
            <View className="gap-3">
              {support.data.resources.resources.map((resource) => (
                <ListItem
                  key={resource.id}
                  title={resource.title}
                  subtitle={resource.description}
                  meta={resource.category}
                  icon={resource.resourceType === 'APP' ? Smartphone : BookOpen}
                  iconTone="blue"
                  onPress={() => void Linking.openURL(resource.url)}
                />
              ))}
            </View>
          </AnimatedCard>

          <AnimatedCard index={3}>
            <SectionHeader title="Benefits" />
            <View className="gap-3">
              {support.data.benefits.benefits.map((benefit) => (
                <ListItem
                  key={benefit.id}
                  title={benefit.title}
                  subtitle={benefit.description}
                  meta={benefit.benefitType.replaceAll('_', ' ')}
                  icon={Gift}
                  iconTone="red"
                  onPress={() => void Linking.openURL(benefit.url)}
                />
              ))}
            </View>
          </AnimatedCard>
        </>
      ) : null}
    </AppScreen>
  );
}
