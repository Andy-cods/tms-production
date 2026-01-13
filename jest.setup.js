// Jest setup file for Next.js 15 + TypeScript testing environment
import '@testing-library/jest-dom'

// Global test timeout
jest.setTimeout(10000)

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    asPath: '/',
    pathname: '/',
    query: {},
    route: '/',
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
  notFound: jest.fn(),
  permanentRedirect: jest.fn(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>
  },
}))

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data })),
    redirect: jest.fn((url) => ({ redirect: () => url })),
    rewrite: jest.fn(),
    next: jest.fn(),
  },
  headers: jest.fn(() => new Headers()),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
  })),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NODE_ENV = 'test'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    request: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    attachment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    escalation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock uploadthing
jest.mock('@/lib/uploadthing', () => ({
  uploadFiles: jest.fn(),
  generateComponents: jest.fn(),
}))

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(),
  addBreadcrumb: jest.fn(),
  setContext: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setLevel: jest.fn(),
}))

// Mock date-fns (allow real implementation for utils tests)
jest.mock('date-fns', () => {
  const actualDateFns = jest.requireActual('date-fns')
  return {
    ...actualDateFns,
    formatDistanceToNow: jest.fn(() => '2 hours ago'),
    isValid: jest.fn(() => true),
    addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
    subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  }
})

// Mock lucide-react
jest.mock('lucide-react', () => ({
  User: jest.fn(() => <div data-testid="user-icon" />),
  Settings: jest.fn(() => <div data-testid="settings-icon" />),
  Plus: jest.fn(() => <div data-testid="plus-icon" />),
  Search: jest.fn(() => <div data-testid="search-icon" />),
  Filter: jest.fn(() => <div data-testid="filter-icon" />),
  Calendar: jest.fn(() => <div data-testid="calendar-icon" />),
  Clock: jest.fn(() => <div data-testid="clock-icon" />),
  CheckCircle: jest.fn(() => <div data-testid="check-circle-icon" />),
  AlertCircle: jest.fn(() => <div data-testid="alert-circle-icon" />),
  X: jest.fn(() => <div data-testid="x-icon" />),
  ChevronDown: jest.fn(() => <div data-testid="chevron-down-icon" />),
  ChevronUp: jest.fn(() => <div data-testid="chevron-up-icon" />),
  Loader2: jest.fn(() => <div data-testid="loader-icon" />),
  Send: jest.fn(() => <div data-testid="send-icon" />),
  Eye: jest.fn(() => <div data-testid="eye-icon" />),
  Edit: jest.fn(() => <div data-testid="edit-icon" />),
  Trash2: jest.fn(() => <div data-testid="trash-icon" />),
  Download: jest.fn(() => <div data-testid="download-icon" />),
  Upload: jest.fn(() => <div data-testid="upload-icon" />),
  FileText: jest.fn(() => <div data-testid="file-text-icon" />),
  Users: jest.fn(() => <div data-testid="users-icon" />),
  TrendingUp: jest.fn(() => <div data-testid="trending-up-icon" />),
  RefreshCw: jest.fn(() => <div data-testid="refresh-icon" />),
  AlertTriangle: jest.fn(() => <div data-testid="alert-triangle-icon" />),
  Star: jest.fn(() => <div data-testid="star-icon" />),
  Tag: jest.fn(() => <div data-testid="tag-icon" />),
  UserPlus: jest.fn(() => <div data-testid="user-plus-icon" />),
  Zap: jest.fn(() => <div data-testid="zap-icon" />),
}))

// Global test utilities
global.mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  task: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  request: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  team: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn(),
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock fetch
global.fetch = jest.fn()

// Mock window.location (simplified)
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = jest.fn()

// Mock crypto.randomUUID
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9012'),
}

// Mock performance.now
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock scrollTo
global.scrollTo = jest.fn()

// Mock getComputedStyle
global.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
}))

// Mock HTMLElement methods
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  })),
})

// Mock addEventListener and removeEventListener
Object.defineProperty(HTMLElement.prototype, 'addEventListener', {
  value: jest.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'removeEventListener', {
  value: jest.fn(),
})

// Mock FormData
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
}))

// Mock File
global.File = jest.fn(() => ({
  name: 'test-file.txt',
  size: 1024,
  type: 'text/plain',
  lastModified: Date.now(),
}))

// Mock Blob
global.Blob = jest.fn(() => ({
  size: 1024,
  type: 'text/plain',
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(),
  arrayBuffer: jest.fn(),
}))

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: {
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
}))

// Mock TextEncoder and TextDecoder
global.TextEncoder = jest.fn(() => ({
  encode: jest.fn((text) => new Uint8Array(Buffer.from(text))),
}))

global.TextDecoder = jest.fn(() => ({
  decode: jest.fn((bytes) => Buffer.from(bytes).toString()),
}))

// Mock structuredClone
global.structuredClone = jest.fn((obj) => JSON.parse(JSON.stringify(obj)))

// Mock queueMicrotask
global.queueMicrotask = jest.fn((callback) => Promise.resolve().then(callback))

// Mock setTimeout and clearTimeout with proper typing
global.setTimeout = jest.fn((callback, delay) => {
  return setTimeout(callback, delay)
})

global.clearTimeout = jest.fn((id) => {
  clearTimeout(id)
})

global.setInterval = jest.fn((callback, delay) => {
  return setInterval(callback, delay)
})

global.clearInterval = jest.fn((id) => {
  clearInterval(id)
})
