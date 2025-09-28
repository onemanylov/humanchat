'use client';

import React from 'react';

export type ChatValidationPillProps = {
  message: string;
  className?: string;
};

export function ChatValidationPill({ message, className = '' }: ChatValidationPillProps) {
  return (
    <div className={`bg-red-100 text-red-800 text-xs font-medium px-4 py-1 rounded-full border border-red-200 shadow-sm whitespace-nowrap ${className}`}>
      {message}
    </div>
  );
}