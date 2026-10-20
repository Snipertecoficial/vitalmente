# Vitallmente — site estático fiel (fora do WordPress/Elementor)

Data: 2026-10-19 · Origem: https://www.vitallmente.com.br/

## Objetivo

Recriar o site inteiro como arquivos estáticos (HTML/CSS/JS/imagens), sem WordPress e sem o PHP do Elementor, com **visual, HTML, CSS e links idênticos** ao site atual. Os formulários vêm com **todas as perguntas idênticas**, mas o envio (backend) fica para a fase seguinte.

## Dados levantados (2026-10-19, via curl no site no ar)

- Stack atual: WordPress + Elementor 4.2.0 + Elementor Pro, Apache.
- Plugins com reflexo no front: `elementor`, `elementor-pro`, `wp-google-places-review-slider`, `beautiful-and-responsive-cookie-consent`.
- Terceiros carregados: Google Tag Manager (`GTM-W7Q42XQ3`, `GTM-P65HBM6M`, `GTM-TCNPZRD5`), Trustindex (`cdn.trustindex.io`), Google Maps, reCAPTCHA v3, WhatsApp, Instagram, Facebook.
- Sitemap (`page-sitemap.xml`): 32 URLs. Ficam **30**; saem `/__trashed/` e `/__trashed-2/` (lixeira do WP).
- Formulários: Elementor Pro, multi-etapas (`elementor-field-type-step`). **As perguntas ficam em `<script>` inline dentro do `<form>`** (ex.: BDI-II, `const questoes = [...]`, `TOTAL_PERGUNTAS = 21`). O HTML servido já contém 100% das perguntas, então o scraping do HTML é suficiente e não é preciso executar JS para extraí-las.
- Envio atual: AJAX para `/wp-admin/admin-ajax.php` (Elementor Pro), seguido de redirecionamento ao WhatsApp. **Sem WordPress, esse endpoint deixa de existir.**

## Catálogo de páginas (30)

Institucionais e legais (10): `/`, `/psicoterapia/`, `/terapia-aba/`, `/avaliacao/`, `/avaliacao-online/`, `/avaliacao_meta/`, `/furo-de-orelha/`, `/homes/`, `/politica-de-privacidade/`, `/privacy-policy/`.

Formulários (20; nome conforme a lista do cliente):

| URL | Teste |
|---|---|
| /teste-gravidade-depressiva/ | Depressão (BDI-II, 21 itens) |
| /teste-gravidade-de-desesperanca/ | Desesperança |
| /teste-vitallmente-gravidade-ansiosa/ | Ansiedade |
| /teste-impulsividade/ | ESAVI |
| /teste-vitallmente-responsabilidade-social/ | SRS-2 |
| /teste-tea/ | SRS-2 infantil |
| /teste-tdah/ | ASRS (18 itens) |
| /teste-memoria-operacional/ | MVPT |
| /teste-raciocinio/ | TRL |
| /teste-atencao/ | AOL |
| /anamnese-1/ | Anamnese |
| /anamnese-2/ | Anamnese |
| /vineland-3/ | Vineland-3 |
| /experiencia-emocionais/ | BOLIE |
| /vivencias-mocionais/ | BOLIE QOE |
| /torre-de-londres/ | Torre de Londres |
| /flexibilidade-cognitiva/ | CPT-Flex |
| /avaliacao-comportamento/ | ADOS-2 |
| /adi-r/ | ADI-R |
| /swyc/ | SWYC |

## Abordagem escolhida: espelhamento + pós-processamento reproduzível

Um script (`tools/mirror.py`, só stdlib) baixa as 30 páginas e todos os assets do domínio (`/wp-content/`, `/wp-includes/`), salva no mesmo caminho em `site/` e troca as URLs absolutas do próprio domínio por caminhos relativos à raiz. O HTML e o CSS gerados pelo Elementor são mantidos **byte a byte**. O CSS/JS do Elementor passa a ser um arquivo estático qualquer, sem WordPress e sem PHP.

Alternativas descartadas:
- **Reescrever o HTML/CSS do zero, sem o markup do Elementor.** O código fica mais limpo, mas não há como garantir "idêntico" em 30 páginas; cada página vira um risco visual. Pode ser uma fase futura, quando os testes de paridade abaixo já existirem para proteger a mudança.
- **wget/HTTrack.** Não estão instalados, não capturam os chunks JS carregados sob demanda pelo Elementor e reescrevem links de um jeito que não controlamos.

### Regras de transformação (todas em `tools/mirror.py`, nunca editar `site/` à mão)

1. `https://www.vitallmente.com.br/...` (inclusive na forma `https:\/\/...` dentro de JSON) passa a `/...`.
2. **Exceções que continuam absolutas:** `<link rel="canonical">`, `<meta og:*>`/`<meta twitter:*>` e `<script type="application/ld+json">`. São SEO e precisam de URL absoluta; o domínio final é o mesmo.
3. Removidas do `<head>` apenas as tags que apontam para o runtime do WP (`wp-json`, `xmlrpc.php`, `wlwmanifest`, `shortlink`, `/feed/`, `oembed`). Nenhum `<a href>` é alterado.
4. Links externos (WhatsApp, Instagram, Facebook, Maps, Trustindex, GTM) ficam intactos.
5. `robots.txt`, `sitemap_index.xml`, `page-sitemap.xml` e `main-sitemap.xsl` são copiados; as entradas `__trashed` saem do sitemap.
6. Assets carregados só em tempo de execução (chunks do Elementor) são descobertos registrando as requisições de rede do site original no navegador (Playwright), em desktop e mobile.

## Testes de aceitação (critério de "pronto")

| Teste | Passa quando |
|---|---|
| `tests/check_forms.py` | As 20 páginas de formulário têm o `<form>` local idêntico ao original (após a regra 1), incluindo todo `<script>` de perguntas |
| `tests/check_links.py` | Cada página tem exatamente o mesmo multiconjunto de `<a href>` que o original, e todo link interno resolve para um arquivo em `site/`. Link já quebrado no original vira aviso, não falha |
| `tests/visual.mjs` | Original × local, 30 páginas × 2 viewports (1440 e 390): mesmas dimensões, ≤ 0,5% de pixels diferentes (com animações congeladas e widgets de terceiros mascarados em `tests/mask.txt`), nenhuma resposta ≥ 400 e **zero** requisições ao domínio de produção |
| `tests/steps.mjs` | Nas 20 páginas de formulário, o JS de etapas inicializa localmente igual ao original (mesmo nº de etapas e indicadores renderizados) |

## Fora de escopo nesta fase

- Envio dos formulários (substituir `admin-ajax.php`), e-mail ao profissional, reCAPTCHA, registro de eventos. Isso fica para a **fase de formulários**.
- Publicação/DNS. **Não publicar antes da fase de formulários**: sem backend, os testes enviados se perdem.
- Remover o markup do Elementor (reescrita limpa).

## Pendências que só o cliente decide

- Formulários em sublinks: manter as URLs atuais (padrão desta spec) ou criar uma nova estrutura (ex.: `/testes/bdi-ii/`) com redirecionamento das antigas.
- Hospedagem final (ex.: Vercel) e versionamento com git.
