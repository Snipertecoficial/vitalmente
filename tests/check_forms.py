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
    a, b = [mirror.personalizar(mirror.rewrite(f)) for f in FORM.findall(raw)], FORM.findall(local)
    total = re.findall(r"TOTAL_PERGUNTAS\s*=\s*(\d+)", b[0]) if b else []
    ok = bool(a) and a == b
    fail += not ok
    print(f"{'OK   ' if ok else 'FALHA'} /{slug}/  forms={len(b)}  scripts={sum(f.count('<script') for f in b)}  "
          f"TOTAL_PERGUNTAS={total[0] if total else '-'}  bytes={sum(map(len, b))}")
print("formularios:", "OK" if not fail else f"{fail} falha(s)")
sys.exit(1 if fail else 0)
