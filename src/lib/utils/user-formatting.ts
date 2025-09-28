import type { ChatMessage } from '~/lib/chat/types';

/**
 * Formats a display name for a chat message author
 * @param message Chat message containing user information
 * @returns Formatted display name
 */
export function formatDisplayName(message: ChatMessage): string {
  if (message.username && message.username.trim().length > 0) {
    return message.username.trim();
  }
  if (message.wallet) {
    const wallet = message.wallet;
    return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  }
  return 'Anonymous';
}

/**
 * Formats a wallet address for display (shortened)
 * @param wallet Wallet address
 * @returns Shortened wallet address
 */
export function formatWalletAddress(wallet: string): string {
  if (!wallet || wallet.length < 10) {
    return wallet || 'Unknown';
  }
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

/**
 * Gets the display name for a user (username or shortened wallet)
 * @param user User object with wallet and optional username
 * @returns Display name
 */
export function getUserDisplayName(user: {
  wallet: string;
  username?: string | null;
}): string {
  if (user.username && user.username.trim().length > 0) {
    return user.username.trim();
  }
  return formatWalletAddress(user.wallet);
}