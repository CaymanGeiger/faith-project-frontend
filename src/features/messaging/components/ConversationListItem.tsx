import { Pressable, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors } from '../../../lib/theme/theme';
import { Conversation, User } from '../../../lib/api/types';
import { formatTime, fullName } from '../../../lib/format';
import { chatStyles } from '../../../lib/theme/chatStyles';

const personalStyles = chatStyles.personalContact;
const inboxStyles = chatStyles.compactInbox;

type ConversationListItemProps = {
  conversation: Conversation;
  currentUser: User;
  onPress: () => void;
  personal?: boolean;
};

export function ConversationListItem({ conversation, currentUser, onPress, personal = false }: ConversationListItemProps) {
  const other = conversation.participants.find(participant => participant.userId !== currentUser.id)?.user;
  const name = other ? fullName(other) : 'Conversation';
  const unread = conversation.unreadCount ?? 0;
  const message = conversation.lastMessage;
  const preview = message
    ? `${message.senderId === currentUser.id ? 'You: ' : ''}${message.body}`
    : 'No messages yet';

  if (personal) {
    const initials = other ? `${other.firstName.charAt(0)}${other.lastName.charAt(0)}` : 'H';
    return (
      <View>
        <View className={personalStyles.identity}>
          <View className={personalStyles.avatar}>
            <Text className={personalStyles.initials}>{initials}</Text>
          </View>
          <Text className={personalStyles.name}>{name}</Text>
          <Text className={personalStyles.role}>Your Hercules sales manager</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open conversation with ${name}`} onPress={onPress}
          className={personalStyles.action}>
          <Text className={personalStyles.actionLabel}>Open conversation</Text>
          <ArrowRight size={personalStyles.actionIconSize} color={colors.white} />
        </Pressable>
        {unread > 0 ? (
          <View className={personalStyles.unread}>
            <View className={personalStyles.unreadDot} />
            <Text className={personalStyles.unreadLabel}>{unread} unread {unread === 1 ? 'message' : 'messages'}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${name}${unread ? `, ${unread} unread messages` : ''}. ${preview}`}
      onPress={onPress}
      className={`${inboxStyles.row} ${inboxStyles.pressed}`}
    >
      <View className={inboxStyles.content}>
        <Text className={inboxStyles.name}>{name}</Text>
        <Text numberOfLines={2} className={inboxStyles.preview}>{preview}</Text>
      </View>
      <View className={inboxStyles.trailing}>
        {message ? <Text className={inboxStyles.time}>{formatTime(message.createdAt)}</Text> : null}
        {unread > 0 ? (
          <View className={inboxStyles.unread}>
            <Text className={inboxStyles.unreadLabel}>{unread}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
