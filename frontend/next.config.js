/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co'],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Enable instrumentation for Sentry
  experimental: {
    instrumentationHook: true,
    // Exclude OpenTelemetry and Prisma instrumentation from webpack bundling
    // This prevents "Critical dependency" warnings for dynamic requires
    serverComponentsExternalPackages: [
      '@prisma/instrumentation',
      '@opentelemetry/instrumentation',
      '@opentelemetry/api',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/semantic-conventions',
      'require-in-the-middle',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress OpenTelemetry instrumentation warnings
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@opentelemetry\/instrumentation/,
        },
        {
          module: /@prisma\/instrumentation/,
        },
        {
          module: /require-in-the-middle/,
        },
      ];
    }
    return config;
  },
}

module.exports = nextConfig
