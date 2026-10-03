import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The documented local URL is 127.0.0.1. Next only allows localhost unless listed.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
