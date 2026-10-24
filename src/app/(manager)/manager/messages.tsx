import { useState } from 'react';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { ChatHeading } from '../../../features/messaging/components/ChatHeading';
import { ErrorState } from '../../../components/ui/StateViews';
import { useAuth } from '../../../features/auth/AuthProvider';
import { useManagerData } from '../../../features/manager/ManagerDataProvider';
import { ConversationList, ConversationListSkeleton } from '../../../features/messaging/components/ConversationList';
import { MessagingModal } from '../../../features/messaging/components/MessagingModal';
import { Conversation } from '../../../lib/api/types';

export default function ManagerMessagesScreen() {
  const { user } = useAuth();
  const { conversations, socket } = useManagerData();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const conversationsReady = Boolean(
    user &&
      (!conversations.loading || conversations.conversations.length > 0),
  );

  return (
    <AppScreen
      title="Chat"
      quickLinks={managerQuickLinks}
    >
      <ChatHeading />

      {conversations.error && conversations.conversations.length === 0 ? (
        <ErrorState message={conversations.error} onRetry={conversations.reload} />
      ) : (
        <AsyncContent
          ready={conversationsReady}
          fallback={<ConversationListSkeleton rows={2} />}
        >
          {user ? (
            <ConversationList
              conversations={conversations.conversations}
              currentUser={user}
              onSelect={setSelected}
            />
          ) : null}
        </AsyncContent>
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
