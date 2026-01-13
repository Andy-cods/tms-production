# Testing Guide

## Database Seeding

The application includes a comprehensive seed script that creates realistic test data:

### Seed Data Includes:
- **4 Teams**: IT, HR, Finance, Admin
- **5 Users**: Admin, Leader, 2 Assignees, 1 Requester
- **4 Categories**: Computer repair, Software installation, Leave requests, Bill payment
- **3 Requests**: Various statuses (OPEN, IN_PROGRESS, DONE)
- **5 Tasks**: Assigned to different team members
- **2 Comments**: On requests
- **2 Notifications**: Task assignments

### Running the Seed Script:
```bash
pnpm run db:seed
```

### Test Users:
- **Admin**: `admin@company.com` / `admin123`
- **Leader**: `leader.it@company.com` / `leader123`
- **Assignee 1**: `tech01@company.com` / `tech123`
- **Assignee 2**: `tech02@company.com` / `tech123`
- **Requester**: `requester@company.com` / `req123`

## E2E Testing with Playwright

### Test Scenarios:

1. **Leader Workflow**:
   - Login as leader
   - Navigate to inbox
   - View request details
   - Assign tasks to team members
   - Navigate to My Tasks

2. **Requester Workflow**:
   - Login as requester
   - Create new request
   - View request list
   - View request details

3. **Assignee Workflow**:
   - Login as assignee
   - View My Tasks
   - Update task status
   - Navigate to requests

### Running E2E Tests:

```bash
# Run all tests
pnpm run test:e2e

# Run tests with UI (interactive)
pnpm run test:e2e:ui

# Run tests in headed mode (see browser)
pnpm run test:e2e:headed

# Run specific test
pnpm exec playwright test e2e-sanity.spec.ts

# Run tests for specific browser
pnpm exec playwright test --project=chromium
```

### Test Configuration:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Auto-start**: Dev server starts automatically
- **Screenshots**: Captured on failure
- **Traces**: Available for debugging

### Test Data Requirements:

The E2E tests expect the seed data to be present. Make sure to run the seed script before running tests:

```bash
pnpm run db:seed
pnpm run test:e2e
```

### Debugging Tests:

1. **Run with UI**: `pnpm run test:e2e:ui`
2. **Run headed**: `pnpm run test:e2e:headed`
3. **Debug mode**: `pnpm exec playwright test --debug`
4. **Trace viewer**: `pnpm exec playwright show-trace`

### Test Reports:

After running tests, view the HTML report:
```bash
pnpm exec playwright show-report
```

## Continuous Integration

For CI environments, the tests are configured to:
- Run in headless mode
- Retry failed tests twice
- Generate HTML reports
- Capture screenshots on failure
- Generate traces for debugging

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Make sure port 3000 is available
2. **Database not seeded**: Run `pnpm run db:seed` first
3. **Browser not installed**: Run `pnpm exec playwright install`
4. **Tests timing out**: Increase timeout in playwright.config.ts

### Reset Test Environment:

```bash
# Clean database and reseed
pnpm exec prisma db push --force-reset
pnpm run db:seed

# Clean build artifacts
pnpm run clean
pnpm install
```
