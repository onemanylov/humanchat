import type { ChatMessage } from '~/lib/chat/types';

/**
 * Merges two arrays of chat messages, removing duplicates and maintaining order
 * @param existing Current messages array
 * @param incoming New messages to merge
 * @param append Whether to append (true) or prepend (false) incoming messages
 * @returns Merged and deduplicated messages array
 */
export function mergeMessages(
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
      // Merge message data, preferring non-pending messages
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

/**
 * Removes duplicate messages from an array based on ID or clientId
 * @param messages Array of messages to deduplicate
 * @returns Deduplicated messages array
 */
export function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  return messages.filter(message => {
    const key = message.clientId ?? message.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Updates a specific message in an array by ID or clientId
 * @param messages Current messages array
 * @param updatedMessage Message with updates
 * @returns Updated messages array
 */
export function updateMessageInArray(
  messages: ChatMessage[],
  updatedMessage: ChatMessage,
): ChatMessage[] {
  const key = updatedMessage.clientId ?? updatedMessage.id;
  return messages.map(message => {
    const messageKey = message.clientId ?? message.id;
    return messageKey === key ? { ...message, ...updatedMessage } : message;
  });
}