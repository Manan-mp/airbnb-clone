import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 writes AGENTS.md/CLAUDE.md into the app dir; the repo-level CLAUDE.md is the source of truth.
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.up.railway.app" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
};

export default nextConfig;
