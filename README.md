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

## Envio dos formulários

`/wp-admin/admin-ajax.php` é atendido por `api/elementor-form.mjs`: envia cada teste por e-mail (Resend) para vitallmenteclinica@gmail.com com assunto `[Vitallmente] Teste X — Nome`, mostra a confirmação (popup "Teste enviado com sucesso"; mensagem inline em teste-tea, experiencia-emocionais e adi-r) e redireciona ao WhatsApp 11 91773-8711.

- Chave: variável `RESEND_API_KEY` na Vercel (e no `.env` local, fora do git). Sem ela o envio é só simulado.
- O cabeçalho `x-envio` da resposta diz `email` ou `simulado`.
- Conferir: `BASE=https://vitalmente-gilt.vercel.app node tests/submit.mjs /teste-tdah/` (envia 1 e-mail real).
- Layout do e-mail: `api/_relatorio.mjs`. Teste dos 20 relatórios: `node tests/relatorio.mjs` (prévias em `_scratch/relatorio/`).
- Textos das perguntas: `api/perguntas.json`, gerado por `LOCAL=http://localhost:8081 node tests/extrair_perguntas.mjs` — rodar de novo se um teste mudar.
- O reCAPTCHA v3 só aceita o domínio vitallmente.com.br; o servidor ainda não valida o token.
