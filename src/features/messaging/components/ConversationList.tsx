import { View } from 'react-native';
import { Conversation, User } from '../../../lib/api/types';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { EmptyState } from '../../../components/ui/StateViews';
import { SkeletonLine } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ConversationListItem } from './ConversationListItem';
import { chatStyles } from '../../../lib/theme/chatStyles';

type ConversationListProps = {
  conversations: Conversation[];
  currentUser: User;
  onSelect: (conversation: Conversation) => void;
};

export function ConversationList({
  conversations,
  currentUser,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <AnimatedCard index={1}>
        <EmptyState
          title="No chats yet"
          body="Your assigned chats will appear here."
        />
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard index={1} className={chatStyles.list.container}>
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          personal={currentUser.role === 'PROSPECT' && conversations.length === 1}
          currentUser={currentUser}
          onPress={() => onSelect(conversation)}
        />
      ))}
    </AnimatedCard>
  );
}

export function ConversationListSkeleton({ rows = 1 }: { rows?: number }) {
  if (rows === 1) {
    return (
      <SkeletonReveal label="Loading conversation" className={chatStyles.list.loading}>
        <View className={chatStyles.personalContact.identity}>
          <View className={chatStyles.personalContact.skeleton.avatar} />
          <SkeletonLine className={chatStyles.personalContact.skeleton.name} />
          <SkeletonLine className={chatStyles.personalContact.skeleton.role} subtle />
        </View>
        <View className={chatStyles.personalContact.skeleton.action} />
      </SkeletonReveal>
    );
  }
  return (
    <SkeletonReveal
      label="Loading conversations"
      className={chatStyles.list.loading}
    >
      <View className={chatStyles.list.container}>
        {Array.from({ length: rows }, (_, index) => (
          <View
            key={`conversation-skeleton-${index}`}
            className={chatStyles.compactInbox.row}
          >
            <View className={chatStyles.compactInbox.skeleton.content}>
              <SkeletonLine className={chatStyles.compactInbox.skeleton.name} />
              <SkeletonLine className={chatStyles.compactInbox.skeleton.preview} subtle />
            </View>
            <View className={chatStyles.compactInbox.skeleton.trailing}>
              <SkeletonLine className={chatStyles.compactInbox.skeleton.time} subtle />
              <View className={chatStyles.compactInbox.skeleton.unread} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonReveal>
  );
}
