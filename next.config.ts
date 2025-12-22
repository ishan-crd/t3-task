import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Turbopack treats this folder as the root when multiple lockfiles exist.
    root: __dirname,
  },
};

export default nextConfig;
