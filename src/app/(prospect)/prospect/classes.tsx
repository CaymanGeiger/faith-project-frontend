import { useAuth } from '../../../features/auth/AuthProvider';
import { hasRestrictedAccess } from '../../../features/onboarding/access';
import { isUpcomingTraining, isSavedTraining } from '../../../features/getting-started/trainingAvailability';
import { router } from 'expo-router';
import { Award, CalendarDays, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
import { SkeletonLine, SkeletonListRow } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { useInAppContent } from '../../../features/content/InAppContentProvider';
import { classesApi } from '../../../lib/api/endpoints';
import type { ClassSession } from '../../../lib/api/types';
import { formatShortDate, formatTime } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { colors } from '../../../lib/theme/theme';

const herculesEventCalendarUrl = 'https://www.herculesindustries.com/eventcalendar';

export default function ProspectClassesScreen() {
  const { openContent } = useInAppContent();
  const { user, refreshMe } = useAuth();
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const classes = useAsyncData(() => classesApi.list(), []);
  const allSessions = classes.data?.classes ?? [];
  const classSessions = allSessions.filter(isUpcomingTraining);
  const history = allSessions.filter(session => !isUpcomingTraining(session) && isSavedTraining(session));

  const openEventCalendar = () => {
    setActionError(null);
    openContent({
      url: herculesEventCalendarUrl,
      title: 'Training Calendar & Registration',
    });
  };

  const registerForSelected = async () => {
    if (!selected || !isUpcomingTraining(selected) || isSavedTraining(selected)) {
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
      await Promise.all([classes.reload(), refreshMe()]);
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

      {hasRestrictedAccess(user) ? <AnimatedCard index={1} className="gap-2 rounded-[16px] bg-hercules-blue/5 p-5">
        <Text className="text-lg font-extrabold text-hercules-ink">Initial training verification needed</Text>
        <Text className="text-base leading-6 text-hercules-muted">Registering or saving a preference does not complete training. Dealer features become available after your initial training completion is verified.</Text>
      </AnimatedCard> : null}
      {actionError ? <ErrorState message={actionError} /> : null}

      <AnimatedCard index={hasRestrictedAccess(user) ? 2 : 1} className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <View className="gap-2">
          <SectionHeader title="Choose an Upcoming Class" />
          <Text className="text-[15px] leading-5 text-hercules-muted">
            Browse the Hercules calendar and register for available sessions.
            Save a training preference below for your representative to review.
          </Text>
        </View>
        <PrimaryButton
          label="Training Calendar & Registration"
          icon={CalendarDays}
          onPress={openEventCalendar}
        />
      </AnimatedCard>

      <AnimatedCard index={hasRestrictedAccess(user) ? 3 : 2} className="gap-3">
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

      {history.length > 0 ? <AnimatedCard index={hasRestrictedAccess(user) ? 4 : 3} className="gap-3"><SectionHeader title="Your Training History" /><ListGroup>{history.map((session, index) => <ListItem key={session.id} title={session.title} subtitle={`${formatShortDate(session.startsAt)} · ${formatTime(session.startsAt)}`} meta={session.enrollmentStatus === 'COMPLETED' ? 'Completed' : session.status === 'CANCELED' ? 'Canceled' : 'Preference saved'} icon={Video} variant="row" isLast={index === history.length - 1} onPress={() => setSelected(session)} />)}</ListGroup></AnimatedCard> : null}
      <AsyncContent
        ready={Boolean(classes.data)}
        fallback={<TrainingUnlockSkeleton />}
        className="gap-6"
      >
        {classes.data ? (
          <AnimatedCard
            index={history.length > 0 || hasRestrictedAccess(user) ? 4 : 3}
            className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5"
          >
            <View className="flex-row items-start gap-3">
              <Text className="min-w-0 flex-1 text-lg font-extrabold text-hercules-ink">
                Training & Program Information
              </Text>
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-hercules-blue">
                <Award size={21} color={colors.white} strokeWidth={2.4} />
              </View>
            </View>
            <Text className="text-[15px] leading-5 text-hercules-muted">
              Completing training can help you access current program resources
              and eligibility information. Availability, pricing, and incentives
              depend on current program terms and confirmation by Hercules and LG.
            </Text>
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
                  : isSavedTraining(selected)
                    ? 'Preference saved'
                    : !isUpcomingTraining(selected) ? 'Session unavailable' : 'Save Training Preference'
              }
              onPress={registerForSelected}
              loading={registering}
              disabled={
                !isUpcomingTraining(selected) || isSavedTraining(selected)
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
      <ListGroup>
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonListRow
            key={`training-class-row-skeleton-${index}`}
            titleLines={2}
            subtitleLines={1}
            metaWidthClassName="w-[74px]"
            iconTone={index === 0 ? 'red' : 'blue'}
            isLast={index === 1}
          />
        ))}
      </ListGroup>
    </SkeletonReveal>
  );
}

function TrainingUnlockSkeleton() {
  return (
    <SkeletonReveal>
      <View className="gap-2 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
        <View className="flex-row items-start gap-3">
          <View className="min-w-0 flex-1">
            <View className="h-6 justify-center">
              <SkeletonLine className="h-5 w-full" />
            </View>
            <View className="h-6 justify-center">
              <SkeletonLine className="h-5 w-3/5" />
            </View>
          </View>
          <View className="h-10 w-10 shrink-0 rounded-[12px] bg-hercules-blue/15" />
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
    </SkeletonReveal>
  );
}
