'use client';

import React from 'react';
import { motion } from 'motion/react';

export type ChatSendButtonProps = {
  onClick: (event: React.MouseEvent) => void;
  onPointerDown: (event: React.PointerEvent) => void;
  isDisabled?: boolean;
  className?: string;
  hasContent?: boolean;
};

export function ChatSendButton({
  onClick,
  onPointerDown,
  isDisabled = false,
  className = '',
  hasContent = false,
}: ChatSendButtonProps) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-disabled={isDisabled}
      tabIndex={0}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
        isDisabled
          ? 'cursor-not-allowed bg-neutral-200 text-neutral-400'
          : 'bg-gradient-to-b from-[#239cf9] to-[#1c93f5] text-white'
      } ${className} `}
      type="button"
      aria-label="Send message"
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{
          rotate: hasContent ? 0 : 45,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          mass: 0.5,
        }}
      >
        <path d="m5 12 7-7 7 7" />
        <path d="M12 19V5" />
      </motion.svg>
    </button>
  );
}
