# 🚀 Quick Start - Menu System E2E Tests

## 1️⃣ Install Playwright

```bash
npm install -D @playwright/test
```

## 2️⃣ Add Test Scripts to package.json

Add this to your `package.json` scripts section:

```json
"test": "playwright test",
"test:menu": "playwright test tests/e2e/menu.e2e.js",
"test:ui": "playwright test --ui",
"test:headed": "playwright test --headed"
```

## 3️⃣ Start Dev Server

```bash
npm run dev
```

Keep this running in a terminal. Tests will connect to `http://localhost:5176`

## 4️⃣ Run Tests

### Option A: Visual Mode (Recommended for first run)
```bash
npm run test:ui
```
This opens an interactive UI where you can watch tests run, inspect elements, and debug failures.

### Option B: Menu Tests Only
```bash
npm run test:menu
```
Runs only the menu E2E tests (25+ tests).

### Option C: All Tests with Browser Visible
```bash
npm run test:headed
```
Watches browser window as tests run.

### Option D: Silent Mode
```bash
npm test
```
Runs all tests, prints results to console.

## ✅ What Gets Tested

### Frontend Display (5 tests)
- ✓ Nav loads with correct items
- ✓ Links display in order
- ✓ Hover highlights work
- ✓ CTA button visible
- ✓ Dark mode toggle works

### Mega Menu (5 tests)
- ✓ Dropdown opens on hover
- ✓ Dropdown closes on mouse leave
- ✓ Category links display
- ✓ Featured content shows
- ✓ Hover color changes

### Navigation (4 tests)
- ✓ Browse link navigates
- ✓ Magazine link navigates
- ✓ CTA button works
- ✓ Logo returns to home

### Mobile (4 tests)
- ✓ Hamburger visible on mobile
- ✓ Drawer opens
- ✓ All items in mobile menu
- ✓ Drawer closes

### Scroll (3 tests)
- ✓ Nav transparent at top
- ✓ Nav solid when scrolled
- ✓ Nav transparent when scrolled back

### Accessibility (4 tests)
- ✓ Semantic HTML present
- ✓ Buttons have labels
- ✓ Keyboard focusable
- ✓ Dark toggle keyboard works

### Error Handling (2 tests)
- ✓ Fallback navigation works
- ✓ Handlers exist for nav items

**Total: 27 tests across Desktop, Mobile, Chrome, Firefox, Safari**

## 📊 Expected Output

```
✓ Frontend Menu Display (5 passed)
✓ Mega Menu Functionality (5 passed)
✓ Navigation & Routing (4 passed)
✓ Mobile Menu (4 passed)
✓ Scroll Behavior (3 passed)
✓ Accessibility (4 passed)
✓ Error Handling (2 passed)

==============================
✅ 27 passed in 3 minutes
==============================
```

## 🔍 View Test Report

After tests finish:
```bash
npx playwright show-report
```

Opens HTML dashboard with:
- Test results
- Screenshots of failures
- Video recordings
- Network logs
- Console output

## 🐛 Debug Failed Tests

### Visual Debugging
```bash
npm run test:ui
```
Click on failed test to inspect DOM and step through.

### Debug Single Test
```bash
npx playwright test tests/e2e/menu.e2e.js -g "mega menu"
```

### Debug Mode
```bash
npx playwright test --debug
```
Opens Playwright Inspector - step through line by line.

## 📝 Test Locations

- **Config:** `playwright.config.js`
- **Tests:** `tests/e2e/menu.e2e.js`
- **Docs:** `tests/README.md`
- **Reports:** `playwright-report/`
- **Screenshots:** `test-results/`
- **Videos:** `test-results/`

## 🚦 Typical Workflow

1. Make changes to menu code
2. Run tests: `npm run test:menu`
3. If failing: `npm run test:ui` to debug
4. Fix code
5. Re-run until all pass
6. Commit with test results

## 📦 CI/CD Integration

To add to GitHub Actions:

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
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## ❓ Common Issues

| Issue | Fix |
|-------|-----|
| Tests timeout | Start dev server: `npm run dev` |
| Port already in use | Kill process on 5176: `lsof -ti:5176 \| xargs kill -9` |
| Element not found | Run in UI mode: `npm run test:ui` |
| Mobile tests fail | Check viewport size in config |
| Flaky tests | Increase `waitForTimeout()` values |

## 📚 More Info

- Full docs: See `tests/README.md`
- Playwright docs: https://playwright.dev
- Config options: See `playwright.config.js`

---

**Ready to test?** → `npm run test:ui` 🎉
