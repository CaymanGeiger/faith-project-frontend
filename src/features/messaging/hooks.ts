import { useCallback, useEffect, useMemo, useState } from 'react';
import { conversationsApi } from '../../lib/api/endpoints';
import { Conversation, Message, User } from '../../lib/api/types';
import {
  disconnectMessagingSocket,
  getMessagingSocket,
  MessagingSocket,
} from '../../lib/messagingSocket';

export function useMessagingSocket(token: string | null) {
  const [socket, setSocket] = useState<MessagingSocket | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectMessagingSocket();
      setSocket(null);
      return;
    }

    const nextSocket = getMessagingSocket(token);
    nextSocket.connect();
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  return socket;
}

export function useConversations(socket: MessagingSocket | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await conversationsApi.list();
      setConversations(response.conversations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void load();
    socket.on('message:created', refresh);
    socket.on('message:read', refresh);
    return () => {
      socket.off('message:created', refresh);
      socket.off('message:read', refresh);
    };
  }, [load, socket]);

  return { conversations, loading, error, reload: load };
}

export function useConversationMessages(
  conversationId: string | null,
  socket: MessagingSocket | null,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await conversationsApi.messages(conversationId);
      setMessages(response.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('conversation:join', { conversationId });
    const onMessage = (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message];
      });
    };

    socket.on('message:created', onMessage);
    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:created', onMessage);
    };
  }, [conversationId, socket]);

  const sendMessage = useCallback(
    (body: string) => {
      if (!socket || !conversationId) return;
      socket.emit('message:send', {
        conversationId,
        body,
        clientMessageId: `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });
    },
    [conversationId, socket],
  );

  return { messages, loading, error, reload: load, sendMessage };
}

export function useTypingIndicator(
  conversationId: string | null,
  socket: MessagingSocket | null,
  currentUser: User | null,
) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const started = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUser?.id) return;
      setTypingUserIds((current) =>
        current.includes(payload.userId) ? current : [...current, payload.userId],
      );
    };
    const stopped = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUserIds((current) => current.filter((id) => id !== payload.userId));
    };
    socket.on('typing:started', started);
    socket.on('typing:stopped', stopped);
    return () => {
      socket.off('typing:started', started);
      socket.off('typing:stopped', stopped);
    };
  }, [conversationId, currentUser?.id, socket]);

  const typing = useMemo(() => typingUserIds.length > 0, [typingUserIds]);

  const startTyping = useCallback(() => {
    if (socket && conversationId) socket.emit('typing:start', { conversationId });
  }, [conversationId, socket]);

  const stopTyping = useCallback(() => {
    if (socket && conversationId) socket.emit('typing:stop', { conversationId });
  }, [conversationId, socket]);

  return { typing, startTyping, stopTyping };
}

export function useReadReceipts(
  conversationId: string | null,
  socket: MessagingSocket | null,
) {
  const markRead = useCallback(() => {
    if (!socket || !conversationId) return;
    socket.emit('message:read', {
      conversationId,
      lastReadAt: new Date().toISOString(),
    });
  }, [conversationId, socket]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  return { markRead };
}
