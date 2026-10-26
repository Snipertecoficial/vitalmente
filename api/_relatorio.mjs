// Monta o e-mail clínico de cada teste enviado: dados do paciente, resumo de pontuação,
// cada pergunta com a alternativa escolhida (texto + valor) e as perguntas sem resposta.
import PERGUNTAS from './perguntas.json' with { type: 'json' };
import TAREFAS from './tarefas.json' with { type: 'json' };

// Paleta da clínica (--e-global-color-primary do site) e apoio.
const C = { ameixa: '#5E4352', tinta: '#2B2A2E', grafite: '#6B6870', nevoa: '#F5F2F4', regua: '#E4DDE2', selo: '#EFE8EC', alerta: '#A4442B' };
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = 'Arial,Helvetica,sans-serif';

export const NOMES_TESTE = {
  '/teste-gravidade-depressiva/': 'Inventário de Depressão (BDI-II)',
  '/teste-gravidade-de-desesperanca/': 'Escala de Desesperança (BHS)',
  '/teste-vitallmente-gravidade-ansiosa/': 'Inventário de Ansiedade (BAI)',
  '/teste-impulsividade/': 'Impulsividade (ESAVI)',
  '/teste-vitallmente-responsabilidade-social/': 'Responsividade Social (SRS-2)',
  '/teste-tea/': 'Responsividade Social Infantil (SRS-2)',
  '/teste-tdah/': 'TDAH em adultos (ASRS)',
  '/teste-memoria-operacional/': 'Memória Operacional (MVPT)',
  '/teste-raciocinio/': 'Raciocínio Lógico (TRL)',
  '/teste-atencao/': 'Atenção (AOL)',
  '/anamnese-1/': 'Anamnese (adulto)',
  '/anamnese-2/': 'Anamnese (infantil)',
  '/vineland-3/': 'Comportamento Adaptativo (Vineland-3)',
  '/experiencia-emocionais/': 'Experiências Emocionais (BOLIE)',
  '/vivencias-mocionais/': 'Vivências Emocionais (BOLIE QOE)',
  '/torre-de-londres/': 'Torre de Londres',
  '/flexibilidade-cognitiva/': 'Flexibilidade Cognitiva (CPT-Flex)',
  '/avaliacao-comportamento/': 'Observação do Comportamento (ADOS-2)',
  '/adi-r/': 'Entrevista Diagnóstica de Autismo (ADI-R)',
  '/swyc/': 'Desenvolvimento Infantil (SWYC)',
};

