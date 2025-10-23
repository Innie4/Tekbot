/**
 * TekAssist AI Bot Frontend Config
 * This config is for the chat widget and integrations only.
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Skip ESLint during production builds to avoid plugin resolution issues
    ignoreDuringBuilds: true,
  },
  // No website-specific config. Only for bot widget/integrations.
};

module.exports = nextConfig;
