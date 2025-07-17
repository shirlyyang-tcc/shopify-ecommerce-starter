import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  skipTrailingSlashRedirect:true,
  // exclude: ['functions', 'edge-functions', 'cloud-functions']
};

export default nextConfig;
