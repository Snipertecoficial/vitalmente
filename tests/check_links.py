#!/usr/bin/env python3
"""Cada página local tem exatamente os mesmos <a href> do original, e todo link interno resolve em site/."""
import html, pathlib, re, sys, urllib.error, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW, SITE = ROOT / "_scratch/original", ROOT / "site"
A_HREF = re.compile(r"<a\b[^>]*?\bhref\s*=\s*([\"'])(.*?)\1", re.S | re.I)
DOMAIN = re.compile(r"^(?:https?:)?//(?:www\.)?vitallmente\.com\.br(?=/|$)")


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
