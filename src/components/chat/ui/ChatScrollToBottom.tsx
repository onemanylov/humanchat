'use client';

import { ChevronDown } from 'lucide-react';

export type ChatScrollToBottomProps = {
  onScrollToBottom: () => void;
  unreadCount: number;
  isVisible: boolean;
  className?: string;
};

export function ChatScrollToBottom({ 
  onScrollToBottom, 
  unreadCount, 
  isVisible, 
  className 
}: ChatScrollToBottomProps) {
  if (!isVisible || unreadCount === 0) {
    return null;
  }

  return (
    <button
      onClick={onScrollToBottom}
      className={`pointer-events-auto fixed right-4 bottom-24 z-10 flex items-center justify-center rounded-full border border-white/10 bg-black/70 shadow-lg backdrop-blur ${className || ''}`}
      style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
      aria-label="Scroll to bottom"
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80">
          <ChevronDown strokeWidth={2} className="h-5 w-5 text-white" />
        </div>
        <span
          className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-rose-500 px-1 text-[10px] font-medium text-white shadow"
          style={{ lineHeight: '18px' }}
        >
          {unreadCount}
        </span>
      </div>
    </button>
  );
}