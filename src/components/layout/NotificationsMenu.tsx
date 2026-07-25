import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../features/auth/AuthProvider';
import { classesApi, conversationsApi } from '../../lib/api/endpoints';
import { formatShortDate, fullName } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import { ListItem } from '../ui/ListItem';

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
  onClose: () => void;
};

export function NotificationsMenu({
  open,
  topOffset,
  messagesHref,
  onClose,
}: NotificationsMenuProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [conversations, classes] = await Promise.all([
          conversationsApi.list(),
          user.role === 'PROSPECT' ? classesApi.list() : Promise.resolve(null),
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
              session.isEnrolled && new Date(session.startsAt).getTime() >= Date.now(),
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
            caught instanceof Error ? caught.message : 'Unable to load notifications',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, user]);

  if (!open) {
    return null;
  }

  const openDestination = (href: Notification['href'] = messagesHref) => {
    onClose();
    router.push(href);
  };

  return (
    <View style={[styles.panel, { top: topOffset }]}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-extrabold text-hercules-ink">
          Notifications
        </Text>
        <Pressable onPress={() => openDestination()} className="py-1 active:opacity-70">
          <Text className="text-xs font-extrabold text-hercules-blue">
            View Messages
          </Text>
        </Pressable>
      </View>
      <View className="gap-2 px-3 pb-3">
        {loading ? (
          <Text className="px-2 py-4 text-center text-sm font-bold text-hercules-muted">
            Loading notifications…
          </Text>
        ) : error ? (
          <Text className="px-2 py-4 text-center text-sm font-bold text-hercules-red">
            {error}
          </Text>
        ) : items.length === 0 ? (
          <Text className="px-2 py-4 text-center text-sm font-bold text-hercules-muted">
            No new messages
          </Text>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              meta={item.meta}
              icon={item.kind === 'message' ? MessageCircle : CalendarDays}
              iconTone={item.unread ? 'red' : 'blue'}
              titleNumberOfLines={1}
              subtitleNumberOfLines={2}
              onPress={() => openDestination(item.href)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    right: 0,
    zIndex: 40,
    width: 336,
    maxHeight: 460,
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.18)',
    backgroundColor: colors.white,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 18,
  },
});
