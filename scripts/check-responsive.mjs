/**
 * Browser-level responsive smoke test for desktop, tablet and mobile.
 * Run against Vite preview after a build with a dummy GEMINI_API_KEY.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = [1440, 1024, 768, 390, 360, 320];
await mkdir('responsive-screenshots', { recursive: true });

async function awaitServer() {
  for (let i = 0; i < 50; i++) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  throw new Error('Preview server never became reachable at ' + url);
}
await awaitServer();
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: width < 500 ? 780 : 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.joe-homepage').waitFor({timeout: 20000});
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: 'responsive-screenshots/home-' + width + '.png' });
    }
    await page.locator('.joe-home-primary').click();
    await page.locator('.tutor-workspace-shell').waitFor({timeout: 12000});
    await page.waitForTimeout(400);
    const layout = await page.evaluate(() => {
      const rect = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height };
      };
      return {
        viewport:window.innerWidth,
        bodyWidth:document.documentElement.scrollWidth,
        screen: rect('.tutor-workspace-shell'),
        doc:rect('.main-app-area'),
        companion:rect('.tutor-companion-column'),
        nav:rect('.mobile-tutor-nav'),
        deck:rect('.control-deck-footer'),
        navVisible:getComputedStyle(document.querySelector('.mobile-tutor-nav')).display !== 'none',
      };
    });
    if (!layout.doc || !layout.companion || !layout.deck || !layout.nav) throw new Error('Missing layout elements at ' + width);
    if (layout.bodyWidth > width + 4) throw new Error('Page overflows horizontally at '+width+': '+layout.bodyWidth);
    if (width > 1020) {
      if (layout.navVisible) throw new Error('Mobile nav shown on desktop ' + width);
      if (layout.doc.right > layout.companion.left + 4) throw new Error('Companion overlays notes on desktop: ' + JSON.stringify(layout));
    } else {
      if (!layout.navVisible) throw new Error('Mobile nav is hidden at ' + width);
      if (layout.companion.bottom > layout.doc.top + 4) throw new Error('Mobile companion overlaps notes: ' + JSON.stringify(layout));
      if (layout.deck.bottom > layout.nav.top + 4) throw new Error('Voice dock overlaps mobile navigation: ' + JSON.stringify(layout));
      await page.getByRole('button', { name: 'More', exact:true }).click();
      await page.getByRole('menu', { name: 'More workspace tools' }).waitFor({ timeout:4000 });
      await page.getByRole('menuitem', { name:'Transcript' }).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name:'Notes', exact:true }).click();
    }
    await page.screenshot({ path: 'responsive-screenshots/workspace-' + width + '.png' });
    if (errors.length) throw new Error('JavaScript errors on '+width+': '+errors.join('; '));
    console.log('PASS',width, 'doc',Math.round(layout.doc.width),'companion',Math.round(layout.companion.width),'mobileNav',layout.navVisible);
    await page.close();
  }
} catch (e) {
  failed = true; console.error(e);
} finally {
  await browser.close();
}
if (failed) process.exit(1);
