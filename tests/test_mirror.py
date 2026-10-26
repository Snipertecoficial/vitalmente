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
assert m.assets_in('{&quot;u&quot;:&quot;https://www.vitallmente.com.br/wp-content/a.mp4&quot;}') == {"/wp-content/a.mp4"}
assert not m.is_file("/wp-content/plugins/x") and m.is_file("/wp-content/a.png")
assert m.css_refs("a{background:url(../img/b.png)} @import '/wp-content/c.css';", "/wp-content/css/a.css") == {"/wp-content/img/b.png", "/wp-content/c.css"}
assert m.css_refs("a{background:url(data:image/png;base64,AA)}", "/wp-content/a.css") == set()
assert m.rewrite('const b = "https://vitallmente.com.br/wp-content/uploads/2026/01/";') == 'const b = "/wp-content/uploads/2026/01/";'
assert m.assets_in('"https://vitallmente.com.br/wp-content/uploads/2026/01/a.png"') == {"/wp-content/uploads/2026/01/a.png"}
assert m.rewrite('https://xvitallmente.com.br/a') == 'https://xvitallmente.com.br/a'
assert m.rewrite('https://vitallmente.com.br.evil.com/a') == 'https://vitallmente.com.br.evil.com/a'
import tempfile
with tempfile.TemporaryDirectory() as d:
    m.ROOT = pathlib.Path(d)
    try:
        m.main(); raise AssertionError("main() deveria falhar sem requests.txt")
    except SystemExit as e:
        assert "requests.txt" in str(e)
assert m.personalizar('href="https://api.whatsapp.com/send?phone=5511950698711"') == 'href="https://api.whatsapp.com/send?phone=5511917738711"'
assert m.personalizar("https://wa.me//5511945443760?text=x") == "https://wa.me//5511917738711?text=x"
assert m.personalizar(">11 91399-8711<") == ">11 91773-8711<" and m.personalizar(">11 97290 8711<") == ">(11) 91773-8711<"
assert m.personalizar("5511917738711") == "5511917738711"
assert m.injetar_detalhe("<body>x</body>", "/teste-atencao/") == '<body>x<script src="/vitallmente-detalhe.js" defer></script>\n</body>'
assert m.injetar_detalhe("<body>x</body>", "/teste-tdah/") == "<body>x</body>"
assert m.injetar_detalhe(m.injetar_detalhe("<body></body>", "/teste-raciocinio/"), "/teste-raciocinio/").count("vitallmente-detalhe") == 1
assert m.injetar_detalhe("<form></body></form></body>", "/teste-atencao/") == '<form></body></form><script src="/vitallmente-detalhe.js" defer></script>\n</body>'
g = m.injetar_google_ads("<html><head><title>x</title></head></html>")
assert g.startswith("<html><head>\n<!-- Google tag (gtag.js) -->") and g.count("AW-11341904031") == 2
assert m.injetar_google_ads(g) == g  # não duplica
print("test_mirror OK")
