import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { Message, User } from '../../../lib/api/types';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';

type MessageThreadProps = {
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

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

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
