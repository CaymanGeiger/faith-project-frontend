import { Award, BookOpen, FileText, Gift, Smartphone } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { PageHero } from '../../../components/ui/PageHero';
import { RelatedLinks } from '../../../components/ui/RelatedLinks';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { resourcesApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectResourcesScreen() {
  const resources = useAsyncData(() => resourcesApi.list(), []);

  return (
    <AppScreen
      title="Resources"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <PageHero
        icon={BookOpen}
        title="Dealer Resources"
        subtitle="Catalogs, registration guides, and dealer apps."
      />

      {resources.loading ? <LoadingState label="Loading resources" /> : null}
      {resources.error ? (
        <ErrorState message={resources.error} onRetry={resources.reload} />
      ) : null}
      {resources.data ? (
        <AnimatedCard index={1}>
          <SectionHeader title="Library" />
          <View className="gap-3">
            {resources.data.resources.map((resource, index) => (
              <ListItem
                key={resource.id}
                title={resource.title}
                subtitle={`${resource.category} · ${resource.description}`}
                meta={resource.resourceType.replaceAll('_', ' ')}
                icon={resource.resourceType === 'APP' ? Smartphone : FileText}
                iconTone={index % 2 === 0 ? 'red' : 'blue'}
                onPress={() => void Linking.openURL(resource.url)}
              />
            ))}
          </View>
        </AnimatedCard>
      ) : null}

      <AnimatedCard index={2}>
        <RelatedLinks
          title="More Dealer Support"
          links={[
            {
              title: 'Dealer Benefits',
              description: 'Find discounts, warranty support, and lead generation benefits.',
              href: '/prospect/benefits',
              icon: Gift,
              tone: 'red',
            },
            {
              title: 'Marketing Consultation',
              description: 'Share your availability and connect with the marketing team.',
              href: '/prospect/marketing',
              icon: Award,
              tone: 'blue',
            },
          ]}
        />
      </AnimatedCard>
    </AppScreen>
  );
}
