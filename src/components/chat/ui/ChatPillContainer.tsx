'use client';

import React from 'react';

export type ChatPillContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ChatPillContainer({ children, className = '' }: ChatPillContainerProps) {
  return (
    <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}