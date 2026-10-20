# Vitallmente — site estático

Cópia fiel de https://www.vitallmente.com.br/ (30 páginas, 20 formulários de teste) em HTML/CSS/JS estático, sem WordPress.

## Estrutura

| Pasta | O que é |
|---|---|
| `site/` | O site publicável (raiz do deploy) |
| `tools/mirror.py` | Gera `site/` a partir do site no ar |
| `tools/pages.txt` | As 30 URLs espelhadas |
| `tests/` | Testes de fidelidade (formulários, links, visual, etapas) |
| `docs/` | Spec, plano e pendências da fase de formulários |

## Rodar local

```bash
python3 -m http.server 8081 -d site
```

Abra http://localhost:8081/

## Regenerar o site

```bash
cd tests && npm install && npx playwright install chromium && node capture.mjs && cd ..
python3 -I tools/mirror.py
```

## Testes

```bash
python3 -I tests/test_mirror.py
python3 -I tests/check_forms.py
python3 -I tests/check_links.py
cd tests && LOCAL=http://localhost:8081 node visual.mjs && LOCAL=http://localhost:8081 node steps.mjs
```

## Vercel

O `vercel.json` publica a pasta `site/` (sem build). Nada a configurar no painel.

## Pendente

O envio dos formulários é **simulado**: `/wp-admin/admin-ajax.php` é atendido por `api/elementor-form.mjs`, que só devolve sucesso (popup "Teste enviado com sucesso"; mensagem inline em teste-tea, experiencia-emocionais e adi-r). Nada é enviado nem salvo. Conferir com `BASE=https://vitalmente-gilt.vercel.app node tests/submit.mjs`. Ao ligar o envio real: o reCAPTCHA v3 só aceita o domínio vitallmente.com.br (no vercel.app o token é inválido). Ver `docs/pendencias-fase-formularios.md`. Não apontar o domínio para o novo deploy antes dessa fase.
