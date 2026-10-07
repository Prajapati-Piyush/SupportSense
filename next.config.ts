import path from "node:path";
import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives inside a larger repo that has its own lockfiles; pin the
  // tracing root so the build doesn't walk up and pick the wrong one.
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
      {
        source: "/api/protected/:path*",
        destination: `${BACKEND_URL}/api/protected/:path*`,
      },
      {
        source: "/api/tickets",
        destination: `${BACKEND_URL}/api/tickets`,
      },
      {
        source: "/api/tickets/:path*",
        destination: `${BACKEND_URL}/api/tickets/:path*`,
      },
      {
        source: "/api/desk/:path*",
        destination: `${BACKEND_URL}/api/desk/:path*`,
      },
      {
        source: "/api/documents",
        destination: `${BACKEND_URL}/api/documents`,
      },
      {
        source: "/api/documents/:path*",
        destination: `${BACKEND_URL}/api/documents/:path*`,
      },
      {
        source: "/api/admin/documents",
        destination: `${BACKEND_URL}/api/admin/documents`,
      },
      {
        source: "/api/admin/documents/:path*",
        destination: `${BACKEND_URL}/api/admin/documents/:path*`,
      },
      {
        source: "/api/teams",
        destination: `${BACKEND_URL}/api/teams`,
      },
      {
        source: "/api/teams/:path*",
        destination: `${BACKEND_URL}/api/teams/:path*`,
      },
    ];
  },
};

export default nextConfig;
