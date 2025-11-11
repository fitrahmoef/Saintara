/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co'],
  },
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
    if (isServer) {
      // Only mark as external for Node.js runtime, not edge runtime
      if (nextRuntime === 'nodejs') {
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
            const request = context.request;
            if (externals.some(ext => request.startsWith(ext))) {
              return callback(null, `commonjs ${request}`);
            }
            return originalExternals(context, callback);
          };
        } else {
          config.externals = config.externals || [];
          config.externals.push(...externals);
        }
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
