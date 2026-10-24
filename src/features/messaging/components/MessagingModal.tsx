import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { Conversation, Message, User } from '../../../lib/api/types';
import { conversationsApi } from '../../../lib/api/endpoints';
import { MessagingSocket } from '../../../lib/messagingSocket';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { ErrorState } from '../../../components/ui/StateViews';
import { fullName } from '../../../lib/format';
import {
  useConversationMessages,
  useReadReceipts,
  useTypingIndicator,
} from '../hooks';
import { MessageThread } from './MessageThread';
import { ManagerAvailabilityNotice } from '../../availability/ManagerAvailabilityNotice';

type MessagingModalProps = {
  conversation: Conversation | null;
  currentUser: User;
  socket: MessagingSocket | null;
  onClose: () => void;
};
type SafetyAction = { kind: 'block' | 'unblock' } | { kind: 'report'; message: Message };

export function MessagingModal({
  conversation,
  currentUser,
  socket,
  onClose,
}: MessagingModalProps) {
  const reviewTermsAfterClose = useRef(false);
  const onDismissed = useCallback(() => {
    if (reviewTermsAfterClose.current) {
      reviewTermsAfterClose.current = false;
      router.push('/terms');
    }
  }, []);
  const conversationId = conversation?.id ?? null;
  const messages = useConversationMessages(conversationId, socket);
  const typing = useTypingIndicator(conversationId, socket, currentUser);

  const otherParticipant = conversation?.participants.find(
    (participant) => participant.userId !== currentUser.id,
  );
  const [blockedByCurrentUser, setBlockedByCurrentUser] = useState(false);
  const [blockedByParticipant, setBlockedByParticipant] = useState(false);
  useReadReceipts(blockedByCurrentUser || blockedByParticipant ? null : conversationId, socket, messages.messages);
  const [safetyAction, setSafetyAction] = useState<SafetyAction | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const safetyVersion = useRef(0);
  const safetyInFlight = useRef(false);
  const currentConversationId = useRef(conversationId);
  currentConversationId.current = conversationId;

  useEffect(() => {
    safetyVersion.current += 1;
    safetyInFlight.current = false;
    setSafetyAction(null);
    setSafetyBusy(false);
    setSafetyError(null);
    setSafetyNotice(null);
    return () => { safetyVersion.current += 1; };
  }, [conversationId]);

  useEffect(() => {
    setBlockedByCurrentUser(
      Boolean(conversation?.currentUserHasBlockedParticipant),
    );
    setBlockedByParticipant(Boolean(conversation?.currentUserIsBlocked));
  }, [conversation?.currentUserHasBlockedParticipant, conversation?.currentUserIsBlocked, conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    let sequence = 0;
    const refresh = async () => {
      const request = ++sequence;
      const safetyRequest = safetyVersion.current;
      try {
        const response = await conversationsApi.get(conversationId);
        if (active && request === sequence && safetyRequest === safetyVersion.current) {
          setBlockedByCurrentUser(Boolean(response.conversation.currentUserHasBlockedParticipant));
          setBlockedByParticipant(Boolean(response.conversation.currentUserIsBlocked));
        }
      } catch { /* Send authorization remains enforced by the server. */ }
    };
    void refresh();
    const update = (payload: { conversationId: string }) => { if (payload.conversationId === conversationId) void refresh(); };
    socket?.on('conversation:updated', update);
    const foreground = AppState.addEventListener('change', next => { if (next === 'active') void refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30_000);
    return () => { active = false; foreground.remove(); clearInterval(timer); socket?.off('conversation:updated', update); };
  }, [conversationId, socket]);

  const submitSafetyAction = async (action: SafetyAction) => {
    if (!conversationId || safetyInFlight.current) return;
    const targetConversationId = conversationId;
    const request = ++safetyVersion.current;
    safetyInFlight.current = true;
    setSafetyBusy(true);
    setSafetyError(null);
    setSafetyNotice(null);
    const isCurrent = () => currentConversationId.current === targetConversationId && safetyVersion.current === request;
    try {
      if (action.kind === 'report') await conversationsApi.reportMessage(targetConversationId, action.message.id);
      else if (action.kind === 'block') await conversationsApi.blockParticipant(targetConversationId);
      else await conversationsApi.unblockParticipant(targetConversationId);
      if (!isCurrent()) return;
      if (action.kind !== 'report') setBlockedByCurrentUser(action.kind === 'block');
      setSafetyAction(null);
      setSafetyNotice(action.kind === 'report' ? 'Report received. Hercules will review this message.' : null);
    } catch (caught) {
      if (isCurrent()) setSafetyError(caught instanceof Error ? caught.message : 'Unable to update this conversation. Please try again.');
    } finally {
      if (isCurrent()) {
        safetyVersion.current += 1;
        safetyInFlight.current = false;
        setSafetyBusy(false);
      }
    }
  };

  return (
    <ModalSheet
      avoidKeyboard
      visible={Boolean(conversation)}
      title={otherParticipant ? fullName(otherParticipant.user) : 'Chat'}
      titleContent={
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-hercules-blue">
            <Text className="text-sm font-semibold text-hercules-white">{otherParticipant ? `${otherParticipant.user.firstName.charAt(0)}${otherParticipant.user.lastName.charAt(0)}` : 'H'}</Text>
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text accessibilityRole="header" className="text-base font-semibold text-hercules-ink">{otherParticipant ? fullName(otherParticipant.user) : 'Chat'}</Text>
            <Text className="text-xs text-hercules-muted">{otherParticipant?.user.role === 'SALES_MANAGER' ? 'Your Hercules sales manager' : 'Hercules dealer'}</Text>
          </View>
        </View>
      }
      onClose={onClose}
      onDismissed={onDismissed}
    >
      <View className="gap-2">
        {conversationId && currentUser.role === 'PROSPECT' && otherParticipant?.user.role === 'SALES_MANAGER' ? <ManagerAvailabilityNotice key={conversationId} conversationId={conversationId} /> : null}
        {safetyError ? <ErrorState message={safetyError} /> : null}
        {safetyNotice ? <Text accessibilityRole="alert" className="text-sm text-hercules-muted">{safetyNotice}</Text> : null}
        {safetyAction ? (
          <View className="gap-3 rounded-[14px] border border-hercules-blue/15 bg-hercules-blue/5 p-4">
            <Text accessibilityRole="header" className="font-bold text-hercules-ink">{safetyAction.kind === 'report' ? 'Report message?' : 'Block participant?'}</Text>
            <Text className="text-sm text-hercules-muted">{safetyAction.kind === 'report' ? 'Hercules will review this report.' : 'Messages in this conversation will stop until you unblock this participant.'}</Text>
            <PrimaryButton label={safetyAction.kind === 'report' ? 'Report Message' : 'Block Participant'} loading={safetyBusy} onPress={() => void submitSafetyAction(safetyAction)} />
            <SecondaryButton label="Cancel" disabled={safetyBusy} onPress={() => { setSafetyAction(null); setSafetyError(null); }} />
          </View>
        ) : conversationId && !blockedByCurrentUser ? (
          <Pressable accessibilityRole="button" disabled={safetyBusy} onPress={() => { setSafetyError(null); setSafetyNotice(null); setSafetyAction({ kind: 'block' }); }} className="min-h-11 self-end justify-center px-1">
            <Text className="text-sm font-bold text-hercules-muted">Block participant</Text>
          </Pressable>
        ) : null}
      </View>
      <MessageThread
        participantName={otherParticipant?.user.firstName || 'Hercules'}
        key={conversationId ?? 'closed'}
        conversationId={conversationId}
        messages={messages.messages}
        hasOlder={messages.hasOlder}
        loadingOlder={messages.loadingOlder}
        onLoadOlder={() => void messages.loadOlder()}
        currentUser={currentUser}
        loading={messages.loading}
        error={messages.error}
        typing={typing.typing}
        onSend={messages.sendMessage}
        onTypingStart={typing.startTyping}
        onTypingStop={typing.stopTyping}
        onReportMessage={message => { if (!safetyInFlight.current) { setSafetyError(null); setSafetyNotice(null); setSafetyAction({ kind: 'report', message }); } }}
        blockedByCurrentUser={blockedByCurrentUser}
        blockedByParticipant={blockedByParticipant}
        onUnblockParticipant={() => void submitSafetyAction({ kind: 'unblock' })}
        onReviewTerms={() => {
          reviewTermsAfterClose.current = true;
          onClose();
        }}
        readyToSend={messages.readyToSend}
      />
    </ModalSheet>
  );
}
