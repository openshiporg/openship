import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['graphql'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Workaround since we diverged from Keystone reltionship and document views
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.S3_ENDPOINT ? process.env.S3_ENDPOINT.replace(/^https?:\/\//, '').replace(/:\d+$/, '') : '/',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;