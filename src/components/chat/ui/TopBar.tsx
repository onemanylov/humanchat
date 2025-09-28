'use client';

import { cn } from '~/lib/utils';
import { motion } from 'motion/react';
import { useState, useCallback } from 'react';
import OnlineUsers from './OnlineUsers';
import { TextLoop } from '~/components/core/text-loop';
import { ProgressiveBlur } from '~/components/ui/progressive-blur';
import type { OnlineUser } from '~/lib/chat/types';

interface TopBarProps {
  onlineUsers?: OnlineUser[];
  className?: string;
}

function formatDisplayName(user: OnlineUser): string {
  if (user.username) {
    return user.username;
  }
  // Fallback to shortened wallet address
  return `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`;
}

const mockUsers = [
  {
    wallet: '0x1234567890123456789012345678901234567890',
    username: 'jenny30',
  },
  {
    wallet: '0x2345678901234567890123456789012345678901',
    username: 'atom',
  },
  {
    wallet: '0x3456789012345678901234567890123456789012',
    username: 'natab.3203',
  },
];

export default function TopBar({
  onlineUsers: users = [],
  className,
}: TopBarProps) {
  const onlineUsers = [...users, ...mockUsers];
  const displayUsers = onlineUsers.slice(0, 3); // Show avatars for first 3 users
  const additionalCount = Math.max(0, onlineUsers.length - 3);
  const hasMultipleUsers = onlineUsers.length > 1;
  const [textContainerWidth, setTextContainerWidth] = useState<number | 'auto'>(
    'auto',
  );

  const textContainerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedWidth = entries?.[0]?.contentRect?.width;
        if (observedWidth) {
          setTextContainerWidth(observedWidth);
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div
      className={cn(
        'relative flex h-fit w-full items-center justify-center bg-white px-4 pt-2 pb-1',
        className,
      )}
    >
      {onlineUsers.length > 0 && (
        <div className="flex items-center gap-3">
          <OnlineUsers users={displayUsers} />
          <motion.div
            className="overflow-hidden text-sm text-black/80"
            style={{ width: textContainerWidth }}
            animate={{ width: textContainerWidth }}
            transition={{
              width: {
                type: 'spring',
                stiffness: 60,
                damping: 9,
                mass: 0.1,
              },
            }}
          >
            {hasMultipleUsers ? (
              <div
                ref={textContainerRef}
                className="inline-flex items-center gap-1 whitespace-nowrap"
              >
                <TextLoop
                  interval={10}
                  transition={{
                    type: 'spring',
                    stiffness: 60,
                    damping: 9,
                    mass: 0.1,
                  }}
                  className="overflow-y-clip"
                >
                  {onlineUsers.map((user) => (
                    <span key={user.wallet}>{formatDisplayName(user)}</span>
                  ))}
                </TextLoop>
                {onlineUsers.length > 1 && (
                  <span> and {onlineUsers.length - 1} more online</span>
                )}
              </div>
            ) : (
              <span ref={textContainerRef} className="whitespace-nowrap">
                {formatDisplayName(onlineUsers[0])} is here
              </span>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
