# Vitallmente — Site Estático Fiel: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar em `site/` uma cópia estática das 30 páginas de www.vitallmente.com.br com HTML, CSS, links e perguntas dos formulários idênticos ao original, sem WordPress.

**Architecture:** Um script Python (stdlib) espelha as páginas e os assets e aplica as regras de transformação da spec. Um script Playwright descobre os assets carregados em tempo de execução. Quatro testes (formulários, links, visual, etapas) comparam o local com o original no ar e definem o "pronto".

**Tech Stack:** Python 3 (stdlib), Node 24, Playwright 1.49.1, pixelmatch 6.0.0, pngjs 7.0.0, `python3 -m http.server`.

**Spec:** `docs/superpowers/specs/2026-10-19-site-estatico-design.md`

## Global Constraints

- Diretório do projeto: `/Users/douglasnogueira/Desktop/VITALMENTE SITE ` (o nome termina com espaço; sempre entre aspas).
- `site/` é saída gerada: **nunca editar à mão**. Toda correção vai para `tools/mirror.py`, seguida de novo espelhamento.
- Nenhum `<a href>` pode mudar (o único teste que decide isso é `tests/check_links.py`).
- Canonical, `og:*`, `twitter:*` e JSON-LD continuam com URL absoluta `https://www.vitallmente.com.br`.
- GTM `GTM-W7Q42XQ3`, `GTM-P65HBM6M` e `GTM-TCNPZRD5` ficam onde estão hoje.
- Limite visual: ≤ 0,5% de pixels diferentes por página e viewport; viewports 1440×900 e 390×844.
- Sem backend nesta fase; `admin-ajax.php` fica como está, pendente para a fase de formulários.
- O projeto não usa git: no lugar de commits, cada tarefa termina num **checkpoint** (testes verdes + nota em `plano.md`).
- Temporários vão em `_scratch/` (gitignored quando houver git).
- A pasta `Arquivos site/` não é tocada.

## Estrutura de arquivos

```
VITALMENTE SITE /
  plano.md                     checklist de progresso (CLAUDE.md)
  tools/pages.txt              as 30 URLs (fonte única da lista de páginas)
  tools/mirror.py              espelhamento + regras de transformação
  tests/package.json           deps Node dos testes
  tests/lib.mjs                constantes e helper de rolagem compartilhados
  tests/capture.mjs            descobre os assets em tempo de execução → _scratch/requests.txt
  tests/check_forms.py         fidelidade dos 20 formulários
  tests/check_links.py         paridade de links + links internos resolvem
  tests/visual.mjs             diff de pixels original × local + rede
  tests/mask.txt               seletores de widgets de terceiros mascarados
  tests/steps.mjs              JS de etapas dos formulários inicializa igual
  site/                        SAÍDA: site estático publicável
  _scratch/original/           HTML bruto do original (base dos testes)
  _scratch/visual/             screenshots, diffs, report.txt
```

---

### Task 1: Setup (lista de páginas + dependências de teste)

**Files:**
- Create: `tools/pages.txt`, `tests/package.json`, `tests/lib.mjs`, `plano.md`

**Interfaces:**
- Produces: `tools/pages.txt` (uma URL por linha); `tests/lib.mjs` exporta `ORIGIN`, `LOCAL`, `HOST`, `PATHS: string[]`, `FORM_PATHS: string[]`, `VIEWPORTS`, `settle(page): Promise<void>`.

- [ ] **Step 1: Criar `tools/pages.txt`**

```
https://www.vitallmente.com.br/
https://www.vitallmente.com.br/privacy-policy/
https://www.vitallmente.com.br/avaliacao_meta/
https://www.vitallmente.com.br/psicoterapia/
https://www.vitallmente.com.br/furo-de-orelha/
https://www.vitallmente.com.br/homes/
https://www.vitallmente.com.br/terapia-aba/
https://www.vitallmente.com.br/anamnese-1/
https://www.vitallmente.com.br/anamnese-2/
https://www.vitallmente.com.br/politica-de-privacidade/
https://www.vitallmente.com.br/avaliacao-online/
https://www.vitallmente.com.br/avaliacao/
https://www.vitallmente.com.br/adi-r/
https://www.vitallmente.com.br/experiencia-emocionais/
https://www.vitallmente.com.br/vivencias-mocionais/
https://www.vitallmente.com.br/flexibilidade-cognitiva/
https://www.vitallmente.com.br/torre-de-londres/
https://www.vitallmente.com.br/avaliacao-comportamento/
https://www.vitallmente.com.br/vineland-3/
https://www.vitallmente.com.br/teste-raciocinio/
https://www.vitallmente.com.br/teste-atencao/
https://www.vitallmente.com.br/teste-memoria-operacional/
https://www.vitallmente.com.br/teste-tdah/
https://www.vitallmente.com.br/teste-tea/
https://www.vitallmente.com.br/teste-vitallmente-responsabilidade-social/
https://www.vitallmente.com.br/swyc/
https://www.vitallmente.com.br/teste-impulsividade/
https://www.vitallmente.com.br/teste-vitallmente-gravidade-ansiosa/
https://www.vitallmente.com.br/teste-gravidade-de-desesperanca/
https://www.vitallmente.com.br/teste-gravidade-depressiva/
```

