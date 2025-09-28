'use client';

import { cn } from '~/lib/utils';
import { formatMessageTime } from '~/lib/utils/date-formatting';

export type ChatMessageTimestampProps = {
  timestamp: number;
  isOwn: boolean;
  className?: string;
};

export function ChatMessageTimestamp({ 
  timestamp, 
  isOwn, 
  className 
}: ChatMessageTimestampProps) {
  const formattedTime = formatMessageTime(timestamp);
  
  if (!formattedTime) {
    return null;
  }

  return (
    <div
      className={cn(
        'mt-1 text-right text-[10px] uppercase',
        isOwn ? 'text-white/70' : 'text-black/50',
        className,
      )}
    >
      {formattedTime}
    </div>
  );
}