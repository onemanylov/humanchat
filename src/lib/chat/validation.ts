// Comprehensive link detection - catches all domains and protocols
export const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/i;

// Robust wallet address detection - comprehensive patterns
export const walletAddressRegex = new RegExp([
  // Ethereum addresses (0x + 40 hex chars, case insensitive, with word boundaries)
  '\\b0x[a-fA-F0-9]{40}\\b',
  
  // Bitcoin legacy addresses (1 or 3 + base58, 25-34 chars)
  '\\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\\b',
  
  // Bitcoin Bech32 addresses (bc1 + lowercase alphanumeric)
  '\\bbc1[a-z0-9]{39,59}\\b',
  
  // Solana addresses (base58, 32-44 chars, no 0OIl)
  '\\b[1-9A-HJ-NP-Za-km-z]{32,44}\\b',
  
  // Generic long alphanumeric strings that look like addresses (34-68 chars)
  '\\b[a-zA-Z0-9]{34,68}\\b',
  
  // Ethereum-like patterns with any case mixing
  '\\b0[xX][a-fA-F0-9]{40,}\\b',
  
  // Address-like patterns with context words
  '(?:address|wallet|send\\s+to)\\s*[:\\-]?\\s*[a-zA-Z0-9]{25,}',
  
  // Long hex strings (potential private keys or addresses)
  '\\b[a-fA-F0-9]{32,128}\\b',
  
  // Base58-like strings of medium length
  '\\b[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25,50}\\b'
].join('|'), 'gi');

export function containsProhibitedLink(text: string): boolean {
  return linkRegex.test(text);
}

export function containsProhibitedContent(text: string): boolean {
  return containsProhibitedLink(text) || containsWalletAddress(text);
}

export function containsWalletAddress(text: string): boolean {
  // Remove common words that might false positive
  const cleanText = text.replace(/\b(password|token|session|cookie|hash|code|key)\b/gi, '');
  
  // Check against wallet patterns
  if (walletAddressRegex.test(cleanText)) {
    // Additional validation for Ethereum addresses
    const ethMatches = cleanText.match(/\b0x[a-fA-F0-9]{40,}\b/gi);
    if (ethMatches) {
      // Ensure it's exactly 42 characters (0x + 40 hex)
      for (const match of ethMatches) {
        if (match.length >= 42 && /^0x[a-fA-F0-9]+$/i.test(match)) {
          return true;
        }
      }
    }
    
    // Check for other wallet patterns
    const otherMatches = cleanText.match(/\b[a-zA-Z0-9]{32,68}\b/g);
    if (otherMatches) {
      for (const match of otherMatches) {
        // Skip common false positives
        if (!/^(undefined|function|console|window|document|null|true|false)$/i.test(match)) {
          // If it's a long alphanumeric string, likely an address
          if (match.length >= 34) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}
