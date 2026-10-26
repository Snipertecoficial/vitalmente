// Confere a medição de tempo das tarefas (tools/detalhe-tarefas.js): mostra uma etapa por vez com esperas
// conhecidas, clica com intervalos conhecidos e compara com os tempos registrados no envio.
// Uso: LOCAL=http://localhost:8081 node tempos.mjs
import { chromium } from 'playwright';
import { LOCAL, blockTracking } from './lib.mjs';

const b = await chromium.launch(); const ctx = await b.newContext(); await blockTracking(ctx);
const page = await ctx.newPage(); page.on('dialog', d => d.accept());
const mostrar = i => page.evaluate(i => document.querySelectorAll('form .e-form__step').forEach((s, k) => s.classList.toggle('elementor-hidden', k !== i)), i);
const clicar = sel => page.evaluate(sel => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
const detalhe = () => page.evaluate(() => JSON.parse(document.querySelector('[name="form_fields[r_detalhe]"]').value));
const perto = (v, esperado, tol = 0.4) => Math.abs(v - esperado) <= tol;
let falhas = 0;
const conferir = (ok, msg) => { if (!ok) falhas++; console.log(`${ok ? 'OK   ' : 'FALHA'} ${msg}`); };

// Atenção: parte 1 (etapa 3) por ~2 s, com cliques na linha 1 aos 0,5 s e 1,5 s
await page.goto(LOCAL + '/teste-atencao/', { waitUntil: 'networkidle' });
await mostrar(2); await page.waitForTimeout(500);
await clicar('#grid-pergunta-1 > :nth-child(1)'); await page.waitForTimeout(1000);
await clicar('#grid-pergunta-1 > :nth-child(5)'); await page.waitForTimeout(500);
await mostrar(4); await page.waitForTimeout(1000); await clicar('#grid-teste-1 > :nth-child(2)');
let d = await detalhe();
const e3 = d._tempos.etapas.find(e => e.etapa === 3), e5 = d._tempos.etapas.find(e => e.etapa === 5);
conferir(perto(e3.segundos, 2.0), `Atenção parte 1: ${e3.segundos} s (esperado ~2,0)`);
conferir(perto(e5.segundos, 1.0), `Atenção parte 2 até agora: ${e5.segundos} s (esperado ~1,0)`);
conferir(perto(d['grid-pergunta-1'].tempo_s, 1.0), `Linha 1, 1º ao último clique: ${d['grid-pergunta-1'].tempo_s} s (esperado ~1,0)`);
conferir(d['grid-pergunta-1'].marcadas_certas.length + d['grid-pergunta-1'].marcadas_erradas.length === 2, 'Linha 1: 2 marcações registradas');

// Raciocínio: responde tarefa 2 aos 0,8 s e depois tarefa 1 aos +1,2 s (fora da ordem)
await page.goto(LOCAL + '/teste-raciocinio/', { waitUntil: 'networkidle' });
await mostrar(2); await page.waitForTimeout(800);
await clicar('#tarefa_2 .btn-matriz[data-opcao="1"]'); await page.waitForTimeout(1200);
await clicar('#tarefa_1 .btn-matriz[data-opcao="3"]'); await page.waitForTimeout(100);
d = await detalhe();
conferir(perto(d.tarefa_2.tempo_resposta_s, 0.8), `Raciocínio tarefa 2 (1ª respondida): ${d.tarefa_2.tempo_resposta_s} s (esperado ~0,8)`);
conferir(perto(d.tarefa_1.tempo_resposta_s, 1.2), `Raciocínio tarefa 1 (2ª respondida): ${d.tarefa_1.tempo_resposta_s} s (esperado ~1,2)`);
conferir(d.tarefa_1.escolhida === '3' && d.tarefa_2.escolhida === '1', 'Raciocínio: escolhas registradas');

// Memória: memorizar (etapa 3) por 1,5 s, depois reconhecer (etapa 5)
await page.goto(LOCAL + '/teste-memoria-operacional/', { waitUntil: 'networkidle' });
await mostrar(2); await page.waitForTimeout(300);
await mostrar(3); await page.waitForTimeout(400); // etapa de transição não conta
await clicar('body'); await mostrar(4); await page.waitForTimeout(700);
await clicar('#placas-grid-1 .placa-item[data-id="1"]');
d = await detalhe();
const mem = d._tempos.etapas.find(e => e.memorizar);
conferir(mem && perto(mem.segundos, 0.3), `Memória, memorizando: ${mem?.segundos} s (esperado ~0,3)`);
conferir(!d._tempos.etapas.some(e => e.etapa === 4), 'Etapa de transição fica fora dos tempos');

await b.close();
process.exit(falhas ? 1 : 0);
