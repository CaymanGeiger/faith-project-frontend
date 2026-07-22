import { CalendarDays, ExternalLink, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PageHero } from '../../../components/ui/PageHero';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { ClassSession } from '../../../lib/api/types';
import { classesApi } from '../../../lib/api/endpoints';
import { formatShortDate, formatTime } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';
import { colors } from '../../../lib/theme/theme';

const herculesEventCalendarUrl = 'https://www.herculesindustries.com/eventcalendar';

export default function ProspectClassesScreen() {
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const classes = useAsyncData(() => classesApi.list(), []);

  const openEventCalendar = async () => {
    setActionError(null);
    try {
      await Linking.openURL(herculesEventCalendarUrl);
    } catch {
      setActionError('Unable to open the Hercules event calendar.');
    }
  };

  return (
    <AppScreen
      title="Classes"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <PageHero
        icon={CalendarDays}
        title="Certification Classes"
        subtitle="Virtual training and certification sessions."
      />

      {actionError ? <ErrorState message={actionError} /> : null}

      <AnimatedCard index={1} className="gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-hercules-blue">
            <CalendarDays size={22} color={colors.white} strokeWidth={2.4} />
          </View>
          <Text className="text-2xl font-extrabold text-hercules-ink">
            Sign Up Through Hercules
          </Text>
        </View>
        <View className="gap-3">
          <Text className="text-base font-semibold leading-6 text-hercules-muted">
            Browse the Hercules event calendar to find upcoming training and
            certification sessions, then register for the class that works for
            your schedule.
          </Text>
        </View>
        <PrimaryButton
          label="Open Event Calendar"
          icon={ExternalLink}
          onPress={openEventCalendar}
        />
      </AnimatedCard>

      {classes.loading ? <LoadingState label="Loading classes" /> : null}
      {classes.error ? (
        <ErrorState message={classes.error} onRetry={classes.reload} />
      ) : null}
      {classes.data ? (
        <View className="gap-3">
          {classes.data.classes.map((session, index) => (
            <AnimatedCard key={session.id} index={index + 2}>
              <ListItem
                title={session.title}
                subtitle={`${formatShortDate(session.startsAt)} · ${formatTime(
                  session.startsAt,
                )}`}
                meta={session.isEnrolled ? 'Enrolled' : session.status}
                icon={Video}
                iconTone={session.isEnrolled ? 'blue' : 'red'}
                onPress={() => setSelected(session)}
              />
            </AnimatedCard>
          ))}
        </View>
      ) : null}

      <ModalSheet
        title="Class Details"
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <View className="gap-4">
            {actionError ? <ErrorState message={actionError} /> : null}
            <View className="gap-2 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-5">
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
              label="Open Event Calendar"
              icon={ExternalLink}
              onPress={openEventCalendar}
            />
          </View>
        ) : null}
      </ModalSheet>
    </AppScreen>
  );
}
