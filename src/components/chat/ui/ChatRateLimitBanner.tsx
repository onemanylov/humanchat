'use client';

import type { RateLimitEvent } from '~/providers/ChatProvider';

export type ChatRateLimitBannerProps = {
  rateLimit: RateLimitEvent | null;
  remainingSeconds: number;
  className?: string;
};

export function ChatRateLimitBanner({ 
  rateLimit, 
  remainingSeconds, 
  className 
}: ChatRateLimitBannerProps) {
  if (!rateLimit) {
    return null;
  }

  return (
    <div className={`rounded-full border border-amber-500/30 bg-amber-50 px-4 py-1 text-xs whitespace-nowrap text-amber-700 shadow-sm ${className || ''}`}>
      {rateLimit.message} Try again in {remainingSeconds}s.
    </div>
  );
}