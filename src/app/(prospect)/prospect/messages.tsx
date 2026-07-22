import { MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { PageHero } from '../../../components/ui/PageHero';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ConversationList } from '../../../features/messaging/components/ConversationList';
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
      title="Messages"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <PageHero
        icon={MessageCircle}
        title="Sales Manager Messages"
        subtitle="Connect with your assigned Hercules contact."
        tone="blue"
      />

      {conversations.loading ? <LoadingState label="Loading conversations" /> : null}
      {conversations.error ? (
        <ErrorState message={conversations.error} onRetry={conversations.reload} />
      ) : null}
      {user ? (
        <ConversationList
          conversations={conversations.conversations}
          currentUser={user}
          onSelect={setSelected}
        />
      ) : null}
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
