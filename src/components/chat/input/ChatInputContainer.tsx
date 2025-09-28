'use client';

import React from 'react';

export type ChatInputContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ChatInputContainer({ children, className }: ChatInputContainerProps) {
  return (
    <div
      className={`bg-transparent px-2 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] ${className || ''}`}
    >
      {children}
    </div>
  );
}
