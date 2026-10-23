// Envia cada formulário (sem preencher) e confere a resposta de sucesso e o redirecionamento ao WhatsApp.
// A exibição do popup/mensagem é do próprio Elementor a partir dessa resposta.
// Uso: BASE=http://localhost:8081 MOCK=1 node submit.mjs   (MOCK responde admin-ajax com api/elementor-form.mjs)
//      BASE=https://vitalmente-gilt.vercel.app node submit.mjs
import { chromium } from 'playwright';
import { FORM_PATHS, blockTracking } from './lib.mjs';
import { resposta } from '../api/elementor-form.mjs';

const BASE = process.env.BASE;
const SEM_POPUP = ['/teste-tea/', '/experiencia-emocionais/', '/adi-r/'];
const WHATSAPP = 'phone=5511917738711';
if (!BASE) throw new Error('defina BASE');

const browser = await chromium.launch();
const ctx = await browser.newContext();
await blockTracking(ctx);
// Intercepta admin-ajax: MOCK responde com api/elementor-form.mjs; sem MOCK repassa a resposta real. Guarda o JSON.
let json = null;
await ctx.route('**/wp-admin/admin-ajax.php', async r => {
  const out = process.env.MOCK ? resposta(r.request().postData() || '') : await (await r.fetch()).json().catch(() => null);
  json = out;
  return out ? r.fulfill({ json: out }) : r.fulfill({ status: 400, body: '0' });
});
let destino = '';
// Registra o destino do redirecionamento (a página não sai do teste).
await ctx.route('https://api.whatsapp.com/**', r => { destino = r.request().url(); return r.fulfill({ status: 204 }); }); // 204 cancela a navegação sem página de erro
const page = await ctx.newPage();
let fail = 0;
const expectDestino = async () => { for (let i = 0; i < 30 && !destino; i++) await page.waitForTimeout(200); };
for (const p of FORM_PATHS) {
  destino = ''; json = null;
  await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => jQuery('form.elementor-form').trigger('submit'));
  await expectDestino();
  const d = json?.data?.data || {};
  const confirma = json?.success === true && (SEM_POPUP.includes(p) ? /Teste enviado com sucesso/.test(json.data.message) : d.popup?.id === '1494');
  const ok = confirma && destino.includes(WHATSAPP) && destino.includes('finalizar');
  if (!ok) fail++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${p.padEnd(46)} ${SEM_POPUP.includes(p) ? 'mensagem' : 'popup   '} -> ${decodeURIComponent(destino.split('text=')[1] || 'sem redirecionamento')}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
