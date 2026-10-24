import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { mergeMessages, reconcileMessageHistory } from './messageHistory';
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

  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const response = await conversationsApi.list();
      if (request === sequence.current) setConversations(response.conversations);
    } catch (caught) {
      if (request === sequence.current) setError(caught instanceof Error ? caught.message : 'Unable to load');
    } finally {
      if (request === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const foreground = AppState.addEventListener('change', next => { if (next === 'active') void load(); });
    const poll = setInterval(() => { if (AppState.currentState === 'active') void load(); }, 30_000);
    return () => { sequence.current += 1; foreground.remove(); clearInterval(poll); };
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => void load();
    socket.on('connect', refresh);
    socket.on('message:created', refresh);
    socket.on('message:read', refresh);
    socket.on('conversation:updated', refresh);
    return () => {
      socket.off('connect', refresh);
      socket.off('message:created', refresh);
      socket.off('message:read', refresh);
      socket.off('conversation:updated', refresh);
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
  const [page, setPage] = useState<{ conversationId: string | null; nextCursor: string | null }>({ conversationId: null, nextCursor: null });
  const [loadingOlder, setLoadingOlder] = useState(false);
  const olderBusy = useRef(false);
  const requestSequence = useRef(0);
  const activeConversation = useRef(conversationId);
  const stateRef = useRef(state);
  activeConversation.current = conversationId;
  stateRef.current = state;

  const load = useCallback(async (_recoverGap = false) => {
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
      const known = stateRef.current.conversationId === targetConversationId ? stateRef.current.messages : [];
      const recovered = await reconcileMessageHistory(
        (cursor) => conversationsApi.messages(targetConversationId, cursor),
        known,
        () => requestId === requestSequence.current && activeConversation.current === targetConversationId,
      );
      if (requestId !== requestSequence.current) return;
      setPage({ conversationId: targetConversationId, nextCursor: recovered.nextCursor });
      const knownIds = new Set(known.map(message => message.id));
      setState((current) => ({
        conversationId: targetConversationId,
        messages: mergeMessages(recovered.messages, current.conversationId === targetConversationId ? current.messages.filter(message => !knownIds.has(message.id)) : []),
        error: null,
      }));
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
    const foreground = AppState.addEventListener('change', next => { if (next === 'active' && !olderBusy.current) void load(true); });
    const poll = setInterval(() => { if (AppState.currentState === 'active' && !olderBusy.current) void load(true); }, 30_000);
    return () => { requestSequence.current += 1; foreground.remove(); clearInterval(poll); };
  }, [conversationId, load]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    let active = true;
    let hasJoined = false;
    setReadyConversationId(null);
    const disconnected = () => {
      setReadyConversationId(null);
      requestSequence.current += 1;
      setLoadingConversationId(null);
    };
    const join = () => {
      setReadyConversationId(null);
      socket.emit(
        'conversation:join',
        { conversationId },
        (result: MessagingAcknowledgement) => {
          if (active && !result.ok) {
            setState((current) => ({
              ...current,
              error: result.message,
            }));
          }
        },
      );
    };
    const onJoined = (payload: { conversationId: string }) => {
      if (active && payload.conversationId === conversationId) {
        setReadyConversationId(conversationId);
        void load(hasJoined);
        hasJoined = true;
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
          messages: mergeMessages(currentMessages, [message]),
          error: null,
        };
      });
    };

    socket.on('conversation:joined', onJoined);
    socket.on('messaging:error', onMessagingError);
    socket.on('message:created', onMessage);
    socket.on('connect', join);
    socket.on('disconnect', disconnected);
    if (socket.connected) {
      join();
    }

    return () => {
      active = false;
      if (socket.connected) {
        socket.emit('conversation:leave', { conversationId });
      }
      socket.off('connect', join);
      socket.off('disconnect', disconnected);
      socket.off('conversation:joined', onJoined);
      socket.off('messaging:error', onMessagingError);
      socket.off('message:created', onMessage);
    };
  }, [conversationId, load, socket]);

  const sendMessage = useCallback(
    async (body: string, clientMessageId: string) => {
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

      setState((current) => ({ ...current, error: null }));

      const targetConversationId = conversationId;
      const updateError = (message: string) => {
        if (activeConversation.current === targetConversationId) {
          setState((current) => ({ ...current, error: message }));
        }
      };
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          const error = new Error('Message delivery timed out. Please try again.');
          settled = true;
          updateError(error.message);
          reject(error);
        }, 10_000);

        socket.emit(
          'message:send',
          { conversationId, body, clientMessageId },
          (result: SendMessageAcknowledgement) => {
            clearTimeout(timeout);
            if (!result.ok) {
              if (settled) return;
              settled = true;
              const error = new Error(result.message);
              updateError(error.message);
              reject(error);
              return;
            }

            if (activeConversation.current === targetConversationId) setState((current) => {
              const messages =
                current.conversationId === conversationId ? current.messages : [];
              if (messages.some((message) => message.id === result.message.id)) {
                return { ...current, error: null };
              }
              return {
                conversationId,
                messages: mergeMessages(messages, [result.message]),
                error: null,
              };
            });
            settled = true;
            resolve();
          },
        );
      });
    },
    [conversationId, readyConversationId, socket],
  );

  const loadOlder = useCallback(async () => {
    if (!conversationId || page.conversationId !== conversationId || !page.nextCursor || olderBusy.current || loadingConversationId) return;
    olderBusy.current = true; setLoadingOlder(true);
    const request = requestSequence.current;
    try {
      const response = await conversationsApi.messages(conversationId, page.nextCursor);
      if (activeConversation.current !== conversationId || request !== requestSequence.current) return;
      setState(current => ({ ...current, messages: mergeMessages(response.messages, current.messages), error: null }));
      setPage({ conversationId, nextCursor: response.nextCursor });
    } catch (caught) {
      if (activeConversation.current === conversationId && request === requestSequence.current) setState(current => ({ ...current, error: caught instanceof Error ? caught.message : 'Unable to load older messages' }));
    } finally { olderBusy.current = false; setLoadingOlder(false); }
  }, [conversationId, page, loadingConversationId]);

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
    loadOlder,
    loadingOlder,
    hasOlder: page.conversationId === conversationId && Boolean(page.nextCursor),
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
  const lastTypingAt = useRef(0);

  useEffect(() => {
    setTypingUserIds([]);
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    const expiries = new Map<string, ReturnType<typeof setTimeout>>();
    const started = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUser?.id) return;
      clearTimeout(expiries.get(payload.userId));
      expiries.set(payload.userId, setTimeout(() => { expiries.delete(payload.userId); setTypingUserIds(current => current.filter(id => id !== payload.userId)); }, 6_000));
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
      for (const timer of expiries.values()) clearTimeout(timer);
      socket.off('typing:started', started);
      socket.off('typing:stopped', stopped);
    };
  }, [conversationId, currentUser?.id, socket]);

  const typing = useMemo(() => typingUserIds.length > 0, [typingUserIds]);

  const startTyping = useCallback(() => {
    if (socket?.connected && conversationId && Date.now() - lastTypingAt.current >= 3_000) { lastTypingAt.current = Date.now(); socket.emit('typing:start', { conversationId }); }
  }, [conversationId, socket]);

  const stopTyping = useCallback(() => {
    if (socket && conversationId) socket.emit('typing:stop', { conversationId });
  }, [conversationId, socket]);

  return { typing, startTyping, stopTyping };
}

