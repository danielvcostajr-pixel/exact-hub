/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Force new build hash on every deploy to bust browser cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
};

export default nextConfig;
