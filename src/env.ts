import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

export const env = createEnv({
  server: {
    DATABASE_URL: isProd
      ? z.string().min(1)
      : z.string().min(1).catch('sqlite://dev.db'),
    JWT_SECRET: isProd
      ? z.string().min(1)
      : z.string().min(1).catch('dev-secret'),
    UPSTASH_REDIS_REST_URL: z.string().min(1).catch(''),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).catch(''),
    CHAT_RATE_LIMIT_MAX: z.string().optional(),
    CHAT_RATE_LIMIT_WINDOW_SECONDS: z.string().optional(),
    OPENAI_API_KEY: isProd
      ? z.string().min(1)
      : z.string().min(1).catch(''),
  },
  client: {
    NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_MOCK_AUTH: z.string().optional(),
    NEXT_PUBLIC_PARTYKIT_HOST: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CHAT_RATE_LIMIT_MAX: process.env.CHAT_RATE_LIMIT_MAX,
    CHAT_RATE_LIMIT_WINDOW_SECONDS:
      process.env.CHAT_RATE_LIMIT_WINDOW_SECONDS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_PARTYKIT_HOST: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
  },
});
