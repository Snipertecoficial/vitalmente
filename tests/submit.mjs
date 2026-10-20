// Envia cada formulário (sem preencher) e confere a confirmação de sucesso.
// Uso: BASE=http://localhost:8081 MOCK=1 node submit.mjs   (MOCK responde admin-ajax com api/elementor-form.mjs)
//      BASE=https://vitalmente-gilt.vercel.app node submit.mjs
import { chromium } from 'playwright';
import { FORM_PATHS, blockTracking } from './lib.mjs';
import { resposta } from '../api/elementor-form.mjs';

const BASE = process.env.BASE;
const SEM_POPUP = ['/teste-tea/', '/experiencia-emocionais/', '/adi-r/'];
if (!BASE) throw new Error('defina BASE');

const browser = await chromium.launch();
const ctx = await browser.newContext();
await blockTracking(ctx);
if (process.env.MOCK) {
  await ctx.route('**/wp-admin/admin-ajax.php', r => {
    const out = resposta(r.request().postData() || '');
    return out ? r.fulfill({ json: out }) : r.fulfill({ status: 400, body: '0' });
  });
}
const page = await ctx.newPage();
let fail = 0;
for (const p of FORM_PATHS) {
  let ajax = '-';
  const onResp = r => { if (r.url().includes('admin-ajax.php') && r.request().method() === 'POST') ajax = r.status(); };
  page.on('response', onResp);
  await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => jQuery('form.elementor-form').trigger('submit'));
  const alvo = SEM_POPUP.includes(p)
    ? page.locator('form.elementor-form .elementor-message-success', { hasText: 'Teste enviado com sucesso' })
    : page.locator('#elementor-popup-modal-1494', { hasText: 'Teste enviado com sucesso' });
  const ok = await alvo.waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false);
  page.off('response', onResp);
  if (!ok) fail++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${p.padEnd(46)} admin-ajax=${ajax} ${SEM_POPUP.includes(p) ? 'mensagem' : 'popup'}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
