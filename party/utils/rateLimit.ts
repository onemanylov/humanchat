import type { EnvLike } from './env';
import { redisEXPIRE, redisPipelineCommands } from './redis';

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number;
};

export class CustomRateLimiter {
  private readonly prefix = 'chat:ratelimit';
  constructor(
    private readonly source: EnvLike,
    private readonly max: number,
    private readonly windowSeconds: number,
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}:${key}`;
    const [incrResult, ttlResult] = await redisPipelineCommands(this.source, [
      ['INCR', redisKey],
      ['PTTL', redisKey],
    ]);

    const count = Number(incrResult.result ?? 0);
    let ttl = Number(ttlResult?.result ?? -1);

    if (count === 1 || ttl === -1) {
      await redisEXPIRE(this.source, redisKey, this.windowSeconds);
      ttl = this.windowSeconds * 1000;
    }

    const success = count <= this.max;
    const remaining = Math.max(0, this.max - count);
    const reset = Date.now() + Math.max(ttl, 0);

    return {
      success,
      remaining,
      limit: this.max,
      reset,
    };
  }
}

export function initializeRateLimit(
  env: Record<string, string | undefined>,
): CustomRateLimiter | null {
  const max = Number(env.CHAT_RATE_LIMIT_MAX ?? 5);
  const windowSeconds = Number(env.CHAT_RATE_LIMIT_WINDOW_SECONDS ?? 60);
  const hasRedis = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasRedis || !Number.isFinite(max) || !Number.isFinite(windowSeconds)) {
    return null;
  }

  return new CustomRateLimiter({ env }, max, windowSeconds);
}
