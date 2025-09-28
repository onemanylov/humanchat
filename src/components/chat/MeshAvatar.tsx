'use client';

import { StaticRadialGradient } from '@paper-design/shaders-react';
import { cn } from '~/lib/utils';

type MeshAvatarProps = {
  seed: string;
  className?: string;
  size?: number;
};

// Simple hash function to derive a color from a string seed (ENS or address)
const stringToColor = (str: string, hueOffset: number = 0): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360) + hueOffset;
  const s = 70 + Math.abs(hash % 30); // Saturation 70-100%
  const l = 50 + Math.abs(hash % 20); // Lightness 50-70%
  return `hsl(${h}, ${s}%, ${l}%)`;
};

function MeshAvatar({ seed, className, size = 36 }: MeshAvatarProps) {
  const colors = [
    stringToColor(seed, 0),
    stringToColor(seed, 60),
    stringToColor(seed, 120),
  ];

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <StaticRadialGradient
        colors={colors}
        colorBack="#00000000"
        scale={2}
        offsetX={0.1}
        offsetY={-0.2}
        radius={1}
        focalDistance={0.99}
        focalAngle={-90}
        falloff={0.24}
        mixing={100}
        distortion={0}
        distortionShift={0}
        distortionFreq={12}
        grainMixer={1}
        grainOverlay={0}
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute inset-0 z-50" />
    </div>
  );
}

export default MeshAvatar;
