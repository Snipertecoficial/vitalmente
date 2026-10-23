// Extrai, de cada teste renderizado, o texto da pergunta e das alternativas de cada campo de resposta
// e grava api/perguntas.json (usado no e-mail). Depois preenche cada teste e mede quantas respostas
// do resultado enviado ficaram com texto.
// Uso: LOCAL=http://localhost:8081 node extrair_perguntas.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { LOCAL, FORM_PATHS, blockTracking } from './lib.mjs';

const extrair = () => {
  const f = document.querySelector('form.elementor-form');
  const limpa = t => t.replace(/\s+/g, ' ').replace(/Este campo é obrigatório\.?/g, '').trim();
  const meta = n => !n || n.startsWith('form_fields[') || n.startsWith('${') || n === 'g-recaptcha-response';
  const campos = [...f.querySelectorAll('input,select,textarea')].filter(e => !meta(e.name) && e.type !== 'hidden');
  const grupos = {};
  campos.forEach(e => (grupos[e.name] ||= []).push(e));
  const outrosNomes = el => new Set([...el.querySelectorAll('input,select,textarea')].map(e => e.name).filter(n => !meta(n)));
  const textoOpcao = e => {
    const l = e.closest('label') || (e.id && f.querySelector(`label[for="${CSS.escape(e.id)}"]`));
    const t = limpa(l ? l.innerText : (e.nextSibling?.textContent || ''));
    if (t && t !== e.value) return t;
    // escalas em tabela: o significado está no rótulo da célula (data-label) ou no cabeçalho da coluna
    const cel = e.closest('td,th');
    const dl = limpa(e.closest('[data-label]')?.dataset.label || '').replace(/:$/, '');
    if (dl && cel) return dl;
    const tab = e.closest('table');
    if (cel && tab) { const cab = (tab.tHead || tab).rows[0]?.cells[cel.cellIndex]; if (cab && limpa(cab.innerText)) return limpa(cab.innerText); }
    // grades em div: a alternativa é a descrição da linha (ex.: ADI-R)
    return limpa(e.closest('[class*="row"]')?.querySelector('[class*="desc"]')?.innerText || '') || t || e.value;
  };
  const tituloCard = card => {
    for (const sel of ['h1,h2,h3,h4,h5', '[class*="title"]', '[class*="q-text"]', 'label']) {
      const t = [...card.querySelectorAll(sel)].find(x => !x.querySelector('input,select,textarea') && limpa(x.innerText));
      if (!t) continue;
      const num = card.querySelector('[class*="q-num"]'); // ex.: Vineland "1." fica separado do texto
      return limpa(`${num && !t.contains(num) ? num.innerText : ''} ${t.innerText}`);
    }
    return '';
  };
  const out = {};
  for (const [nome, els] of Object.entries(grupos)) {
    // menor ancestral comum do grupo; sobe enquanto o pai só contém este grupo
    let a = els[0].parentElement;
    while (!els.every(e => a.contains(e))) a = a.parentElement;
    // testes em "cartões": <div data-id="D1"><h4>título</h4>… — o título do cartão é a pergunta
    const card = els[0].closest(`[data-id="${CSS.escape(nome)}"],[data-campo-id="${CSS.escape(nome)}"]`);
    let pergunta = card ? tituloCard(card) : '';
    // grade com colunas (ex.: ADI-R q11_a / q11_h): título do cartão q11 + nome da coluna
    const base = !card && nome.match(/^(.+)_[a-z]$/) && els[0].closest(`[data-id="${CSS.escape(nome.replace(/_[a-z]$/, ''))}"]`);
    if (base) pergunta = `${tituloCard(base)} — ${limpa((els[0].closest('[data-label]')?.dataset.label || '').replace(/:$/, ''))}`.replace(/ — $/, '');
    for (let i = 0; i < 6 && a && a !== f && !pergunta; i++) {
      const c = a.cloneNode(true);
      // remove alternativas (labels que envolvem o campo) e os campos; mantém labels soltos (pergunta)
      c.querySelectorAll('label').forEach(l => l.querySelector('input,select,textarea') && l.remove());
      c.querySelectorAll('input,select,textarea,script,style,.erro-msg').forEach(x => x.remove());
      pergunta = limpa(c.innerText || c.textContent || '');
      if (pergunta.length > 2) break;
      const pai = a.parentElement;
      const nomes = outrosNomes(pai);
      if (nomes.size > 1) break;
      a = pai;
    }
    const opcoes = {};
    for (const e of els) {
      if (e.tagName === 'SELECT') [...e.options].filter(o => o.value).forEach(o => (opcoes[o.value] = limpa(o.text)));
      else if (e.type === 'radio' || e.type === 'checkbox') opcoes[e.value] = textoOpcao(e);
    }
    out[nome] = Object.keys(opcoes).length ? { p: pergunta, o: opcoes } : { p: pergunta };
    // seção da página onde a pergunta está (ex.: Anamnese "Identificação"), para agrupar no e-mail
    const secTit = els[0].closest('[class*="section"]:not([data-id])')?.querySelector('[class*="section-title"]');
    if (secTit && limpa(secTit.innerText)) out[nome].g = limpa(secTit.innerText);
  }
  // cartões cujo código vira chave do resultado sem ser nome de campo (ex.: ADI-R q2 = q2_yrs + q2_mths)
  f.querySelectorAll('[data-id],[data-campo-id]').forEach(card => {
    const id = card.dataset.id || card.dataset.campoId;
    // ADI-R: cartões "nm" somam anos × 12 + meses no resultado
    if (!out[id]?.p && tituloCard(card)) out[id] = { ...(out[id] || {}), p: tituloCard(card) + (card.dataset.type === 'nm' ? ' (idade em meses)' : '') };
  });
  // campos de comentário "X_texto" herdam a pergunta de X
  for (const [nome, m] of Object.entries(out)) {
    const base = nome.replace(/_texto$/, '');
    if (base !== nome && out[base]?.p) m.p = `${out[base].p} (observações)`;
  }
  // títulos das seções (data-sec="Secao_D" → "D. Comportamentos Repetitivos…"); marcados com s: 1
  for (const sec of new Set([...f.querySelectorAll('[data-sec]')].map(e => e.dataset.sec))) {
    const el = f.querySelector(`[data-sec="${CSS.escape(sec)}"]`);
    const caixa = el.closest('[class*="section"]:not([data-id])') || el.parentElement;
    const t = caixa?.querySelector('[class*="section-title"],h2,h3');
    if (t && limpa(t.innerText) && !out[sec]) out[sec] = { p: limpa(t.innerText), s: 1 };
  }
  // perguntas repetidas no mesmo teste (ex.: idade_anos / idade_meses; q1_a…q1_d): acrescenta o sufixo do código
  const porTexto = {};
  for (const [nome, m] of Object.entries(out)) if (!m.s) (porTexto[m.p] ||= []).push(nome);
  for (const nomes of Object.values(porTexto)) if (nomes.length > 1) nomes.forEach(n => { const suf = n.split('_').pop(); if (suf !== n) out[n].p += ` (${suf})`; });
  return out;
};

