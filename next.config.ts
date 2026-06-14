import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: other lockfiles higher up
  // (e.g. C:\Users\aabad\package-lock.json) would otherwise be inferred.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
