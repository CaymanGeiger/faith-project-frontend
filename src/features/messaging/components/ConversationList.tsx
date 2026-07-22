import { View } from 'react-native';
import { Conversation, User } from '../../../lib/api/types';
import { EmptyState } from '../../../components/ui/StateViews';
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
        title="No conversations"
        body="Assigned conversations will appear here."
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
