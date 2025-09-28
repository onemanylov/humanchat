import type { ChatMessage } from '~/lib/chat/types';

export type WebSocketMessageType = 'chat:message';

export type OutgoingWebSocketEvent = {
  type: WebSocketMessageType;
  text: string;
  wallet: string;
  username: string | null;
  profilePictureUrl: string | null;
  clientId: string;
};

export type IncomingWebSocketEvent =
  | { type: 'chat:new'; message: ChatMessage }
  | { type: 'chat:message:deleted'; messageId: string }
  | { type: 'chat:user:warned'; wallet: string; reason: string }
  | { type: 'chat:user:banned'; wallet: string; reason: string; isTemporary: boolean; expiresAt?: number }
  | { type: 'error:rateLimit'; message: string; retryAt: number; limit: number; remaining: number }
  | { type: 'error:validation'; message: string; reason?: string }
  | { type: 'error:auth'; message: string }
  | { type: 'error:banned'; message: string; isTemporary?: boolean; expiresAt?: number; reason?: string }
  | { type: 'error:protocol'; message: string };

/**
 * Creates a WebSocket message payload for sending a chat message
 * @param text Message text
 * @param user Current user information
 * @returns WebSocket message payload
 */
export function createChatMessagePayload(
  text: string,
  user: {
    wallet: string;
    username: string | null;
    profilePictureUrl: string | null;
  },
): OutgoingWebSocketEvent {
  const clientId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    type: 'chat:message',
    text: text.trim(),
    wallet: user.wallet,
    username: user.username,
    profilePictureUrl: user.profilePictureUrl,
    clientId,
  };
}

/**
 * Creates an optimistic chat message for immediate UI updates
 * @param payload WebSocket message payload
 * @returns Optimistic chat message
 */
export function createOptimisticMessage(
  payload: OutgoingWebSocketEvent,
): ChatMessage {
  return {
    id: payload.clientId,
    clientId: payload.clientId,
    text: payload.text,
    wallet: payload.wallet,
    username: payload.username,
    profilePictureUrl: payload.profilePictureUrl,
    ts: Date.now(),
    pending: true,
  };
}

/**
 * Parses incoming WebSocket message data
 * @param data Raw WebSocket message data
 * @returns Parsed event or null if invalid
 */
export function parseWebSocketMessage(data: string): IncomingWebSocketEvent | null {
  try {
    const parsed = JSON.parse(data);
    
    // Basic validation
    if (!parsed || typeof parsed !== 'object' || !parsed.type) {
      return null;
    }
    
    return parsed as IncomingWebSocketEvent;
  } catch (error) {
    console.warn('Failed to parse WebSocket message:', error);
    return null;
  }
}

/**
 * Serializes outgoing WebSocket message
 * @param event Event to serialize
 * @returns JSON string
 */
export function serializeWebSocketMessage(event: OutgoingWebSocketEvent): string {
  return JSON.stringify(event);
}