// Nomes técnicos do resultado → rótulos para o profissional.
const TERMOS = {
  soma_bruta: 'Pontuação total', soma_a: 'Pontuação parte A', soma_b: 'Pontuação parte B',
  total_respondidas: 'Itens respondidos', teste_concluido: 'Teste concluído', total_obrigatorias: 'Itens obrigatórios',
  respondidas: 'Itens respondidos', concluido: 'Concluído', status: 'Situação', respostas: 'Respostas',
  parte_a: 'Parte A', parte_b: 'Parte B', resultado_final: 'Resultado final',
  acertos: 'Acertos', erros: 'Erros', omissoes: 'Omissões',
  total_acertos: 'Total de acertos', total_erros: 'Total de erros', total_omissoes: 'Total de omissões',
  tarefas: 'Tarefas', tarefa: 'Tarefa', tentativas: 'Tentativas', tempo_finalizar_ms: 'Tempo para concluir',
  tempo_total_finalizacao_segundos: 'Tempo total', Torre_de_Londres: 'Torre de Londres',
  Flexibilidade_Cognitiva: 'Flexibilidade cognitiva', tarefa_real: 'Tarefa', treinos_tentativas: 'Tentativas no treino',
  acuracia_treino_final: 'Acurácia no treino', acuracia_geral: 'Acurácia geral', acuracia: 'Acurácia',
  tempo_reacao_medio_ms: 'Tempo médio de reação', tempo_reacao_ms: 'Tempo de reação', total_estimulos: 'Estímulos',
  erros_omissao: 'Erros por omissão', erros_comissao: 'Erros por comissão',
  resultados_regra_normal: 'Regra normal (azul)', resultados_regra_invertida: 'Regra invertida (laranja)',
  sequencia_detalhada: 'Sequência detalhada', item: 'Item', tipo: 'Estímulo', cor: 'Cor', regra: 'Regra',
  deveria_apertar: 'Deveria responder', apertou: 'Respondeu', correto: 'Correto',
  Marcos_Desenvolvimento: 'Marcos do desenvolvimento', Perguntas_Familia: 'Perguntas sobre a família',
  Preocupacoes_Pais: 'Preocupações dos pais', Sintomas_Pediatricos: 'Sintomas pediátricos',
  // detalhe registrado nas tarefas de clique (tools/detalhe-tarefas.js)
  placas_marcadas: 'Placas marcadas', marcadas: 'Posições marcadas', escolhida: 'Opção escolhida', correta: 'Opção correta',
  marcadas_certas: 'Marcadas certas (posição)', marcadas_erradas: 'Marcadas erradas (posição)', alvos_nao_marcados: 'Alvos não marcados (posição)',
};
// Testes com mais de um campo de resultado (Atenção tem três partes).
const PARTES = { r_star_test: 'Parte 1 · Estrelas', r_oct_test: 'Parte 2 · Octógonos', r_tr_test: 'Parte 3 · Triângulos' };
// Ordem do resumo: pontuação primeiro.
const DESTAQUE = ['soma_bruta', 'soma_a', 'soma_b', 'total_acertos', 'total_erros', 'total_omissoes',
  'acuracia_geral', 'tempo_reacao_medio_ms', 'tempo_total_finalizacao_segundos'];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ehObj = v => v && typeof v === 'object' && !Array.isArray(v);
const ehFolha = v => !v || typeof v !== 'object' || (Array.isArray(v) && v.every(x => !x || typeof x !== 'object'));
const json = v => { try { const o = JSON.parse(v); return ehObj(o) ? o : null; } catch { return null; } };

