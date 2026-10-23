#!/usr/bin/env python3
"""Espelha www.vitallmente.com.br em site/ como HTML estático.
Uso: python3 -I tools/mirror.py   (lê tools/pages.txt e _scratch/requests.txt)"""
import pathlib, re, shutil, urllib.error, urllib.parse, urllib.request

ORIGIN, HOST = "https://www.vitallmente.com.br", "www.vitallmente.com.br"
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE, RAW = ROOT / "site", ROOT / "_scratch" / "original"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"}

# Domínio próprio, inclusive escapado em JSON (https:\/\/www...). Grupo 1 = primeira barra, grupo 2 = barra após o host.
ABS = re.compile(r"(?:https?:)?(\\?/)\\?/(?:www\.)?vitallmente\.com\.br(?![\w.-])(\\?/)?")
ASSET = re.compile(r"(?:https?:)?\\?/\\?/(?:www\.)?vitallmente\.com\.br((?:\\?/)wp-(?:content|includes)(?:\\?/)(?:(?!&quot;)[^\"'\s)<>?#,])+)")
# Trechos de SEO que precisam continuar absolutos.
KEEP_ABS = re.compile(r"<script[^>]+application/ld\+json[^>]*>.*?</script>|<link[^>]+rel=[\"']canonical[\"'][^>]*>"
                      r"|<meta[^>]+(?:property|name)=[\"'](?:og|twitter):[^>]*>", re.S | re.I)
# Tags de <head> que só fazem sentido com o runtime do WordPress.
WP_HEAD = re.compile(r"<link[^>]+(?:wp-json|xmlrpc\.php|wlwmanifest|rel=[\"']shortlink|/feed/|oembed)[^>]*>\s*", re.I)
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)|@import\s+['\"]([^'\"]+)['\"]")
SITEMAP_XSL = "/wp-content/plugins/wordpress-seo/css/main-sitemap.xsl"  # referenciado pelos sitemaps
SEO_FILES = ["robots.txt", "sitemap_index.xml", "page-sitemap.xml", "main-sitemap.xsl"]
# Personalizações pedidas pelo cliente (únicas diferenças intencionais em relação ao original).
# 2026-10-22: todos os WhatsApp passam a ser o 11 91773-8711.
TROCAS = {
    "5511950698711": "5511917738711",
    "5511945443760": "5511917738711",
    "5511913998711": "5511917738711",
    "5511991148332": "5511917738711",
    "11 91399-8711": "11 91773-8711",
    "11 97290 8711": "11 91773 8711",
}


def fetch(url):
    for i in range(3):  # timeouts esporádicos do servidor de origem
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError:
            raise
        except OSError:
            if i == 2:
                raise


def rewrite(text):
    return ABS.sub(lambda m: m.group(2) or m.group(1), text)


def rewrite_html(text):
    out, last = [], 0
    for m in KEEP_ABS.finditer(text):
        out += [rewrite(text[last:m.start()]), m.group(0)]
        last = m.end()
    return "".join(out) + rewrite(text[last:])


def personalizar(text):
    for old, new in TROCAS.items():
        text = text.replace(old, new)
    return text


def page_file(path):
    p = path.strip("/")
    return f"{p}/index.html" if p else "index.html"


def assets_in(text):
    return {m.group(1).replace("\\/", "/") for m in ASSET.finditer(text)}


def is_file(path):
    return "." in path.rsplit("/", 1)[-1]  # URLs-base de diretório (ex.: wprevpluginsurl) não são assets


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
    extra = ROOT / "_scratch" / "requests.txt"
    if not extra.exists():
        raise SystemExit(f"erro: {extra} não existe; rode tests/capture.mjs antes (build reprodutível exige a lista de requests)")
    shutil.rmtree(SITE, ignore_errors=True)  # site/ é 100% gerado
    RAW.mkdir(parents=True, exist_ok=True)
    queue = {l for l in extra.read_text(encoding="utf-8").splitlines() if l} | {SITEMAP_XSL}
    failed = []
    for url in (ROOT / "tools" / "pages.txt").read_text().split():
        path = urllib.parse.urlsplit(url).path
        raw = fetch(url).decode("utf-8")
        (RAW / f"{path.strip('/') or 'home'}.html").write_text(raw, encoding="utf-8")
        queue |= assets_in(raw)
        save(page_file(path), personalizar(WP_HEAD.sub("", rewrite_html(raw))).encode("utf-8"))
    done = set()
    while queue:
        path = queue.pop()
        if path in done or not is_file(path):
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
