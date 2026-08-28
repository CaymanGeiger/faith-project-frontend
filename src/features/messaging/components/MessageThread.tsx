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

type MessageThreadProps = {
  conversationId: string | null;
  messages: Message[];
  currentUser: User;
  loading?: boolean;
  error?: string | null;
  typing?: boolean;
  onSend: (body: string) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onReportMessage: (message: Message) => void;
  blockedByCurrentUser?: boolean;
  blockedByParticipant?: boolean;
  onBlockParticipant: () => void;
  onUnblockParticipant: () => void;
  onReviewTerms: () => void;
  readyToSend?: boolean;
};

export function MessageThread({
  conversationId,
  messages,
  currentUser,
  loading,
  error,
  typing,
  onSend,
  onTypingStart,
  onTypingStop,
  onReportMessage,
  blockedByCurrentUser,
  blockedByParticipant,
  onBlockParticipant,
  onUnblockParticipant,
  onReviewTerms,
  readyToSend,
}: MessageThreadProps) {
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const { height: windowHeight } = useWindowDimensions();
  const threadHeight = Math.min(
    560,
    Math.max(380, Math.floor(windowHeight * 0.88 - 112)),
  );

  return (
    <View
      className="gap-2 border-t border-hercules-blue/10 pt-3"
      style={{ height: threadHeight }}
    >
      <View className="flex-1">
        {error ? <ErrorState message={error} /> : null}
        {loading && messages.length === 0 ? (
          <MessageThreadSkeleton conversationId={conversationId} />
        ) : (
          <FlatList
            key={conversationId ?? 'chat'}
            data={newestFirst}
            inverted
            keyExtractor={(message) => message.id}
            renderItem={({ item: message }) => (
              <MessageBubble
                message={message}
                mine={message.senderId === currentUser.id}
                onReport={onReportMessage}
              />
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
        <>
          <Pressable
            accessibilityRole="button"
            onPress={onBlockParticipant}
            className="min-h-9 self-start justify-center px-1"
          >
            <Text className="text-xs font-extrabold text-hercules-red">
              Block participant
            </Text>
          </Pressable>
          <MessageComposer
            onSend={onSend}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
            disabled={!readyToSend}
          />
        </>
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
                ? 'bg-hercules-red/15'
                : 'border border-hercules-blue/15 bg-hercules-blue/10'
            }`}
          />
        </View>
      ))}
    </SkeletonReveal>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 10,
    paddingVertical: 4,
  },
});
