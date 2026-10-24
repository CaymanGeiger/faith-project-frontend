import { BadgeDollarSign } from 'lucide-react-native';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { ListGroup } from '../../components/ui/ListGroup';
import { ListItem } from '../../components/ui/ListItem';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonListRow } from '../../components/ui/SkeletonPrimitives';
import { ErrorState } from '../../components/ui/StateViews';
import { useAsyncData } from '../../lib/hooks/useAsyncData';
import { isAllowedContentUrl } from '../content/contentPolicy';
import { useInAppContent } from '../content/InAppContentProvider';
import { financingApi } from './financingApi';

export function FinancingCard() {
  const { openContent } = useInAppContent();
  const request = useAsyncData(financingApi.get, []);
  const financing = request.data?.financing;
  const available = Boolean(
    financing?.available &&
    financing.description?.trim() &&
    financing.url &&
    isAllowedContentUrl(financing.url),
  );
  const destination = available && financing?.url
    ? { url: financing.url, title: 'Synchrony Financing' }
    : null;

  return (
    <AnimatedCard index={4} className="gap-3">
      <SectionHeader title="Financing" />
      {request.error ? (
        <ErrorState message="Financing information could not be loaded." onRetry={request.reload} />
      ) : (
        <ListGroup>
          {request.loading && !request.data ? (
            <SkeletonListRow titleLines={1} subtitleLines={2} iconTone="blue" isLast />
          ) : (
            <ListItem
              title="Synchrony Financing"
              subtitle={available && financing?.description
                ? financing.description
                : 'Synchrony financing information is not available in the app yet. Contact your Hercules representative for help.'}
              subtitleNumberOfLines={0}
              meta={available ? 'View financing information' : 'Details unavailable'}
              icon={BadgeDollarSign}
              iconTone="blue"
              variant="row"
              isLast
              onPress={destination
                ? () => openContent(destination)
                : undefined}
            />
          )}
        </ListGroup>
      )}
    </AnimatedCard>
  );
}
