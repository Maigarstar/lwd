# LWD E2E Tests - Menu System

Complete end-to-end test suite for the Luxury Wedding Directory menu system.

## Overview

This test suite validates the entire menu lifecycle:

1. **Frontend Display** - Nav items render correctly
2. **Mega Menu** - Dropdowns open/close and display content
3. **Navigation** - Links route correctly
4. **Mobile** - Drawer and responsive behavior
5. **Scroll** - Nav transparency changes
6. **Accessibility** - Proper labels and keyboard support
7. **Error Handling** - Fallback navigation works

## Setup

### 1. Install Playwright

```bash
npm install -D @playwright/test
```

### 2. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:menu": "playwright test tests/e2e/menu.e2e.js",
    "test:headed": "playwright test --headed",
    "test:chrome": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit",
    "test:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'"
  }
}
```

### 3. Start Dev Server

The tests require your app running on `http://localhost:5176`:

```bash
npm run dev
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Menu Tests Only
```bash
npm run test:menu
```

### Run Tests with UI (Visual)
```bash
npm run test:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Tests
```bash
npm run test:debug
```

### Run on Mobile Only
```bash
npm run test:mobile
```

### Run on Specific Browser
```bash
npm run test:chrome
npm run test:firefox
npm run test:webkit
```

## Test Structure

### Phase 1: Frontend Menu Display
```javascript
✓ should load home page with navigation
✓ should display all nav items in correct order
✓ should highlight nav link on hover
✓ should display CTA button in nav
✓ should show dark mode toggle
```

### Phase 2: Mega Menu (Dropdown)
```javascript
✓ should show mega menu panel on hover
✓ should close mega menu on mouse leave
✓ should display category links in mega menu
✓ mega menu should have featured article section
✓ mega menu should highlight on hover
```

### Phase 3: Navigation & Routing
```javascript
✓ should navigate to Browse page on click
✓ should navigate to Magazine on link click
✓ CTA button should navigate to List Your Business
✓ logo click should go to home
```

### Phase 4: Mobile Menu
```javascript
✓ should show hamburger menu on mobile
✓ mobile drawer should open on hamburger click
✓ mobile menu should show all nav items
✓ mobile menu should close on click
```

### Phase 5: Scroll Behavior
```javascript
✓ nav should be transparent at top of hero page
✓ nav should become solid after scroll past 80px
✓ nav should return to transparent when scrolled back to top
```

### Phase 6: Accessibility
```javascript
✓ nav should have proper semantic markup
✓ buttons should have accessible labels
✓ nav items should be keyboard focusable
✓ dark mode toggle should work with keyboard
```

### Phase 7: Error Handling
```javascript
✓ page should load even if nav data fails
✓ nav items should have fallback handlers
```

## Expected Test Results

A passing test run should show:

```
✓ [chromium] menu.e2e.js:20:1 › Frontend Menu Display › should load home page with navigation
✓ [chromium] menu.e2e.js:32:1 › Frontend Menu Display › should display all nav items in correct order
✓ [chromium] menu.e2e.js:48:1 › Frontend Menu Display › should highlight nav link on hover
... (total 25+ tests)

✅ 25+ passed, 0 failed, 0 skipped
```

## Debugging Failed Tests

### 1. Check Screenshot
Playwright saves screenshots of failed tests:
```
test-results/menu.e2e.js-chromium/
```

### 2. Check Video
If video recording is enabled:
```
test-results/menu.e2e.js-chromium/test-failed-1.webm
```

### 3. Run Single Test
```bash
npx playwright test tests/e2e/menu.e2e.js -g "should show mega menu panel"
```

### 4. Run in Debug Mode
```bash
npx playwright test --debug
```

This opens the Playwright Inspector where you can step through tests.

### 5. Check Logs
Playwright logs network requests and console errors:
```bash
npx playwright test --reporter=line
```

## Common Issues

### Test Timeout
**Issue:** Tests timeout waiting for elements
**Solution:**
- Ensure dev server is running: `npm run dev`
- Check that `baseURL: 'http://localhost:5176'` matches your server
- Increase timeout in `playwright.config.js`

### Element Not Found
**Issue:** Selectors aren't finding elements
**Solution:**
- Check element structure hasn't changed
- Use `--ui` mode to visually inspect elements
- Update selectors in test file

### Mobile Tests Fail
**Issue:** Mobile-specific functionality broken
**Solution:**
- Run `npm run test:mobile` to isolate mobile tests
- Check viewport sizes match actual device sizes
- Verify hamburger menu and drawer logic

### Flaky Tests
**Issue:** Tests pass sometimes, fail sometimes
**Solution:**
- Increase `waitForTimeout()` values
- Use `waitForURL()` instead of relying on navigation timing
- Add explicit waits for animations

## Continuous Integration

To run tests in CI (GitHub Actions, etc):

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens an interactive dashboard showing:
- Test status (passed/failed)
- Screenshots of failures
- Video recordings
- Network requests
- Console logs

## Adding New Tests

### Template for New Test

```javascript
test('should do something', async ({ page }) => {
  // 1. Navigate
  await page.goto('/');

  // 2. Find element
  const element = page.locator('selector');

  // 3. Interact
  await element.click();

  // 4. Verify
  await expect(element).toBeVisible();
  expect(actualValue).toBe(expectedValue);
});
```

### Common Assertions

```javascript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text
await expect(element).toContainText('text');
await expect(element).toHaveText('exact text');

// Attributes
await expect(element).toHaveAttribute('id', 'my-id');
await expect(element).toHaveClass('class-name');

// URL
await expect(page).toHaveURL('/expected-url');

// Counts
expect(await element.count()).toBe(5);
```

## Performance Testing

To measure menu load and interaction performance:

```javascript
test('should load menu items quickly', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  await page.waitForFunction(() => {
    return document.querySelectorAll('nav button').length > 2;
  });

  const loadTime = Date.now() - startTime;
  console.log(`Menu loaded in ${loadTime}ms`);

  expect(loadTime).toBeLessThan(1000); // Should load in < 1 second
});
```

## Coverage

This test suite covers:

- ✅ Menu rendering (all variations)
- ✅ Mega menu behavior (hover, click, close)
- ✅ Navigation (all link types)
- ✅ Mobile responsiveness (drawer, hamburger)
- ✅ Scroll interactions (transparency)
- ✅ Accessibility (keyboard, labels)
- ✅ Error handling (fallbacks)
- ✅ Dark mode toggle
- ✅ Multiple browsers (Chrome, Firefox, Safari)
- ✅ Multiple devices (Desktop, Mobile)

## Next Steps

1. ✅ Run tests locally: `npm test`
2. ✅ Fix any failures
3. ✅ Add to CI/CD pipeline
4. ✅ Set up test reporting
5. ✅ Create test dashboard

---

For questions or issues with tests, check the [Playwright docs](https://playwright.dev)
