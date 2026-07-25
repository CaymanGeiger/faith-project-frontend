import { BriefcaseBusiness, Building2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { Badge } from '../../../components/ui/Badge';
import { ListItem } from '../../../components/ui/ListItem';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { LeadStatusEditor } from '../../../features/manager/LeadStatusEditor';
import { AssignedProspect, LeadRecord } from '../../../lib/api/types';
import { leadsApi } from '../../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ManagerProspectsScreen() {
  const prospects = useAsyncData(() => leadsApi.prospects(), []);
  const [selected, setSelected] = useState<AssignedProspect | null>(null);
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setLead(null);
      return;
    }

    setLeadLoading(true);
    setLeadError(null);
    leadsApi
      .lead(selected.userId)
      .then((response) => setLead(response.lead))
      .catch((caught) =>
        setLeadError(caught instanceof Error ? caught.message : 'Unable to load lead'),
      )
      .finally(() => setLeadLoading(false));
  }, [selected]);

  const reloadLead = async () => {
    if (!selected) return;
    const response = await leadsApi.lead(selected.userId);
    setLead(response.lead);
    await prospects.reload();
  };

  return (
    <AppScreen
      title="Assigned Prospects"
      quickLinks={managerQuickLinks}
    >
      <PageHero
        title="Lead Tracking"
        subtitle="Status and notes for assigned prospects."
      />

      {prospects.loading ? <LoadingState label="Loading prospects" /> : null}
      {prospects.error ? (
        <ErrorState message={prospects.error} onRetry={prospects.reload} />
      ) : null}
      {prospects.data ? (
        <View className="gap-3">
          {prospects.data.prospects.map((prospect, index) => (
            <AnimatedCard key={prospect.id} index={index + 1}>
              <ListItem
                title={fullName(prospect.user)}
                subtitle={`${prospect.companyName} · Signed up ${formatShortDate(
                  prospect.signupDate,
                )}`}
                meta={prospect.certificationStatus.replaceAll('_', ' ')}
                icon={Building2}
                iconTone={index % 2 === 0 ? 'red' : 'blue'}
                onPress={() => setSelected(prospect)}
              />
            </AnimatedCard>
          ))}
        </View>
      ) : null}

      <ModalSheet
        title={selected ? fullName(selected.user) : 'Prospect'}
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        <View className="gap-4">
          {selected ? (
            <View className="gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-5">
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {selected.companyName}
              </Text>
              <Text className="font-bold text-hercules-muted">{selected.user.email}</Text>
              <Badge
                label={selected.certificationStatus.replaceAll('_', ' ')}
                tone="red"
              />
            </View>
          ) : null}
          {leadLoading ? <LoadingState label="Loading lead" /> : null}
          {leadError ? <ErrorState message={leadError} /> : null}
          {selected && lead ? (
            <LeadStatusEditor
              prospectUserId={selected.userId}
              lead={lead}
              onSaved={reloadLead}
            />
          ) : null}
        </View>
      </ModalSheet>
    </AppScreen>
  );
}
