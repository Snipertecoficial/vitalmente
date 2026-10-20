import { chromium } from 'playwright';
import fs from 'node:fs';
import { ORIGIN, HOST, OWN_HOSTS, PATHS, VIEWPORTS, settle, blockTracking } from './lib.mjs';

const found = new Set();
const browser = await chromium.launch();
for (const vp of Object.values(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: vp });
  await blockTracking(ctx);
  const page = await ctx.newPage();
  page.on('request', r => {
    const u = new URL(r.url());
    if (OWN_HOSTS.includes(u.host) && /^\/wp-(content|includes)\//.test(u.pathname)) found.add(decodeURIComponent(u.pathname));
  });
  for (const p of PATHS) {
    await page.goto(ORIGIN + p, { waitUntil: 'load', timeout: 90000 });
    await settle(page);
  }
  await ctx.close();
}
await browser.close();
fs.mkdirSync(new URL('../_scratch/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../_scratch/requests.txt', import.meta.url), [...found].sort().join('\n') + '\n');
console.log(`capturados ${found.size} assets`);
