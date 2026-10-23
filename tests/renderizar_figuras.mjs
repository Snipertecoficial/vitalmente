// Gera as figuras das tarefas visuais para o e-mail (o Gmail não mostra SVG nem figuras montadas por CSS)
// e o mapa de cada tarefa: instrução, figura-alvo, itens na ordem da tela e quais são respostas certas.
// Saída: tools/relatorio-figuras/*.png (copiadas para o site por mirror.py) e api/tarefas.json.
// Uso: LOCAL=http://localhost:8081 node renderizar_figuras.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOCAL, blockTracking } from './lib.mjs';

const OUT = new URL('../tools/relatorio-figuras/', import.meta.url);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const URLFIG = n => `/relatorio-figuras/${n}.png`;
const fonte = p => fs.readFileSync(new URL(`../site${p}index.html`, import.meta.url), 'utf8');

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
await blockTracking(ctx);
const page = await ctx.newPage();
const abrir = async p => {
  await page.goto(LOCAL + p, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.e-form__step, .elementor-hidden').forEach(e => e.classList.remove('elementor-hidden'));
    // nada fixo na tela (aviso de cookies, cabeçalho, cronômetro) pode cobrir a figura capturada
    document.querySelectorAll('body *').forEach(e => { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') e.style.setProperty('display', 'none', 'important'); });
  });
};
const foto = async (loc, nome) => { await loc.scrollIntoViewIfNeeded(); await loc.screenshot({ path: fileURLToPath(new URL(`${nome}.png`, OUT)), animations: 'disabled' }); return URLFIG(nome); };
const tarefas = {};

// ---- Raciocínio: a matriz (pergunta) e cada opção, por tarefa ----
await abrir('/teste-raciocinio/');
const rac = {};
for (const id of await page.$$eval('.tarefa-container[id^="tarefa_"]', els => els.map(e => e.id))) {
  const c = page.locator(`#${id}`);
  const opcoes = {};
  for (const op of await c.locator('.btn-matriz').evaluateAll(els => els.map(e => e.dataset.opcao))) {
    opcoes[op] = await foto(c.locator(`.btn-matriz[data-opcao="${op}"]`), `rac-${id}-op${op}`);
  }
  rac[id] = {
    titulo: (await c.locator('.tarefa-titulo').innerText()).trim(),
    instrucao: 'Clique na opção que encaixa no campo',
    matriz: await foto(c.locator('.grade-matriz'), `rac-${id}-matriz`),
    opcoes,
    correta: await c.getAttribute('data-correta'),
  };
}
tarefas['/teste-raciocinio/'] = { tipo: 'escolha', itens: rac };

// ---- Atenção: cada figura distinta das 3 partes, os alvos e a ordem de cada linha ----
await abrir('/teste-atencao/');
const src = fonte('/teste-atencao/');
const alvosTr = [...src.match(/alvosCorretos\s*=\s*\[([^\]]*)\]/)[1].matchAll(/t:\s*'(\w)',\s*r:\s*(\d+)/g)].map(m => `${m[1]}${m[2]}`);
const figuras = {};
const figura = async (loc, chave) => (figuras[chave] ??= await foto(loc, `aol-${chave.replace(/[^\w]/g, '_')}`));
const atencao = {};
const partes = [
  ['grid-pergunta-', 'r_star_test', 'Parte 1 · Estrelas', 'Clique em todas as figuras iguais à imagem de referência', '.star-item', e => e.dataset.nome],
  ['grid-teste-', 'r_oct_test', 'Parte 2 · Octógonos', 'Clique em todas as figuras iguais ao alvo de cada questão', '.oct-wrapper', e => e.dataset.dna],
  ['tr-grid-', 'r_tr_test', 'Parte 3 · Triângulos', 'Clique nas figuras que correspondem a qualquer um dos 3 modelos', '.tr-item', e => `${e.dataset.t}${e.dataset.r}`],
];
for (const [prefixo, campo, parte, instrucao, sel] of partes) {
  const ids = await page.$$eval(`[id^="${prefixo}"]`, els => els.map(e => e.id));
  for (const [n, id] of ids.entries()) {
    const g = page.locator(`#${id}`);
    const chaves = await g.locator(`:scope > ${sel}`).evaluateAll((els, s) => els.map(e => e.dataset.nome || e.dataset.dna || `${e.dataset.t}${e.dataset.r}`), sel);
    const itens = [];
    for (const [i, k] of chaves.entries()) itens.push(await figura(g.locator(`:scope > ${sel}`).nth(i), `${sel}-${k}`));
    const correta = await g.getAttribute('data-correta');
    const ehAlvo = k => (correta ? k === correta : alvosTr.includes(k));
    const alvo = correta
      ? await figura(g.locator(`:scope > ${sel}`).nth(chaves.indexOf(correta) >= 0 ? chaves.indexOf(correta) : 0), `${sel}-${correta}`)
      : '/wp-content/uploads/2026/01/tr_alvo.png'; // os 3 modelos, imagem da própria página
    atencao[id] = { campo, parte, titulo: `${prefixo === 'tr-grid-' ? 'Bloco' : 'Questão'} ${n + 1}`, instrucao, alvo, itens, alvos: chaves.map((k, i) => (ehAlvo(k) ? i + 1 : 0)).filter(Boolean) };
    if (correta && !chaves.includes(correta)) atencao[id].alvoForaDaLinha = true;
  }
}
tarefas['/teste-atencao/'] = { tipo: 'grade', itens: atencao };

// ---- Memória: placas na ordem da tela, gabarito do próprio teste e a prancha memorizada ----
await abrir('/teste-memoria-operacional/');
const gab = JSON.parse(fonte('/teste-memoria-operacional/').match(/gabaritoGlobal\s*=\s*(\[[^\]]*\])/)[1]);
const mem = {};
for (const id of await page.$$eval('[id^="placas-grid-"]', els => els.map(e => e.id))) {
  const ids = await page.$$eval(`#${id} .placa-item`, els => els.map(e => Number(e.dataset.id)));
  mem[id] = {
    titulo: await page.locator(`#${id}`).evaluate(e => e.parentElement.querySelector('.question-label-row')?.innerText.trim() || ''),
    instrucao: 'Selecione todas as placas que você memorizou',
    referencia: '/wp-content/uploads/2026/03/placas_base.png',
    itens: ids.map(i => `/wp-content/uploads/2026/03/placas_${i}.png`),
    numeros: ids.map(i => i + 1),
    alvos: ids.map((i, pos) => (gab.includes(i + 1) ? pos + 1 : 0)).filter(Boolean),
  };
}
tarefas['/teste-memoria-operacional/'] = { tipo: 'grade', itens: mem };

await b.close();
fs.writeFileSync(new URL('../api/tarefas.json', import.meta.url), JSON.stringify(tarefas));
console.log('figuras:', fs.readdirSync(OUT).length, '| raciocínio:', Object.keys(rac).length, 'tarefas | atenção:', Object.keys(atencao).length, 'linhas | memória:', Object.keys(mem).length, 'blocos');
