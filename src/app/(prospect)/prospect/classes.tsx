import { router } from 'expo-router';
import { Award, ExternalLink, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { ListItem } from '../../../components/ui/ListItem';
import { ListGroup } from '../../../components/ui/ListGroup';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PageHero } from '../../../components/ui/PageHero';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { SkeletonLine } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { classesApi } from '../../../lib/api/endpoints';
import type { ClassSession } from '../../../lib/api/types';
import { formatShortDate, formatTime } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { colors } from '../../../lib/theme/theme';

const herculesEventCalendarUrl = 'https://www.herculesindustries.com/eventcalendar';

export default function ProspectClassesScreen() {
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const classes = useAsyncData(() => classesApi.list(), []);
  const classSessions = classes.data?.classes ?? [];

  const openEventCalendar = async () => {
    setActionError(null);
    try {
      await Linking.openURL(herculesEventCalendarUrl);
    } catch {
      setActionError('Unable to open the Hercules event calendar.');
    }
  };

  const registerForSelected = async () => {
    if (!selected || selected.enrollmentStatus === 'COMPLETED') {
      return;
    }

    setRegistering(true);
    setActionError(null);
    try {
      await classesApi.enroll(selected.id);
      setSelected({
        ...selected,
        isEnrolled: true,
        enrollmentStatus: 'ENROLLED',
      });
      await classes.reload();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Unable to register for this training session.',
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <AppScreen
      title="Training"
      quickLinks={prospectQuickLinks}
    >
      <PageHero
        title="LG Training"
        subtitle="Explore available LG training and work with Hercules to confirm the sessions and program requirements that apply to your business."
      />

      {actionError ? <ErrorState message={actionError} /> : null}

      <AnimatedCard index={1} className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <View className="gap-2">
          <SectionHeader title="Choose an Upcoming Class" />
          <Text className="text-[15px] leading-5 text-hercules-muted">
            Save your training preference here. A Hercules representative will
            confirm final enrollment, schedule details, and availability.
          </Text>
        </View>
        <PrimaryButton
          label="Browse LG Training"
          icon={ExternalLink}
          onPress={openEventCalendar}
        />
      </AnimatedCard>

      <AnimatedCard index={2} className="gap-3">
        <SectionHeader title="Upcoming Classes" />
        {classes.error && !classes.data ? (
          <ErrorState message={classes.error} onRetry={classes.reload} />
        ) : (
          <AsyncContent
            ready={Boolean(classes.data)}
            fallback={<TrainingClassListSkeleton />}
          >
            {classes.data ? (
              classSessions.length > 0 ? (
                <ListGroup>
                  {classSessions.map((session, index) => (
                    <ListItem
                      key={session.id}
                      title={session.title}
                      subtitle={`${formatShortDate(
                        session.startsAt,
                      )} · ${formatTime(session.startsAt)}`}
                      meta={
                        session.enrollmentStatus === 'COMPLETED'
                          ? 'Completed'
                          : session.enrollmentStatus === 'ENROLLED'
                            ? 'Preference saved'
                            : session.status
                      }
                      icon={Video}
                      iconTone={
                        session.enrollmentStatus === 'ENROLLED' ||
                        session.enrollmentStatus === 'COMPLETED'
                          ? 'blue'
                          : 'red'
                      }
                      variant="row"
                      isLast={index === classSessions.length - 1}
                      onPress={() => setSelected(session)}
                    />
                  ))}
                </ListGroup>
              ) : (
                <View className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
                  <View className="gap-2">
                    <Text className="text-lg font-extrabold text-hercules-ink">
                      No upcoming classes are available right now.
                    </Text>
                    <Text className="text-[15px] leading-5 text-hercules-muted">
                      Contact your Hercules representative for help finding the
                      next session.
                    </Text>
                  </View>
                  <PrimaryButton
                    label="Open Technical Support"
                    onPress={() => router.push('/prospect/resources')}
                  />
                </View>
              )
            ) : null}
          </AsyncContent>
        )}
      </AnimatedCard>

      <AsyncContent
        ready={Boolean(classes.data)}
        fallback={<TrainingUnlockSkeleton />}
        className="gap-6"
      >
        {classes.data ? (
          <AnimatedCard
            index={3}
            className="flex-row items-start gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5"
          >
            <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-hercules-blue">
              <Award size={21} color={colors.white} strokeWidth={2.4} />
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-lg font-extrabold text-hercules-ink">
                Training & Program Information
              </Text>
              <Text className="text-[15px] leading-5 text-hercules-muted">
                Completing training can help you access current program resources
                and eligibility information. Availability, pricing, and incentives
                depend on current program terms and confirmation by Hercules and LG.
              </Text>
            </View>
          </AnimatedCard>
        ) : null}
      </AsyncContent>

      <ModalSheet
        title="Training Details"
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <View className="gap-4">
            {actionError ? <ErrorState message={actionError} /> : null}
            <View className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
              <Text className="text-2xl font-extrabold text-hercules-ink">
                {selected.title}
              </Text>
              <Text className="text-base leading-6 text-hercules-muted">
                {selected.description}
              </Text>
              <Text className="font-bold text-hercules-blue">
                {formatShortDate(selected.startsAt)} · {formatTime(selected.startsAt)}
              </Text>
            </View>
            <PrimaryButton
              label={
                selected.enrollmentStatus === 'COMPLETED'
                  ? 'Training Complete'
                  : selected.enrollmentStatus === 'ENROLLED'
                    ? 'Preference saved'
                    : 'Save Training Preference'
              }
              onPress={registerForSelected}
              loading={registering}
              disabled={
                selected.enrollmentStatus === 'ENROLLED' ||
                selected.enrollmentStatus === 'COMPLETED'
              }
            />
          </View>
        ) : null}
      </ModalSheet>
    </AppScreen>
  );
}

function TrainingClassListSkeleton() {
  return (
    <SkeletonReveal label="Loading classes">
      <View className="overflow-hidden rounded-[18px] border border-hercules-blue/15 bg-hercules-white">
        {Array.from({ length: 2 }, (_, index) => (
          <View
            key={`training-class-row-skeleton-${index}`}
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
              <View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-4 w-4/5" />
                </View>
                <View className="h-5 justify-center">
                  <SkeletonLine className="h-4 w-3/5" />
                </View>
              </View>
              <View className="h-5 justify-center">
                <SkeletonLine className="h-3 w-3/5" subtle />
              </View>
            </View>
            <View className="shrink-0 flex-row items-center justify-end gap-2">
              <SkeletonLine className="h-3 w-[74px]" subtle />
              <View className="h-6 w-4 items-center justify-center">
                <SkeletonLine className="h-5 w-4" subtle />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonReveal>
  );
}

function TrainingUnlockSkeleton() {
  return (
    <SkeletonReveal>
      <View className="flex-row items-start gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <View className="h-10 w-10 rounded-[12px] bg-hercules-blue/15" />
        <View className="min-w-0 flex-1 gap-2">
          <View className="h-6 justify-center">
            <SkeletonLine className="h-5 w-3/5" />
          </View>
          <View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-full" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-full" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-4/5" subtle />
            </View>
            <View className="h-5 justify-center">
              <SkeletonLine className="h-3 w-3/5" subtle />
            </View>
          </View>
        </View>
      </View>
    </SkeletonReveal>
  );
}
