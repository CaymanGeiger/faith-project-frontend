import { Building2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { Badge } from '../../../components/ui/Badge';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PageHero } from '../../../components/ui/PageHero';
import {
  SkeletonLine,
  SkeletonPrimaryButton,
  SkeletonTextField,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { LeadStatusEditor } from '../../../features/manager/LeadStatusEditor';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { AssignedProspect, LeadRecord } from '../../../lib/api/types';
import { leadsApi } from '../../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../../lib/format';

export default function ManagerProspectsScreen() {
  const { prospects } = useManagerData();
  const [selected, setSelected] = useState<AssignedProspect | null>(null);
  const [loadedLead, setLoadedLead] = useState<{
    userId: string;
    lead: LeadRecord;
  } | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const selectedUserId = selected?.userId ?? null;

  useEffect(() => {
    const userId = selectedUserId;

    if (!userId) {
      setLoadedLead(null);
      setLeadError(null);
      return;
    }

    let active = true;
    setLoadedLead(null);
    setLeadError(null);
    leadsApi
      .lead(userId)
      .then((response) => {
        if (active && selectedUserIdRef.current === userId) {
          setLoadedLead({ userId, lead: response.lead });
        }
      })
      .catch((caught) => {
        if (active && selectedUserIdRef.current === userId) {
          setLeadError(
            caught instanceof Error ? caught.message : 'Unable to load lead',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [selectedUserId]);

  const openProspect = (prospect: AssignedProspect) => {
    selectedUserIdRef.current = prospect.userId;
    setLoadedLead(null);
    setLeadError(null);
    setSelected(prospect);
  };

  const closeProspect = () => {
    selectedUserIdRef.current = null;
    setSelected(null);
    setLoadedLead(null);
    setLeadError(null);
  };

  const reloadLead = async () => {
    const userId = selectedUserId;
    if (!userId || selectedUserIdRef.current !== userId) return;

    const response = await leadsApi.lead(userId);
    if (selectedUserIdRef.current !== userId) return;

    setLoadedLead({ userId, lead: response.lead });
    await prospects.reload();
  };

  const selectedLead =
    selected && loadedLead?.userId === selected.userId
      ? loadedLead.lead
      : null;

  return (
    <AppScreen
      title="Dealer Success"
      quickLinks={managerQuickLinks}
    >
      <PageHero
        title="Dealer Success"
        subtitle="Track each dealer's current stage, next action, and follow-up notes."
        reveal={false}
      />

      {prospects.error && !prospects.data ? (
        <ErrorState message={prospects.error} onRetry={prospects.reload} />
      ) : null}
      {(prospects.loading && !prospects.data) || prospects.data ? (
        <AsyncContent
          ready={Boolean(prospects.data)}
          fallback={<ManagerProspectsSkeleton />}
        >
          {prospects.data ? (
            <AnimatedCard reveal={false}>
              <ListGroup>
                {prospects.data.prospects.map((prospect, index) => (
                  <ListItem
                    key={prospect.id}
                    title={fullName(prospect.user)}
                    subtitle={`${prospect.companyName} · ${getDealerGuidance(
                      prospect,
                    ).title}`}
                    meta={prospect.certificationStatus.replaceAll('_', ' ')}
                    icon={Building2}
                    iconTone={index % 2 === 0 ? 'red' : 'blue'}
                    variant="row"
                    isLast={
                      index === (prospects.data?.prospects.length ?? 0) - 1
                    }
                    subtitleNumberOfLines={1}
                    onPress={() => openProspect(prospect)}
                  />
                ))}
              </ListGroup>
            </AnimatedCard>
          ) : null}
        </AsyncContent>
      ) : null}

      <ModalSheet
        title={selected ? fullName(selected.user) : 'Dealer'}
        visible={Boolean(selected)}
        onClose={closeProspect}
      >
        <View className="gap-4">
          {selected ? (
            <View className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {selected.companyName}
              </Text>
              <Text className="font-bold text-hercules-muted">{selected.user.email}</Text>
              <Text className="text-xs font-extrabold uppercase tracking-[0.7px] text-hercules-muted">
                Current training stage
              </Text>
              <Badge
                label={selected.certificationStatus.replaceAll('_', ' ')}
                tone="red"
              />
            </View>
          ) : null}
          {selected ? (
            <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
              <View className="gap-1">
                <Text className="text-xs font-extrabold uppercase tracking-[0.7px] text-hercules-red">
                  Recommended Next Step
                </Text>
                <Text className="text-xl font-extrabold text-hercules-ink">
                  {getDealerGuidance(selected).title}
                </Text>
                <Text className="text-sm leading-5 text-hercules-muted">
                  {getDealerGuidance(selected).description}
                </Text>
              </View>
              <View className="gap-1 border-t border-hercules-blue/10 pt-3">
                <Text className="text-xs font-bold text-hercules-muted">
                  Joined {formatShortDate(selected.signupDate)}
                </Text>
                <Text className="text-xs font-bold text-hercules-muted">
                  Warranty target {formatShortDate(selected.jbWarrantiesDueAt)}
                </Text>
                <Text className="text-xs font-bold text-hercules-muted">
                  Marketing target{' '}
                  {formatShortDate(selected.marketingConsultationDueAt)}
                </Text>
              </View>
            </View>
          ) : null}
          {selected && leadError && !selectedLead ? (
            <ErrorState message={leadError} />
          ) : selected ? (
            <AsyncContent
              ready={Boolean(selectedLead)}
              fallback={<LeadEditorSkeleton />}
            >
              {selectedLead ? (
                <LeadStatusEditor
                  prospectUserId={selected.userId}
                  lead={selectedLead}
                  onSaved={reloadLead}
                />
              ) : null}
            </AsyncContent>
          ) : null}
        </View>
      </ModalSheet>
    </AppScreen>
  );
}

function ManagerProspectsSkeleton() {
  return (
    <SkeletonReveal label="Loading prospects">
      <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
        {Array.from({ length: 2 }, (_, index) => (
          <View
            key={`manager-prospect-${index}`}
            className={`min-h-[76px] flex-row items-center gap-3 px-4 py-3 ${
              index === 1 ? '' : 'border-b border-hercules-blue/10'
            }`}
          >
            <View
              className={`h-10 w-10 shrink-0 rounded-[12px] ${
                index === 0
                  ? 'bg-hercules-red/15'
                  : 'bg-hercules-blue/15'
              }`}
            />
            <View className="min-w-0 flex-1 gap-1">
              <View className="h-5 justify-center">
                <SkeletonLine className="h-4 w-4/5" />
              </View>
              <View className="h-5 justify-center">
                <SkeletonLine className="h-3 w-4/5" subtle />
              </View>
            </View>
            <View className="shrink-0 flex-row items-center justify-end gap-2">
              <View className="h-4 w-[83px] justify-center">
                <SkeletonLine className="h-3 w-full" subtle />
              </View>
              <View className="h-6 w-4 items-center justify-center">
                <SkeletonLine className="h-5 w-2" subtle />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonReveal>
  );
}

function LeadEditorSkeleton() {
  return (
    <SkeletonReveal label="Loading lead">
      <View className="gap-4">
        <SkeletonLine className="h-7 w-2/5" />
        <View className="flex-row rounded-[18px] border border-hercules-blue bg-hercules-white p-1">
          {Array.from({ length: 5 }, (_, index) => (
            <View
              key={`lead-status-skeleton-${index}`}
              className={`min-h-10 flex-1 items-center justify-center rounded-[14px] ${
                index === 0 ? 'bg-hercules-blue/15' : ''
              }`}
            >
              <SkeletonLine
                className={`h-2 ${index === 1 ? 'w-4/5' : 'w-3/5'}`}
                subtle={index !== 0}
              />
            </View>
          ))}
        </View>
        <SkeletonTextField
          labelWidthClassName="w-1/4"
          multiline
        />
        <SkeletonPrimaryButton />
      </View>
    </SkeletonReveal>
  );
}

function getDealerGuidance(prospect: AssignedProspect) {
  if (prospect.certificationStatus === 'CERTIFIED') {
    return {
      title: 'Support ongoing dealer growth',
      description:
        'Review warranty and marketing milestones, then keep the dealer engaged with updates, offers, training, and lead support.',
    };
  }
  if (prospect.certificationStatus === 'IN_PROGRESS') {
    return {
      title: 'Follow up on LG training',
      description:
        'Confirm the selected session, answer questions, and help the dealer complete required training.',
    };
  }
  return {
    title: 'Help choose LG training',
    description:
      'Guide the dealer to an upcoming LG training session and explain the current onboarding next step.',
  };
}
