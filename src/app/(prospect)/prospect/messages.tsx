import { useState } from 'react';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import {
  ConversationList,
  ConversationListSkeleton,
} from '../../../features/messaging/components/ConversationList';
import { MessagingModal } from '../../../features/messaging/components/MessagingModal';
import { useConversations, useMessagingSocket } from '../../../features/messaging/hooks';
import { Conversation } from '../../../lib/api/types';

export default function ProspectMessagesScreen() {
  const { token, user } = useAuth();
  const socket = useMessagingSocket(token);
  const conversations = useConversations(socket);
  const [selected, setSelected] = useState<Conversation | null>(null);

  return (
    <AppScreen
      title="Chat"
      quickLinks={prospectQuickLinks}
    >
      <PageHero
        title="Chat"
        subtitle="Connect with your assigned Hercules sales manager."
      />

      {conversations.error && conversations.conversations.length === 0 ? (
        <ErrorState message={conversations.error} onRetry={conversations.reload} />
      ) : !user ||
        (conversations.loading && conversations.conversations.length === 0) ? (
        <ConversationListSkeleton />
      ) : (
        <ConversationList
          conversations={conversations.conversations}
          currentUser={user}
          onSelect={setSelected}
        />
      )}
      {user ? (
        <MessagingModal
          conversation={selected}
          currentUser={user}
          socket={socket}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </AppScreen>
  );
}