- [ ] **Step 2: Criar `tests/package.json`**

```json
{
  "name": "vitallmente-tests",
  "private": true,
  "type": "module",
  "devDependencies": {
    "pixelmatch": "6.0.0",
    "playwright": "1.49.1",
    "pngjs": "7.0.0"
  }
}
```

- [ ] **Step 3: Criar `tests/lib.mjs`**

```js
import fs from 'node:fs';

export const ORIGIN = 'https://www.vitallmente.com.br';
export const LOCAL = 'http://localhost:8080';
export const HOST = 'www.vitallmente.com.br';
export const PATHS = fs.readFileSync(new URL('../tools/pages.txt', import.meta.url), 'utf8')
  .split(/\s+/).filter(Boolean).map(u => new URL(u).pathname);
export const FORM_PATHS = [
  '/teste-gravidade-depressiva/', '/teste-gravidade-de-desesperanca/', '/teste-vitallmente-gravidade-ansiosa/',
  '/teste-impulsividade/', '/teste-vitallmente-responsabilidade-social/', '/teste-tea/', '/teste-tdah/',
  '/teste-memoria-operacional/', '/teste-raciocinio/', '/teste-atencao/', '/anamnese-1/', '/anamnese-2/',
  '/vineland-3/', '/experiencia-emocionais/', '/vivencias-mocionais/', '/torre-de-londres/',
  '/flexibilidade-cognitiva/', '/avaliacao-comportamento/', '/adi-r/', '/swyc/',
];
export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

// Rola a página inteira para disparar lazy-load e animações de entrada do Elementor.
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
}
```

- [ ] **Step 4: Instalar e verificar**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE /tests" && npm install && npx playwright install chromium && node -e "import('./lib.mjs').then(m=>console.log(m.PATHS.length, m.FORM_PATHS.length, m.FORM_PATHS.every(p=>m.PATHS.includes(p))))"`
Expected: `30 20 true`

- [ ] **Step 5: Checkpoint.** Criar `plano.md` com as 7 tarefas deste plano em checklist e marcar a Task 1.

---

### Task 2: Descobrir os assets carregados em tempo de execução

**Files:**
- Create: `tests/capture.mjs`
- Output: `_scratch/requests.txt`

**Interfaces:**
- Consumes: `ORIGIN`, `HOST`, `PATHS`, `VIEWPORTS`, `settle` de `tests/lib.mjs`.
- Produces: `_scratch/requests.txt`, com um path decodificado por linha (só `/wp-content/` e `/wp-includes/`).

- [ ] **Step 1: Criar `tests/capture.mjs`**

```js
import { chromium } from 'playwright';
import fs from 'node:fs';
import { ORIGIN, HOST, PATHS, VIEWPORTS, settle } from './lib.mjs';

const found = new Set();
const browser = await chromium.launch();
for (const vp of Object.values(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.host === HOST && /^\/wp-(content|includes)\//.test(u.pathname)) found.add(decodeURIComponent(u.pathname));
  });
  for (const p of PATHS) {
    await page.goto(ORIGIN + p, { waitUntil: 'load', timeout: 90000 });
    await settle(page);
  }
  await ctx.close();
}
await browser.close();
fs.mkdirSync(new URL('../_scratch/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../_scratch/requests.txt', import.meta.url), [...found].sort().join('\n') + '\n');
console.log(`capturados ${found.size} assets`);
```

- [ ] **Step 2: Rodar**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE /tests" && node capture.mjs && grep -c '\.css$' ../_scratch/requests.txt && grep -c '\.js$' ../_scratch/requests.txt`
Expected: `capturados N assets` com N > 70 (só o HTML estático já referencia 70), e pelo menos 1 `.css` e 1 `.js`.

