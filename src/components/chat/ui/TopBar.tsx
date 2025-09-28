'use client';

import { cn } from '~/lib/utils';
import Logo from '~/components/ui/Logo';
import OnlineUsers from './OnlineUsers';
import type { OnlineUser } from '~/lib/chat/types';

interface TopBarProps {
  onlineUsers?: OnlineUser[];
  className?: string;
}

export default function TopBar({ onlineUsers = [], className }: TopBarProps) {
  return (
    <div className={cn(
      'flex h-16 w-full items-center justify-between border-b border-border bg-background px-4',
      className
    )}>
      {/* Left side - Logo */}
      <div className="flex items-center">
        <Logo size={32} />
      </div>

      {/* Right side - Online users */}
      <div className="flex items-center">
        <OnlineUsers users={onlineUsers} />
        {onlineUsers.length > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {onlineUsers.length} online
          </span>
        )}
      </div>
    </div>
  );
}