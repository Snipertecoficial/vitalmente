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

Configure **Root Directory = `site`**, sem build command.

## Pendente

O envio dos formulários ainda depende do WordPress (`admin-ajax.php`). Ver `docs/pendencias-fase-formularios.md`. Não apontar o domínio para o novo deploy antes dessa fase.
