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
  },
  client: {
    NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_MOCK_AUTH: z.string().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH,
  },
});
