import { nativeStyles } from '../../../lib/theme/nativeStyles';
import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { Message, User } from '../../../lib/api/types';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { CURRENT_TERMS_VERSION } from '../../legal/legal';
import { isSameMessageDay, messageDayLabel } from '../messageDates';

type MessageThreadProps = {
  conversationId: string | null;
  messages: Message[];
  currentUser: User;
  participantName: string;
  loading?: boolean;
  error?: string | null;
  typing?: boolean;
  onSend: (body: string, clientMessageId: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onReportMessage: (message: Message) => void;
  blockedByCurrentUser?: boolean;
  blockedByParticipant?: boolean;
  onUnblockParticipant: () => void;
  onReviewTerms: () => void;
  readyToSend?: boolean;
  hasOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
};

export function MessageThread({
  conversationId,
  messages,
  currentUser,
  participantName,
  loading,
  error,
  typing,
  onSend,
  onTypingStart,
  onTypingStop,
  onReportMessage,
  blockedByCurrentUser,
  blockedByParticipant,
  onUnblockParticipant,
  onReviewTerms,
  readyToSend,
  hasOlder, loadingOlder, onLoadOlder,
}: MessageThreadProps) {
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const { height: windowHeight } = useWindowDimensions();
  const threadHeight = Math.min(
    560,
    Math.max(380, Math.floor(windowHeight * 0.88 - 112)),
  );

  return (
    <View
      className="gap-2 border-t border-hercules-blue/15 pt-3"
      // Let the list shrink when the keyboard reduces the sheet's available space.
      style={[
        { height: threadHeight },
        { flexShrink: 1, minHeight: 0 },
      ]}
    >
      <View className="flex-1">
        {error ? <ErrorState message={error} /> : null}
        {loading && messages.length === 0 ? (
          <MessageThreadSkeleton conversationId={conversationId} />
        ) : (
          <FlatList
            key={conversationId ?? 'chat'}
            data={newestFirst}
            ListFooterComponent={hasOlder ? <Pressable accessibilityRole="button" disabled={loadingOlder} onPress={onLoadOlder} className="min-h-11 items-center justify-center"><Text className="font-bold text-hercules-blue">{loadingOlder ? 'Loading…' : 'Load older messages'}</Text></Pressable> : null}
            inverted
            keyExtractor={(message) => message.id}
            renderItem={({ item: message, index }) => (
              <View>
                {!newestFirst[index + 1] || !isSameMessageDay(message.createdAt, newestFirst[index + 1].createdAt) ? (
                  <Text accessibilityRole="header" className="pb-5 pt-3 text-center text-[11px] leading-4 text-hercules-muted">{messageDayLabel(message.createdAt)}</Text>
                ) : null}
              <MessageBubble
                message={message}
                mine={message.senderId === currentUser.id}
                senderName={message.senderId === currentUser.id ? currentUser.firstName : participantName}
                onReport={onReportMessage}
              />
              </View>
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <View className="min-h-5 justify-center px-1">
        <TypingIndicator visible={Boolean(typing)} />
      </View>
      {!currentUser.termsAcceptedAt ||
      currentUser.termsVersion !== CURRENT_TERMS_VERSION ? (
        <ConversationNotice
          message="Review and accept the Terms of Use before sending messages."
          actionLabel="Review Terms"
          onPress={onReviewTerms}
        />
      ) : blockedByCurrentUser ? (
        <ConversationNotice
          message="You blocked this participant."
          actionLabel="Unblock participant"
          onPress={onUnblockParticipant}
        />
      ) : blockedByParticipant ? (
        <ConversationNotice message="Messaging is unavailable in this conversation." />
      ) : (
          <MessageComposer
            onSend={onSend}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
            disabled={!readyToSend}
            recipientName={participantName}
          />
      )}
    </View>
  );
}

function ConversationNotice({
  message,
  actionLabel,
  onPress,
}: {
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View className="gap-1 rounded-[14px] border border-hercules-blue/15 bg-hercules-blue/5 px-4 py-3">
      <Text className="text-sm leading-5 text-hercules-muted">{message}</Text>
      {actionLabel && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          className="min-h-9 self-start justify-center"
        >
          <Text className="text-sm font-extrabold text-hercules-blue">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const messageSkeletonRows = [
  { mine: false, width: 'w-3/4', height: 'h-[112px]' },
  { mine: true, width: 'w-2/3', height: 'h-16' },
  { mine: false, width: 'w-1/2', height: 'h-16' },
] as const;

function MessageThreadSkeleton({
  conversationId,
}: {
  conversationId: string | null;
}) {
  return (
    <SkeletonReveal
      key={conversationId ?? 'chat'}
      label="Loading chat"
      className="flex-1 justify-end gap-2.5 py-1"
    >
      {messageSkeletonRows.map((row, index) => (
        <View
          key={`${row.mine ? 'mine' : 'theirs'}-${index}`}
          className={`w-full ${row.mine ? 'items-end' : 'items-start'}`}
        >
          <View
            className={`${row.height} rounded-[18px] ${row.width} ${
              row.mine
                ? 'bg-hercules-blue/15'
                : 'bg-hercules-blue/[0.06]'
            }`}
          />
        </View>
      ))}
    </SkeletonReveal>
  );
}

const styles = StyleSheet.create(nativeStyles.messageThread);
