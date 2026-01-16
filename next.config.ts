import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable React strict mode for better error detection
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Production source maps (disabled for smaller bundles)
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  
  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = [
      "'self'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "'unsafe-inline'",
    ].join(" ");
    const styleSrc = ["'self'", "'unsafe-inline'"].join(" ");
    const csp = [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
  
  // Suppress external package warnings for OpenTelemetry dependencies
  // These packages are part of Sentry's instrumentation but cause warnings in Next.js 15
  serverExternalPackages: [
    '@sentry/nextjs',
    '@sentry/node',
    '@opentelemetry/instrumentation',
  ],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize problematic packages to prevent bundling issues
      config.externals = [...(config.externals || [])];
    }
    return config;
  },

  // Turbopack configuration (Next.js 16 default bundler)
  // Empty config acknowledges Turbopack usage and silences webpack config warning
  turbopack: {},
};

// Conditionally apply Sentry only in production or if explicitly enabled
// This prevents development build issues with OpenTelemetry dependencies
const useSentry = process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true';

if (useSentry) {
  try {
    // Import Sentry config only when needed
    const { withSentryConfig } = require("@sentry/nextjs");
    
    const sentryWebpackPluginOptions = {
      silent: true, // Suppresses source map uploading logs during build
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Disable during development to avoid dependency issues
      dryRun: process.env.NODE_ENV !== 'production',
    };

    module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
    console.info('✓ Sentry configuration applied');
  } catch (error) {
    console.warn('⚠️ Sentry configuration skipped:', error instanceof Error ? error.message : 'Unknown error');
    module.exports = nextConfig;
  }
} else {
  // Development mode: Skip Sentry entirely to avoid OpenTelemetry dependency warnings
  console.info('ℹ️ Sentry disabled in development mode (set ENABLE_SENTRY=true to enable)');
  module.exports = nextConfig;
}

// Default export for TypeScript compatibility
export default nextConfig;
