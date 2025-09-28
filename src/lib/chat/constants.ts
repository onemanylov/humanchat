// Chat configuration constants
export const CHAT_CONFIG = {
  INITIAL_MESSAGES_LIMIT: 50,
  PAGINATION_LIMIT: 50,
  MESSAGES_STALE_TIME: 1_000 * 10, // 10 seconds
  MESSAGES_GC_TIME: 1_000 * 60 * 5, // 5 minutes
  AUTO_SCROLL_THRESHOLD: 100, // pixels from bottom
  RATE_LIMIT_RETRY_DELAY: 1_000, // 1 second
} as const;

// UI constants
export const UI_CONFIG = {
  LOADING_DELAY: 500, // ms before showing loading indicator
  SCROLL_DEBOUNCE: 100, // ms for scroll debouncing
  MESSAGE_TIMESTAMP_FORMAT: 'short', // timestamp display format
} as const;

// WebSocket constants
export const WEBSOCKET_CONFIG = {
  RECONNECT_DELAY: 1_000, // 1 second
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30_000, // 30 seconds
} as const;