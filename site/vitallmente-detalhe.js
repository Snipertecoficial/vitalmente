// Vitallmente: registra no envio o que o paciente marcou nas tarefas de clique
// (Memória, Raciocínio e Atenção). O teste original só envia as contagens; este script
// só lê a tela e preenche form_fields[r_detalhe] — não altera o teste nem a correção dele.
(function () {
  var form = document.querySelector('form.elementor-form');
  if (!form) return;
  var campo = document.createElement('input');
  campo.type = 'hidden';
  campo.name = 'form_fields[r_detalhe]';
  form.appendChild(campo);

  function posicoes(itens, teste) {
    var out = [];
    itens.forEach(function (e, i) { if (teste(e)) out.push(i + 1); });
    return out;
  }

  function ler() {
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
    campo.value = JSON.stringify(d);
  }

  // depois que o próprio teste processa o clique
  document.addEventListener('click', function () { setTimeout(ler, 0); }, true);
  form.addEventListener('change', function () { setTimeout(ler, 0); });
  ler();
})();
