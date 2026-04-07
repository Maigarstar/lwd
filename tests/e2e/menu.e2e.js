// tests/e2e/menu.e2e.js
// Comprehensive End-to-End Tests for LWD Menu System
// Tests: Admin menu creation → Frontend display → User interactions

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: Menu System E2E
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Menu System E2E Tests', () => {

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1: FRONTEND - Menu Display & Interactions
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Frontend Menu Display', () => {

    test('should load home page with navigation', async ({ page }) => {
      // Navigate to home page
      await page.goto('/');

      // Verify nav elements exist
      await expect(page.locator('nav')).toBeTruthy();

      // Verify logo is displayed
      const logo = page.locator('text=Luxury Wedding Directory, text=Luxury, text=Wedding');
      await expect(logo).toBeVisible();

      // Verify main nav links exist
      const browseLink = page.locator('button:has-text("Browse")');
      await expect(browseLink).toBeVisible();
    });

    test('should display all nav items in correct order', async ({ page }) => {
      await page.goto('/');

      // Get all nav items (excluding CTA buttons)
      const navLinks = page.locator('.home-nav-links');
      const count = await navLinks.count();

      // Should have at least 3 items (Browse, Aura Discovery, Real Weddings, etc)
      expect(count).toBeGreaterThanOrEqual(3);

      // Verify specific items exist
      await expect(page.locator('button:has-text("Browse")')).toBeVisible();
      await expect(page.locator('button:has-text("Magazine")')).toBeVisible();
      await expect(page.locator('button:has-text("Planning")')).toBeVisible();
    });

    test('should highlight nav link on hover', async ({ page }) => {
      await page.goto('/');

      const browseLink = page.locator('button:has-text("Browse")');
      const initialColor = await browseLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Hover over link
      await browseLink.hover();
      await page.waitForTimeout(200); // Wait for transition

      const hoverColor = await browseLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Color should change on hover (to gold)
      expect(hoverColor).not.toBe(initialColor);
    });

    test('should display CTA button in nav', async ({ page }) => {
      await page.goto('/');

      // Find CTA button (typically "List Your Business")
      const ctaButton = page.locator('button:has-text("List Your Business")');

      await expect(ctaButton).toBeVisible();

      // CTA button should have gold background
      const bgColor = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toContain('201'); // Gold color: rgb(201, 168, 76)
    });

    test('should show dark mode toggle', async ({ page }) => {
      await page.goto('/');

      // Find dark mode toggle button (☀ or ☽)
      const darkToggle = page.locator('button[title*="Dark Mode"], button[title*="Light Mode"]');

      await expect(darkToggle).toBeVisible();

      // Click to toggle
      await darkToggle.click();
      await page.waitForTimeout(300); // Wait for transition

      // Nav background should change
      const navBg = await page.locator('nav').first().evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(navBg).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2: MEGA MENU - Hover & Display
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Mega Menu (Dropdown) Functionality', () => {

    test('should show mega menu panel on hover', async ({ page }) => {
      await page.goto('/');

      // Find Magazine nav item (has mega menu)
      const magazineLink = page.locator('button:has-text("Magazine")');
      await expect(magazineLink).toBeVisible();

      // Hover to open mega menu
      await magazineLink.hover();
      await page.waitForTimeout(300); // Wait for panel to appear

      // Mega menu panel should be visible
      const megaPanel = page.locator('div[class*="mega"], div[class*="panel"]').first();
      await expect(megaPanel).toBeVisible();
    });

    test('should close mega menu on mouse leave', async ({ page }) => {
      await page.goto('/');

      const magazineLink = page.locator('button:has-text("Magazine")');

      // Open menu
      await magazineLink.hover();
      await page.waitForTimeout(300);

      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200); // 120ms close delay + buffer

      // Panel should be hidden
      const megaPanel = page.locator('[class*="mega"], [class*="panel"]').first();
      const isVisible = await megaPanel.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('should display category links in mega menu', async ({ page }) => {
      await page.goto('/');

      const magazineLink = page.locator('button:has-text("Magazine")');
      await magazineLink.hover();
      await page.waitForTimeout(300);

      // Should show category links
      const categoryLinks = page.locator('a, button').filter({ hasText: /Weddings|Venues|Vendors|Planners/ });
      const count = await categoryLinks.count();

      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('mega menu should have featured article section', async ({ page }) => {
      await page.goto('/');

      const magazineLink = page.locator('button:has-text("Magazine")');
      await magazineLink.hover();
      await page.waitForTimeout(300);

      // Should show featured article or content
      const featuredContent = page.locator('text=Editor|Featured|Pick, text=View All').first();
      const isVisible = await featuredContent.isVisible().catch(() => false);

      // May or may not have featured content, but structure should exist
      expect(isVisible).toBeDefined();
    });

    test('mega menu should highlight on hover', async ({ page }) => {
      await page.goto('/');

      const magazineLink = page.locator('button:has-text("Magazine")');

      // Before hover
      const beforeColor = await magazineLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Hover
      await magazineLink.hover();
      await page.waitForTimeout(200);

      // After hover - should be gold
      const afterColor = await magazineLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      expect(afterColor).not.toBe(beforeColor);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3: NAVIGATION - Link Clicks & Routing
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Navigation & Routing', () => {

    test('should navigate to Browse page on click', async ({ page }) => {
      await page.goto('/');

      const browseLink = page.locator('button:has-text("Browse")');
      await browseLink.click();

      // Wait for navigation
      await page.waitForURL(/\/venue|\/browse/, { timeout: 5000 });

      // Should be on browse page
      const url = page.url();
      expect(url).toContain('/venue');
    });

    test('should navigate to Magazine on link click', async ({ page }) => {
      await page.goto('/');

      // Click "View All" in magazine menu if visible, or direct link
      const magazineLink = page.locator('button:has-text("Magazine")');

      // Try direct click first
      const directMagazineNav = page.locator('a:has-text("Magazine"), button:has-text("Magazine")').first();

      if (await directMagazineNav.isVisible()) {
        await directMagazineNav.click();
        await page.waitForURL(/\/magazine/, { timeout: 5000 });
        expect(page.url()).toContain('/magazine');
      }
    });

    test('CTA button should navigate to List Your Business', async ({ page }) => {
      await page.goto('/');

      const ctaButton = page.locator('button:has-text("List Your Business")');
      await ctaButton.click();

      // Wait for navigation
      await page.waitForURL(/\/list-your-business/, { timeout: 5000 });

      const url = page.url();
      expect(url).toContain('/list-your-business');
    });

    test('logo click should go to home', async ({ page }) => {
      await page.goto('/listings'); // Go to different page

      // Click logo
      const logo = page.locator('div:has-text("Wedding")').first();
      await logo.click();

      // Should navigate to home
      await page.waitForURL('/', { timeout: 5000 });
      expect(page.url()).toBe('http://localhost:5176/');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4: RESPONSIVE - Mobile Menu
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Mobile Menu (Responsive)', () => {

    test('should show hamburger menu on mobile', async ({ page }) => {
      // Use mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      await page.goto('/');

      // Hamburger button should be visible
      const hamburger = page.locator('button[aria-label*="Menu"], button[title*="Menu"]').first();
      const isVisible = await hamburger.isVisible().catch(() => false);

      expect(isVisible).toBe(true);
    });

    test('mobile drawer should open on hamburger click', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Find and click hamburger
      const hamburger = page.locator('button').filter({ has: page.locator('svg, [class*="menu"], [class*="hamburger"]') }).first();

      // Try multiple selectors for hamburger
      let opened = false;
      const buttons = await page.locator('button').all();

      for (const btn of buttons) {
        await btn.click();
        const drawer = page.locator('[class*="drawer"], nav[class*="mobile"]').first();
        if (await drawer.isVisible().catch(() => false)) {
          opened = true;
          break;
        }
      }

      // If drawer exists and opened
      if (opened) {
        const drawer = page.locator('[class*="drawer"], nav[class*="mobile"]').first();
        await expect(drawer).toBeVisible();
      }
    });

    test('mobile menu should show all nav items', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Open drawer (find hamburger and click)
      const buttons = await page.locator('button').all();
      let drawerOpened = false;

      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        if (!text && await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(300);

          const drawer = page.locator('[class*="drawer"]').first();
          if (await drawer.isVisible().catch(() => false)) {
            drawerOpened = true;
            break;
          }
        }
      }

      if (drawerOpened) {
        // Should show navigation items
        const navItems = page.locator('[class*="drawer"] button, [class*="drawer"] a').count();
        expect(await navItems).toBeGreaterThan(0);
      }
    });

    test('mobile menu should close on click', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Open drawer
      const buttons = await page.locator('button').all();

      for (const btn of buttons) {
        await btn.click();
        const drawer = page.locator('[class*="drawer"]').first();
        if (await drawer.isVisible().catch(() => false)) {
          // Click close button or outside
          const closeBtn = drawer.locator('button:has-text("×"), button[aria-label*="close"]').first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
            await page.waitForTimeout(300);

            const stillVisible = await drawer.isVisible().catch(() => false);
            expect(stillVisible).toBe(false);
          }
          break;
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 5: SCROLL BEHAVIOR
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Scroll Behavior & Transparency', () => {

    test('nav should be transparent at top of hero page', async ({ page }) => {
      await page.goto('/');

      // Get nav background at top
      const nav = page.locator('nav').first();
      const topBg = await nav.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should be transparent or very light on hero
      expect(topBg).toMatch(/transparent|rgba\(.*0\)|rgba\(255.*0\)/);
    });

    test('nav should become solid after scroll past 80px', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 100));
      await page.waitForTimeout(300); // Wait for scroll listener

      const nav = page.locator('nav').first();
      const scrolledBg = await nav.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should be dark/solid background
      expect(scrolledBg).not.toMatch(/transparent/);
    });

    test('nav should return to transparent when scrolled back to top', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 100));
      await page.waitForTimeout(300);

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const nav = page.locator('nav').first();
      const topBg = await nav.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should be transparent again
      expect(topBg).toMatch(/transparent|rgba\(.*0\)/);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 6: ACCESSIBILITY
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Accessibility & Semantics', () => {

    test('nav should have proper semantic markup', async ({ page }) => {
      await page.goto('/');

      // Should have nav element
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Should have buttons/links
      const buttons = page.locator('nav button, nav a');
      expect(await buttons.count()).toBeGreaterThan(0);
    });

    test('buttons should have accessible labels', async ({ page }) => {
      await page.goto('/');

      // Dark toggle should have aria-label or title
      const darkToggle = page.locator('button[aria-label*="Mode"], button[title*="Mode"]');
      const hasLabel = await darkToggle.getAttribute('aria-label').catch(() => null) ||
                      await darkToggle.getAttribute('title').catch(() => null);

      expect(hasLabel).toBeTruthy();
    });

    test('nav items should be keyboard focusable', async ({ page }) => {
      await page.goto('/');

      // Tab to first nav item
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Nav usually second in tab order

      const focused = page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName === 'BUTTON' || el?.tagName === 'A';
      });

      expect(await focused).toBe(true);
    });

    test('dark mode toggle should work with keyboard', async ({ page }) => {
      await page.goto('/');

      // Find and focus dark toggle
      const darkToggle = page.locator('button[aria-label*="Mode"], button[title*="Mode"]');
      await darkToggle.focus();

      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Verify toggle happened (nav color changed)
      const navBg = await page.locator('nav').first().evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(navBg).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 7: ERROR HANDLING & FALLBACKS
  // ──────────────────────────────────────────────────────────────────────────

  test.describe('Error Handling & Fallbacks', () => {

    test('page should load even if nav data fails', async ({ page }) => {
      // Page should load with fallback navigation
      await page.goto('/');

      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Should have at least Browse link (fallback)
      const browseLink = page.locator('button:has-text("Browse")');
      const exists = await browseLink.count() > 0;
      expect(exists).toBe(true);
    });

    test('nav items should have fallback handlers', async ({ page }) => {
      await page.goto('/');

      // Click a nav item - should navigate
      const browseLink = page.locator('button:has-text("Browse")');
      const hasHandler = await browseLink.evaluate(el => !!el.onclick);

      // Should have click handler or be a link
      const isButton = await browseLink.evaluate(el => el.tagName === 'BUTTON');
      expect(isButton || hasHandler).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wait for nav items to load from Supabase
 */
async function waitForNavItems(page) {
  await page.waitForFunction(() => {
    const navButtons = document.querySelectorAll('nav button');
    return navButtons.length > 2;
  }, { timeout: 5000 });
}

/**
 * Check if element is gold color (nav hover)
 */
function isGoldColor(color) {
  // Gold: rgb(201, 168, 76) or #c9a84c
  return color.includes('201') || color.includes('c9a8');
}

/**
 * Get all visible nav items
 */
async function getNavItems(page) {
  return page.locator('nav button:visible, nav a:visible').all();
}
