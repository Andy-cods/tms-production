# ⚡ Performance Optimization Guide - TMS 2025

## 📊 Current Analysis

### Bundle Size Issues
Based on package.json analysis:
- **Heavy dependencies**: `@react-pdf/renderer`, `frappe-gantt`, `exceljs`
- **Duplicate date libraries**: `date-fns` (production), `react-day-picker` (includes date-fns)
- **Testing libraries in dependencies**: Some testing libs should be devDependencies

### Build Configuration
- ✅ Turbopack enabled for dev (`--turbopack`)
- ✅ Webpack fallback available (`--no-turbo`)
- ⚠️ No bundle analyzer configured
- ⚠️ No compression config in next.config

## 🎯 Optimization Actions

### 1. Next.js Configuration Improvements

**Add to `next.config.ts`:**

```typescript
const nextConfig: NextConfig = {
  // Enable production optimizations
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Compress responses
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
    ],
  },
  
  // Production source maps (smaller)
  productionBrowserSourceMaps: false,
  
  // ... rest of config
};
```

### 2. Dependencies Optimization

#### Remove Unused Dependencies (Check First!)
```bash
# Check if these are actually used:
pnpm remove canvas-confetti  # If not used
pnpm remove papaparse        # If CSV import is not active
```

#### Move Dev Dependencies
```bash
# These should be in devDependencies:
# - exceljs (if only used in dev/testing)
# - frappe-gantt (if only used in specific admin pages)
```

### 3. Code Splitting Improvements

**Lazy load heavy components:**

```typescript
// In pages that use PDF renderer
const PDFRenderer = dynamic(
  () => import('@/components/PDFRenderer'),
  { ssr: false, loading: () => <p>Loading PDF...</p> }
);

// In pages that use Gantt chart
const GanttChart = dynamic(
  () => import('@/components/GanttChart'),
  { ssr: false }
);

// In pages that use Excel export
const ExcelExport = dynamic(
  () => import('@/lib/excel-export'),
  { ssr: false }
);
```

### 4. Database Query Optimization

**Add to Prisma queries:**

```typescript
// Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Don't select password, large fields
  }
});

// Use pagination
const tasks = await prisma.task.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
});

// Use indexes (check schema.prisma)
```

### 5. Image Optimization

**Use Next.js Image component:**

```typescript
import Image from 'next/image';

// Instead of <img>
<Image
  src={avatarUrl}
  alt="Avatar"
  width={40}
  height={40}
  quality={75}
  loading="lazy"
/>
```

### 6. Caching Strategy

**Add headers for static assets:**

```typescript
// In next.config.ts
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### 7. Monitoring Setup

**Add bundle analyzer:**

```bash
pnpm add -D @next/bundle-analyzer
```

```typescript
// In next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**Run analysis:**
```bash
ANALYZE=true pnpm build
```

## 📈 Performance Targets

### Lighthouse Scores (Production)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 90

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Bundle Size Targets
- **First Load JS**: < 200 KB
- **Total Page Size**: < 1 MB
- **Time to Interactive**: < 3s

## 🔍 Monitoring Commands

```bash
# Analyze bundle size
pnpm build && pnpm analyze

# Check bundle composition
pnpm add -D source-map-explorer
pnpm build && source-map-explorer '.next/static/**/*.js'

# Lighthouse audit
pnpm build && pnpm start
# Then run Lighthouse in Chrome DevTools

# Check dependencies size
npx depcheck
pnpm list --depth=0
```

## 🚀 Quick Wins (Do Now)

1. ✅ **Enable compression in next.config** - Save ~70% on text assets
2. ✅ **Lazy load PDF/Excel/Gantt** - Reduce initial bundle by ~1MB
3. ✅ **Add bundle analyzer** - Identify biggest chunks
4. ✅ **Optimize images** - Use Next.js Image component
5. ✅ **Database query pagination** - Faster page loads
6. ✅ **Remove unused dependencies** - Smaller node_modules

## 📝 Long-term Improvements

1. **CDN Setup**: Serve static assets from CDN (Cloudflare, AWS CloudFront)
2. **Database Indexes**: Add indexes for frequent queries
3. **Redis Caching**: Cache expensive queries
4. **Background Jobs**: Move heavy processing to background (Bull/BullMQ)
5. **API Response Caching**: Cache GET requests with stale-while-revalidate
6. **Service Worker**: Offline support and asset caching

## 🔧 Performance Testing Tools

- **Lighthouse**: Built into Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org/
- **GTmetrix**: https://gtmetrix.com/
- **Next.js Analytics**: https://nextjs.org/analytics

---

**Last Updated**: 2026-01-13
**Priority**: High - Implement Quick Wins before production deploy

