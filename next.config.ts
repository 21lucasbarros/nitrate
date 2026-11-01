import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'media.themoviedb.org',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'image.tmdb.org',
          pathname: '/t/p/**',
        },
      ],
    },
};

export default nextConfig;