- [ ] **Step 3: Checkpoint** em `plano.md`, com o N obtido.

---

### Task 3: Espelhamento (`tools/mirror.py`)

**Files:**
- Create: `tools/mirror.py`
- Output: `site/**`, `_scratch/original/<slug>.html`, `_scratch/mirror-failures.txt`

**Interfaces:**
- Consumes: `tools/pages.txt`, `_scratch/requests.txt`.
- Produces: `rewrite(text: str) -> str` e `rewrite_html(text: str) -> str` (importados por `tests/check_forms.py`); `page_file(path: str) -> str`; o `main()` só roda com `__name__ == "__main__"`. O slug do HTML bruto é `path.strip("/") or "home"`.

- [ ] **Step 1: Escrever o teste das regras de transformação (falha antes do script existir)**

Create `tests/test_mirror.py`:

```python
#!/usr/bin/env python3
import importlib.util, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("mirror", ROOT / "tools/mirror.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

assert m.rewrite('href="https://www.vitallmente.com.br/terapia-aba"') == 'href="/terapia-aba"'
assert m.rewrite('href="https://www.vitallmente.com.br"') == 'href="/"'
assert m.rewrite('"url":"https:\\/\\/www.vitallmente.com.br\\/wp-content\\/x.js"') == '"url":"\\/wp-content\\/x.js"'
assert m.rewrite('src="//www.vitallmente.com.br/wp-content/a.png"') == 'src="/wp-content/a.png"'
assert m.rewrite('https://api.whatsapp.com/send?phone=1') == 'https://api.whatsapp.com/send?phone=1'
keep = '<link rel="canonical" href="https://www.vitallmente.com.br/x/" />'
assert m.rewrite_html(keep + '<a href="https://www.vitallmente.com.br/y/">') == keep + '<a href="/y/">'
ld = '<script type="application/ld+json">{"@id":"https://www.vitallmente.com.br/#org"}</script>'
assert m.rewrite_html(ld) == ld
assert m.page_file("/") == "index.html" and m.page_file("/terapia-aba/") == "terapia-aba/index.html"
assert m.assets_in('x https:\\/\\/www.vitallmente.com.br\\/wp-content\\/a b.png?ver=1') == {"/wp-content/a"}
assert m.assets_in('"https://www.vitallmente.com.br/wp-includes/js/jquery.min.js?ver=3"') == {"/wp-includes/js/jquery.min.js"}
assert m.css_refs("a{background:url(../img/b.png)} @import '/wp-content/c.css';", "/wp-content/css/a.css") == {"/wp-content/img/b.png", "/wp-content/c.css"}
assert m.css_refs("a{background:url(data:image/png;base64,AA)}", "/wp-content/a.css") == set()
print("test_mirror OK")
```

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tests/test_mirror.py`
Expected: FAIL (`FileNotFoundError` para `tools/mirror.py`).

- [ ] **Step 2: Implementar `tools/mirror.py`**

```python
#!/usr/bin/env python3
"""Espelha www.vitallmente.com.br em site/ como HTML estático.
Uso: python3 -I tools/mirror.py   (lê tools/pages.txt e _scratch/requests.txt)"""
import pathlib, re, urllib.parse, urllib.request

ORIGIN, HOST = "https://www.vitallmente.com.br", "www.vitallmente.com.br"
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE, RAW = ROOT / "site", ROOT / "_scratch" / "original"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"}

# Domínio próprio, inclusive escapado em JSON (https:\/\/www...). Grupo 1 = primeira barra, grupo 2 = barra após o host.
ABS = re.compile(r"(?:https?:)?(\\?/)\\?/www\.vitallmente\.com\.br(\\?/)?")
ASSET = re.compile(r"(?:https?:)?\\?/\\?/www\.vitallmente\.com\.br((?:\\?/)wp-(?:content|includes)(?:\\?/)[^\"'\s)<>?#,]+)")
# Trechos de SEO que precisam continuar absolutos.
KEEP_ABS = re.compile(r"<script[^>]+application/ld\+json[^>]*>.*?</script>|<link[^>]+rel=[\"']canonical[\"'][^>]*>"
                      r"|<meta[^>]+(?:property|name)=[\"'](?:og|twitter):[^>]*>", re.S | re.I)
