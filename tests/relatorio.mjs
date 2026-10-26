// Gera o e-mail dos 20 testes a partir de envios reais (tests/fixtures/envios) e confere que o médico
// lê tudo: toda resposta com pergunta + alternativa, nenhum nome técnico/JSON visível.
// Uso: node tests/relatorio.mjs   — prévias em _scratch/relatorio/*.html
import fs from 'node:fs';
import { montarEmail } from '../api/_relatorio.mjs';
import PERGUNTAS from '../api/perguntas.json' with { type: 'json' };

const dir = new URL('./fixtures/envios/', import.meta.url);
const saida = new URL('../_scratch/relatorio/', import.meta.url);
fs.mkdirSync(saida, { recursive: true });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const visivel = html => [...html.matchAll(/<(td|th|h1|h2|h3|div|span)[^>]*>([^<]+)</g)].map(m => m[2].trim()).filter(Boolean);
const TECNICO = /^[a-z]+(_[a-z0-9]+)+$|^[A-Z][a-z]+_[A-Z]|grid-|\[object|^\{|":/;

let falhas = 0;
for (const arq of fs.readdirSync(dir).sort()) {
  const campos = JSON.parse(fs.readFileSync(new URL(arq, dir)));
  const path = `/${arq.replace(/\.json$/, '')}/`;
  const mapa = PERGUNTAS[path] || {};
  const e = montarEmail(campos, path);
  fs.writeFileSync(new URL(arq.replace('.json', '.html'), saida), e.html);
  const erros = [];
  // 1) toda resposta respondida aparece com pergunta e alternativa
  const folhas = {};
  const walk = o => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' && !Array.isArray(v) ? walk(v) : (folhas[k] ??= v); };
  Object.entries(campos).filter(([k, v]) => k.startsWith('form_fields[') && v.startsWith('{')).forEach(([, v]) => walk(JSON.parse(v)));
  let conferidas = 0;
  for (const [k, v] of Object.entries(folhas)) {
    if (!mapa[k] || mapa[k].s || v === '' || v === null) continue;
    conferidas++;
    if (!e.html.includes(esc(mapa[k].p))) erros.push(`pergunta ausente: ${k}`);
    const alt = mapa[k].o?.[String(v)];
    if (alt && !e.html.includes(esc(alt))) erros.push(`alternativa ausente: ${k}=${v}`);
  }
  // 1b) detalhe das tarefas bate com a contagem feita pelo próprio teste
  const { _tempos: tempos, ...det } = JSON.parse(campos['form_fields[r_detalhe]'] || '{}');
  // tempos registrados aparecem no e-mail (tempo total na faixa de resumo)
  if (tempos?.total_s > 0 && !e.html.includes('Tempo nas tarefas')) erros.push('tempo total ausente');
  const contagens = {};
  Object.entries(campos).filter(([k, v]) => k.startsWith('form_fields[r_') && k !== 'form_fields[r_detalhe]' && v.startsWith('{')).forEach(([, v]) => Object.assign(contagens, JSON.parse(v)));
  for (const [k, d] of Object.entries(det)) {
    const c = contagens[k];
    if (!c) { erros.push(`detalhe sem contagem: ${k}`); continue; }
    if (d.marcadas_certas && (d.marcadas_certas.length !== c.acertos || d.marcadas_erradas.length !== c.erros || d.alvos_nao_marcados.length !== c.omissoes))
      erros.push(`detalhe diverge da contagem em ${k}`);
    if ('escolhida' in d && (d.escolhida === d.correta) !== (c.acertos === 1)) erros.push(`escolha diverge em ${k}`);
    for (const x of [...(d.marcadas_certas || []), ...(d.placas_marcadas || [])]) if (!e.html.includes(String(x))) erros.push(`marcação ausente ${k}:${x}`);
  }
  // 1c) limite do Gmail (~102 KB corta a mensagem) e figuras das tarefas existem no site
  const kb = Buffer.byteLength(e.html) / 1024;
  if (kb > 95) erros.push(`e-mail com ${kb.toFixed(0)} KB (Gmail corta acima de ~102 KB)`);
  for (const [, src] of e.html.matchAll(/<img[^>]+src="https?:\/\/[^/"]+(\/[^"]+)"/g))
    if (!fs.existsSync(new URL(`../site${decodeURI(src)}`, import.meta.url))) erros.push(`figura inexistente: ${src}`);
  // 1d) marcações visuais batem com a contagem do teste (verde = acertos, vermelho = erros, tracejado = omissões)
  if (Object.keys(det).length && !/escolhida/.test(JSON.stringify(det))) {
    const soma = c => Object.entries(contagens).filter(([k]) => k in det).reduce((a, [, v]) => a + (v[c] || 0), 0);
    const conta = cls => (e.html.match(new RegExp(`<img class="f ${cls}"`, "g")) || []).length;
    const temAlvos = !/tr-grid|placas/.test(Object.keys(det).join()) ;
    if (conta('fc') !== soma('acertos') || conta('fe') !== soma('erros') || (temAlvos && conta('fo') !== soma('omissoes')))
      erros.push(`marcações visuais ${conta('fc')}/${conta('fe')}/${conta('fo')} ≠ contagem ${soma('acertos')}/${soma('erros')}/${soma('omissoes')}`);
  }
  if (/escolhida/.test(JSON.stringify(det)) && (e.html.match(/Escolhida/g) || []).length !== Object.keys(det).length)
    erros.push('raciocínio: nem toda tarefa mostra a opção escolhida');
  // 2) nada técnico visível
  const tecnicos = visivel(e.html).filter(t => TECNICO.test(t));
  if (tecnicos.length) erros.push(`termos técnicos: ${[...new Set(tecnicos)].slice(0, 5).join(' | ')}`);
  if (/\{"|\[object/.test(e.text)) erros.push('texto simples com JSON');
  if (erros.length) falhas++;
  const resumo = (e.html.match(/Itens respondidos<\/div>\s*<div[^>]*>([^<]+)/) || [])[1] || '-';
  console.log(`${erros.length ? 'FALHA' : 'OK   '} ${path.padEnd(44)} ${String(Math.round(kb)).padStart(3)} KB respostas=${String(conferidas).padStart(3)} respondidos=${resumo.padEnd(9)} ${erros.slice(0, 3).join('; ')}`);
}
process.exit(falhas ? 1 : 0);
