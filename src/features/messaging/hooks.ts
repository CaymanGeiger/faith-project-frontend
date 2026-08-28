import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { conversationsApi } from '../../lib/api/endpoints';
import { Conversation, Message, User } from '../../lib/api/types';
import {
  disconnectMessagingSocket,
  getMessagingSocket,
  MessagingAcknowledgement,
  MessagingSocket,
  SendMessageAcknowledgement,
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
  const [state, setState] = useState<{
    conversationId: string | null;
    messages: Message[];
    error: string | null;
  }>({
    conversationId: null,
    messages: [],
    error: null,
  });
  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);
  const [readyConversationId, setReadyConversationId] = useState<string | null>(
    null,
  );
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const targetConversationId = conversationId;
    if (!targetConversationId) return;

    const requestId = ++requestSequence.current;
    setLoadingConversationId(targetConversationId);
    setState((current) =>
      current.conversationId === targetConversationId
        ? { ...current, error: null }
        : current,
    );

    try {
      const response = await conversationsApi.messages(targetConversationId);
      if (requestId !== requestSequence.current) return;
      setState({
        conversationId: targetConversationId,
        messages: response.messages,
        error: null,
      });
    } catch (caught) {
      if (requestId !== requestSequence.current) return;
      setState((current) => ({
        conversationId: targetConversationId,
        messages:
          current.conversationId === targetConversationId
            ? current.messages
            : [],
        error: caught instanceof Error ? caught.message : 'Unable to load',
      }));
    } finally {
      if (requestId === requestSequence.current) {
        setLoadingConversationId(null);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      requestSequence.current += 1;
      setLoadingConversationId(null);
      setReadyConversationId(null);
      return;
    }

    void load();
    return () => {
      requestSequence.current += 1;
    };
  }, [conversationId, load]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    setReadyConversationId(null);
    const join = () => {
      socket.emit(
        'conversation:join',
        { conversationId },
        (result: MessagingAcknowledgement) => {
          if (!result.ok) {
            setState((current) => ({
              ...current,
              error: result.message,
            }));
          }
        },
      );
    };
    const onJoined = (payload: { conversationId: string }) => {
      if (payload.conversationId === conversationId) {
        setReadyConversationId(conversationId);
      }
    };
    const onMessagingError = (payload: { message: string }) => {
      setState((current) => ({ ...current, error: payload.message }));
    };
    const onMessage = (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setState((current) => {
        const currentMessages =
          current.conversationId === conversationId ? current.messages : [];
        if (currentMessages.some((item) => item.id === message.id)) {
          return current;
        }
        return {
          conversationId,
          messages: [...currentMessages, message],
          error: null,
        };
      });
    };

    socket.on('conversation:joined', onJoined);
    socket.on('messaging:error', onMessagingError);
    socket.on('message:created', onMessage);
    socket.on('connect', join);
    if (socket.connected) {
      join();
    }
    return () => {
      if (socket.connected) {
        socket.emit('conversation:leave', { conversationId });
      }
      socket.off('connect', join);
      socket.off('conversation:joined', onJoined);
      socket.off('messaging:error', onMessagingError);
      socket.off('message:created', onMessage);
    };
  }, [conversationId, socket]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (
        !socket ||
        !conversationId ||
        !socket.connected ||
        readyConversationId !== conversationId
      ) {
        const error = new Error('Connecting to secure chat. Please try again in a moment.');
        setState((current) => ({ ...current, error: error.message }));
        throw error;
      }

      const clientMessageId = `mobile-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;
      setState((current) => ({ ...current, error: null }));

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const error = new Error('Message delivery timed out. Please try again.');
          setState((current) => ({ ...current, error: error.message }));
          reject(error);
        }, 10_000);

        socket.emit(
          'message:send',
          { conversationId, body, clientMessageId },
          (result: SendMessageAcknowledgement) => {
            clearTimeout(timeout);
            if (!result.ok) {
              const error = new Error(result.message);
              setState((current) => ({ ...current, error: error.message }));
              reject(error);
              return;
            }

            setState((current) => {
              const messages =
                current.conversationId === conversationId ? current.messages : [];
              if (messages.some((message) => message.id === result.message.id)) {
                return { ...current, error: null };
              }
              return {
                conversationId,
                messages: [...messages, result.message],
                error: null,
              };
            });
            resolve();
          },
        );
      });
    },
    [conversationId, readyConversationId, socket],
  );

  const showingCurrentConversation = state.conversationId === conversationId;
  const loading = Boolean(
    conversationId &&
      (loadingConversationId === conversationId ||
        !showingCurrentConversation),
  );

  return {
    messages: showingCurrentConversation ? state.messages : [],
    loading,
    error: showingCurrentConversation ? state.error : null,
    reload: load,
    sendMessage,
    readyToSend:
      Boolean(socket?.connected) && readyConversationId === conversationId,
  };
}

export function useTypingIndicator(
  conversationId: string | null,
  socket: MessagingSocket | null,
  currentUser: User | null,
) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  useEffect(() => {
    setTypingUserIds([]);
  }, [conversationId]);

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
