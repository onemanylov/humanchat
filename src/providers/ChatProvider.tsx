'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '~/trpc/react';
import type { ChatMessage } from '~/lib/chat/types';
import { ChatWebSocketService, type WebSocketConnectionState } from '~/lib/chat/services/ChatWebSocketService';
import { ChatMessageService } from '~/lib/chat/services/ChatMessageService';
import { 
  createChatMessagePayload, 
  createOptimisticMessage,
  type IncomingWebSocketEvent,
} from '~/lib/chat/utils/websocket-events';
import { validateMessageText, canSendMessage } from '~/lib/chat/utils/message-validation';
import { CHAT_CONFIG } from '~/lib/chat/constants';

// Rate limit event type
export type RateLimitEvent = {
  type: 'error:rateLimit';
  message: string;
  retryAt: number;
  limit: number;
  remaining: number;
};

// Moderation event types
export type ModerationWarningEvent = {
  type: 'chat:user:warned';
  wallet: string;
  reason: string;
};

export type ModerationBanEvent = {
  type: 'chat:user:banned';
  wallet: string;
  reason: string;
  isTemporary: boolean;
  expiresAt?: number;
};

export type BanStatus = {
  isBanned: boolean;
  isTemporary: boolean;
  reason?: string;
  expiresAt?: number;
};

