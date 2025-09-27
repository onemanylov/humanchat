import { env } from '~/env';
import type { ChatMessage } from '~/lib/chat/types';
import { getMessagesBefore, getRecentMessages } from '../../party/storage';
import type { EnvLike } from '../../party/utils/env';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const SAFETY_MARGIN = 10;

type HistoryResult = {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestTimestamp: number | undefined;
};

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toEnvLike(): EnvLike {
  return {
    env: {
      UPSTASH_REDIS_REST_URL: clean(env.UPSTASH_REDIS_REST_URL),
      UPSTASH_REDIS_REST_TOKEN: clean(env.UPSTASH_REDIS_REST_TOKEN),
      CHAT_RATE_LIMIT_MAX: clean(env.CHAT_RATE_LIMIT_MAX),
      CHAT_RATE_LIMIT_WINDOW_SECONDS: clean(env.CHAT_RATE_LIMIT_WINDOW_SECONDS),
      VITE_NETWORK: clean(process.env.VITE_NETWORK) ?? 'default',
    },
  };
}

function clampLimit(limit: number | undefined): number {
  const fallback = DEFAULT_LIMIT;
  if (typeof limit !== 'number' || Number.isNaN(limit)) return fallback;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

export async function fetchInitialMessages(limit?: number): Promise<HistoryResult> {
  const effectiveLimit = clampLimit(limit);
  const envLike = toEnvLike();
  const extraLimit = Math.min(effectiveLimit + SAFETY_MARGIN, MAX_LIMIT * 2);

  try {
    const messages = await getRecentMessages(envLike, extraLimit);
    const trimmed = messages.slice(-effectiveLimit);
    const hasMore = messages.length > effectiveLimit;
    const oldestTimestamp = trimmed.length > 0 ? trimmed[0]!.ts : undefined;

    return {
      messages: trimmed,
      hasMore,
      oldestTimestamp,
    };
  } catch (error) {
    console.error('[fetchInitialMessages] error', error);
    return { messages: [], hasMore: false, oldestTimestamp: undefined };
  }
}

export async function fetchMessagesBefore(
  beforeTimestamp: number,
  limit?: number,
): Promise<HistoryResult> {
  const effectiveLimit = clampLimit(limit);
  const envLike = toEnvLike();
  const requestLimit = Math.min(effectiveLimit + SAFETY_MARGIN, MAX_LIMIT * 2);

  try {
    const result = await getMessagesBefore(envLike, beforeTimestamp, requestLimit);
    let messages = result.messages;

    if (messages.length > effectiveLimit) {
      messages = messages.slice(messages.length - effectiveLimit);
    }

    const hasMore = result.hasMore || result.messages.length > effectiveLimit;
    const oldestTimestamp = messages.length > 0 ? messages[0]!.ts : undefined;

    return {
      messages,
      hasMore,
      oldestTimestamp,
    };
  } catch (error) {
    console.error('[fetchMessagesBefore] error', error);
    return { messages: [], hasMore: false, oldestTimestamp: undefined };
  }
}

export async function fetchLastMessage(): Promise<ChatMessage | null> {
  const envLike = toEnvLike();
  try {
    const messages = await getRecentMessages(envLike, 1);
    return messages.length > 0 ? messages[0]! : null;
  } catch (error) {
    console.error('[fetchLastMessage] error', error);
    return null;
  }
}
