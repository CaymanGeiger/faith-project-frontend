import { View } from 'react-native';
import { Conversation, User } from '../../../lib/api/types';
import { EmptyState } from '../../../components/ui/StateViews';
import { SkeletonLine } from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ConversationListItem } from './ConversationListItem';

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
      <EmptyState
        title="No chats yet"
        body="Your assigned chats will appear here."
      />
    );
  }

  return (
    <View className="gap-3">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          currentUser={currentUser}
          onPress={() => onSelect(conversation)}
        />
      ))}
    </View>
  );
}

export function ConversationListSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <SkeletonReveal
      label="Loading conversations"
      className="w-full"
    >
      <View className="gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <View
            key={`conversation-skeleton-${index}`}
            className="min-h-20 flex-row items-center gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4"
          >
            <View className="h-12 w-12 rounded-full bg-hercules-blue/15" />
            <View className="flex-1 gap-1">
              <SkeletonLine className="h-6 w-3/4" />
              <SkeletonLine className="h-5 w-4/5" subtle />
            </View>
            <View className="items-end gap-2">
              <SkeletonLine className="h-4 w-10" subtle />
              <View className="h-6 min-w-7 rounded-pill bg-hercules-red/15" />
            </View>
          </View>
        ))}
      </View>
    </SkeletonReveal>
  );
}
