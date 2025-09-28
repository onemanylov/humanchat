'use client';

import { cn } from '~/lib/utils';

type MeshAvatarProps = {
  seed: string;
  className?: string;
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

const stringToColor = (str: string, hueOffset: number = 0): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = (Math.abs(hash) % 360) + hueOffset;
  const s = 70 + (Math.abs(hash) % 30);
  const l = 50 + (Math.abs(hash) % 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

function MeshAvatar({
  seed,
  className,
  size = 36,
  offsetX = -0.5,
  offsetY = -0.5,
}: MeshAvatarProps) {
  const colors = [
    stringToColor(seed, 0),
    stringToColor(seed, 60),
    stringToColor(seed, 120),
  ];

  const cx = 50 + offsetX * 50;
  const cy = 50 + offsetY * 50;

  const gradient = `radial-gradient(circle at ${cx}% ${cy}%, ${colors[0]} 0%, ${colors[1]} 60%, ${colors[2]} 100%)`;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        className,
      )}
      style={{ width: size, height: size, backgroundImage: gradient }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default MeshAvatar;
