import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 生产构建时忽略 TypeScript 错误（仅 scripts 目录有错误）
    ignoreBuildErrors: true,
  },
  eslint: {
    // 生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