# Tags de <head> que só fazem sentido com o runtime do WordPress.
WP_HEAD = re.compile(r"<link[^>]+(?:wp-json|xmlrpc\.php|wlwmanifest|rel=[\"']shortlink|/feed/|oembed)[^>]*>\s*", re.I)
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)|@import\s+['\"]([^'\"]+)['\"]")
SEO_FILES = ["robots.txt", "sitemap_index.xml", "page-sitemap.xml", "main-sitemap.xsl"]


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def rewrite(text):
    return ABS.sub(lambda m: m.group(2) or m.group(1), text)


def rewrite_html(text):
    out, last = [], 0
    for m in KEEP_ABS.finditer(text):
        out += [rewrite(text[last:m.start()]), m.group(0)]
        last = m.end()
    return "".join(out) + rewrite(text[last:])


def page_file(path):
    p = path.strip("/")
    return f"{p}/index.html" if p else "index.html"


def assets_in(text):
    return {m.group(1).replace("\\/", "/") for m in ASSET.finditer(text)}


def css_refs(css, css_path):
    refs = set()
    for m in CSS_URL.finditer(css):
        u = (m.group(1) or m.group(2)).strip()
        if u.startswith("data:"):
            continue
        p = urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN + css_path, u))
        if p.netloc == HOST:
            refs.add(p.path)
    return refs


