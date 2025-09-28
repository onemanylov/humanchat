import type { ChatMessage } from '~/lib/chat/types';

/**
 * Sorts chat messages by timestamp in ascending order
 * @param messages Array of chat messages to sort
 * @returns Sorted array of messages (oldest first)
 */
export function sortMessagesByTimestamp(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.ts - b.ts);
}

/**
 * Sorts chat messages by timestamp in descending order
 * @param messages Array of chat messages to sort
 * @returns Sorted array of messages (newest first)
 */
export function sortMessagesByTimestampDesc(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => b.ts - a.ts);
}

/**
 * Checks if messages are already sorted by timestamp
 * @param messages Array of chat messages
 * @returns True if messages are sorted in ascending order
 */
export function areMessagesSorted(messages: ChatMessage[]): boolean {
  for (let i = 1; i < messages.length; i++) {
    if (messages[i]!.ts < messages[i - 1]!.ts) {
      return false;
    }
  }
  return true;
}