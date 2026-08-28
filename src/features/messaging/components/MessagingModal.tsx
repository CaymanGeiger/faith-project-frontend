import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { Conversation, Message, User } from '../../../lib/api/types';
import { conversationsApi } from '../../../lib/api/endpoints';
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
  const { height: windowHeight } = useWindowDimensions();
  const conversationId = conversation?.id ?? null;
  const messages = useConversationMessages(conversationId, socket);
  const typing = useTypingIndicator(conversationId, socket, currentUser);
  useReadReceipts(conversationId, socket);

  const otherParticipant = conversation?.participants.find(
    (participant) => participant.userId !== currentUser.id,
  );
  const [blockedByCurrentUser, setBlockedByCurrentUser] = useState(false);
  const [blockedByParticipant, setBlockedByParticipant] = useState(false);

  useEffect(() => {
    setBlockedByCurrentUser(
      Boolean(conversation?.currentUserHasBlockedParticipant),
    );
    setBlockedByParticipant(Boolean(conversation?.currentUserIsBlocked));
  }, [conversation?.currentUserHasBlockedParticipant, conversation?.currentUserIsBlocked, conversationId]);

  const reportMessage = (message: Message) => {
    if (!conversationId) return;
    Alert.alert('Report message?', 'Hercules will review this report.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: () => {
          void conversationsApi
            .reportMessage(conversationId, message.id)
            .then(() => Alert.alert('Report received', 'Hercules will review this message.'))
            .catch((caught: unknown) =>
              Alert.alert(
                'Unable to report message',
                caught instanceof Error ? caught.message : 'Please try again.',
              ),
            );
        },
      },
    ]);
  };

  const blockParticipant = () => {
    if (!conversationId) return;
    Alert.alert(
      'Block participant?',
      'They will no longer be able to send messages in this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            void conversationsApi
              .blockParticipant(conversationId)
              .then(() => setBlockedByCurrentUser(true))
              .catch((caught: unknown) =>
                Alert.alert(
                  'Unable to block participant',
                  caught instanceof Error ? caught.message : 'Please try again.',
                ),
              );
          },
        },
      ],
    );
  };

  const unblockParticipant = () => {
    if (!conversationId) return;
    void conversationsApi
      .unblockParticipant(conversationId)
      .then(() => setBlockedByCurrentUser(false))
      .catch((caught: unknown) =>
        Alert.alert(
          'Unable to unblock participant',
          caught instanceof Error ? caught.message : 'Please try again.',
        ),
      );
  };

  return (
    <ModalSheet
      visible={Boolean(conversation)}
      title={otherParticipant ? fullName(otherParticipant.user) : 'Chat'}
      onClose={onClose}
      closeTravelDistance={windowHeight}
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
        onReportMessage={reportMessage}
        blockedByCurrentUser={blockedByCurrentUser}
        blockedByParticipant={blockedByParticipant}
        onBlockParticipant={blockParticipant}
        onUnblockParticipant={unblockParticipant}
        onReviewTerms={() => router.push('/terms')}
        readyToSend={messages.readyToSend}
      />
    </ModalSheet>
  );
}
