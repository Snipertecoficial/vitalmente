import { chromium } from 'playwright';
import { ORIGIN, LOCAL, FORM_PATHS, settle, blockTracking } from './lib.mjs';

const probe = page => page.evaluate(() => ({
  forms: document.querySelectorAll('form.elementor-form').length,
  steps: document.querySelectorAll('.e-form__step').length,
  indicators: document.querySelectorAll('.e-form__indicators__indicator').length,
  hiddenSteps: document.querySelectorAll('.e-form__step.elementor-hidden').length,
  buttons: document.querySelectorAll('.e-form__buttons button, .e-form__buttons__wrapper button').length,
}));

const browser = await chromium.launch();
const ctx = await browser.newContext();
await blockTracking(ctx);
const page = await ctx.newPage();
let fail = 0;
for (const p of FORM_PATHS) {
  await page.goto(ORIGIN + p, { waitUntil: 'load', timeout: 90000 }); await settle(page);
  const a = await probe(page);
  await page.goto(LOCAL + p, { waitUntil: 'load', timeout: 90000 }); await settle(page);
  const b = await probe(page);
  const ok = a.forms > 0 && JSON.stringify(a) === JSON.stringify(b);
  if (!ok) fail++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${p.padEnd(46)} original=${JSON.stringify(a)} local=${JSON.stringify(b)}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
