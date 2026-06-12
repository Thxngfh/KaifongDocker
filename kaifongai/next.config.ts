import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   allowedDevOrigins:['172.20.10.13'],
  transpilePackages: ["emoji-picker-react"],
};

export default nextConfig;
