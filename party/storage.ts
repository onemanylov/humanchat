import type { ChatMessage } from '~/lib/chat/types';
import type { EnvLike } from './utils/env';
import { getChatKeys, redisLRANGE, redisRPUSH, redisSET, redisGET, redisDEL } from './utils/redis';

export async function insertMessage(source: EnvLike, message: ChatMessage) {
  const { CHAT_LIST_KEY, CHAT_LAST_KEY } = getChatKeys(source);
  await redisRPUSH(source, CHAT_LIST_KEY, JSON.stringify(message));
  await redisSET(source, CHAT_LAST_KEY, JSON.stringify(message));
}

export async function getRecentMessages(
  source: EnvLike,
  limit: number,
): Promise<ChatMessage[]> {
  const { CHAT_LIST_KEY } = getChatKeys(source);
  const items = await redisLRANGE(source, CHAT_LIST_KEY, -limit, -1);
  return parseMessages(items);
}

export async function getMessagesBefore(
  source: EnvLike,
  beforeTimestamp: number,
  limit: number,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const { CHAT_LIST_KEY } = getChatKeys(source);
  const items = await redisLRANGE(source, CHAT_LIST_KEY, 0, -1);
  const all = parseMessages(items).filter((msg) => msg.ts < beforeTimestamp);
  const sorted = all.sort((a, b) => b.ts - a.ts);
  const messages = sorted.slice(0, limit).reverse();
  const hasMore = sorted.length > limit;
  return { messages, hasMore };
}

export async function deleteMessage(source: EnvLike, messageId: string): Promise<boolean> {
  try {
    const { CHAT_LIST_KEY } = getChatKeys(source);
    
    // Get all messages to find and remove the specific one
    const items = await redisLRANGE(source, CHAT_LIST_KEY, 0, -1);
    const messages = parseMessages(items);
    
    // Filter out the message to delete
    const filteredMessages = messages.filter(msg => msg.id !== messageId);
    
    if (filteredMessages.length === messages.length) {
      // Message not found
      return false;
    }
    
    // Clear the list and re-populate with filtered messages
    await redisDEL(source, CHAT_LIST_KEY);
    
    for (const message of filteredMessages) {
      await redisRPUSH(source, CHAT_LIST_KEY, JSON.stringify(message));
    }
    
    // Update last message if needed
    const { CHAT_LAST_KEY } = getChatKeys(source);
    if (filteredMessages.length > 0) {
      const lastMessage = filteredMessages[filteredMessages.length - 1];
      await redisSET(source, CHAT_LAST_KEY, JSON.stringify(lastMessage));
    } else {
      await redisDEL(source, CHAT_LAST_KEY);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete message:', error);
    return false;
  }
}

function parseMessages(items: string[]): ChatMessage[] {
  return items
    .map((item) => {
      try {
        return JSON.parse(item) as ChatMessage;
      } catch {
        return null;
      }
    })
    .filter((msg): msg is ChatMessage => Boolean(msg));
}
