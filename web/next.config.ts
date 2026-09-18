import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["genlayer-js", "@genlayer/transaction-kit", "@genlayer/transaction-kit-react"],
};

export default nextConfig;
