'use client';

export type ChatMessageContentProps = {
  text: string;
  className?: string;
};

export function ChatMessageContent({
  className,
  text,
}: ChatMessageContentProps) {
  return <div className={`break-words ${className || ''}`}>{text}</div>;
}
