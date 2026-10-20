# Plano: espelhamento estático de www.vitallmente.com.br

## Tarefas

- [x] 1. Setup (lista de páginas + dependências de teste). Resultado: `tools/pages.txt` com 30 URLs; `tests/lib.mjs` exporta 30 PATHS e 20 FORM_PATHS, todos FORM_PATHS dentro de PATHS (`30 20 true`).
- [x] 2. Captura de assets (Task 2). Resultado: 205 assets em `_scratch/requests.txt` (63 `.css`, 28 `.js`), 30 páginas × 2 viewports, 5m12s.
- [x] 3. Espelhamento (Task 3). Resultado: `tests/test_mirror.py` OK; 252 assets espelhados, 0 falhas, 30 index.html, 30 HTML brutos, 0 `__trashed` no sitemap. Dois bugs do mirror corrigidos no script (diretório-base `wprevpluginsurl` e `&quot;` colado em URLs de .mp4), sem falhas pré-existentes do original. Fix round 1: domínio sem www tratado como próprio (ABS/ASSET, OWN_HOSTS no capture); recaptura 217 assets; mirror final 264 assets, 0 falhas; uploads/2026/01 de 12 para 24 arquivos; fetch com 3 tentativas (timeouts esporádicos).
- [x] 4. Formulários. Resultado: `tests/check_forms.py` criado; prova de RED (TOTAL_PERGUNTAS 18→17 em teste-tdah) gerou `FALHA /teste-tdah/` e exit=1, arquivo restaurado (cmp OK); execução real: `formularios: OK`, 20 OK. Inventário de perguntas (tabela impressa pelo check_forms.py):

  | Página | forms | scripts | TOTAL_PERGUNTAS | bytes |
  |---|---|---|---|---|
  | /teste-gravidade-depressiva/ | 1 | 1 | 21 | 25207 |
  | /teste-gravidade-de-desesperanca/ | 1 | 1 | - | 19837 |
  | /teste-vitallmente-gravidade-ansiosa/ | 1 | 1 | - | 19510 |
  | /teste-impulsividade/ | 1 | 1 | - | 19848 |
  | /teste-vitallmente-responsabilidade-social/ | 1 | 1 | - | 23628 |
  | /teste-tea/ | 1 | 1 | - | 20222 |
  | /teste-tdah/ | 1 | 1 | 18 | 22374 |
  | /teste-memoria-operacional/ | 1 | 1 | - | 27082 |
  | /teste-raciocinio/ | 1 | 1 | - | 49708 |
  | /teste-atencao/ | 1 | 3 | - | 55898 |
  | /anamnese-1/ | 1 | 1 | - | 30210 |
  | /anamnese-2/ | 1 | 1 | - | 28390 |
  | /vineland-3/ | 1 | 1 | - | 61986 |
  | /experiencia-emocionais/ | 1 | 1 | - | 22546 |
  | /vivencias-mocionais/ | 1 | 1 | - | 23410 |
  | /torre-de-londres/ | 1 | 1 | - | 35484 |
  | /flexibilidade-cognitiva/ | 1 | 2 | - | 35600 |
  | /avaliacao-comportamento/ | 1 | 1 | - | 40266 |
  | /adi-r/ | 1 | 1 | - | 40819 |
  | /swyc/ | 1 | 1 | - | 42889 |

- [x] 5. Links. Resultado: `tests/check_links.py` criado; prova de RED (`/terapia-aba`→`/terapia-abaX` na home) gerou `FALHA /` citando `/terapia-aba` e `/terapia-abaX`, exit=1, arquivo restaurado (cmp OK); execução real: `links: OK`, 234 hrefs comparados, 0 AVISO, 0 mismatch. Sem AVISO para registrar (nenhum link interno quebrado no site atual). Sem desvio do brief: 0 hrefs de apex `//vitallmente.com.br` no original, então o DOMAIN com `www.` basta.
- [x] 6. Visual. Resultado: `tests/visual.mjs` + `tests/mask.txt` criados; prova de RED (invert em /terapia-aba/) gerou FALHA 59.81% desktop / 54.52% mobile, exit=1, arquivo restaurado (cmp OK); execução real: 60/60 OK, todas diff=0.00%, sem FALHA, mask.txt inalterado. Desvio: porta 8080 ocupada por outro servidor (http.server em ~/openclaw-backup-configs, não nosso), então usei :8081 via `LOCAL=http://localhost:8081` (lib.mjs agora aceita `process.env.LOCAL`, default 8080).

