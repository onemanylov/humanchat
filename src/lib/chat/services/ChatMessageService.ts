import { trpc } from '~/trpc/react';
import type { ChatMessage } from '~/lib/chat/types';
import { CHAT_CONFIG } from '../constants';
import { mergeMessages } from '../utils/message-merging';
import { sortMessagesByTimestamp } from '../utils/message-sorting';

export type ChatMessagesData = {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestTimestamp: number | undefined;
};

export type MessageOperationResult = {
  success: boolean;
  error?: string;
};

export class ChatMessageService {
  private utils: ReturnType<typeof trpc.useUtils>;

  constructor(trpcUtils: ReturnType<typeof trpc.useUtils>) {
    this.utils = trpcUtils;
  }

  /**
   * Gets current messages data with fallback
   */
  getCurrentData(): ChatMessagesData {
    const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
    const data = this.utils.chat.initialMessages.getData({ limit });
    
    return data ?? {
      messages: [],
      hasMore: false,
      oldestTimestamp: undefined,
    };
  }

  /**
   * Adds a new message to the cache (for real-time updates)
   */
  addMessage(message: ChatMessage): void {
    const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
    
    this.utils.chat.initialMessages.setData({ limit }, (previous) => {
      const prev = previous ?? this.getCurrentData();
      const mergedMessages = mergeMessages(prev.messages, [message], true);
      
      return {
        messages: mergedMessages,
        hasMore: prev.hasMore,
        oldestTimestamp: mergedMessages.length > 0 ? mergedMessages[0]!.ts : undefined,
      };
    });
  }

  /**
   * Updates an existing message (e.g., to remove pending status)
   */
  updateMessage(updatedMessage: ChatMessage): void {
    const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
    
    this.utils.chat.initialMessages.setData({ limit }, (previous) => {
      const prev = previous ?? this.getCurrentData();
      const messages = prev.messages.map(message => {
        const messageKey = message.clientId ?? message.id;
        const updateKey = updatedMessage.clientId ?? updatedMessage.id;
        
        return messageKey === updateKey 
          ? { ...message, ...updatedMessage }
          : message;
      });
      
      return {
        messages: sortMessagesByTimestamp(messages),
        hasMore: prev.hasMore,
        oldestTimestamp: messages.length > 0 ? messages[0]!.ts : undefined,
      };
    });
  }

  /**
   * Loads older messages (pagination)
   */
  async loadOlderMessages(loadMoreFn: (params: { beforeTimestamp: number; limit: number }) => Promise<{ messages: ChatMessage[]; hasMore: boolean }>): Promise<MessageOperationResult> {
    const current = this.getCurrentData();
    
    if (!current.hasMore || !current.oldestTimestamp) {
      return { success: false, error: 'No more messages to load' };
    }

    try {
      const result = await loadMoreFn({
        beforeTimestamp: current.oldestTimestamp,
        limit: CHAT_CONFIG.PAGINATION_LIMIT,
      });

      const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
      
      this.utils.chat.initialMessages.setData({ limit }, (previous) => {
        const prev = previous ?? current;
        const mergedMessages = mergeMessages(prev.messages, result.messages, false);

        return {
          messages: mergedMessages,
          hasMore: result.hasMore,
          oldestTimestamp: mergedMessages.length > 0 ? mergedMessages[0]!.ts : undefined,
        };
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to load older messages:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Removes a message from the cache
   */
  removeMessage(messageId: string): void {
    const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
    
    this.utils.chat.initialMessages.setData({ limit }, (previous) => {
      const prev = previous ?? this.getCurrentData();
      const messages = prev.messages.filter(message => {
        const key = message.clientId ?? message.id;
        return key !== messageId;
      });
      
      return {
        messages,
        hasMore: prev.hasMore,
        oldestTimestamp: messages.length > 0 ? messages[0]!.ts : undefined,
      };
    });
  }

  /**
   * Marks a message as failed
   */
  markMessageAsFailed(messageId: string, error: string): void {
    const limit = CHAT_CONFIG.INITIAL_MESSAGES_LIMIT;
    
    this.utils.chat.initialMessages.setData({ limit }, (previous) => {
      const prev = previous ?? this.getCurrentData();
      const messages = prev.messages.map(message => {
        const key = message.clientId ?? message.id;
        return key === messageId 
          ? { ...message, pending: false, error }
          : message;
      });
      
      return {
        messages,
        hasMore: prev.hasMore,
        oldestTimestamp: messages.length > 0 ? messages[0]!.ts : undefined,
      };
    });
  }

  /**
   * Gets sorted messages
   */
  getSortedMessages(): ChatMessage[] {
    const data = this.getCurrentData();
    return sortMessagesByTimestamp(data.messages);
  }
}