// Preenche testes reais localmente, captura o envio e monta o e-mail; falha se sobrar rótulo com código cru.
// Uso (servidor local em :8081): node email.mjs   — prévias em _scratch/email-*.html

import { chromium } from 'playwright';
import fs from 'node:fs';
import { blockTracking, FORM_PATHS } from './lib.mjs';
import { lerCampos, montarEmail } from '../api/elementor-form.mjs';
const src = fs.readFileSync('extrair_perguntas.mjs', 'utf8');
const preencher = eval(src.match(/const preencher = (\(\) => \{[\s\S]*?\n\});/)[1]);
// tarefas de clique: clica em metade dos itens para gerar um resultado real (com o detalhe registrado)
const jogar = () => {
  const f = document.querySelector('form.elementor-form');
  f.querySelectorAll('.e-form__step, .elementor-hidden').forEach(e => e.classList.remove('elementor-hidden'));
  [...f.querySelectorAll('img, [class*="item"], [class*="opcao"], [class*="option"], [class*="card"], button:not([type=submit])')]
    .filter(e => !e.closest('.e-form__buttons') && !e.closest('.elementor-field-type-submit'))
    .forEach((e, i) => { if (i % 2 === 0) e.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};
const TAREFAS = ['/teste-memoria-operacional/', '/teste-raciocinio/', '/teste-atencao/'];
const b = await chromium.launch(); const ctx = await b.newContext(); await blockTracking(ctx);
let corpo = null;
await ctx.route('**/wp-admin/admin-ajax.php', async r => { corpo = await lerCampos(r.request().postDataBuffer(), r.request().headers()['content-type']); return r.fulfill({ json: { success: true, data: { message: '', data: {} } } }); });
await ctx.route('https://api.whatsapp.com/**', r => r.fulfill({ status: 204 }));
const page = await ctx.newPage(); let falhas = 0;
fs.mkdirSync('../_scratch/envios', { recursive: true });
for (const p of FORM_PATHS) {
  corpo = null;
  await page.goto('http://localhost:8081' + p, { waitUntil: 'networkidle' });
  await page.evaluate(TAREFAS.includes(p) ? jogar : preencher);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const f = document.querySelector('form.elementor-form'); f.querySelector('[name="form_fields[name]"]').value = 'Paciente Exemplo'; jQuery(f).trigger('submit'); });
  for (let i = 0; i < 50 && !corpo; i++) await page.waitForTimeout(100);
  fs.writeFileSync(`../_scratch/envios/${p.replace(/\//g, '')}.json`, JSON.stringify(corpo, null, 1));
  const e = montarEmail(corpo);
  const slug = p.replace(/\//g, '');
  fs.writeFileSync(`../_scratch/email-${slug}.html`, e.html);
  // códigos crus de resposta que não deveriam aparecer como rótulo
  const crus = [...e.html.matchAll(/<td[^>]*color:#7A7A7A[^>]*>([^<]+)<\/td>/g)].map(m => m[1]).filter(t => /^(Bdi|A|B|Q|C|D|S|M|Ee|Ve|Bhs|Bai|Srs|Esavi)\s?\d+/i.test(t) && t.length < 12);
  if (crus.length) falhas++;
  console.log(`${crus.length ? 'FALHA' : 'OK   '} ${p.padEnd(30)} assunto="${e.subject}" linhas=${(e.html.match(/<tr>/g) || []).length} rotulos_crus=${crus.slice(0, 5).join(',') || 0}`);
}
await b.close(); process.exit(falhas ? 1 : 0);
