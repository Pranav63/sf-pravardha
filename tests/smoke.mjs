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

async function checkCleanControls(page) {
  await expect(page.getByRole('button', { name: /(?:Pause|Play) motion/ })).toHaveCount(0);
  const decoratedControls = await page.locator('button, a').evaluateAll((elements) => elements
    .filter((element) => element.querySelector('.arrow') || /[↗↑↓→]/u.test(element.textContent))
    .map((element) => element.textContent.trim() || element.getAttribute('aria-label')));
  assert.deepEqual(decoratedControls, [], 'Buttons and links must keep clean, arrow-free labels.');
}

async function checkContactSheet(page, openSheet, trigger) {
  const position = await page.evaluate(() => scrollY);
  await openSheet();
  const sheet = page.getByRole('dialog', { name: 'Your next move. Let’s talk it through.' });
  const close = sheet.getByRole('button', { name: 'Close contact sheet' });
  await expect(sheet).toBeVisible();
  await expect(close).toBeFocused();
  await expect(sheet.getByRole('link', { name: 'Email Parul' })).toHaveAttribute('href', /^mailto:parulgupta@hotmail\.com/);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async value => { document.documentElement.dataset.copiedEmail = value; },
  } }));
  await sheet.getByRole('button', { name: 'Copy email' }).click();
  await expect(sheet.getByRole('status')).toHaveText('Email address copied.');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.copiedEmail), 'parulgupta@hotmail.com');
  // Native modal focus must stay inside the sheet in either direction.
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(sheet.getByRole('button', { name: 'Copied', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2, 'The sheet must preserve the reading position.');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  await openSheet();
  await expect(sheet.getByRole('button', { name: 'Copy email' })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async () => { throw new Error('Clipboard access denied'); },
  } }));
  await sheet.getByRole('button', { name: 'Copy email' }).click();
  await expect(sheet.getByRole('status')).toContainText('Copy is unavailable');
  await expect(sheet.getByRole('status')).not.toContainText('copied');
  await page.mouse.click(2, 2);
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
}

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
  await expect(page.locator('.hero-eyebrow, .manifesto-rule, .corridor-atlas-note, .service-visual-note, .service-scroll-hint')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Three perspectives\. One way forward\.|Scroll to explore/i);
  await expect(page.locator('#intro-title')).toContainText('Ambition opens doors.');
  await checkCleanControls(page);
  assert.match(await page.title(), /Pravardha/);
  await expect.poll(() => page.locator('.hero-art img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect.poll(() => identityTransform(page.locator('.hero-line > span').last())).toBe(true);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/desktop-hero.png' });
  await checkContactSheet(page, () => page.locator('.header-contact').click(), page.locator('.header-contact'));

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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'reduced');
  const pausedAfter = await page.locator('#expertise').evaluate((section) => ({ y: window.scrollY, height: section.offsetHeight }));
  assert.ok(Math.abs(pausedAfter.y - pausedPosition.y) <= 2, 'Changing the OS motion preference must preserve the current scroll position.');
  assert.equal(pausedAfter.height, pausedPosition.height, 'Changing the OS motion preference must preserve the established scroll track.');
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '2');
  await serviceChapter(page, .5, 1);
  await page.waitForTimeout(300);
  assert.equal(Number(await sculpture.getAttribute('data-yaw')), sculptureViews[2].yaw, 'Reduced motion must freeze the 3D angle even when scrolling across chapter boundaries.');

  await page.locator('.corridor-geography').scrollIntoViewIfNeeded();
  await expect(page.locator('#perspective')).toHaveAttribute('data-motion', 'paused');
  await expect(page.locator('#perspective animateMotion')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'full');
  await expect(page.locator('#perspective')).toHaveAttribute('data-motion', 'running');
  await expect(page.locator('#perspective animateMotion')).toHaveCount(6);

  const regionButtons = page.locator('.corridor-controls button');
  await expect(regionButtons).toHaveCount(3);
  const atlasHeight = await page.getByTestId('route-map').evaluate(element => element.offsetHeight);
  let previousCamera = await transformOf(page.getByTestId('route-camera'));
  for (const region of ['India', 'Singapore', 'GCC']) {
    const button = regionButtons.filter({ hasText: region });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('route-map')).toHaveAttribute('data-region', region);
    assert.equal(await page.getByTestId('route-map').evaluate(element => element.offsetHeight), atlasHeight, 'Region changes must preserve the map height and reading position.');
    await expect(page.locator('.corridor-controls button[aria-pressed="true"]')).toHaveCount(1);
    await expect.poll(() => transformOf(page.getByTestId('route-camera'))).not.toBe(previousCamera);
    previousCamera = await transformOf(page.getByTestId('route-camera'));
  }
  // Camera, text and route emphasis should settle together, including rapid selections.
  await regionButtons.filter({ hasText: 'India' }).click();
  await regionButtons.filter({ hasText: 'Singapore' }).click();
  await page.waitForTimeout(550);
  const settledCamera = await transformOf(page.getByTestId('route-camera'));
  await expect(page.locator('.corridor-detail h3:visible')).toHaveText('An international point of view.');
  assert.equal(await page.locator('.corridor-detail > [aria-hidden="false"]').evaluate(element => Number(getComputedStyle(element).opacity)), 1);
  await page.waitForTimeout(100);
  assert.equal(await transformOf(page.getByTestId('route-camera')), settledCamera, 'The map camera should settle within its 450ms transition.');
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

  await expect(page.locator('#contact .contact-button')).toHaveAttribute('href', /^mailto:parulgupta@hotmail\.com/);
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
    if (width <= 780) await expect(page.locator('.hero-glass-note')).toBeHidden();
    const bodySize = await page.locator('.hero-description').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    assert.ok(bodySize >= (width >= 1024 ? 18 : 16), `Hero body type is too small at ${width}px.`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await goTo(page, 0);
  const menu = page.locator('.menu-toggle');
  const header = page.locator('.site-header');
  await goTo(page, 650);
  await expect(header).toHaveAttribute('data-hidden', 'true');
  await expect.poll(() => header.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await goTo(page, 620);
  await expect(header).toHaveAttribute('data-hidden', 'false');
  for (const top of [624, 620, 624, 620]) { await goTo(page, top); await page.waitForTimeout(30); }
  await expect(header).toHaveAttribute('data-hidden', 'false');
  await checkContactSheet(page, async () => {
    await menu.click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Let’s talk' }).click();
  }, menu);
  await page.keyboard.press('Tab');
  await menu.focus();
  await goTo(page, 750);
  await expect(header).toHaveAttribute('data-hidden', 'false');
  await menu.click();
  await goTo(page, 850);
  await expect(header).toHaveAttribute('data-hidden', 'false');
  await page.keyboard.press('Escape');
  await goTo(page, 0);

  const menuBounds = await menu.boundingBox();
  assert.ok(menuBounds.width >= 44 && menuBounds.height >= 44, 'The mobile menu needs a comfortable touch target.');
  const menuAlignment = await menu.evaluate((element) => {
    const label = element.querySelector('.menu-label').getBoundingClientRect();
    const icon = element.querySelector('.menu-lines').getBoundingClientRect();
    return { gap: icon.left - label.right, centerDifference: Math.abs(label.top + label.height / 2 - icon.top - icon.height / 2) };
  });
  assert.ok(menuAlignment.gap >= 4 && menuAlignment.gap <= 12 && menuAlignment.centerDifference <= 2, 'The menu label and icon should form one compact, aligned control.');
  await menu.click({ position: { x: 8, y: 8 } });
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await checkCleanControls(page);
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  const linkHeights = await mobileNavigation.getByRole('link').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
  assert.ok(linkHeights.every((height) => height >= 44), 'Mobile navigation links must be easy to tap.');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await menu.click();
  await mobileNavigation.getByRole('link', { name: 'Expertise', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(mobileNavigation).toHaveCount(0);
  await expect(page.locator('#expertise'), 'The mobile menu must navigate to its section after closing.').toBeInViewport();
  await expect(page.locator('#expertise')).not.toHaveClass(/service-track--pinned/);
  await expect(page.locator('.service-button:visible')).toHaveCount(0);
  const mobileChapters = page.locator('.mobile-service-chapter');
  await expect(mobileChapters).toHaveCount(3);
  await expect(sculptureCanvas).toHaveCount(1);
  const mobileAngles = [];
  const mobileHeadings = ['Built around your', 'Connect the transaction.', 'Different markets.'];
  for (const [index, heading] of mobileHeadings.entries()) {
    const chapter = mobileChapters.nth(index);
    await chapter.locator('h3').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 130, behavior: 'instant' }));
    await expect(chapter.locator('h3')).toContainText(heading);
    await expect(chapter.locator('h3')).toBeInViewport({ ratio: 1 });
    await expect(sculpture).toHaveAttribute('data-renderer', 'webgl');
    await expect(sculptureCanvas).toBeInViewport();
    if (index) await expect.poll(async () => Number(await sculpture.getAttribute('data-yaw'))).toBeGreaterThan(mobileAngles[index - 1] + .1);
    let mobileFrame;
    await expect.poll(async () => {
      const frame = await sculpture.getAttribute('data-frame');
      const settled = frame === mobileFrame;
      mobileFrame = frame;
      return settled;
    }, { timeout: 10000, intervals: [100, 150, 250] }).toBe(true);
    mobileAngles.push(Number(await sculpture.getAttribute('data-yaw')));
    const reading = await chapter.locator('.mobile-service-description').evaluate((element) => {
      const box = element.getBoundingClientRect();
      const canvas = document.querySelector('[data-testid="sculpture-canvas"]').getBoundingClientRect();
      const style = getComputedStyle(element);
      const hit = document.elementFromPoint(box.left + box.width / 2, Math.min(box.top + 12, innerHeight - 10));
      return {
        left: box.left, right: box.right, fontSize: parseFloat(style.fontSize), opacity: Number(style.opacity),
        overlapsArt: box.top < canvas.bottom && box.bottom > canvas.top && box.left < canvas.right && box.right > canvas.left,
        textReceivesPointer: Boolean(hit && element.contains(hit)), userSelect: style.userSelect,
      };
    });
    assert.ok(reading.left >= 0 && reading.right <= 390 && reading.fontSize >= 16 && reading.opacity === 1, `Mobile chapter ${index + 1} must remain readable: ${JSON.stringify(reading)}`);
    assert.ok(reading.overlapsArt && reading.textReceivesPointer && reading.userSelect !== 'none', 'The sculpture should sit behind selectable text without blocking it.');
    assert.equal(await transformOf(sculpture), 'none', 'Mobile scrolling must rotate the 3D object without tilting its canvas.');
    await page.screenshot({ path: `test-results/mobile-services-${index + 1}.png` });
    const enquiry = chapter.getByRole('link', { name: 'Discuss your requirements' });
    assert.ok(decodeURIComponent(await enquiry.getAttribute('href')).includes(serviceTitles[index].toLowerCase()));
    await enquiry.scrollIntoViewIfNeeded();
    await expect(enquiry).toBeInViewport();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Service text must not cause horizontal scrolling.');
  }
  assert.equal(new Set(mobileAngles).size, 3, 'Ordinary mobile scrolling must reveal all three 3D perspectives without any service taps.');
  await expect(page.getByTestId('service-stage')).toHaveAttribute('data-active', '2');
  const portrait = page.locator('#about img[src="/images/md_parul.png"]');
  await portrait.scrollIntoViewIfNeeded();
  await expect.poll(() => portrait.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.partner-monogram')).toHaveCount(0);
  await page.locator('#about').screenshot({ path: 'test-results/mobile-people.png' });
  await page.locator('#contact').screenshot({ path: 'test-results/mobile-contact.png' });
  await goTo(page, 0);
  await expect.poll(() => identityTransform(page.locator('.hero-line > span').last())).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-hero.png' });

  // Motion runs by default and follows live OS preference changes without a site override.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.site')).toHaveAttribute('data-motion', 'reduced');
  await expect.poll(() => identityTransform(page.getByTestId('hero-art'))).toBe(true);
  await goTo(page, 300);
  await checkCleanControls(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
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
  await expect(reducedPage.locator('.corridor-detail h3:visible')).toHaveText('An international point of view.');
  for (const selector of ['.hero-content', '#intro-title > span', '.service-copy', '.corridor-detail']) {
    const opacities = await reducedPage.locator(selector).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
    assert.ok(opacities.length && opacities.every((opacity) => opacity === 1), `Reduced-motion content must remain visible: ${selector}`);
  }
  await reducedPage.locator('.header-contact').click();
  await expect(reducedPage.getByRole('dialog')).toBeVisible();
  await expect.poll(() => identityTransform(reducedPage.getByRole('dialog'))).toBe(true);
  await reducedPage.getByRole('button', { name: 'Close contact sheet' }).click();
  await expect(reducedPage.getByRole('dialog')).toBeHidden();
  await reducedPage.screenshot({ path: 'test-results/desktop-reduced-full.png', fullPage: true });
  await reducedPage.setViewportSize({ width: 390, height: 844 });
  await reducedPage.goto(url, { waitUntil: 'networkidle' });
  await expect(reducedPage.locator('.mobile-service-chapter')).toHaveCount(3);
  await expect(reducedPage.locator('.service-button:visible')).toHaveCount(0);
  let reducedMobileAngle;
  for (const chapter of await reducedPage.locator('.mobile-service-chapter').all()) {
    await chapter.locator('h3').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 130, behavior: 'instant' }));
    await expect(chapter.locator('h3')).toBeInViewport({ ratio: 1 });
    await expect(reducedPage.getByTestId('service-sculpture')).toHaveAttribute('data-renderer', 'webgl');
    const visibleText = await chapter.locator('h3, .mobile-service-description').evaluateAll((elements) => elements.every((element) => Number(getComputedStyle(element).opacity) === 1));
    assert.ok(visibleText, 'Reduced motion must leave every mobile chapter readable without selecting a tab.');
    await reducedPage.waitForTimeout(150);
    const angle = Number(await reducedPage.getByTestId('service-sculpture').getAttribute('data-yaw'));
    if (reducedMobileAngle === undefined) reducedMobileAngle = angle;
    else assert.equal(angle, reducedMobileAngle, 'Reduced motion must freeze the mobile sculpture while all chapters remain scrollable.');
  }
  await expect(reducedPage.locator('.site-header')).toHaveAttribute('data-hidden', 'false');
  await reducedContext.close();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('\n')}`);
  console.log('PASS: live 3D rotation with stable framing, idle rendering and OS motion continuity; hero/map motion, scroll chapters, clean arrow-free controls, keyboard navigation, shorter page, word spacing, contact links, native mobile service reading with a rotating 3D backdrop, compact touch-friendly menu, supplied portrait, five viewport widths, readable type, reduced motion, and browser/network checks.');
} finally {
  await browser?.close();
  server.kill();
}