```
OK    desktop /                                              diff=0.00% 
OK    desktop /privacy-policy/                               diff=0.00% 
OK    desktop /avaliacao_meta/                               diff=0.00% 
OK    desktop /psicoterapia/                                 diff=0.00% 
OK    desktop /furo-de-orelha/                               diff=0.00% 
OK    desktop /homes/                                        diff=0.00% 
OK    desktop /terapia-aba/                                  diff=0.00% 
OK    desktop /anamnese-1/                                   diff=0.00% 
OK    desktop /anamnese-2/                                   diff=0.00% 
OK    desktop /politica-de-privacidade/                      diff=0.00% 
OK    desktop /avaliacao-online/                             diff=0.00% 
OK    desktop /avaliacao/                                    diff=0.00% 
OK    desktop /adi-r/                                        diff=0.00% 
OK    desktop /experiencia-emocionais/                       diff=0.00% 
OK    desktop /vivencias-mocionais/                          diff=0.00% 
OK    desktop /flexibilidade-cognitiva/                      diff=0.00% 
OK    desktop /torre-de-londres/                             diff=0.00% 
OK    desktop /avaliacao-comportamento/                      diff=0.00% 
OK    desktop /vineland-3/                                   diff=0.00% 
OK    desktop /teste-raciocinio/                             diff=0.00% 
OK    desktop /teste-atencao/                                diff=0.00% 
OK    desktop /teste-memoria-operacional/                    diff=0.00% 
OK    desktop /teste-tdah/                                   diff=0.00% 
OK    desktop /teste-tea/                                    diff=0.00% 
OK    desktop /teste-vitallmente-responsabilidade-social/    diff=0.00% 
OK    desktop /swyc/                                         diff=0.00% 
OK    desktop /teste-impulsividade/                          diff=0.00% 
OK    desktop /teste-vitallmente-gravidade-ansiosa/          diff=0.00% 
OK    desktop /teste-gravidade-de-desesperanca/              diff=0.00% 
OK    desktop /teste-gravidade-depressiva/                   diff=0.00% 
OK    mobile  /                                              diff=0.00% 
OK    mobile  /privacy-policy/                               diff=0.00% 
OK    mobile  /avaliacao_meta/                               diff=0.00% 
OK    mobile  /psicoterapia/                                 diff=0.00% 
OK    mobile  /furo-de-orelha/                               diff=0.00% 
OK    mobile  /homes/                                        diff=0.00% 
OK    mobile  /terapia-aba/                                  diff=0.00% 
OK    mobile  /anamnese-1/                                   diff=0.00% 
OK    mobile  /anamnese-2/                                   diff=0.00% 
OK    mobile  /politica-de-privacidade/                      diff=0.00% 
OK    mobile  /avaliacao-online/                             diff=0.00% 
OK    mobile  /avaliacao/                                    diff=0.00% 
OK    mobile  /adi-r/                                        diff=0.00% 
OK    mobile  /experiencia-emocionais/                       diff=0.00% 
OK    mobile  /vivencias-mocionais/                          diff=0.00% 
OK    mobile  /flexibilidade-cognitiva/                      diff=0.00% 
OK    mobile  /torre-de-londres/                             diff=0.00% 
OK    mobile  /avaliacao-comportamento/                      diff=0.00% 
OK    mobile  /vineland-3/                                   diff=0.00% 
OK    mobile  /teste-raciocinio/                             diff=0.00% 
OK    mobile  /teste-atencao/                                diff=0.00% 
OK    mobile  /teste-memoria-operacional/                    diff=0.00% 
OK    mobile  /teste-tdah/                                   diff=0.00% 
OK    mobile  /teste-tea/                                    diff=0.00% 
OK    mobile  /teste-vitallmente-responsabilidade-social/    diff=0.00% 
OK    mobile  /swyc/                                         diff=0.00% 
OK    mobile  /teste-impulsividade/                          diff=0.00% 
OK    mobile  /teste-vitallmente-gravidade-ansiosa/          diff=0.00% 
OK    mobile  /teste-gravidade-de-desesperanca/              diff=0.00% 
OK    mobile  /teste-gravidade-depressiva/                   diff=0.00% 
```
- [x] 7. Etapas + pendências. Resultado: `tests/steps.mjs` 20/20 OK (steps>0, idêntico ao original); `docs/pendencias-fase-formularios.md` criado; bateria final exit 0: test_mirror, check_forms, check_links, visual (60/60 OK), steps.

## Correções pós-revisão final
- tests/lib.mjs: `BLOCK_TRACKING` + `blockTracking(ctx)`; chamado em capture/visual/steps (steps agora usa contexto). Verificado: 0 requests de tracking não abortados, 5 abortados (local e original).
- tools/mirror.py: espelha `/wp-content/plugins/wordpress-seo/css/main-sitemap.xsl`; falha com erro claro sem `_scratch/requests.txt`; apaga `site/` antes de gerar. Teste novo em test_mirror.py.
- tests/check_links.py: DOMAIN aceita `vitallmente.com.br` sem www.
- Removidos _scratch/{aba,home,tdah}.bak.
- Resultados (exit): test_mirror 0 | mirror 0 (265 assets, 0 falhas) | check_forms 0 | check_links 0 | visual 0 (60/60 OK, 0.00%) | steps 0 (20/20 OK). site/: 299 arquivos; main-sitemap.xsl presente.
