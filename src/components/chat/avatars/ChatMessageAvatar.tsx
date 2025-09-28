'use client';

import Image from 'next/image';
import type { ChatMessage } from '~/lib/chat/types';
import { cn } from '~/lib/utils';
import MeshAvatar from '../MeshAvatar';
import { formatDisplayName } from '../messages/ChatMessageAuthor';

export type ChatMessageAvatarProps = {
  message: ChatMessage;
  isOwn: boolean;
  size?: number;
  className?: string;
};

export function ChatMessageAvatar({ 
  message, 
  isOwn, 
  size = 36, 
  className 
}: ChatMessageAvatarProps) {
  const seed = message.wallet || 'anonymous';
  const displayName = formatDisplayName(message);

  if (message.profilePictureUrl) {
    return (
      <Image
        src={message.profilePictureUrl}
        alt={displayName}
        width={size}
        height={size}
        className={cn(
          'shrink-0 rounded-full object-cover',
          `h-${Math.floor(size/4)} w-${Math.floor(size/4)}`, // Tailwind sizing
          isOwn && 'order-2',
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
      className={cn(
        `h-${Math.floor(size/4)} w-${Math.floor(size/4)}`,
        isOwn && 'order-2',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}