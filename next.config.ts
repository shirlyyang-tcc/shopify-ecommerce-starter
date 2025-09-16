import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect:true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com'
      }
    ]
  }
};

export default nextConfig;
