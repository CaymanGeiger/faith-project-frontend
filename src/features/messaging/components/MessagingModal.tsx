import { Conversation, User } from '../../../lib/api/types';
import { useCallback, useEffect, useState } from 'react';
import { MessagingSocket } from '../../../lib/messagingSocket';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { fullName } from '../../../lib/format';
import {
  useConversationMessages,
  useReadReceipts,
  useTypingIndicator,
} from '../hooks';
import { MessageThread } from './MessageThread';

type MessagingModalProps = {
  conversation: Conversation | null;
  currentUser: User;
  socket: MessagingSocket | null;
  onClose: () => void;
};

export function MessagingModal({
  conversation,
  currentUser,
  socket,
  onClose,
}: MessagingModalProps) {
  const [lastConversation, setLastConversation] = useState<Conversation | null>(
    conversation,
  );

  useEffect(() => {
    if (conversation) {
      setLastConversation(conversation);
    }
  }, [conversation]);

  const displayedConversation = conversation ?? lastConversation;
  const conversationId = displayedConversation?.id ?? null;
  const messages = useConversationMessages(conversationId, socket);
  const typing = useTypingIndicator(conversationId, socket, currentUser);
  useReadReceipts(conversationId, socket);

  const otherParticipant = displayedConversation?.participants.find(
    (participant) => participant.userId !== currentUser.id,
  );
  const handleDismissed = useCallback(() => {
    setLastConversation(null);
  }, []);

  return (
    <ModalSheet
      visible={Boolean(conversation)}
      title={otherParticipant ? fullName(otherParticipant.user) : 'Messages'}
      onClose={onClose}
      onDismissed={handleDismissed}
    >
      <MessageThread
        conversationId={conversationId}
        messages={messages.messages}
        currentUser={currentUser}
        loading={messages.loading}
        error={messages.error}
        typing={typing.typing}
        onSend={messages.sendMessage}
        onTypingStart={typing.startTyping}
        onTypingStop={typing.stopTyping}
      />
    </ModalSheet>
  );
}
