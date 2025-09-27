export interface MockUser {
  username: string;
  wallet: string;
  profilePictureUrl?: string | null;
}

export interface MockWalletAuthPayload {
  status: 'success';
  message: string;
  signature: string;
  address: string;
  version: number;
}

// Predefined mock users for development
const MOCK_USERS: MockUser[] = [
  {
    username: 'alice_dev',
    wallet: '0x1234567890123456789012345678901234567890',
    profilePictureUrl: null,
  },
  {
    username: 'bob_dev',
    wallet: '0x2345678901234567890123456789012345678901',
    profilePictureUrl: null,
  },
  {
    username: 'charlie_dev',
    wallet: '0x3456789012345678901234567890123456789012',
    profilePictureUrl: null,
  },
];

export function isMockAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' ||
      (typeof window !== 'undefined' && !('WorldApp' in window)))
  );
}

export function generateMockWalletAuth(nonce: string): {
  finalPayload: MockWalletAuthPayload;
  user: MockUser;
} {
  // Use a random mock user for variety in development
  const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]!;

  // Create a mock SIWE message
  const domain =
    typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const uri =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const message = `${domain} wants you to sign in with your Ethereum account:
${user.wallet}

This is my statement and here is a link https://worldcoin.com/apps

URI: ${uri}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}
Not Before: ${notBefore}`;

  const finalPayload: MockWalletAuthPayload = {
    status: 'success',
    message,
    signature: `0x${'a'.repeat(130)}`, // Mock signature
    address: user.wallet,
    version: 1,
  };

  return { finalPayload, user };
}

export function createMockAuthFlow() {
  return {
    isInstalled: () => true,
    commandsAsync: {
      walletAuth: async (params: {
        nonce: string;
        requestId: string;
        expirationTime: Date;
        notBefore: Date;
        statement: string;
      }) => {
        // Simulate async auth delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return generateMockWalletAuth(params.nonce);
      },
    },
    user: null, // Will be set after auth
  };
}