def save(rel, data):
    dest = SITE / urllib.parse.unquote(rel).lstrip("/")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    extra = ROOT / "_scratch" / "requests.txt"
    queue = {l for l in extra.read_text(encoding="utf-8").splitlines() if l} if extra.exists() else set()
    failed = []
    for url in (ROOT / "tools" / "pages.txt").read_text().split():
        path = urllib.parse.urlsplit(url).path
        raw = fetch(url).decode("utf-8")
        (RAW / f"{path.strip('/') or 'home'}.html").write_text(raw, encoding="utf-8")
        queue |= assets_in(raw)
        save(page_file(path), WP_HEAD.sub("", rewrite_html(raw)).encode("utf-8"))
    done = set()
    while queue:
        path = queue.pop()
        if path in done:
            continue
        done.add(path)
        try:
            data = fetch(ORIGIN + urllib.parse.quote(urllib.parse.unquote(path), safe="/"))
        except Exception as e:
            failed.append(f"{path}\t{e}")
            continue
        if path.endswith(".css"):
            css = data.decode("utf-8", "replace")
            queue |= css_refs(css, path) | assets_in(css)
        if path.endswith((".css", ".js")) and b"vitallmente.com.br" in data:
            data = rewrite(data.decode("utf-8")).encode("utf-8")
        save(path, data)
    for name in SEO_FILES:
        try:
            txt = fetch(f"{ORIGIN}/{name}").decode("utf-8")
        except Exception as e:
            failed.append(f"/{name}\t{e}")
            continue
        txt = re.sub(r"<url>(?:(?!</url>).)*?__trashed(?:(?!</url>).)*?</url>\s*", "", txt, flags=re.S)
        save(name, txt.encode("utf-8"))
    (ROOT / "_scratch" / "mirror-failures.txt").write_text("\n".join(failed) + "\n", encoding="utf-8")
    print(f"assets: {len(done)} | falhas: {len(failed)} (ver _scratch/mirror-failures.txt)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Rodar o teste das regras**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tests/test_mirror.py`
Expected: `test_mirror OK`

- [ ] **Step 4: Espelhar e conferir a saída**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tools/mirror.py && find site -name index.html | wc -l && ls _scratch/original | wc -l && cat _scratch/mirror-failures.txt && grep -c __trashed site/page-sitemap.xml`
Expected: `30`, `30`, e `0` ocorrências de `__trashed`. Para cada linha em `mirror-failures.txt`, rodar `curl -s -o /dev/null -w '%{http_code}' "https://www.vitallmente.com.br<path>"`: se o original também der 404, é asset já quebrado no original (anotar em `plano.md`); se der 200, é bug do mirror e precisa ser corrigido antes de seguir.

- [ ] **Step 5: Checkpoint** em `plano.md` (número de assets e falhas com a classificação de cada uma).

---

### Task 4: Fidelidade dos formulários

**Files:**
- Create: `tests/check_forms.py`

**Interfaces:**
- Consumes: `rewrite` de `tools/mirror.py`; `_scratch/original/<slug>.html`; `site/<path>/index.html`.

- [ ] **Step 1: Criar `tests/check_forms.py`**

```python
#!/usr/bin/env python3
"""Cada <form> local é idêntico ao original (após a troca de domínio), incluindo os <script> de perguntas."""
import importlib.util, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("mirror", ROOT / "tools/mirror.py")
mirror = importlib.util.module_from_spec(spec); spec.loader.exec_module(mirror)

FORM_PAGES = ["teste-gravidade-depressiva", "teste-gravidade-de-desesperanca", "teste-vitallmente-gravidade-ansiosa",
              "teste-impulsividade", "teste-vitallmente-responsabilidade-social", "teste-tea", "teste-tdah",
              "teste-memoria-operacional", "teste-raciocinio", "teste-atencao", "anamnese-1", "anamnese-2",
              "vineland-3", "experiencia-emocionais", "vivencias-mocionais", "torre-de-londres",
              "flexibilidade-cognitiva", "avaliacao-comportamento", "adi-r", "swyc"]
FORM = re.compile(r"<form\b.*?</form>", re.S | re.I)

fail = 0
for slug in FORM_PAGES:
    raw = (ROOT / "_scratch/original" / f"{slug}.html").read_text(encoding="utf-8")
    local = (ROOT / "site" / slug / "index.html").read_text(encoding="utf-8")
    a, b = [mirror.rewrite(f) for f in FORM.findall(raw)], FORM.findall(local)
    total = re.findall(r"TOTAL_PERGUNTAS\s*=\s*(\d+)", b[0]) if b else []
    ok = bool(a) and a == b
    fail += not ok
    print(f"{'OK   ' if ok else 'FALHA'} /{slug}/  forms={len(b)}  scripts={sum(f.count('<script') for f in b)}  "
          f"TOTAL_PERGUNTAS={total[0] if total else '-'}  bytes={sum(map(len, b))}")
print("formularios:", "OK" if not fail else f"{fail} falha(s)")
sys.exit(1 if fail else 0)
```

- [ ] **Step 2: Provar que o teste pega diferença** (corromper uma cópia temporária, sem tocar em `site/`)

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && cp site/teste-tdah/index.html _scratch/tdah.bak && sed -i '' 's/TOTAL_PERGUNTAS = 18/TOTAL_PERGUNTAS = 17/' site/teste-tdah/index.html; python3 -I tests/check_forms.py; echo "exit=$?"; cp _scratch/tdah.bak site/teste-tdah/index.html`
Expected: `FALHA /teste-tdah/` e `exit=1` (o arquivo é restaurado logo em seguida).

- [ ] **Step 3: Rodar de verdade**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tests/check_forms.py`
Expected: 20 linhas `OK` e `formularios: OK`.

- [ ] **Step 4: Checkpoint.** Copiar a tabela impressa para `plano.md`; ela é o inventário de perguntas por teste para a fase de formulários.

---

### Task 5: Paridade de links

**Files:**
- Create: `tests/check_links.py`

- [ ] **Step 1: Criar `tests/check_links.py`**

```python
#!/usr/bin/env python3
"""Cada página local tem exatamente os mesmos <a href> do original, e todo link interno resolve em site/."""
import html, pathlib, re, sys, urllib.error, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW, SITE = ROOT / "_scratch/original", ROOT / "site"
A_HREF = re.compile(r"<a\b[^>]*?\bhref\s*=\s*([\"'])(.*?)\1", re.S | re.I)
DOMAIN = re.compile(r"^(?:https?:)?//www\.vitallmente\.com\.br(?=/|$)")


def hrefs(text):
    return sorted(DOMAIN.sub("", html.unescape(m.group(2)).strip()) or "/" for m in A_HREF.finditer(text))


def exists(href):
    f = SITE / urllib.parse.unquote(urllib.parse.urlsplit(href).path).lstrip("/")
    return f.is_file() or (f / "index.html").is_file()


def original_status(path):
    req = urllib.request.Request("https://www.vitallmente.com.br" + path, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


fail = 0
for url in (ROOT / "tools/pages.txt").read_text().split():
    path = urllib.parse.urlsplit(url).path
    p = path.strip("/")
    orig = hrefs((RAW / f"{p or 'home'}.html").read_text(encoding="utf-8"))
    local = hrefs((SITE / (f"{p}/index.html" if p else "index.html")).read_text(encoding="utf-8"))
    if orig != local:
        fail += 1
        print(f"FALHA {path}: só no original {sorted(set(orig) - set(local))} | só no local {sorted(set(local) - set(orig))}")
    for h in sorted(set(local)):
        if h.startswith("/") and not h.startswith("//") and not exists(h):
            st = original_status(urllib.parse.urlsplit(h).path)
            if st == 200:
                fail += 1
                print(f"FALHA {path}: {h} existe no original e falta no local")
            else:
                print(f"AVISO {path}: {h} já está quebrado no original ({st})")
print("links:", "OK" if not fail else f"{fail} falha(s)")
sys.exit(1 if fail else 0)
```

- [ ] **Step 2: Provar que o teste pega diferença**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && cp site/index.html _scratch/home.bak && sed -i '' 's#href="/terapia-aba"#href="/terapia-abaX"#' site/index.html; python3 -I tests/check_links.py; echo "exit=$?"; cp _scratch/home.bak site/index.html`
Expected: `FALHA /` citando `/terapia-aba` e `/terapia-abaX`, e `exit=1`.

- [ ] **Step 3: Rodar de verdade**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tests/check_links.py`
Expected: `links: OK`. Os `AVISO` (se houver) vão para `plano.md` como links já quebrados no site atual, para você decidir depois.

- [ ] **Step 4: Checkpoint** em `plano.md`.

---

### Task 6: Paridade visual + rede

**Files:**
- Create: `tests/visual.mjs`, `tests/mask.txt`

**Interfaces:**
- Consumes: `ORIGIN`, `LOCAL`, `OWN_HOSTS`, `PATHS`, `VIEWPORTS`, `settle`; servidor local em `:8080`.
- Produces: `_scratch/visual/<slug>-<viewport>-{original,local,diff}.png` e `_scratch/visual/report.txt`.

- [ ] **Step 1: Criar `tests/mask.txt`** (conteúdo de terceiros que muda a cada carregamento)

```
.ti-widget
iframe
```

- [ ] **Step 2: Criar `tests/visual.mjs`**

```js
import { chromium } from 'playwright';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { ORIGIN, LOCAL, OWN_HOSTS, PATHS, VIEWPORTS, settle } from './lib.mjs';

const OUT = new URL('../_scratch/visual/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const MASK = fs.readFileSync(new URL('./mask.txt', import.meta.url), 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
const LIMIT = 0.005;
const only = process.argv[2]; // opcional: um path, ex. /terapia-aba/

async function shot(ctx, url, problems) {
  const page = await ctx.newPage();
  if (url.startsWith(LOCAL)) {
    page.on('response', r => {
      // admin-ajax.php some sem WordPress de propósito; é pendência da fase de formulários.
      if (r.status() >= 400 && !r.url().includes('admin-ajax.php')) problems.push(`${r.status()} ${r.url()}`);
    });
    page.on('request', r => { if (OWN_HOSTS.includes(new URL(r.url()).host)) problems.push(`produção: ${r.url()}`); });
  }
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await settle(page);
  await page.addStyleTag({ content: FREEZE });
  const buf = await page.screenshot({ fullPage: true, mask: MASK.map(s => page.locator(s)) });
  await page.close();
  return PNG.sync.read(buf);
}

const browser = await chromium.launch();
const rows = [];
let fail = 0;
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce' });
  for (const p of PATHS.filter(x => !only || x === only)) {
    const problems = [];
    const a = await shot(ctx, ORIGIN + p, []);
    const b = await shot(ctx, LOCAL + p, problems);
    const slug = `${p.replace(/\//g, '') || 'home'}-${name}`;
    let ratio = 1;
    if (a.width === b.width && a.height === b.height) {
      const diff = new PNG({ width: a.width, height: a.height });
      ratio = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 }) / (a.width * a.height);
      fs.writeFileSync(new URL(`${slug}-diff.png`, OUT), PNG.sync.write(diff));
    } else problems.push(`tamanho original ${a.width}x${a.height} vs local ${b.width}x${b.height}`);
    fs.writeFileSync(new URL(`${slug}-original.png`, OUT), PNG.sync.write(a));
    fs.writeFileSync(new URL(`${slug}-local.png`, OUT), PNG.sync.write(b));
    const ok = ratio <= LIMIT && problems.length === 0;
    if (!ok) fail++;
    rows.push(`${ok ? 'OK   ' : 'FALHA'} ${name.padEnd(7)} ${p.padEnd(46)} diff=${(ratio * 100).toFixed(2)}% ${problems.join(' | ')}`);
    console.log(rows.at(-1));
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(new URL('report.txt', OUT), rows.join('\n') + '\n');
process.exit(fail ? 1 : 0);
```

- [ ] **Step 3: Subir o servidor local** (em background)

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -m http.server 8080 -d site`
Expected: `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/terapia-aba/` retorna `200`.

- [ ] **Step 4: Provar que o teste pega diferença numa página**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && cp site/terapia-aba/index.html _scratch/aba.bak && sed -i '' 's#</head>#<style>body{filter:invert(1)}</style></head>#' site/terapia-aba/index.html; (cd tests && node visual.mjs /terapia-aba/); echo "exit=$?"; cp _scratch/aba.bak site/terapia-aba/index.html`
Expected: `FALHA` nas duas viewports com diff alto, e `exit=1`.

- [ ] **Step 5: Rodar nas 30 páginas**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE /tests" && node visual.mjs`
Expected: 60 linhas `OK`. Para cada `FALHA`, usar **superpowers:systematic-debugging**: abrir o `-diff.png`, achar a causa (asset faltando → corrigir `mirror.py`/`capture.mjs` e re-espelhar; conteúdo de terceiro que muda a cada visita, confirmado por dois screenshots do *original* diferindo entre si → adicionar o seletor em `mask.txt` e anotar o motivo em `plano.md`). Repetir até 60 OK. Nunca aumentar o `LIMIT` para fazer passar.

- [ ] **Step 6: Checkpoint.** Anexar `_scratch/visual/report.txt` ao `plano.md`.

---

### Task 7: Etapas dos formulários inicializam igual + relatório final

**Files:**
- Create: `tests/steps.mjs`, `docs/pendencias-fase-formularios.md`

- [ ] **Step 1: Criar `tests/steps.mjs`**

```js
import { chromium } from 'playwright';
import { ORIGIN, LOCAL, FORM_PATHS, settle } from './lib.mjs';

const probe = page => page.evaluate(() => ({
  forms: document.querySelectorAll('form.elementor-form').length,
  steps: document.querySelectorAll('.e-form__step').length,
  indicators: document.querySelectorAll('.e-form__indicators__indicator').length,
  hiddenSteps: document.querySelectorAll('.e-form__step.elementor-hidden').length,
  buttons: document.querySelectorAll('.e-form__buttons button, .e-form__buttons__wrapper button').length,
}));

const browser = await chromium.launch();
const page = await browser.newPage();
let fail = 0;
for (const p of FORM_PATHS) {
  await page.goto(ORIGIN + p, { waitUntil: 'load', timeout: 90000 }); await settle(page);
  const a = await probe(page);
  await page.goto(LOCAL + p, { waitUntil: 'load', timeout: 90000 }); await settle(page);
  const b = await probe(page);
  const ok = a.forms > 0 && JSON.stringify(a) === JSON.stringify(b);
  if (!ok) fail++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${p.padEnd(46)} original=${JSON.stringify(a)} local=${JSON.stringify(b)}`);
}
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Rodar** (servidor da Task 6 no ar)

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE /tests" && node steps.mjs`
Expected: 20 linhas `OK`, com `steps > 0` em todas (confirma que o JS do Elementor rodou localmente).

- [ ] **Step 3: Levantar o que depende de backend**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && grep -rlo 'admin-ajax\.php' site --include=index.html | sort && grep -rhoE 'recaptcha[^"]{0,60}' site --include=index.html | sort -u | head`
Expected: lista das páginas com envio via `admin-ajax.php` (esperado: as 20 de formulário).

- [ ] **Step 4: Escrever `docs/pendencias-fase-formularios.md`** com: as páginas do Step 3; a tabela de perguntas da Task 4; os links já quebrados no original (Task 5); os seletores mascarados e o motivo de cada um (Task 6); e a regra "não publicar antes da fase de formulários".

- [ ] **Step 5: Rodar a bateria completa uma última vez**

Run: `cd "/Users/douglasnogueira/Desktop/VITALMENTE SITE " && python3 -I tests/test_mirror.py && python3 -I tests/check_forms.py && python3 -I tests/check_links.py && (cd tests && node visual.mjs && node steps.mjs)`
Expected: todas as suítes com exit 0.

- [ ] **Step 6: Checkpoint final** em `plano.md` e entrega com as evidências (report visual, tabela de formulários, pendências).
