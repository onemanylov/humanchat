'use client';

import { useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import type { ChatMessage } from '~/lib/chat/types';
import { GLOBAL_CHAT_ROOM_ID } from '~/lib/constants/chat';
import { resolvePartyHost } from '~/lib/party/host';
import { useChatMessages } from './hooks';
import { trpc } from '~/trpc/react';

export type RateLimitEvent = {
  type: 'error:rateLimit';
  message: string;
  retryAt: number;
  limit: number;
  remaining: number;
};

export type ConnectionOptions = {
  onRateLimit?: (event: RateLimitEvent) => void;
};

export type ChatConnection = {
  socket: PartySocket | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  isInitialLoading: boolean;
  isTokenLoading: boolean;
};

type IncomingEvent =
  | { type: 'chat:new'; message: ChatMessage }
  | RateLimitEvent
  | { type: 'error:validation'; message: string; reason?: string };

export function useChatConnection(options: ConnectionOptions = {}): ChatConnection {
  const { messages, isLoadingMore, hasMoreMessages, loadOlderMessages, addMessage, isInitialLoading } =
    useChatMessages();

  const rateLimitHandler = useRef<ConnectionOptions['onRateLimit']>(undefined);
  rateLimitHandler.current = options.onRateLimit;

  const tokenQuery = trpc.chat.connectionToken.useQuery(undefined, {
    staleTime: 1_000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);

  const token = tokenQuery.data?.token;

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = new PartySocket({
      host: resolvePartyHost(),
      room: GLOBAL_CHAT_ROOM_ID,
      query: { token },
    });

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);
    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as IncomingEvent;
        if (data.type === 'chat:new' && data.message) {
          addMessage(data.message);
        } else if (data.type === 'error:rateLimit') {
          rateLimitHandler.current?.(data);
        } else if (data.type === 'error:validation') {
          console.warn('Chat validation error:', data.message);
        }
      } catch (error) {
        console.warn('Unable to parse chat message payload', error);
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('message', handleMessage as EventListener);

    socketRef.current = socket;

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('message', handleMessage as EventListener);
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [addMessage, token]);

  return {
    socket: socketRef.current,
    messages,
    isConnected,
    isLoadingMore,
    hasMoreMessages,
    loadOlderMessages,
    addMessage,
    isInitialLoading,
    isTokenLoading: tokenQuery.isLoading,
  };
}
