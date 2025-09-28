export function resolvePartyHost(): string {
  if (typeof window !== 'undefined') {
    const host = (window as WindowWithPartyHost).__PARTYKIT_HOST__;
    if (host) return host;
  }

  const envHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  if (envHost && envHost.trim().length > 0) {
    return envHost.trim();
  }

  return 'localhost:1999';
}

type WindowWithPartyHost = Window & {
  __PARTYKIT_HOST__?: string;
};
