import { test, expect } from '@playwright/test';

test('verify active packages in profile', async ({ page }) => {
  // Use a mock response to ensure packages show up.
  await page.route('**/api/packages*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        packages: [
          {
            id: 'pkg123',
            status: 'active',
            purchased_at: '2023-10-01T12:00:00Z',
            packages: { name: 'Premium Car Wash Plan' },
            service_allowances: { 'Car Wash': 5, 'Interior Cleaning': 2 }
          }
        ]
      })
    });
  });

  // Since we're mocking, we just navigate. But profile page expects auth.
  // We can set a localstorage item to mock auth.
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('ua_cached_user', JSON.stringify({
        id: 'user123',
        display_id: '1234',
        name: 'Test User',
        phone: '9999999999',
        email: 'test@example.com',
        role: 'user',
        wallet_balance: 5000
    }));
  });

  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/profile-packages.png', fullPage: true });
});
