import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, MessageCircle } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import { useAuth } from '../../features/auth/AuthProvider';
import { classesApi, conversationsApi } from '../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../lib/format';
import { motionDuration } from '../../lib/motion';
import { ListItem } from '../ui/ListItem';
import { floatingPanelStyles } from './floatingPanel';

type Notification = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  unread: boolean;
  href: '/prospect/messages' | '/manager/messages' | '/prospect/classes';
  kind: 'message' | 'class';
};

type NotificationsMenuProps = {
  open: boolean;
  topOffset: number;
  messagesHref: '/prospect/messages' | '/manager/messages';
  onLoadingChange: (loading: boolean) => void;
  onClose: () => void;
};

const spinnerDelayMs = 140;
const minimumSpinnerDurationMs = 240;
const notificationRequestTimeoutMs = 10_000;

export function NotificationsMenu({
  open,
  topOffset,
  messagesHref,
  onLoadingChange,
  onClose,
}: NotificationsMenuProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      setReady(false);
      onLoadingChange(false);
      return;
    }

    let active = true;
    const requestController = new AbortController();
    const requestTimeout = setTimeout(
      () => requestController.abort(),
      notificationRequestTimeoutMs,
    );
    let spinnerShownAt: number | null = null;
    const spinnerTimer = setTimeout(() => {
      if (!active) {
        return;
      }
      spinnerShownAt = Date.now();
      onLoadingChange(true);
    }, spinnerDelayMs);

    setReady(false);
    setError(null);
    void (async () => {
      try {
        const [conversations, classes] = await Promise.all([
          conversationsApi.list({ signal: requestController.signal }),
          user.role === 'PROSPECT'
            ? classesApi.list({ signal: requestController.signal })
            : Promise.resolve(null),
        ]);
        if (!active) return;

        const messageNotifications = conversations.conversations
          .slice()
          .sort(
            (a, b) =>
              (b.unreadCount ?? 0) - (a.unreadCount ?? 0) ||
              new Date(b.lastMessageAt ?? b.updatedAt).getTime() -
                new Date(a.lastMessageAt ?? a.updatedAt).getTime(),
          )
          .map((conversation) => {
            const otherParticipant = conversation.participants.find(
              (participant) => participant.userId !== user.id,
            );
            const unreadCount = conversation.unreadCount ?? 0;

            return {
              id: conversation.id,
              title: otherParticipant
                ? fullName(otherParticipant.user)
                : 'Hercules conversation',
              subtitle: conversation.lastMessage?.body ?? 'No messages yet',
              meta:
                unreadCount > 0
                  ? `${unreadCount} unread`
                  : `Updated ${formatShortDate(conversation.updatedAt)}`,
              unread: unreadCount > 0,
              href: messagesHref,
              kind: 'message' as const,
            };
          });
        const classNotifications = (classes?.classes ?? [])
          .filter(
            (session) =>
              (session.enrollmentStatus === 'ENROLLED' ||
                session.enrollmentStatus === 'COMPLETED') &&
              new Date(session.startsAt).getTime() >= Date.now(),
          )
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          )
          .map((session) => ({
            id: `class-${session.id}`,
            title: session.title,
            subtitle: 'Upcoming class session',
            meta: `Starts ${formatShortDate(session.startsAt)}`,
            unread: false,
            href: '/prospect/classes' as const,
            kind: 'class' as const,
          }));

        setItems([...messageNotifications, ...classNotifications].slice(0, 4));
      } catch (caught) {
        if (active) {
          setError(
            requestController.signal.aborted
              ? 'Notifications took too long to load. Please try again.'
              : caught instanceof Error
                ? caught.message
                : 'Unable to load notifications',
          );
        }
      } finally {
        clearTimeout(requestTimeout);
        clearTimeout(spinnerTimer);
        if (active && spinnerShownAt) {
          const remainingDuration =
            minimumSpinnerDurationMs - (Date.now() - spinnerShownAt);
          if (remainingDuration > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, remainingDuration),
            );
          }
        }
        if (active) {
          onLoadingChange(false);
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
      requestController.abort();
      clearTimeout(requestTimeout);
      clearTimeout(spinnerTimer);
      onLoadingChange(false);
    };
  }, [messagesHref, onLoadingChange, open, user]);

  if (!open || !ready) {
    return null;
  }

  const openDestination = (href: Notification['href'] = messagesHref) => {
    onClose();
    router.push(href);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(288)
        .easing(Easing.out(Easing.cubic))
        .reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(220)
        .easing(Easing.inOut(Easing.cubic))
        .reduceMotion(ReduceMotion.System)}
      style={[
        floatingPanelStyles.shell,
        styles.panel,
        { top: topOffset + 12 },
      ]}
    >
      <View style={floatingPanelStyles.surface}>
        <View className="flex-row items-center justify-between border-b border-hercules-blue/10 px-5 py-3">
          <Text className="text-base font-extrabold text-hercules-ink">
            Notifications
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open chat"
            onPress={() => openDestination()}
            className="min-h-11 min-w-11 items-center justify-center rounded-[14px] px-3 active:bg-hercules-blue/5 active:opacity-100"
          >
            <Text className="text-xs font-extrabold text-hercules-blue">
              Open Chat
            </Text>
          </Pressable>
        </View>
        <View className="px-3 pb-3 pt-2">
          {error ? (
            <Text className="px-2 py-4 text-center text-sm font-bold text-hercules-red">
              {error}
            </Text>
          ) : items.length === 0 ? (
            <Text className="px-2 py-4 text-center text-sm font-bold text-hercules-muted">
              No new messages
            </Text>
          ) : (
            <View style={styles.notificationGroup}>
              {items.map((item, index) => (
                <ListItem
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={item.meta}
                  icon={item.kind === 'message' ? MessageCircle : CalendarDays}
                  iconTone={item.unread ? 'red' : 'blue'}
                  titleNumberOfLines={1}
                  subtitleNumberOfLines={2}
                  metaNumberOfLines={2}
                  variant="row"
                  isLast={index === items.length - 1}
                  onPress={() => openDestination(item.href)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
    maxHeight: 460,
  },
  notificationGroup: {
    borderColor: 'rgba(10, 45, 127, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
