import type { EnvLike } from './env';
import { redisEXPIRE, redisPipelineCommands } from './redis';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
};

export async function checkRateLimit(
  partyEnv: Record<string, unknown>,
  key: string,
): Promise<RateLimitResult | null> {
  const env = partyEnv as Record<string, string | undefined>;
  const max = Number(env.CHAT_RATE_LIMIT_MAX ?? 5);
  const windowSeconds = Number(env.CHAT_RATE_LIMIT_WINDOW_SECONDS ?? 60);
  const hasRedis = Boolean(
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
  );

  if (!hasRedis || !Number.isFinite(max) || !Number.isFinite(windowSeconds)) {
    return null;
  }

  const prefix = 'chat:ratelimit';
  const redisKey = `${prefix}:${key}`;
  const source: EnvLike = { env };

  const [incrResult, ttlResult] = await redisPipelineCommands(source, [
    ['INCR', redisKey],
    ['PTTL', redisKey],
  ]);

  const count = Number(incrResult.result ?? 0);
  let ttl = Number(ttlResult?.result ?? -1);

  if (count === 1 || ttl === -1) {
    await redisEXPIRE(source, redisKey, windowSeconds);
    ttl = windowSeconds * 1000;
  }

  const success = count <= max;
  const remaining = Math.max(0, max - count);
  const reset = Date.now() + Math.max(ttl, 0);

  return {
    success,
    remaining,
    limit: max,
    reset,
  };
}
