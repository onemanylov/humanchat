import type { EnvLike } from './env';
import { getEnv, getNetwork } from './env';

const USER_AGENT = 'humanchat/partykit (chat)';

type RedisCommand = (string | number)[];

type PipelineEntry = {
  result?: unknown;
  error?: string;
};

function getRedisCredentials(source: EnvLike) {
  const url = getEnv(source, 'UPSTASH_REDIS_REST_URL');
  const token = getEnv(source, 'UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) {
    throw new Error('Missing Upstash Redis configuration');
  }
  return { url, token };
}

async function redisCommand<T = unknown>(
  source: EnvLike,
  command: RedisCommand,
): Promise<T> {
  const { url, token } = getRedisCredentials(source);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Redis command failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { result: T; error?: string };
  if (data.error) {
    throw new Error(data.error);
  }
  return data.result;
}

async function redisPipeline(
  source: EnvLike,
  commands: RedisCommand[],
): Promise<PipelineEntry[]> {
  const { url, token } = getRedisCredentials(source);
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Redis pipeline failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as PipelineEntry[];
  data.forEach((entry) => {
    if (entry && 'error' in entry && entry.error) {
      throw new Error(entry.error);
    }
  });
  return data;
}

export function getChatKeys(source: EnvLike): {
  CHAT_LIST_KEY: string;
  CHAT_LAST_KEY: string;
} {
  const network = getNetwork(source);
  return {
    CHAT_LIST_KEY: `${network}:chat:messages`,
    CHAT_LAST_KEY: `${network}:chat:last`,
  };
}

export async function redisRPUSH(
  source: EnvLike,
  key: string,
  value: string,
) {
  await redisCommand(source, ['RPUSH', key, value]);
}

export async function redisSET(
  source: EnvLike,
  key: string,
  value: string,
) {
  await redisCommand(source, ['SET', key, value]);
}

export async function redisLRANGE(
  source: EnvLike,
  key: string,
  start: number,
  stop: number,
): Promise<string[]> {
  return redisCommand(source, ['LRANGE', key, start, stop]);
}

export async function redisGET(
  source: EnvLike,
  key: string,
): Promise<string | null> {
  return redisCommand(source, ['GET', key]);
}

export async function redisDEL(source: EnvLike, key: string) {
  await redisCommand(source, ['DEL', key]);
}

export async function redisEXPIRE(
  source: EnvLike,
  key: string,
  seconds: number,
) {
  await redisCommand(source, ['EXPIRE', key, seconds]);
}

export async function redisINCR(source: EnvLike, key: string) {
  return redisCommand<number>(source, ['INCR', key]);
}

export async function redisPipelineCommands(
  source: EnvLike,
  commands: RedisCommand[],
): Promise<PipelineEntry[]> {
  return redisPipeline(source, commands);
}
