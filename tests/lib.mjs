import fs from 'node:fs';

export const ORIGIN = 'https://www.vitallmente.com.br';
export const LOCAL = process.env.LOCAL || 'http://localhost:8080';
export const HOST = 'www.vitallmente.com.br';
export const OWN_HOSTS = [HOST, 'vitallmente.com.br'];
export const PATHS = fs.readFileSync(new URL('../tools/pages.txt', import.meta.url), 'utf8')
  .split(/\s+/).filter(Boolean).map(u => new URL(u).pathname);
export const FORM_PATHS = [
  '/teste-gravidade-depressiva/', '/teste-gravidade-de-desesperanca/', '/teste-vitallmente-gravidade-ansiosa/',
  '/teste-impulsividade/', '/teste-vitallmente-responsabilidade-social/', '/teste-tea/', '/teste-tdah/',
  '/teste-memoria-operacional/', '/teste-raciocinio/', '/teste-atencao/', '/anamnese-1/', '/anamnese-2/',
  '/vineland-3/', '/experiencia-emocionais/', '/vivencias-mocionais/', '/torre-de-londres/',
  '/flexibilidade-cognitiva/', '/avaliacao-comportamento/', '/adi-r/', '/swyc/',
];
export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

// Rola a página inteira para disparar lazy-load e animações de entrada do Elementor.
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
}

// Evita poluir analytics/pixels do cliente com as visitas dos testes (original e local).
export const BLOCK_TRACKING = /googletagmanager\.com|google-analytics\.com|google\.com\/(ccm|pagead)|doubleclick\.net|googleadservices\.com|facebook\.(net|com)\/(tr|signals)|connect\.facebook\.net/;
export async function blockTracking(ctx) { await ctx.route(BLOCK_TRACKING, r => r.abort()); }