function termo(k, mapa = {}) {
  if (mapa[k]?.p) return mapa[k].p; // pergunta ou título de seção extraído do próprio teste
  if (TERMOS[k]) return TERMOS[k];
  let m;
  if ((m = k.match(/^tarefa_(\d+)$/))) return `Tarefa ${m[1]}`;
  if ((m = k.match(/^(?:placas|tr)-grid-(\d+)$/))) return `Bloco ${m[1]}`;
  if ((m = k.match(/grid\D*(\d+)$/))) return `Linha ${m[1]}`;
  return (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
}

function formata(k, v) {
  if (v === true) return 'Sim';
  if (v === false) return 'Não';
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.map(x => formata(k, x)).join(', ') : '—';
  if (typeof v === 'number' && /acuracia/.test(k)) return `${Math.round(v * 100)}%`;
  if (typeof v === 'number' && /_ms$/.test(k)) return `${v.toLocaleString('pt-BR')} ms`;
  if (typeof v === 'number' && /segundos/.test(k)) return `${v} s`;
  if (k === 'status' && typeof v === 'string') return { concluido: 'Concluído', treino_concluido: 'Só o treino' }[v] || v;
  return String(v);
}

// 8.4 → "8,4 s"; 102 → "1 min 42 s"
export const duracao = s => (typeof s !== 'number' ? '' : s < 60 ? `${String(s).replace('.', ',')} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`);
const tempoEtapas = (detalhe, ids, memorizar = false) => {
  const es = (detalhe._tempos?.etapas || []).filter(e => (memorizar ? e.memorizar : e.grades.some(g => ids.includes(g))));
  return es.length ? es.reduce((a, e) => a + e.segundos, 0) : null;
};

// Alternativa escolhida: texto da alternativa + código (o valor que o profissional soma).
function alternativa(mapa, k, v) {
  const o = mapa[k]?.o;
  if (!o || v === null || v === '' || typeof v === 'boolean') return { texto: formata(k, v), valor: '' };
  const partes = (Array.isArray(v) ? v : String(v).split(' | ')).map(x => String(x).trim());
  const textos = partes.map(x => o[x] ?? x);
  const codigo = partes.length === 1 && o[partes[0]] && o[partes[0]] !== partes[0] && partes[0].length <= 4 ? partes[0] : '';
  return { texto: textos.join(Array.isArray(v) ? ', ' : ' — '), valor: codigo };
}

// ---------- blocos de HTML ----------
// Classes curtas num <style> (Gmail aceita) em vez de estilo repetido em cada célula: mantém o e-mail
// abaixo dos ~102 KB em que o Gmail corta a mensagem ("Mensagem cortada").
const CSS = `
.t{width:100%;border-collapse:collapse;margin:0 0 4px}
.h{padding:8px 12px;background:${C.nevoa};border-bottom:1px solid ${C.regua};font:bold 11px ${SANS};color:${C.grafite};text-transform:uppercase;letter-spacing:.6px;text-align:left}
.c{padding:9px 12px;border-bottom:1px solid ${C.regua};font:14px/1.45 ${SANS};color:${C.tinta};vertical-align:top}
.q{color:${C.grafite}}.b{font-weight:bold}.r{text-align:right}.m{text-align:center}.n{white-space:nowrap}.z{background:#FBFAFB}
.s{display:inline-block;min-width:22px;padding:2px 7px;border-radius:10px;background:${C.selo};color:${C.ameixa};font:bold 13px ${SANS};text-align:center}
.nt{margin:6px 0 0;font:12px/1.5 ${SANS};color:${C.grafite}}
.f{display:inline-block;margin:0 3px 3px 0;padding:1px;border:1px solid ${C.regua};border-radius:3px;vertical-align:top;background:#fff}
.fc{border:2px solid #2E7D4F;background:#E7F3EC}.fe{border:2px solid ${C.alerta};background:#F8E9E5}.fo{border:2px dashed #C77B2A}
.op{display:inline-block;width:30%;margin:0 2% 8px 0;vertical-align:top;text-align:center;font:12px ${SANS};color:${C.grafite}}
`;
const th = (t, cls = '', largura = '') => `<th class="h ${cls}"${largura ? ` width="${largura}"` : ''}>${esc(t)}</th>`;
const td = (t, cls = '') => `<td class="c ${cls}">${t}</td>`;
const selo = v => (v === '' ? '' : `<span class="s">${esc(v)}</span>`);
const tabela = (cab, linhas) => `<table class="t" cellspacing="0" cellpadding="0">${cab ? `<tr>${cab}</tr>` : ''}${linhas.join('')}</table>`;
const zebra = i => (i % 2 ? ' class="z"' : '');
const titulo = (t, nota = '') =>
  `<h3 style="margin:30px 0 10px;padding-bottom:6px;border-bottom:2px solid ${C.ameixa};font:bold 16px ${SERIF};color:${C.ameixa}">${esc(t)}${nota ? ` <span style="font:12px ${SANS};color:${C.grafite}">${esc(nota)}</span>` : ''}</h3>`;

function tabelaRespostas(mapa, itens) {
  const linhas = itens.map(([k, v]) => ({ k, p: termo(k, mapa), ...alternativa(mapa, k, v) }));
  const comValor = linhas.some(l => l.valor !== '');
  return tabela(th('Pergunta', '', comValor ? '48%' : '50%') + th('Resposta') + (comValor ? th('Valor', 'r', '60') : ''),
    linhas.map((l, i) => `<tr${zebra(i)}>${td(esc(l.p), 'q')}${td(esc(l.texto), 'b')}${comValor ? td(selo(l.valor), 'r') : ''}</tr>`));
}

function tabelaIndicadores(itens) {
  return tabela('', itens.map(([k, v]) => `<tr>${td(esc(termo(k)), 'q')}${td(esc(formata(k, v)), 'b')}</tr>`));
}

// Lista de objetos com as mesmas chaves (linhas da Atenção, tarefas da Torre, sequência do CPT) → matriz.
function matriz(linhas) {
  const ents = Array.isArray(linhas) ? linhas.map((v, i) => [String(i + 1), v]) : Object.entries(linhas);
  const cols = Object.keys(ents[0][1]);
  const rotuloLinha = !Array.isArray(linhas);
  const nota = cols.some(c => /marcadas|alvos_nao/.test(c) && c !== 'placas_marcadas')
    ? `<p class="nt">Posição = ordem da figura na linha, da esquerda para a direita (1ª, 2ª, 3ª…).</p>` : '';
  return tabela((rotuloLinha ? th('') : '') + cols.map(c => th(termo(c), 'm')).join(''),
    ents.map(([k, v], i) => `<tr${zebra(i)}>${rotuloLinha ? td(esc(termo(k)), 'q n') : ''}${cols.map(c => td(esc(formata(c, v[c])), 'm')).join('')}</tr>`)) + nota;
}

// ---------- tarefas visuais: a instrução, o alvo e cada figura com a marcação do paciente ----------
const LEGENDA = `<p class="nt"><span class="f fc">&nbsp;&nbsp;&nbsp;</span> marcou e era alvo &nbsp; <span class="f fe">&nbsp;&nbsp;&nbsp;</span> marcou e não era alvo &nbsp; <span class="f fo">&nbsp;&nbsp;&nbsp;</span> era alvo e não marcou &nbsp; <span class="f">&nbsp;&nbsp;&nbsp;</span> não marcou (correto)</p>`;

function gradeVisual(meta, det, base, tam) {
  const marcadas = new Set([...(det.marcadas_certas || []), ...(det.marcadas_erradas || []), ...(det.marcadas || []),
    ...(det.placas_marcadas || []).map(n => meta.numeros.indexOf(n) + 1)]);
  const alvos = new Set(meta.alvos);
  const fig = (src, i) => {
    const pos = i + 1, m = marcadas.has(pos), a = alvos.has(pos);
    const cls = m && a ? 'fc' : m ? 'fe' : a ? 'fo' : '';
    return `<img class="f ${cls}" src="${base}${src}" width="${tam}" height="${tam}" alt="${pos}" title="${pos}ª">`;
  };
  const alvo = meta.alvo
    ? `<td class="c q" width="70" style="text-align:center"><div style="font:bold 10px ${SANS};text-transform:uppercase">Alvo</div><img src="${base}${meta.alvo}" width="${meta.alvo.includes('tr_alvo') ? 64 : tam + 12}" style="margin-top:4px;border:1px solid ${C.regua};border-radius:3px"></td>`
    : '';
  return `<table class="t" cellspacing="0" cellpadding="0"><tr>${alvo}<td class="c">${meta.itens.map(fig).join('')}</td></tr></table>`;
}

// Uma parte (campo de resultado) da tarefa: cada linha/tarefa com o que foi marcado e a contagem do teste.
function tarefasVisuais(path, detalhe, base, campo, contagens) {
  const t = TAREFAS[path];
  const itens = Object.entries(t.itens).filter(([id, meta]) => (!meta.campo || meta.campo === campo) && detalhe[id]);
  if (!itens.length) return [];
  const out = [];
  if (t.tipo === 'escolha') { // Raciocínio: matriz + 6 opções
    const tEsc = tempoEtapas(detalhe, itens.map(([id]) => id));
    out.push(titulo('Respostas por tarefa', `${itens.length} tarefas${tEsc !== null ? ` · ${duracao(tEsc)} no total` : ''}`));
    for (const [id, meta] of itens) {
      const esc1 = detalhe[id].escolhida || '';
      const ok = esc1 && esc1 === meta.correta;
      const ops = Object.entries(meta.opcoes).map(([op, src]) => {
        const cls = op === meta.correta ? 'fc' : op === esc1 ? 'fe' : '';
        const rot = op === esc1 && op === meta.correta ? '<b>Escolhida · correta</b>' : op === esc1 ? '<b>Escolhida</b>' : op === meta.correta ? 'Correta' : '&nbsp;';
        return `<div class="op"><img class="f ${cls}" src="${base}${src}" width="150" style="width:100%;max-width:150px;height:auto"><br>${rot}</div>`;
      }).join('');
      const tr = detalhe[id].tempo_resposta_s;
      out.push(`<div style="margin:22px 0 6px;font:bold 15px ${SANS};color:${C.tinta}">${esc(meta.titulo)} <span style="font:bold 13px ${SANS};color:${ok ? '#2E7D4F' : C.alerta}">· ${esc1 ? (ok ? 'acertou' : 'errou') : 'sem resposta'}</span>${typeof tr === 'number' ? `<span style="font:13px ${SANS};color:${C.grafite}"> · respondeu em ${duracao(tr)}</span>` : ''}</div>
<div class="nt" style="margin:0 0 8px">${esc(meta.instrucao)}</div>
<table class="t" cellspacing="0" cellpadding="0"><tr><td class="c m"><img src="${base}${meta.matriz}" width="260" style="width:100%;max-width:260px;height:auto;border:1px solid ${C.regua}"></td></tr><tr><td class="c">${ops}</td></tr></table>`);
    }
    return out;
  }
  // Atenção / Memória: uma faixa de figuras por questão/bloco, com a contagem do próprio teste
  const tParte = tempoEtapas(detalhe, itens.map(([id]) => id));
  const tMem = itens[0][1].referencia ? tempoEtapas(detalhe, [], true) : null;
  const tempos = [tMem !== null && `<b>Tempo memorizando:</b> ${duracao(tMem)}`, tParte !== null && `<b>Tempo ${tMem !== null ? 'respondendo' : 'nesta parte'}:</b> ${duracao(tParte)}`].filter(Boolean);
  out.push(`<p class="nt" style="font-size:13px;color:${C.tinta}"><b>Instrução ao paciente:</b> ${esc(itens[0][1].instrucao)}${tempos.length ? `<br>${tempos.join(' &nbsp;·&nbsp; ')}` : ''}</p>`);
  const ref = itens[0][1].referencia; // Memória: a prancha que o paciente memorizou
  if (ref) out.push(`<div style="margin:16px 0 4px;font:bold 14px ${SANS};color:${C.tinta}">Placas apresentadas para memorizar</div><img src="${base}${ref}" width="560" style="width:100%;max-width:560px;height:auto;border:1px solid ${C.regua};border-radius:4px">`);
  for (const [id, meta] of itens) {
    const c = contagens[id] || {};
    const tam = meta.itens.length > 30 ? 26 : meta.numeros ? 52 : 34; // legível no Gmail; a faixa pode quebrar linha
    const tl = detalhe[id].tempo_s;
    out.push(`<div style="margin:18px 0 4px;font:bold 14px ${SANS};color:${C.tinta}">${esc(meta.titulo)} <span style="font:13px ${SANS};color:${C.grafite}">· ${c.acertos ?? '—'} acertos · ${c.erros ?? '—'} erros · ${c.omissoes ?? '—'} omissões${typeof tl === 'number' ? ` · 1º ao último clique: ${duracao(tl)}` : ''}</span></div>` + gradeVisual(meta, detalhe[id], base, tam));
  }
  out.push(LEGENDA);
  return out;
}

const ehMatriz = v => {
  const xs = Array.isArray(v) ? v : ehObj(v) ? Object.values(v) : [];
  if (xs.length < 2 || !xs.every(x => ehObj(x) && Object.values(x).every(ehFolha))) return false;
  const chave = Object.keys(xs[0]).join();
  return xs.every(x => Object.keys(x).join() === chave);
};

// Percorre o resultado: folhas com pergunta → tabela de respostas; métricas → indicadores; grupos → seções.
function secoes(obj, mapa, nome, out) {
  const ents = Object.entries(obj);
  const respostas = ents.filter(([k, v]) => ehFolha(v) && mapa[k] && !mapa[k].s);
  const metricas = ents.filter(([k, v]) => ehFolha(v) && !(mapa[k] && !mapa[k].s));
  const porSecao = !nome && respostas.some(([k]) => mapa[k].g)
    ? respostas.reduce((acc, it) => { const g = mapa[it[0]].g || 'Respostas'; (acc[g] ||= []).push(it); return acc; }, {})
    : (respostas.length ? { [nome || 'Respostas']: respostas } : {});
  for (const [g, itens] of Object.entries(porSecao)) out.push(titulo(g, `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`) + tabelaRespostas(mapa, itens));
  if (metricas.length) out.push(titulo(!nome ? 'Indicadores' : respostas.length ? `${nome} · indicadores` : nome) + tabelaIndicadores(metricas));
  const filhos = ents.filter(([, v]) => !ehFolha(v));
  // irmãos com as mesmas medidas (linhas da Atenção, tarefas do Raciocínio) → uma tabela comparativa
  const assinatura = v => (ehObj(v) && Object.values(v).every(ehFolha) ? Object.keys(v).join() : null);
  const grupos = {};
  for (const [k, v] of filhos) if (assinatura(v)) (grupos[assinatura(v)] ||= []).push(k);
  const agrupados = new Set(Object.values(grupos).filter(g => g.length > 1).flat());
  for (const g of Object.values(grupos).filter(g => g.length > 1)) {
    const t = /^tarefa_/.test(g[0]) ? 'Desempenho por tarefa' : /placas|^tr-/.test(g[0]) ? 'Desempenho por bloco' : 'Desempenho por linha';
    out.push(titulo(nome && nome !== 'Respostas' ? `${nome} › ${t}` : t) + matriz(Object.fromEntries(g.map(k => [k, obj[k]]))));
  }
  for (const [k, v] of filhos.filter(([k]) => !agrupados.has(k))) {
    const sub = !nome || nome === 'Respostas' ? termo(k, mapa) : `${nome} › ${termo(k, mapa)}`;
    if (ehMatriz(v)) out.push(titulo(sub) + matriz(v));
    else if (ehObj(v) && Object.keys(v).length) secoes(v, mapa, sub, out);
  }
  return out;
}

const semRepetir = (o, chaves) => { for (const [k, v] of Object.entries(o)) { if (chaves.includes(k) && ehFolha(v)) delete o[k]; else if (ehObj(v)) { semRepetir(v, chaves); if (!Object.keys(v).length) delete o[k]; } } };

// Achata o resultado em { chave: valor } para o resumo e a contagem de respondidas.
const folhas = (o, acc = {}) => { for (const [k, v] of Object.entries(o)) ehObj(v) ? folhas(v, acc) : (acc[k] ??= v); return acc; };

export function montarEmail(campos, path, baseImagens = '') {
  const mapa = PERGUNTAS[path] || {};
  const teste = NOMES_TESTE[path] || campos.referer_title || path;
  const nome = campos['form_fields[name]'] || 'Paciente sem nome';
  const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
  const f = id => campos[`form_fields[${id}]`] ?? '';
  const detalhe = json(campos['form_fields[r_detalhe]']) || {};
  const resultados = Object.entries(campos)
    .filter(([k, v]) => k.startsWith('form_fields[') && k !== 'form_fields[r_detalhe]' && json(v))
    .map(([k, v]) => [k.slice(12, -1), json(v)]);
  // o que foi marcado em cada linha/tarefa vira colunas extras da tabela de desempenho
  if (!TAREFAS[path]) for (const [, o] of resultados) for (const [k, extra] of Object.entries(detalhe)) if (ehObj(o[k])) Object.assign(o[k], extra);
  const textosLivres = Object.entries(campos)
    .filter(([k, v]) => k.startsWith('form_fields[') && v !== '' && !json(v) && !['name', 'cpf', 'cel', 'accept', 'field_5bb3790', 'r_detalhe'].includes(k.slice(12, -1)));

  // Resumo: pontuação/indicadores principais + itens respondidos X de Y + situação.
  const todas = resultados.reduce((acc, [, o]) => folhas(o, acc), {});
  const esperadas = Object.keys(mapa).filter(k => mapa[k].r);
  const respondidas = esperadas.filter(k => todas[k] !== undefined && todas[k] !== '' && todas[k] !== null);
  const semResposta = esperadas.filter(k => !respondidas.includes(k));
  // com várias partes (Atenção), a pontuação fica em cada parte; a faixa não soma partes diferentes
  const naFaixa = resultados.length === 1 ? DESTAQUE.filter(k => typeof todas[k] === 'number').slice(0, 3) : [];
  const resumo = naFaixa.map(k => [termo(k), formata(k, todas[k])]);
  if (esperadas.length) resumo.push(['Itens respondidos', `${respondidas.length} de ${esperadas.length}`]);
  const concluido = esperadas.length ? semResposta.length === 0 : (todas.concluido ?? todas.teste_concluido ?? resultados.length > 0);
  if (typeof detalhe._tempos?.total_s === 'number' && detalhe._tempos.total_s > 0) resumo.push(['Tempo nas tarefas', duracao(detalhe._tempos.total_s)]);
  resumo.push(['Situação', resultados.length ? (concluido ? 'Concluído' : 'Incompleto') : 'Sem resultado']);

  const corpo = [];
  // figuras: do site que enviou, ou de onde elas estão hospedadas (envios vindos do WordPress)
  let base = baseImagens || 'https://www.vitallmente.com.br';
  if (!baseImagens) try { base = new URL(campos.referrer).origin; } catch {}
  for (const [id, o] of resultados) {
    const limpo = structuredClone(o);
    if (ehObj(limpo.status) && 'respondidas' in limpo.status) delete limpo.status; // já está no resumo
    for (const k of ['total_respondidas', 'teste_concluido']) delete limpo[k];
    semRepetir(limpo, naFaixa); // o que já está na faixa de resumo não se repete abaixo
    if (PARTES[id]) corpo.push(`<h2 style="margin:36px 0 0;font:bold 19px ${SERIF};color:${C.tinta}">${esc(PARTES[id])}</h2>`);
    // tarefas visuais: cada linha/tarefa mostra figuras + contagem; a tabela de desempenho por linha sai (seria repetida)
    const visual = TAREFAS[path] ? tarefasVisuais(path, detalhe, base, id, o) : [];
    if (visual.length) { for (const k of Object.keys(TAREFAS[path].itens)) delete limpo[k]; corpo.push(...visual); }
    secoes(limpo, mapa, '', corpo);
  }
  for (const [k, v] of textosLivres) corpo.push(titulo(termo(k.slice(12, -1), mapa)) + tabelaIndicadores([[k, v]]));
  if (semResposta.length) {
    corpo.push(titulo('Perguntas sem resposta', `${semResposta.length}`) +
      tabela('', semResposta.map(k => `<tr>${`<td class="c" style="color:${C.alerta}">${esc(termo(k, mapa))}</td>`}</tr>`)));
  }
  if (!resultados.length && !textosLivres.length) {
    corpo.push(`<p style="margin:28px 0;padding:14px 16px;background:${C.nevoa};border-left:3px solid ${C.alerta};font:14px ${SANS};color:${C.tinta}">O paciente enviou o formulário sem respostas do teste. Confirme com ele se o teste foi feito até o fim.</p>`);
  }

  const celula = ([r, v], ultima) =>
    `<td style="padding:12px 14px;${ultima ? '' : `border-right:1px solid ${C.regua};`}vertical-align:top">
<div style="font:bold 10px ${SANS};color:${C.grafite};text-transform:uppercase;letter-spacing:.8px">${esc(r)}</div>
<div style="margin-top:4px;font:bold 20px ${SANS};color:${r === 'Situação' && v !== 'Concluído' ? C.alerta : C.tinta}">${esc(v)}</div></td>`;
  const paciente = [['Paciente', nome], ['CPF', f('cpf') || '—'], ['Celular', f('cel') || '—'], ['Termos de uso', f('accept') ? 'Aceitos' : 'Não aceitos']];

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head>
<body style="margin:0;padding:0;background:${C.nevoa}">
<table width="100%" cellspacing="0" cellpadding="0" style="background:${C.nevoa}"><tr><td align="center" style="padding:24px 10px">
<table width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#fff;border:1px solid ${C.regua};border-radius:8px;overflow:hidden">
<tr><td style="background:${C.ameixa};padding:20px 28px">
<div style="font:24px ${SERIF};color:#fff">Vitallmente</div>
<div style="font:11px ${SANS};color:#E9DDE4;letter-spacing:2px;text-transform:uppercase">Relatório de teste online · uso profissional</div></td></tr>
<tr><td style="padding:24px 28px 8px">
<div style="font:12px ${SANS};color:${C.grafite}">Recebido em ${esc(quando)}</div>
<h1 style="margin:6px 0 2px;font:bold 25px/1.25 ${SERIF};color:${C.tinta}">${esc(teste)}</h1>
<div style="font:17px ${SANS};color:${C.ameixa}">${esc(nome)}</div>
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border:1px solid ${C.regua};border-radius:6px"><tr>${resumo.map((x, i) => celula(x, i === resumo.length - 1)).join('')}</tr></table>
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px">${paciente.map(([r, v]) => `<tr><td style="padding:3px 0;width:120px;font:12px ${SANS};color:${C.grafite}">${esc(r)}</td><td style="padding:3px 0;font:14px ${SANS};color:${C.tinta}">${esc(v)}</td></tr>`).join('')}</table>
${corpo.join('\n')}
</td></tr>
<tr><td style="padding:18px 28px;background:${C.nevoa};font:12px/1.5 ${SANS};color:${C.grafite}">
Conteúdo confidencial com dados de saúde do paciente. Não encaminhe fora da equipe clínica.<br>
Enviado pelo site${f('field_5bb3790') ? ` · código ${esc(f('field_5bb3790'))}` : ''} · <a href="${esc(campos.referrer || '')}" style="color:${C.ameixa}">${esc(path)}</a></td></tr>
</table></td></tr></table></body></html>`;

  // Versão em texto simples (mesmo conteúdo, sem HTML).
  const linhasTexto = [`${teste} — ${nome}`, `Recebido em ${quando}`, '', ...resumo.map(([r, v]) => `${r}: ${v}`), '',
    ...paciente.map(([r, v]) => `${r}: ${v}`), ''];
  const texto = (o, ind = '') => Object.entries(o).forEach(([k, v]) => {
    if (ehFolha(v)) {
      const a = mapa[k] && !mapa[k].s ? alternativa(mapa, k, v) : { texto: formata(k, v), valor: '' };
      linhasTexto.push(`${ind}${termo(k, mapa)}: ${a.texto}${a.valor ? ` [${a.valor}]` : ''}`);
    } else if (Array.isArray(v)) {
      linhasTexto.push(`${ind}${termo(k, mapa)}:`);
      v.forEach((x, i) => linhasTexto.push(`${ind}  ${i + 1}. ${Object.entries(x).map(([a, b]) => `${termo(a)} ${formata(a, b)}`).join(', ')}`));
    } else { linhasTexto.push(`${ind}${termo(k, mapa)}:`); texto(v, ind + '  '); }
  });
  for (const [id, o] of resultados) { if (PARTES[id]) linhasTexto.push('', PARTES[id]); texto(o); }
  if (semResposta.length) linhasTexto.push('', 'Perguntas sem resposta:', ...semResposta.map(k => `- ${termo(k, mapa)}`));

  return { subject: `[Vitallmente] ${teste} — ${nome}`, html, text: linhasTexto.join('\n') };
}
