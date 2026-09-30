import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

// Exercise the built site, including observable motion rather than only DOM presence.
const port = 4178;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', `${port}`, '--strictPort'], { stdio: 'pipe' });
const errors = [];
let browser;
let serverOutput = '';
server.stderr.on('data', (data) => { serverOutput += data; });

function watchErrors(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
}

async function goTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
}

async function serviceChapter(page, progress, index) {
  await page.locator('#expertise').evaluate((section, value) => {
    const start = section.getBoundingClientRect().top + window.scrollY - 90;
    const distance = section.offsetHeight - window.innerHeight + 90;
    window.scrollTo({ top: start + distance * value, behavior: 'instant' });
  }, progress);
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', `${index}`);
}

const transformOf = (locator) => locator.evaluate((element) => getComputedStyle(element).transform);
const identityTransform = (locator) => locator.evaluate((element) => {
  const transform = getComputedStyle(element).transform;
  return transform === 'none' || new DOMMatrixReadOnly(transform).isIdentity;
});

try {
  for (let attempt = 0; ; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview server stopped: ${serverOutput}`);
    try { if ((await fetch(url)).ok) break; } catch { /* Wait for the preview server. */ }
    if (attempt === 60) throw new Error('Preview server did not start. Run npm run build first.');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  watchErrors(page);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#approach')).toHaveCount(0);
  await expect(page.locator('#intro-title')).toContainText('Ambition opens doors.');
  assert.match(await page.title(), /Pravardha/);
  await expect.poll(() => page.locator('.hero-art img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect.poll(() => identityTransform(page.locator('.hero-line > span').last())).toBe(true);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/desktop-hero.png' });

  const heroTransform = await transformOf(page.getByTestId('hero-art'));
  await goTo(page, 300);
  await expect.poll(() => transformOf(page.getByTestId('hero-art'))).not.toBe(heroTransform);

  await expect(page.locator('#expertise')).toHaveClass(/service-track--pinned/);
  const sculpture = page.getByTestId('service-sculpture');
  const sculptureCanvas = page.getByTestId('sculpture-canvas');
  const sculptureViews = [];
  const sculptureImages = [];
  for (const [index, progress] of [0.1, 0.5, 0.9].entries()) {
    await serviceChapter(page, progress, index);
    await expect(sculpture).toHaveAttribute('data-renderer', 'webgl');
    await expect(sculptureCanvas).toBeVisible();
    if (index) await expect.poll(async () => Number(await sculpture.getAttribute('data-yaw'))).toBeGreaterThan(sculptureViews[index - 1].yaw + .3);
    let previousFrame;
    await expect.poll(async () => {
      const frame = await sculpture.getAttribute('data-frame');
      const settled = frame === previousFrame;
      previousFrame = frame;
      return settled;
    }, { message: 'The 3D renderer should rest once its scroll angle settles.', timeout: 10000, intervals: [100, 150, 250] }).toBe(true);
    const view = await sculpture.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { yaw: Number(element.dataset.yaw), pitch: Number(element.dataset.pitch), transform: getComputedStyle(element).transform, x, y, width, height };
    });
    assert.ok(Number.isFinite(view.yaw) && Number.isFinite(view.pitch), 'The sculpture must report a rendered 3D viewing angle.');
    assert.equal(view.transform, 'none', 'Scroll must rotate the 3D object rather than tilt or move its canvas.');
    if (index) {
      for (const dimension of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(view[dimension] - sculptureViews[0][dimension]) <= 1, `The sculpture frame must keep a stable ${dimension} while scrolling.`);
      }
    }
    sculptureViews.push(view);
    if (index !== 1) sculptureImages.push(await sculptureCanvas.screenshot());
  }
  assert.equal(new Set(sculptureViews.map((view) => view.yaw)).size, 3, 'Scroll must reveal three different 3D viewing angles.');
  assert.ok(!sculptureImages[0].equals(sculptureImages[1]), 'Different angles must visibly change the rendered sculpture.');

  const pausedPosition = await page.locator('#expertise').evaluate((section) => ({ y: window.scrollY, height: section.offsetHeight }));
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'reduced');
  const pausedAfter = await page.locator('#expertise').evaluate((section) => ({ y: window.scrollY, height: section.offsetHeight }));
  assert.ok(Math.abs(pausedAfter.y - pausedPosition.y) <= 2, 'Pausing motion must preserve the current scroll position.');
  assert.equal(pausedAfter.height, pausedPosition.height, 'Pausing motion must preserve the established scroll track.');
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '2');
  await serviceChapter(page, .5, 1);
  await page.waitForTimeout(300);
  assert.equal(Number(await sculpture.getAttribute('data-yaw')), sculptureViews[2].yaw, 'Pausing must freeze the 3D angle even when scrolling across chapter boundaries.');

  await page.locator('.corridor-geography').scrollIntoViewIfNeeded();
  await expect(page.locator('#perspective')).toHaveAttribute('data-motion', 'paused');
  await expect(page.locator('#perspective animateMotion')).toHaveCount(0);
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('#perspective')).toHaveAttribute('data-motion', 'running');
  await expect(page.locator('#perspective animateMotion')).toHaveCount(6);

  const regionButtons = page.locator('.corridor-controls button');
  await expect(regionButtons).toHaveCount(3);
  let previousCamera = await transformOf(page.getByTestId('route-camera'));
  for (const region of ['India', 'Singapore', 'GCC']) {
    const button = regionButtons.filter({ hasText: region });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('route-map')).toHaveAttribute('data-region', region);
    await expect(page.locator('.corridor-controls button[aria-pressed="true"]')).toHaveCount(1);
    await expect.poll(() => transformOf(page.getByTestId('route-camera'))).not.toBe(previousCamera);
    previousCamera = await transformOf(page.getByTestId('route-camera'));
  }
  await page.getByRole('button', { name: 'Explore India', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('route-map')).toHaveAttribute('data-region', 'India');
  await page.locator('.corridor-geography').scrollIntoViewIfNeeded();
  const travelerStart = await page.locator('.corridor-map circle:has(animateMotion)').first().evaluate((dot) => {
    const camera = document.querySelector('[data-testid="route-camera"]');
    const local = camera.getCTM().inverse().multiply(dot.getCTM());
    return { x: local.e, y: local.f, time: performance.now() };
  });
  await page.waitForFunction((start) => {
    const dot = document.querySelector('.corridor-map circle:has(animateMotion)');
    const camera = document.querySelector('[data-testid="route-camera"]');
    if (!dot || performance.now() - start.time < 500) return false;
    const local = camera.getCTM().inverse().multiply(dot.getCTM());
    return Math.hypot(local.e - start.x, local.f - start.y) > 2;
  }, travelerStart, { timeout: 4000 });
  await page.getByTestId('route-map').screenshot({ path: 'test-results/desktop-perspective.png' });

  const serviceTitles = ['Corporate structuring', 'Trade finance advisory', 'Cross-border trade'];
  for (const [index, title] of serviceTitles.entries()) {
    const button = page.getByRole('button', { name: new RegExp(title) });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', `${index}`);
    await expect(page.locator('.service-button[aria-pressed="true"]')).toHaveCount(1);
    const href = await page.getByRole('link', { name: 'Discuss your requirements' }).getAttribute('href');
    assert.ok(href.startsWith('mailto:parulgupta@hotmail.com'));
    assert.ok(decodeURIComponent(href).includes(title.toLowerCase()));
  }
  await page.locator('.service-button').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.service-button').nth(1)).toBeFocused();
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '1');
  await page.locator('.service-button').last().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '2');
  await expect(sculpture).toHaveAttribute('data-renderer', 'webgl');
  await expect(sculptureCanvas).toBeVisible();
  await page.getByTestId('service-stage').screenshot({ path: 'test-results/desktop-services.png' });

  await expect(page.getByRole('link', { name: 'Start a conversation', exact: true })).toHaveAttribute('href', /^mailto:parulgupta@hotmail\.com/);
  for (const link of await page.locator('a[href^="#"]').all()) {
    const target = await link.getAttribute('href');
    await expect(page.locator(target), `Anchor target ${target}`).toHaveCount(1);
  }

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await goTo(page, 0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const textBounds = await page.locator('.hero-line').evaluateAll((lines) => lines.map((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }));
    assert.ok(textBounds.every(({ left, right }) => left >= -1 && right <= width + 1), `Hero text overflows at ${width}px: ${JSON.stringify(textBounds)}`);
    const introWords = await page.locator('#intro-title > span').evaluateAll((words) => words.map((word) => ({
      left: word.offsetLeft, right: word.offsetLeft + word.offsetWidth, top: word.offsetTop,
    })));
    assert.equal(introWords.length, 3);
    for (let index = 1; index < introWords.length; index++) {
      if (introWords[index].top === introWords[index - 1].top) {
        assert.ok(introWords[index].left - introWords[index - 1].right >= 3, `Animated introduction words must retain visible spaces at ${width}px.`);
      }
    }
    const bodySize = await page.locator('.hero-description').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    assert.ok(bodySize >= (width >= 1024 ? 18 : 16), `Hero body type is too small at ${width}px.`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await goTo(page, 0);
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Expertise', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#expertise')).not.toHaveClass(/service-track--pinned/);
  await page.getByRole('button', { name: /Trade finance advisory/ }).click();
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '1');
  await page.locator('.service-visual').scrollIntoViewIfNeeded();
  await expect(sculpture).toHaveAttribute('data-renderer', 'webgl');
  let mobileFrame;
  await expect.poll(async () => {
    const frame = await sculpture.getAttribute('data-frame');
    const settled = frame === mobileFrame;
    mobileFrame = frame;
    return settled;
  }, { timeout: 10000, intervals: [100, 150, 250] }).toBe(true);
  const mobileYaw = Number(await sculpture.getAttribute('data-yaw'));
  await page.evaluate(() => window.scrollBy({ top: 100, behavior: 'instant' }));
  await expect(sculpture).toBeInViewport();
  await expect.poll(async () => Number(await sculpture.getAttribute('data-yaw'))).toBeGreaterThan(mobileYaw + .02);
  assert.equal(await transformOf(sculpture), 'none', 'Mobile scrolling must rotate the 3D object without tilting its canvas.');
  await page.getByTestId('service-stage').screenshot({ path: 'test-results/mobile-services.png' });
  await goTo(page, 0);
  await expect.poll(() => identityTransform(page.locator('.hero-line > span').last())).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-hero.png' });

  // OS preference changes are observed live; an explicit Play choice can override them.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'reduced');
  await expect.poll(() => identityTransform(page.getByTestId('hero-art'))).toBe(true);
  await goTo(page, 300);
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'full');

  const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  watchErrors(reducedPage);
  await reducedPage.goto(url, { waitUntil: 'networkidle' });
  await expect(reducedPage.locator('.site')).toHaveAttribute('data-motion', 'reduced');
  await expect(reducedPage.locator('#expertise')).not.toHaveClass(/service-track--pinned/);
  assert.ok(await reducedPage.locator('#expertise').evaluate((section) => section.offsetHeight < innerHeight * 1.8), 'Reduced motion must not start with a long pinned service track.');
  await expect.poll(() => identityTransform(reducedPage.getByTestId('hero-art'))).toBe(true);
  await reducedPage.getByRole('button', { name: /Cross-border trade/ }).click();
  await expect(reducedPage.getByTestId('service-stage')).toHaveAttribute('data-active', '2');
  await expect(reducedPage.locator('#service-detail h3')).toContainText('Different markets.');
  await reducedPage.locator('.corridor-geography').scrollIntoViewIfNeeded();
  await expect(reducedPage.locator('#perspective animateMotion')).toHaveCount(0);
  await reducedPage.locator('.corridor-controls button').filter({ hasText: 'Singapore' }).click();
  await expect(reducedPage.getByTestId('route-map')).toHaveAttribute('data-region', 'Singapore');
  await expect(reducedPage.locator('.corridor-detail h3')).toHaveText('An international point of view.');
  for (const selector of ['.hero-eyebrow', '.hero-content', '#intro-title > span', '.service-copy', '.corridor-detail']) {
    const opacities = await reducedPage.locator(selector).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
    assert.ok(opacities.length && opacities.every((opacity) => opacity === 1), `Reduced-motion content must remain visible: ${selector}`);
  }
  await reducedPage.screenshot({ path: 'test-results/desktop-reduced-full.png', fullPage: true });
  await reducedContext.close();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  console.log('PASS: live 3D rotation with stable framing, idle rendering and pause continuity; hero/map motion, scroll chapters, service and regional controls, keyboard navigation, shorter page, word spacing, contact links, mobile menu, five viewport widths, readable type, reduced motion, and browser/network checks.');
} finally {
  await browser?.close();
  server.kill();
}
