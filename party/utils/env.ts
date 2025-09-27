export type EnvLike = {
  env: Record<string, string | undefined>;
};

export function resolveEnv(source: EnvLike): Record<string, string | undefined> {
  return source.env;
}

export function getEnv(source: EnvLike, key: string): string | undefined {
  return resolveEnv(source)[key];
}

export function getNetwork(source: EnvLike): string {
  return getEnv(source, 'VITE_NETWORK') ?? 'default';
}
