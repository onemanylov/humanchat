'use client';

import { useCallback, useState } from 'react';
import type { ChatMessage } from '~/lib/chat/types';
import { trpc } from '~/trpc/react';

export const CHAT_QUERY_CONFIG = {
  INITIAL_MESSAGES_LIMIT: 50,
  PAGINATION_LIMIT: 50,
  MESSAGES_STALE_TIME: 1_000 * 10,
  MESSAGES_GC_TIME: 1_000 * 60 * 5,
} as const;

type ChatMessagesData = {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestTimestamp: number | undefined;
};

type UseChatMessagesReturn = {
  messages: ChatMessage[];
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  isInitialLoading: boolean;
};

function ensureData(data: ChatMessagesData | undefined): ChatMessagesData {
  return (
    data ?? {
      messages: [],
      hasMore: false,
      oldestTimestamp: undefined,
    }
  );
}

function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
  append: boolean,
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  const ordered = append
    ? [...existing, ...incoming]
    : [...incoming, ...existing];

  for (const message of ordered) {
    const key = message.clientId ?? message.id;
    const previous = map.get(key);
    if (previous) {
      map.set(key, {
        ...previous,
        ...message,
        pending: message.pending ?? false,
      });
    } else {
      map.set(key, { ...message, pending: message.pending ?? false });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
}

export function useChatMessages(): UseChatMessagesReturn {
  const utils = trpc.useUtils();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const limit = CHAT_QUERY_CONFIG.INITIAL_MESSAGES_LIMIT;
  const initialMessages = trpc.chat.initialMessages.useQuery(
    { limit },
    {
      staleTime: CHAT_QUERY_CONFIG.MESSAGES_STALE_TIME,
      gcTime: CHAT_QUERY_CONFIG.MESSAGES_GC_TIME,
    },
  );

  const loadOlderMessages = useCallback(async () => {
    const current = ensureData(utils.chat.initialMessages.getData({ limit }));

    if (isLoadingMore || !current.hasMore || !current.oldestTimestamp) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await utils.chat.loadMore.fetch({
        beforeTimestamp: current.oldestTimestamp,
        limit: CHAT_QUERY_CONFIG.PAGINATION_LIMIT,
      });

      utils.chat.initialMessages.setData({ limit }, (previous) => {
        const prev = ensureData(previous ?? current);
        const mergedMessages = mergeMessages(prev.messages, result.messages, false);

        return {
          messages: mergedMessages,
          hasMore: result.hasMore,
          oldestTimestamp:
            mergedMessages.length > 0 ? mergedMessages[0]!.ts : undefined,
        } satisfies ChatMessagesData;
      });
    } catch (error) {
      console.error('Failed to load older chat messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, limit, utils.chat.initialMessages]);

  const addMessage = useCallback(
    (message: ChatMessage) => {
      utils.chat.initialMessages.setData({ limit }, (previous) => {
        const prev = ensureData(previous);
        const mergedMessages = mergeMessages(prev.messages, [message], true);
        return {
          messages: mergedMessages,
          hasMore: prev.hasMore,
          oldestTimestamp:
            mergedMessages.length > 0 ? mergedMessages[0]!.ts : undefined,
        } satisfies ChatMessagesData;
      });
    },
    [limit, utils.chat.initialMessages],
  );

  const snapshot = ensureData(initialMessages.data);

  return {
    messages: snapshot.messages,
    isLoadingMore,
    hasMoreMessages: snapshot.hasMore,
    loadOlderMessages,
    addMessage,
    isInitialLoading: initialMessages.isLoading,
  };
}
