'use client';

import Image from 'next/image';
import { cn } from '~/lib/utils';
import MeshAvatar from '../MeshAvatar';
import type { OnlineUser } from '~/lib/chat/types';

interface OnlineUsersProps {
  users: OnlineUser[];
  className?: string;
}

function UserAvatar({
  user,
  size = 32,
  className,
}: {
  user: OnlineUser;
  size?: number;
  className?: string;
}) {
  const seed = user.wallet || 'anonymous';

  if (user.profilePictureUrl) {
    return (
      <Image
        src={user.profilePictureUrl}
        alt={user.username || user.wallet}
        width={size}
        height={size}
        className={cn(
          'shrink-0 rounded-full border-2 border-white object-cover',
          className,
        )}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <MeshAvatar
      seed={seed}
      size={size}
      className={cn('border-2 border-white', className)}
      style={{ width: size, height: size }}
    />
  );
}

export default function OnlineUsers({ users, className }: OnlineUsersProps) {
  const displayUsers = users.slice(0, 3);
  const additionalCount = Math.max(0, users.length - 3);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center', className)}>
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <div
            key={user.wallet}
            className="relative"
            style={{ zIndex: displayUsers.length - index }}
          >
            <UserAvatar
              user={user}
              size={28}
              className="transition-transform hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Additional count */}
      {additionalCount > 0 && (
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          +{additionalCount}
        </div>
      )}
    </div>
  );
}
