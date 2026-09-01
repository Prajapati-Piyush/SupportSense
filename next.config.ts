import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives inside a larger repo that has its own lockfiles; pin the
  // tracing root so the build doesn't walk up and pick the wrong one.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