export function useReadReceipts(conversationId: string | null, socket: MessagingSocket | null, messages: Message[] = []) {
  const newest = messages[messages.length - 1];
  const attempt = useRef<() => void>(() => {});
  const markRead = useCallback(() => attempt.current(), []);
  useEffect(() => {
    if (!socket || !conversationId || !newest) return;
    const payload = { conversationId, lastReadAt: newest.createdAt, lastMessageId: newest.id };
    let active = true;
    let acknowledged = false;
    let pending = false;
    let failures = 0;
    let request = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let acknowledgementTimer: ReturnType<typeof setTimeout> | undefined;
    const retry = () => {
      pending = false;
      clearTimeout(acknowledgementTimer);
      if (!active || acknowledged) return;
      failures += 1;
      timer = setTimeout(send, Math.min(1_000 * 2 ** Math.min(failures - 1, 5), 30_000));
    };
    const send = () => {
      if (!active || acknowledged || pending || !socket.connected || AppState.currentState !== 'active') return;
      clearTimeout(timer);
      pending = true;
      const sentRequest = ++request;
      acknowledgementTimer = setTimeout(() => {
        if (!active || sentRequest !== request) return;
        request += 1;
        retry();
      }, 5_000);
      socket.emit('message:read', payload, result => {
        if (!active || sentRequest !== request) return;
        clearTimeout(acknowledgementTimer);
        if (!result.ok) { retry(); return; }
        pending = false;
        acknowledged = true;
        clearTimeout(timer);
      });
    };
    const disconnected = () => {
      request += 1;
      pending = false;
      clearTimeout(timer);
      clearTimeout(acknowledgementTimer);
    };
    attempt.current = send;
    timer = setTimeout(send, 500);
    const foreground = AppState.addEventListener('change', next => { if (next === 'active') send(); });
    socket.on('connect', send);
    socket.on('disconnect', disconnected);
    return () => {
      active = false;
      attempt.current = () => {};
      clearTimeout(timer);
      clearTimeout(acknowledgementTimer);
      foreground.remove();
      socket.off('connect', send);
      socket.off('disconnect', disconnected);
    };
  }, [conversationId, socket, newest?.id, newest?.createdAt]);
  return { markRead };
}
