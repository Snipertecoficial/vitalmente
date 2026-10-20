import { chromium } from 'playwright';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { ORIGIN, LOCAL, OWN_HOSTS, PATHS, VIEWPORTS, settle, blockTracking } from './lib.mjs';

const OUT = new URL('../_scratch/visual/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const MASK = fs.readFileSync(new URL('./mask.txt', import.meta.url), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
const LIMIT = 0.005;
const only = process.argv[2]; // opcional: um path, ex. /terapia-aba/

async function shot(ctx, url, problems) {
  const page = await ctx.newPage();
  if (url.startsWith(LOCAL)) {
    page.on('response', r => {
      // admin-ajax.php some sem WordPress de propósito; é pendência da fase de formulários.
      if (r.status() >= 400 && !r.url().includes('admin-ajax.php')) problems.push(`${r.status()} ${r.url()}`);
    });
    page.on('request', r => { if (OWN_HOSTS.includes(new URL(r.url()).host)) problems.push(`produção: ${r.url()}`); });
  }
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await settle(page);
  await page.addStyleTag({ content: FREEZE });
  const buf = await page.screenshot({ fullPage: true, mask: MASK.map(s => page.locator(s)) });
  await page.close();
  return PNG.sync.read(buf);
}

const browser = await chromium.launch();
const rows = [];
let fail = 0;
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  await blockTracking(ctx);
  for (const p of PATHS.filter(x => !only || x === only)) {
    const problems = [];
    const a = await shot(ctx, ORIGIN + p, []);
    const b = await shot(ctx, LOCAL + p, problems);
    const slug = `${p.replace(/\//g, '') || 'home'}-${name}`;
    let ratio = 1;
    if (a.width === b.width && a.height === b.height) {
      const diff = new PNG({ width: a.width, height: a.height });
      ratio = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height);
      fs.writeFileSync(new URL(`${slug}-diff.png`, OUT), PNG.sync.write(diff));
    } else problems.push(`tamanho original ${a.width}x${a.height} vs local ${b.width}x${b.height}`);
    fs.writeFileSync(new URL(`${slug}-original.png`, OUT), PNG.sync.write(a));
    fs.writeFileSync(new URL(`${slug}-local.png`, OUT), PNG.sync.write(b));
    const ok = ratio <= LIMIT && problems.length === 0;
    if (!ok) fail++;
    rows.push(`${ok ? 'OK   ' : 'FALHA'} ${name.padEnd(7)} ${p.padEnd(46)} diff=${(ratio * 100).toFixed(2)}% ${problems.join(' | ')}`);
    console.log(rows.at(-1));
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(new URL('report.txt', OUT), rows.join('\n') + '\n');
process.exit(fail ? 1 : 0);
