import { cn } from '~/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className }: LogoProps) {
  return (
    <div 
      className={cn(
        'rounded bg-gray-400 shrink-0',
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Application logo"
    />
  );
}