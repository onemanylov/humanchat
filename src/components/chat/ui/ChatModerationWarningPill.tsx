'use client';

import React from 'react';

export type ChatModerationWarningPillProps = {
  reason: string;
  className?: string;
};

export function ChatModerationWarningPill({
  reason,
  className = '',
}: ChatModerationWarningPillProps) {
  return (
    <div
      className={`rounded-full border border-amber-200 bg-amber-100 px-4 py-1 text-xs font-medium whitespace-nowrap text-amber-800 shadow-sm ${className}`}
    >
      ⚠️ Your last message was flagged for {reason}.
    </div>
  );
}
