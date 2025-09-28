'use client';

export type ChatMessageContentProps = {
  text: string;
  isPending?: boolean;
  className?: string;
};

export function ChatMessageContent({ 
  text, 
  isPending = false, 
  className 
}: ChatMessageContentProps) {
  return (
    <div className={`break-words ${className || ''}`}>
      {text}
      {isPending && (
        <span className="ml-1 opacity-50" title="Sending...">
          ⋯
        </span>
      )}
    </div>
  );
}