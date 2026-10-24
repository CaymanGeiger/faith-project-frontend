import { io, Socket } from 'socket.io-client';
import { Message } from './api/types';

export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000/messaging';

export type MessagingServerEvents = {
  'conversation:joined': (payload: { conversationId: string }) => void;
  'conversation:updated': (payload: { conversationId: string }) => void;
  'message:created': (payload: Message) => void;
  'message:read': (payload: {
    conversationId: string;
    userId: string;
    lastReadAt: string; lastMessageId?: string;
  }) => void;
  'typing:started': (payload: { conversationId: string; userId: string }) => void;
  'typing:stopped': (payload: { conversationId: string; userId: string }) => void;
  'messaging:error': (payload: { code: string; message: string }) => void;
};

export type MessagingAcknowledgement =
  | { ok: true }
  | { ok: false; message: string };

export type SendMessageAcknowledgement =
  | { ok: true; message: Message }
  | { ok: false; message: string };

export type MessagingClientEvents = {
  'conversation:join': (
    payload: { conversationId: string },
    callback?: (result: MessagingAcknowledgement) => void,
  ) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  'message:send': (payload: {
    conversationId: string;
    clientMessageId: string;
    body: string;
  }, callback?: (result: SendMessageAcknowledgement) => void) => void;
  'message:read': (
    payload: { conversationId: string; lastReadAt: string; lastMessageId?: string },
    callback?: (result: MessagingAcknowledgement) => void,
  ) => void;
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
};

export type MessagingSocket = Socket<MessagingServerEvents, MessagingClientEvents>;

let socket: MessagingSocket | null = null;
let socketToken: string | null = null;

export function getMessagingSocket(token: string) {
  if (socketToken === token && (socket?.connected || socket?.active)) {
    return socket;
  }

  socket?.disconnect();
  socketToken = token;
  socket = io(WS_URL, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
  });

  return socket;
}

export function disconnectMessagingSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
