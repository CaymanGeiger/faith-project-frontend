import { Pressable, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Conversation, User } from '../../../lib/api/types';
import { formatTime, fullName } from '../../../lib/format';
import { colors } from '../../../lib/theme/theme';
import { UnreadBadge } from './UnreadBadge';

type ConversationListItemProps = {
  conversation: Conversation;
  currentUser: User;
  onPress: () => void;
};

export function ConversationListItem({
  conversation,
  currentUser,
  onPress,
}: ConversationListItemProps) {
  const otherParticipant = conversation.participants.find(
    (participant) => participant.userId !== currentUser.id,
  );

  return (
    <Pressable
      onPress={onPress}
      className="min-h-20 flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4 active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-hercules-blue">
        <MessageCircle size={22} color={colors.white} strokeWidth={2.4} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-extrabold text-hercules-ink">
          {otherParticipant ? fullName(otherParticipant.user) : 'Conversation'}
        </Text>
        <Text numberOfLines={1} className="text-sm text-hercules-muted">
          {conversation.lastMessage?.body ?? 'No messages yet'}
        </Text>
      </View>
      <View className="items-end gap-2">
        {conversation.lastMessage ? (
          <Text className="text-xs font-bold text-hercules-muted">
            {formatTime(conversation.lastMessage.createdAt)}
          </Text>
        ) : null}
        <UnreadBadge count={conversation.unreadCount} />
      </View>
    </Pressable>
  );
}
