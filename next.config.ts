import './src/env';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  experimental: {
    swcPlugins: [
      ['@lingui/swc-plugin', {}] as unknown as [
        string,
        Record<string, unknown>,
      ],
    ],
    reactCompiler: true,
    // Turbopack currently doesn't support typedRoutes
    // typedRoutes: true,
  },
};

export default nextConfig;
