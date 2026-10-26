// Vitallmente: registra no envio o que o paciente marcou nas tarefas de clique (Memória, Raciocínio
// e Atenção) e quanto tempo levou. O teste original só envia as contagens; este script só observa a
// tela e preenche form_fields[r_detalhe] — não altera o teste nem a correção dele.
(function () {
  var form = document.querySelector('form.elementor-form');
  if (!form) return;
  var campo = document.createElement('input');
  campo.type = 'hidden';
  campo.name = 'form_fields[r_detalhe]';
  form.appendChild(campo);

  var GRADES = '[id^="grid-pergunta-"],[id^="grid-teste-"],[id^="tr-grid-"],[id^="placas-grid-"],.tarefa-container[id^="tarefa_"]';
  var agora = function () { return Date.now(); };
  var cliques = {};     // id da linha/tarefa -> { primeiro, ultimo } (ms)
  var tempoPasso = {};  // índice da etapa do formulário -> ms acumulados
  var passoAtual = null, inicioPasso = 0;

  function etapas() { return [].slice.call(form.querySelectorAll('.e-form__step')); }
  function etapaVisivel() {
    var es = etapas();
    for (var i = 0; i < es.length; i++) if (!es[i].classList.contains('elementor-hidden')) return i;
    return null;
  }
  function trocouEtapa() {
    var v = etapaVisivel();
    if (v === passoAtual) return;
    if (passoAtual !== null) tempoPasso[passoAtual] = (tempoPasso[passoAtual] || 0) + agora() - inicioPasso;
    passoAtual = v;
    inicioPasso = agora();
  }
  function msEtapa(i) { return (tempoPasso[i] || 0) + (i === passoAtual ? agora() - inicioPasso : 0); }
  function segundos(ms) { return Math.round(ms / 100) / 10; }

  function posicoes(itens, teste) {
    var out = [];
    itens.forEach(function (e, i) { if (teste(e)) out.push(i + 1); });
    return out;
  }

  function ler() {
    trocouEtapa();
    var d = {};
    // Memória: placas marcadas em cada bloco (numeradas de 1 a 48, como no gabarito do teste)
    form.querySelectorAll('[id^="placas-grid-"]').forEach(function (g) {
      d[g.id] = { placas_marcadas: [].map.call(g.querySelectorAll('.placa-item.selected'), function (e) { return Number(e.dataset.id) + 1; }) };
    });
    // Raciocínio: opção escolhida x opção correta em cada tarefa
    form.querySelectorAll('.tarefa-container[id^="tarefa_"]').forEach(function (t) {
      var sel = t.querySelector('.btn-matriz.selecionada');
      d[t.id] = { escolhida: sel ? sel.dataset.opcao : '', correta: t.dataset.correta || '' };
    });
    // Atenção: posição (1ª, 2ª…) de cada figura marcada na linha, certas/erradas e alvos esquecidos
    form.querySelectorAll('[id^="grid-pergunta-"],[id^="grid-teste-"],[id^="tr-grid-"]').forEach(function (g) {
      var itens = [].slice.call(g.children);
      var marcada = function (e) { return e.classList.contains('selected'); };
      var alvo = g.dataset.correta;
      var ehAlvo = alvo ? function (e) { return (e.dataset.nome || e.dataset.dna) === alvo; } : null;
      d[g.id] = ehAlvo
        ? {
            marcadas_certas: posicoes(itens, function (e) { return marcada(e) && ehAlvo(e); }),
            marcadas_erradas: posicoes(itens, function (e) { return marcada(e) && !ehAlvo(e); }),
            alvos_nao_marcados: posicoes(itens, function (e) { return !marcada(e) && ehAlvo(e); }),
          }
        : { marcadas: posicoes(itens, marcada) };
    });

    // Tempos: por etapa (cada parte da tarefa é uma etapa), por linha (1º ao último clique) e,
    // no Raciocínio, quanto levou para responder cada tarefa desde a resposta anterior.
    var es = etapas(), etapasTarefa = [];
    es.forEach(function (e, i) {
      var ids = [].map.call(e.querySelectorAll(GRADES), function (g) { return g.id; });
      var memorizar = !!e.querySelector('img[src*="placas_base"]');
      if (ids.length || memorizar) etapasTarefa.push({ etapa: i + 1, segundos: segundos(msEtapa(i)), grades: ids, memorizar: memorizar });
      var respondidas = ids.filter(function (id) { return d[id] && cliques[id]; });
      // Raciocínio: na ordem em que o paciente respondeu (pode pular tarefas), desde a resposta anterior
      var escolhas = respondidas.filter(function (id) { return d[id].escolhida !== undefined; })
        .sort(function (a, b) { return cliques[a].ultimo - cliques[b].ultimo; });
      escolhas.forEach(function (id, k) {
        var desde = k ? cliques[escolhas[k - 1]].ultimo : cliques[id].inicioEtapa;
        d[id].tempo_resposta_s = segundos(cliques[id].ultimo - desde);
      });
      respondidas.forEach(function (id) {
        if (d[id].escolhida === undefined) d[id].tempo_s = segundos(cliques[id].ultimo - cliques[id].primeiro);
      });
    });
    d._tempos = {
      total_s: segundos(etapasTarefa.reduce(function (a, e) { return a + e.segundos * 1000; }, 0)),
      etapas: etapasTarefa,
    };
    campo.value = JSON.stringify(d);
  }

  document.addEventListener('click', function (ev) {
    var g = ev.target.closest && ev.target.closest(GRADES);
    if (g && form.contains(g)) {
      var c = cliques[g.id] || (cliques[g.id] = { primeiro: agora(), inicioEtapa: inicioPasso });
      c.ultimo = agora();
    }
    setTimeout(ler, 0); // depois que o próprio teste processa o clique (inclui troca de etapa)
  }, true);
  form.addEventListener('change', function () { setTimeout(ler, 0); });
  // etapa que avança sozinha (ex.: limite de tempo) também conta
  new MutationObserver(function () { trocouEtapa(); }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });
  ler();
})();
