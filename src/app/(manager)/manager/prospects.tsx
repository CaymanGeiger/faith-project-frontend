import { Building2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
  SkeletonListRow,
  SkeletonPrimaryButton,
  SkeletonTextField,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { LeadStatusEditor } from '../../../features/manager/LeadStatusEditor';
import { TrainingVerification } from '../../../features/onboarding/TrainingVerification';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { AssignedProspect, LeadRecord } from '../../../lib/api/types';
import { leadsApi } from '../../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../../lib/format';

export default function ManagerProspectsScreen() {
  const { prospects } = useManagerData();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selected = prospects.data?.prospects.find(prospect => prospect.userId === selectedUserId) ?? null;
  const [loadedLead, setLoadedLead] = useState<{
    userId: string;
    lead: LeadRecord;
  } | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadReloadVersion, setLeadReloadVersion] = useState(0);
  const selectedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedUserId && prospects.data && !selected) {
      selectedUserIdRef.current = null;
      setSelectedUserId(null);
      setLoadedLead(null);
      setLeadError(null);
    }
  }, [prospects.data, selected, selectedUserId]);

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
  }, [leadReloadVersion, selectedUserId]);

  const openProspect = (prospect: AssignedProspect) => {
    selectedUserIdRef.current = prospect.userId;
    setLoadedLead(null);
    setLeadError(null);
    setSelectedUserId(prospect.userId);
  };

  const closeProspect = () => {
    selectedUserIdRef.current = null;
    setSelectedUserId(null);
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
            <AnimatedCard index={1}>
              <ListGroup>
                {prospects.data.prospects.map((prospect, index) => (
                  <ListItem
                    key={prospect.id}
                    title={fullName(prospect.user) || prospect.user.email}
                    subtitle={`${prospect.companyName} · ${getDealerGuidance(
                      prospect,
                    ).title}`}
                    meta={prospect.user.status === 'INVITED' ? 'ACTIVATION PENDING' : prospect.certificationStatus.replaceAll('_', ' ')}
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
        title={selected ? fullName(selected.user) || selected.user.email : 'Dealer'}
        visible={Boolean(selected)}
        avoidKeyboard
        onClose={closeProspect}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-4"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {selected ? (
            <View className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {selected.companyName}
              </Text>
              <Text className="font-bold text-hercules-muted">{selected.user.email}</Text>
              <Text className="text-xs font-extrabold uppercase tracking-[0.7px] text-hercules-muted">
                Certification stage
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
          {selected ? <TrainingVerification key={selected.userId} prospectUserId={selected.userId} onVerified={prospects.reload} /> : null}
          {selected && leadError && !selectedLead ? (
            <ErrorState message={leadError} onRetry={() => setLeadReloadVersion(version => version + 1)} />
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
        </ScrollView>
      </ModalSheet>
    </AppScreen>
  );
}

function ManagerProspectsSkeleton() {
  return (
    <SkeletonReveal label="Loading prospects">
      <ListGroup>
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonListRow
            key={`manager-prospect-${index}`}
            subtitleWidthClassNames={['w-4/5']}
            metaWidth={83}
            chevronWidthClassName="w-2"
            iconTone={index === 0 ? 'red' : 'blue'}
            isLast={index === 1}
          />
        ))}
      </ListGroup>
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
  if (prospect.user.status === 'INVITED') {
    return {
      title: 'Account activation pending',
      description: 'The registration is saved. The dealer must verify their email and set a password from Activate Account before signing in.',
    };
  }
  if (prospect.certificationStatus === 'CERTIFIED') {
    return {
      title: 'Support ongoing dealer growth',
      description:
        'Review warranty and marketing milestones, then keep the dealer engaged with updates, offers, training, and lead support.',
    };
  }
  if (prospect.user.initialTrainingVerifiedAt) {
    return {
      title: 'Review remaining dealer milestones',
      description:
        'Initial training is verified and dealer features are available. Review warranty and marketing milestones and help the dealer with their next steps.',
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
      'Guide the dealer to an upcoming LG training session and explain the next step in getting started.',
  };
}
