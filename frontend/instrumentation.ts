export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await import('./sentry.server.config');
    } catch (error) {
      console.error('Failed to load Sentry server config:', error);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    try {
      await import('./sentry.edge.config');
    } catch (error) {
      console.error('Failed to load Sentry edge config:', error);
    }
  }
}

// Note: onRequestError is only available in Next.js 15+
// For Next.js 14, error handling is done through the error boundaries
// export const onRequestError = async (err: Error, request: any, context: any) => {
//   await import('@sentry/nextjs').then((Sentry) => {
//     Sentry.captureException(err, {
//       contexts: {
//         request: {
//           url: request.url,
//           method: request.method,
//         },
//       },
//     });
//   });
// };
