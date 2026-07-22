import { io, Socket } from 'socket.io-client';
import { Message } from './api/types';

export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000/messaging';

export type MessagingServerEvents = {
  'conversation:joined': (payload: { conversationId: string }) => void;
  'message:created': (payload: Message) => void;
  'message:read': (payload: {
    conversationId: string;
    userId: string;
    lastReadAt: string;
  }) => void;
  'typing:started': (payload: { conversationId: string; userId: string }) => void;
  'typing:stopped': (payload: { conversationId: string; userId: string }) => void;
  'messaging:error': (payload: { code: string; message: string }) => void;
};

export type MessagingClientEvents = {
  'conversation:join': (payload: { conversationId: string }) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  'message:send': (payload: {
    conversationId: string;
    clientMessageId: string;
    body: string;
  }) => void;
  'message:read': (payload: { conversationId: string; lastReadAt: string }) => void;
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
};

export type MessagingSocket = Socket<MessagingServerEvents, MessagingClientEvents>;

let socket: MessagingSocket | null = null;

export function getMessagingSocket(token: string) {
  if (socket?.connected || socket?.active) {
    return socket;
  }

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
}
