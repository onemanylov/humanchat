'use client';

import Image from 'next/image';
import { trpc } from '~/trpc/react';

function shorten(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UserProfile({ wallet }: { wallet?: string }) {
  const { data, isLoading } = trpc.user.get.useQuery(
    { wallet },
    { retry: false }
  );
  const user = data?.user;
  if (isLoading) return null;
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      {user.profilePictureUrl ? (
        <Image
          src={user.profilePictureUrl}
          alt={user.username ?? 'Profile'}
          width={40}
          height={40}
          className="rounded-full"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-5 h-5 text-gray-400 opacity-60"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-medium">{user.username ?? 'Anonymous'}</span>
        <code className="text-xs text-gray-500">{shorten(user.wallet)}</code>
      </div>
    </div>
  );
}
