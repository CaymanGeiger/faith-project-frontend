import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Bell, CalendarDays, CheckCircle2, MessageCircle } from 'lucide-react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../features/auth/AuthProvider';
import { conversationsApi, todosApi } from '../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import { ListItem } from '../ui/ListItem';

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  unread: boolean;
  iconTone: 'red' | 'blue';
};

type NotificationsMenuProps = {
  open: boolean;
  topOffset: number;
  fallbackHref: string;
  onClose: () => void;
};

const panelWidth = 336;
const rowHeight = 88;
const rowGap = 8;
const panelPadding = 12;
const menuHeaderHeight = 50;
const footerHeight = 48;
const footerTopGap = 12;
const panelBottomPadding = 8;
const maxVisibleItems = 4;
const notificationPanel = colors.white;

export function NotificationsMenu({
  open,
  topOffset,
  fallbackHref,
  onClose,
}: NotificationsMenuProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: open ? 280 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, progress]);

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    let cancelled = false;
    const currentUser = user;

    async function loadNotifications() {
      setLoading(true);
      setError(null);

      try {
        if (currentUser.role === 'PROSPECT') {
          const response = await todosApi.list();
          const nextItems = response.todos
            .slice()
            .sort((a, b) => {
              if (a.status !== b.status) {
                return a.status === 'OPEN' ? -1 : 1;
              }
              return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
            })
            .slice(0, maxVisibleItems)
            .map((todo, index) => ({
              id: todo.id,
              title: todo.title,
              subtitle: `Due ${formatShortDate(todo.dueAt)} · ${todo.description}`,
              meta: todo.status === 'OPEN' ? 'New' : 'Done',
              href: '/prospect/todos',
              unread: todo.status === 'OPEN',
              iconTone: index % 2 === 0 ? ('red' as const) : ('blue' as const),
            }));

          if (!cancelled) {
            setItems(nextItems);
          }
        } else {
          const response = await conversationsApi.list();
          const nextItems = response.conversations
            .slice()
            .sort((a, b) => {
              const unreadDelta = (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
              if (unreadDelta !== 0) {
                return unreadDelta;
              }
              return (
                new Date(b.lastMessageAt ?? b.updatedAt).getTime() -
                new Date(a.lastMessageAt ?? a.updatedAt).getTime()
              );
            })
            .slice(0, maxVisibleItems)
            .map((conversation) => {
              const otherParticipant = conversation.participants.find(
                (participant) => participant.userId !== currentUser.id,
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
                href: '/manager/messages',
                unread: unreadCount > 0,
                iconTone: unreadCount > 0 ? ('red' as const) : ('blue' as const),
              };
            });

          if (!cancelled) {
            setItems(nextItems);
          }
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load notifications',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const rowCount = loading || error || items.length === 0 ? 1 : items.length;
  const rowsSlotHeight =
    rowCount * rowHeight + Math.max(rowCount - 1, 0) * rowGap;
  const panelHeight =
    menuHeaderHeight +
    rowsSlotHeight +
    rowGap * 2 +
    footerHeight +
    panelPadding * 2 +
    panelBottomPadding;

  const panelStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, panelHeight]),
    opacity: interpolate(progress.value, [0, 0.08, 1], [0, 1, 1]),
  }));

  const openFallback = () => {
    onClose();
    router.push(fallbackHref);
  };
  const fallbackLabel = fallbackHref.includes('messages')
    ? 'Open Messages'
    : 'Open Inbox';

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.panel, { top: topOffset }, panelStyle]}
      className="absolute right-0 z-40 shadow-lg"
    >
      <View style={styles.panelContent}>
        <View className="h-[50px] flex-row items-center justify-between px-2">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-hercules-red">
              <Bell size={16} color={colors.white} />
            </View>
            <Text className="text-base font-extrabold text-hercules-ink">
              Notifications
            </Text>
          </View>
          <Pressable onPress={openFallback} className="rounded-pill px-2 py-1">
            <Text className="text-xs font-extrabold text-hercules-blue">
              View All
            </Text>
          </Pressable>
        </View>

        <View style={[styles.rowsSlot, { height: rowsSlotHeight }]}>
          {loading ? (
            <NotificationState label="Loading notifications" />
          ) : error ? (
            <NotificationState label={error} />
          ) : items.length === 0 ? (
            <NotificationState label="All caught up" />
          ) : (
            items.map((item, index) => (
              <NotificationRow
                key={item.id}
                item={item}
                index={index}
                progress={progress}
                onClose={onClose}
              />
            ))
          )}
        </View>

        <Pressable
          onPress={openFallback}
          style={styles.actionButton}
          className="h-12 justify-center rounded-[20px] bg-hercules-white px-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-extrabold text-hercules-ink">
            {fallbackLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function NotificationState({ label }: { label: string }) {
  return (
    <View
      style={styles.notificationCard}
      className="h-20 flex-row items-center justify-center gap-3 rounded-[20px] bg-hercules-white px-4"
    >
      {label.startsWith('Loading') ? (
        <ActivityIndicator color={colors.red} size="small" />
      ) : null}
      <Text className="text-sm font-bold text-hercules-muted">{label}</Text>
    </View>
  );
}

type NotificationRowProps = {
  item: NotificationItem;
  index: number;
  progress: SharedValue<number>;
  onClose: () => void;
};

function NotificationRow({
  item,
  index,
  progress,
  onClose,
}: NotificationRowProps) {
  const rowStyle = useAnimatedStyle(() => {
    const start = Math.min(0.1 + index * 0.045, 0.32);
    return {
      opacity: interpolate(
        progress.value,
        [0, start, 1],
        [0, 0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress.value,
            [start, 1],
            [-8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const openItem = () => {
    onClose();
    router.push(item.href);
  };

  const Icon = item.unread ? CalendarDays : CheckCircle2;

  return (
    <Animated.View style={rowStyle}>
      <ListItem
        title={item.title}
        subtitle={item.subtitle}
        meta={item.meta}
        icon={item.href.includes('messages') ? MessageCircle : Icon}
        iconTone={item.iconTone}
        titleNumberOfLines={1}
        subtitleNumberOfLines={2}
        containerStyle={styles.notificationCard}
        onPress={openItem}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: panelWidth,
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.18)',
    backgroundColor: notificationPanel,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 14,
  },
  panelContent: {
    padding: panelPadding,
    paddingBottom: panelPadding + panelBottomPadding,
    gap: rowGap,
    width: '100%',
    height: '100%',
  },
  rowsSlot: {
    gap: rowGap,
  },
  notificationCard: {
    borderWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.16)',
  },
  actionButton: {
    marginTop: footerTopGap,
    borderWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.14)',
  },
});
