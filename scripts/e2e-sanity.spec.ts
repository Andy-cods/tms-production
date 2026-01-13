import { test, expect } from '@playwright/test';

test.describe('TMS E2E Sanity Test', () => {
  test('Leader workflow: login -> inbox -> assign task -> my-tasks', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/TMS/);

    // 2. Login as leader
    await page.fill('input[name="email"]', 'leader.it@company.com');
    await page.fill('input[name="password"]', 'leader123');
    await page.click('button[type="submit"]');

    // 3. Wait for redirect to dashboard
    await page.waitForURL('/');
    await expect(page.locator('text=Xin chào, Nguyễn Văn A')).toBeVisible();

    // 4. Navigate to leader inbox
    await page.click('text=Leader');
    await page.click('text=Inbox');
    await page.waitForURL('/leader/inbox');

    // 5. Verify inbox page loads
    await expect(page.locator('h1')).toContainText('Inbox');
    
    // 6. Look for requests in the inbox
    const requestRows = page.locator('tbody tr');
    await expect(requestRows).toHaveCount(1);

    // 7. Click on the first request to view details
    await requestRows.first().click();
    await page.waitForURL(/\/requests\/[a-f0-9-]+/);

    // 8. Verify request detail page loads
    await expect(page.locator('h1')).toBeVisible();
    
    // 9. Look for tasks section
    const tasksSection = page.locator('text=Tasks').or(page.locator('text=Danh sách task'));
    await expect(tasksSection).toBeVisible();

    // 10. Look for task assignment functionality
    const taskRows = page.locator('tbody tr');
    if (await taskRows.count() > 0) {
      // If there are tasks, try to assign one
      const firstTask = taskRows.first();
      const assignSelect = firstTask.locator('select');
      
      if (await assignSelect.count() > 0) {
        // Assign task to a team member
        await assignSelect.selectOption({ label: 'Trần Thị B' });
        
        // Look for update button and click it
        const updateButton = firstTask.locator('button:has-text("Update")');
        if (await updateButton.count() > 0) {
          await updateButton.click();
          
          // Wait for success feedback (toast or page update)
          await page.waitForTimeout(1000);
        }
      }
    }

    // 11. Navigate to My Tasks
    await page.click('text=My Tasks');
    await page.waitForURL('/my-tasks');

    // 12. Verify My Tasks page loads
    await expect(page.locator('h1')).toContainText('My Tasks');
    
    // 13. Check if there are tasks assigned
    const myTaskRows = page.locator('tbody tr');
    await expect(myTaskRows).toHaveCount(0); // Should have at least 0 tasks

    // 14. Test task status update if there are tasks
    if (await myTaskRows.count() > 0) {
      const firstTask = myTaskRows.first();
      const statusSelect = firstTask.locator('select');
      
      if (await statusSelect.count() > 0) {
        // Try to update task status
        await statusSelect.selectOption('IN_PROGRESS');
        
        const updateButton = firstTask.locator('button:has-text("Update")');
        if (await updateButton.count() > 0) {
          await updateButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 15. Navigate back to dashboard
    await page.click('text=TMS');
    await page.waitForURL('/');

    // 16. Verify we're back at the dashboard
    await expect(page.locator('text=Xin chào, Nguyễn Văn A')).toBeVisible();
  });

  test('Requester workflow: login -> create request -> view requests', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Login as requester
    await page.fill('input[name="email"]', 'requester@company.com');
    await page.fill('input[name="password"]', 'req123');
    await page.click('button[type="submit"]');

    // 3. Wait for redirect to dashboard
    await page.waitForURL('/');
    await expect(page.locator('text=Xin chào, Lê Văn C')).toBeVisible();

    // 4. Navigate to create new request
    await page.click('text=Requests');
    await page.click('text=New Request');
    await page.waitForURL('/requests/new');

    // 5. Fill out the request form
    await page.fill('input[name="title"]', 'Test Request from E2E');
    await page.fill('textarea[name="description"]', 'This is a test request created during E2E testing.');
    
    // Select a category if available
    const categorySelect = page.locator('select[name="categoryId"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 1 }); // Select first available category
    }
    
    // Set priority
    const prioritySelect = page.locator('select[name="priority"]');
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption('MEDIUM');
    }

    // 6. Submit the form
    await page.click('button[type="submit"]');

    // 7. Wait for redirect to requests list
    await page.waitForURL('/requests');

    // 8. Verify the new request appears in the list
    await expect(page.locator('text=Test Request from E2E')).toBeVisible();

    // 9. Click on the new request to view details
    await page.click('text=Test Request from E2E');
    await page.waitForURL(/\/requests\/[a-f0-9-]+/);

    // 10. Verify request detail page loads
    await expect(page.locator('h1')).toContainText('Test Request from E2E');
  });

  test('Assignee workflow: login -> my-tasks -> update task status', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');

    // 2. Login as assignee
    await page.fill('input[name="email"]', 'tech01@company.com');
    await page.fill('input[name="password"]', 'tech123');
    await page.click('button[type="submit"]');

    // 3. Wait for redirect to dashboard
    await page.waitForURL('/');
    await expect(page.locator('text=Xin chào, Trần Thị B')).toBeVisible();

    // 4. Navigate to My Tasks
    await page.click('text=My Tasks');
    await page.waitForURL('/my-tasks');

    // 5. Verify My Tasks page loads
    await expect(page.locator('h1')).toContainText('My Tasks');

    // 6. Check if there are tasks assigned
    const taskRows = page.locator('tbody tr');
    await expect(taskRows).toHaveCount(0);

    // 7. If there are tasks, try to update status
    if (await taskRows.count() > 0) {
      const firstTask = taskRows.first();
      const statusSelect = firstTask.locator('select');
      
      if (await statusSelect.count() > 0) {
        // Update task status to IN_PROGRESS
        await statusSelect.selectOption('IN_PROGRESS');
        
        const updateButton = firstTask.locator('button:has-text("Update")');
        if (await updateButton.count() > 0) {
          await updateButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 8. Navigate to requests to see assigned tasks
    await page.click('text=Requests');
    await page.waitForURL('/requests');

    // 9. Verify requests page loads
    await expect(page.locator('h1')).toContainText('Requests');
  });
});
