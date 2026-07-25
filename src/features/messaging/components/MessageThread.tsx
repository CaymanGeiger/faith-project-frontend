import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { Message, User } from '../../../lib/api/types';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';

type MessageThreadProps = {
  conversationId: string | null;
  messages: Message[];
  currentUser: User;
  loading?: boolean;
  error?: string | null;
  typing?: boolean;
  onSend: (body: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
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
}: MessageThreadProps) {
  const scrollRef = useRef<ScrollView>(null);
  const hasPositionedInitialMessages = useRef(false);

  useEffect(() => {
    hasPositionedInitialMessages.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({
        animated: hasPositionedInitialMessages.current,
      });
      hasPositionedInitialMessages.current = true;
    });
  }, [messages.length, conversationId]);

  return (
    <View className="h-[560px] gap-3">
      {loading ? <LoadingState label="Loading messages" /> : null}
      {error ? <ErrorState message={error} /> : null}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-3 pb-2"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mine={message.senderId === currentUser.id}
          />
        ))}
      </ScrollView>
      <TypingIndicator visible={Boolean(typing)} />
      <MessageComposer
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </View>
  );
}
