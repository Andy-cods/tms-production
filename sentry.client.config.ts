// Sentry Client Configuration
// Note: Wrapped in try-catch to prevent build failures from missing dependencies

try {
  const Sentry = require("@sentry/nextjs");

  // Only initialize if DSN is provided
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      
      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: process.env.NODE_ENV === "development",
      
      replaysOnErrorSampleRate: 1.0,
      
      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,
      
      // You can remove this option if you're not planning to use the Sentry Session Replay feature:
      integrations: [
        Sentry.replayIntegration({
          // Additional Replay configuration goes in here, for example:
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  } else {
    console.info('ℹ️ Sentry client disabled (no DSN configured)');
  }
} catch (error) {
  // Silently fail if Sentry is not available
  console.warn('⚠️ Sentry client initialization failed:', error instanceof Error ? error.message : 'Unknown error');
}
