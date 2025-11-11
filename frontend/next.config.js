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
    serverComponentsExternalPackages: [
      '@prisma/instrumentation',
      '@opentelemetry/instrumentation',
      '@opentelemetry/api',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/semantic-conventions',
    ],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'nodejs') {
      // Mark packages as external to prevent bundling issues
      const externals = [
        '@prisma/instrumentation',
        '@opentelemetry/instrumentation',
        '@opentelemetry/api',
        'require-in-the-middle',
      ];

      // Handle externals properly for both function and array formats
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = async (context, callback) => {
          const request = context.request || context;

          // Only mark specific packages as external, not all imports
          if (typeof request === 'string' && externals.some(ext => request === ext || request.startsWith(`${ext}/`))) {
            return callback(null, `commonjs ${request}`);
          }

          // Let Next.js handle everything else
          if (originalExternals) {
            return originalExternals(context, callback);
          }
          return callback();
        };
      } else {
        // For array format, just append our externals
        if (!Array.isArray(config.externals)) {
          config.externals = [];
        }
        config.externals.push(...externals.map(ext => new RegExp(`^${ext}(/.*)?$`)));
      }

      // Ignore OpenTelemetry instrumentation warnings
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