// Chat context type
export type ChatContextType = {
  // Messages
  messages: ChatMessage[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  
  // Connection
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
  
  // User
  currentUser: {
    wallet: string;
    username: string | null;
    profilePictureUrl: string | null;
  } | null;
  isUserLoading: boolean;
  
  // Rate limiting
  rateLimit: RateLimitEvent | null;
  remainingSeconds: number;
  
  // Moderation
  moderationWarning: ModerationWarningEvent | null;
  banStatus: BanStatus | null;
  
  // Actions
  sendMessage: (text: string) => Promise<boolean>;
  loadOlderMessages: () => Promise<boolean>;
  
  // State
  isSending: boolean;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const utils = trpc.useUtils();
  
  // tRPC queries
  const userQuery = trpc.auth.me.useQuery(undefined, {
    staleTime: 1_000 * 30,
    refetchOnWindowFocus: false,
  });
  
  const tokenQuery = trpc.chat.connectionToken.useQuery(undefined, {
    staleTime: 1_000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: !!userQuery.data?.user,
  });
  
  const initialMessages = trpc.chat.initialMessages.useQuery(
    { limit: CHAT_CONFIG.INITIAL_MESSAGES_LIMIT },
    {
      staleTime: CHAT_CONFIG.MESSAGES_STALE_TIME,
      gcTime: CHAT_CONFIG.MESSAGES_GC_TIME,
    },
  );

  // Services
  const webSocketService = useRef<ChatWebSocketService | null>(null);
  const messageService = useRef<ChatMessageService | null>(null);
  
  // State
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const [rateLimit, setRateLimit] = useState<RateLimitEvent | null>(null);
  const [moderationWarning, setModerationWarning] = useState<ModerationWarningEvent | null>(null);
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Initialize services
  useEffect(() => {
    if (!messageService.current) {
      messageService.current = new ChatMessageService(utils);
    }
  }, [utils]);

  // Update ban status from server response
  useEffect(() => {
    setBanStatus(userQuery.data?.banStatus || null);
  }, [userQuery.data?.banStatus]);

  // Handle rate limit timing
  useEffect(() => {
    if (!rateLimit) return;
    
    const timeout = rateLimit.retryAt - Date.now();
    if (timeout <= 0) {
      setRateLimit(null);
      return;
    }
    
    const timer = setTimeout(() => setRateLimit(null), timeout);
    return () => clearTimeout(timer);
  }, [rateLimit]);

  // Calculate remaining seconds for rate limit
  const remainingSeconds = React.useMemo(() => {
    if (!rateLimit) return 0;
    return Math.max(0, Math.ceil((rateLimit.retryAt - Date.now()) / 1000));
  }, [rateLimit]);

  // WebSocket event handler
  const handleWebSocketEvent = useCallback((event: IncomingWebSocketEvent) => {
    const currentUser = userQuery.data?.user;
    
    switch (event.type) {
      case 'chat:new':
        if (event.message && messageService.current) {
          messageService.current.addMessage(event.message);
        }
        break;
      case 'chat:message:deleted':
        if (messageService.current) {
          messageService.current.removeMessage(event.messageId);
        }
        break;
      case 'chat:user:warned':
        // Only show warning for current user
        if (currentUser?.wallet === event.wallet) {
          setModerationWarning(event);
          // Clear warning after 10 seconds
          setTimeout(() => setModerationWarning(null), 10000);
        }
        break;
      case 'chat:user:banned':
        // Only show ban for current user
        if (currentUser?.wallet === event.wallet) {
          const newBanStatus: BanStatus = {
            isBanned: true,
            isTemporary: event.isTemporary,
            reason: event.reason,
            expiresAt: event.expiresAt,
          };
          setBanStatus(newBanStatus);
          // Refetch user data to update ban status from server
          userQuery.refetch();
        }
        break;
      case 'error:rateLimit':
        setRateLimit(event);
        break;
      case 'error:banned':
        // Handle ban error from server
        const banStatusFromError: BanStatus = {
          isBanned: true,
          isTemporary: event.isTemporary || false,
          reason: event.reason,
          expiresAt: event.expiresAt,
        };
        setBanStatus(banStatusFromError);
        // Refetch user data to update ban status from server
        userQuery.refetch();
        break;
      case 'error:validation':
        console.warn('Chat validation error:', event.message);
        break;
    }
  }, [userQuery.data?.user]);

  // Manage WebSocket connection
  useEffect(() => {
    const token = tokenQuery.data?.token;
    
    if (!token) {
      if (webSocketService.current) {
        webSocketService.current.disconnect();
        webSocketService.current = null;
      }
      setConnectionState('disconnected');
      return;
    }

    // Create WebSocket service if needed
    if (!webSocketService.current) {
      webSocketService.current = new ChatWebSocketService();
    }

    // Connect and setup event listeners
    const connectAndListen = async () => {
      try {
        await webSocketService.current!.connect(token);
        setConnectionState('connected');
        
        // Add event listener
        const removeListener = webSocketService.current!.addEventListener(handleWebSocketEvent);
        
        return removeListener;
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setConnectionState('error');
        return null;
      }
    };

    let removeListener: (() => void) | null = null;
    
    connectAndListen().then(cleanup => {
      removeListener = cleanup;
    });

    // Update connection state based on service state
    const updateConnectionState = () => {
      if (webSocketService.current) {
        setConnectionState(webSocketService.current.getConnectionState());
      }
    };

    const interval = setInterval(updateConnectionState, 1000);

    return () => {
      clearInterval(interval);
      removeListener?.();
    };
  }, [tokenQuery.data?.token, handleWebSocketEvent]);

  // Send message function
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    const user = userQuery.data?.user;
    const token = tokenQuery.data?.token;
    
    if (!user || !token || !webSocketService.current || !messageService.current) {
      return false;
    }

    const validatedText = validateMessageText(text);
    if (!validatedText) {
      return false;
    }

    if (!canSendMessage(
      validatedText,
      webSocketService.current.isConnected(),
      !!rateLimit,
      isSending,
    )) {
      return false;
    }

    try {
      setIsSending(true);

      // Create message payload with token
      const payload = createChatMessagePayload(validatedText, user, token);
      
      // Add optimistic message
      const optimisticMessage = createOptimisticMessage(payload);
      messageService.current.addMessage(optimisticMessage);

      // Send via WebSocket
      const success = webSocketService.current.sendMessage(payload);
      
      if (!success) {
        // Remove optimistic message on failure
        messageService.current.removeMessage(payload.clientId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [userQuery.data?.user, tokenQuery.data?.token, rateLimit, isSending]);

  // Load older messages function
  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    if (!messageService.current || isLoadingMore) {
      return false;
    }

    setIsLoadingMore(true);
    try {
      const result = await messageService.current.loadOlderMessages(
        (params) => utils.chat.loadMore.fetch(params)
      );
      return result.success;
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, utils.chat.loadMore]);

  // Get current messages
  const messages = messageService.current?.getSortedMessages() ?? [];
  const messagesData = messageService.current?.getCurrentData() ?? {
    messages: [],
    hasMore: false,
    oldestTimestamp: undefined,
  };

  const contextValue: ChatContextType = {
    // Messages
    messages,
    isInitialLoading: initialMessages.isLoading,
    isLoadingMore,
    hasMoreMessages: messagesData.hasMore,
    
    // Connection
    connectionState,
    isConnected: connectionState === 'connected',
    
    // User
    currentUser: userQuery.data?.user ?? null,
    isUserLoading: userQuery.isLoading || tokenQuery.isLoading,
    
    // Rate limiting
    rateLimit,
    remainingSeconds,
    
    // Moderation
    moderationWarning,
    banStatus,
    
    // Actions
    sendMessage,
    loadOlderMessages,
    
    // State
    isSending,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}