// Preenche tudo (1ª alternativa de cada grupo) para o teste gerar o resultado real.
const preencher = () => {
  const f = document.querySelector('form.elementor-form');
  const vistos = new Set();
  f.querySelectorAll('input,select,textarea').forEach(e => {
    if (!e.name || e.name.startsWith('form_fields[') || e.type === 'hidden') return;
    if ((e.type === 'radio' || e.type === 'checkbox') && !vistos.has(e.name)) {
      // alternativa variada (determinística por nome) para o resultado parecer um envio real
      vistos.add(e.name);
      const grupo = [...f.querySelectorAll(`[name="${CSS.escape(e.name)}"]`)];
      const h = [...e.name].reduce((a, c) => a + c.charCodeAt(0), 0);
      grupo[h % grupo.length].click();
    }
    else if (e.tagName === 'SELECT' && e.options.length > 1) e.value = e.options[1].value;
    else if (e.type === 'number') e.value = '1';
    else if (['text', 'textarea', 'TEXTAREA'].includes(e.type || e.tagName)) e.value = 'Resposta de exemplo escrita pelo paciente';
    ['input', 'change'].forEach(t => e.dispatchEvent(new Event(t, { bubbles: true })));
  });
  return [...f.querySelectorAll('input[name^="form_fields["],textarea[name^="form_fields["]')].map(e => e.value).filter(v => v.startsWith('{'));
};

const chaves = (o, acc = []) => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? chaves(v, acc) : acc.push([k, v]); return acc; };

const browser = await chromium.launch();
const ctx = await browser.newContext();
await blockTracking(ctx);
const page = await ctx.newPage();
const todas = {};
for (const p of FORM_PATHS) {
  await page.goto(LOCAL + p, { waitUntil: 'networkidle' });
  const mapa = await page.evaluate(extrair);
  if (Object.keys(mapa).length) todas[p] = mapa;
  const resultados = await page.evaluate(preencher);
  const folhas = resultados.flatMap(r => { try { return chaves(JSON.parse(r)); } catch { return []; } });
  const respostas = folhas.filter(([k]) => k in mapa);
  respostas.forEach(([k]) => (mapa[k].r = 1)); // aparece no resultado: entra na lista de não respondidas se faltar
  const comOpcao = respostas.filter(([k, v]) => !mapa[k].o || String(v) in mapa[k].o);
  const numericas = respostas.filter(([k, v]) => mapa[k].o && /^\d+[a-z]?$/.test(mapa[k].o[String(v)] || ''));
  const semPergunta = Object.values(mapa).filter(m => !m.p).length;
  console.log(`${p.padEnd(44)} perguntas=${String(Object.keys(mapa).length).padStart(3)} sem_texto=${semPergunta} | resultado: ${respostas.length}/${folhas.length} chaves com pergunta, ${comOpcao.length}/${respostas.length} valores com alternativa, ${numericas.length} alternativas só numéricas`);
}
await browser.close();
fs.writeFileSync(new URL('../api/perguntas.json', import.meta.url), JSON.stringify(todas));
console.log('gravado api/perguntas.json', Object.keys(todas).length, 'testes');
