// Shared link validation used by client and server to stay in sync
export const linkRegex =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|app|gg|xyz|ai|co|dev|fm|tv)\b)/i;

// Wallet address patterns (ETH, BTC legacy, Bech32)
export const walletAddressRegex =
  /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/;

export function containsProhibitedLink(text: string): boolean {
  return linkRegex.test(text);
}

export function containsProhibitedContent(text: string): boolean {
  return linkRegex.test(text) || walletAddressRegex.test(text);
}
