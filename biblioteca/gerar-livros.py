#!/usr/bin/env python3
"""BIBLIOTECA do JC ORGANIZA: baixa livros em português que já são de domínio público
(Projeto Gutenberg) e gera um PDF de cada um, pensado para a tela do celular.

Uso:   pip install reportlab && python3 biblioteca/gerar-livros.py
       python3 biblioteca/gerar-livros.py --teste     (sem internet: gera 1 PDF de exemplo)

Lê  biblioteca/fontes.json  (todos os livros candidatos) e escreve:
  biblioteca/<id>.pdf   um PDF por livro
  biblioteca/livros.json   catálogo final que o app lê (só entram os livros que deram certo, no máximo META)
Se um livro não for encontrado, o próximo da lista de reservas entra no lugar."""
import json, os, re, sys, time, urllib.parse, urllib.request
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.units import mm
from reportlab.lib import colors
import colorsys, math
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, NextPageTemplate

def log(*a):
    print(*a, flush=True)

AQUI = os.path.dirname(os.path.abspath(__file__))
API = "https://gutendex.com/books/"
META = 356   # teto: 56 livros originais + 300 novos; os candidatos que passam disso são reservas e só entram se algum livro não for encontrado

RAW = {}
REFAZER = os.environ.get("REFAZER") == "1" or "--refazer" in sys.argv   # recria também os PDFs que já existem (para ganharem capa)

def matiz(id_):
    """Mesma cor do app (função biCor do index.html), para a capa do PDF combinar com a da lista."""
    n = 0
    for ch in id_: n = (n * 31 + ord(ch)) % 360
    return n

DOURADO = colors.HexColor("#f3e3b0")

def desenhar_capa(c, item, W, H):
    h = matiz(item["id"]) / 360.0
    fundo = colorsys.hls_to_rgb(h, 0.24, 0.50); topo = colorsys.hls_to_rgb(h, 0.33, 0.48)
    c.saveState()
    c.setFillColorRGB(*fundo); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColorRGB(*topo); c.rect(0, H * 0.55, W, H * 0.45, stroke=0, fill=1)      # faixa mais clara em cima
    c.setStrokeColor(DOURADO); c.setLineWidth(1.6); c.rect(12 * mm, 12 * mm, W - 24 * mm, H - 24 * mm, stroke=1, fill=0)
    c.setLineWidth(0.6); c.rect(15 * mm, 15 * mm, W - 30 * mm, H - 30 * mm, stroke=1, fill=0)
    cx, cy = W / 2, H - 38 * mm
    c.setLineWidth(1.4); g = item.get("genero")
    if g == "Poesia":
        c.circle(cx, cy, 6 * mm, stroke=1, fill=0)
        for a in range(0, 360, 45):
            r = math.radians(a); c.line(cx + 9 * mm * math.cos(r), cy + 9 * mm * math.sin(r), cx + 13 * mm * math.cos(r), cy + 13 * mm * math.sin(r))
    elif g == "Contos":
        for dx in (-12, 0, 12): c.circle(cx + dx * mm, cy, 3 * mm, stroke=1, fill=0)
    elif g == "Teatro":
        c.circle(cx - 7 * mm, cy, 8 * mm, stroke=1, fill=0); c.circle(cx + 7 * mm, cy, 8 * mm, stroke=1, fill=0)
    elif g == "Clássico":
        for dx in (-6, 0, 6): c.line(cx + dx * mm, cy - 8 * mm, cx + dx * mm, cy + 8 * mm)
        c.line(cx - 10 * mm, cy + 11 * mm, cx + 10 * mm, cy + 11 * mm); c.line(cx - 10 * mm, cy - 11 * mm, cx + 10 * mm, cy - 11 * mm)
    else:
        p = c.beginPath(); p.moveTo(cx, cy + 12 * mm); p.lineTo(cx + 12 * mm, cy); p.lineTo(cx, cy - 12 * mm); p.lineTo(cx - 12 * mm, cy); p.close()
        c.drawPath(p, stroke=1, fill=0); c.circle(cx, cy, 2.5 * mm, stroke=1, fill=0)
    c.setLineWidth(0.6); c.line(cx - 25 * mm, cy - 17 * mm, cx + 25 * mm, cy - 17 * mm)
    c.restoreState()
INICIO = time.time()
LIMITE_MIN = 200   # para sozinho depois disso e salva o que já ficou pronto (rode de novo para continuar)

def baixar(url, tent=2):
    for i in range(tent):
        try:
            rq = urllib.request.Request(url, headers={"User-Agent": "JC-ORGANIZA-biblioteca/1.0"})
            with urllib.request.urlopen(rq, timeout=25) as r:
                return r.read()
        except Exception as e:
            if i == tent - 1: raise
            time.sleep(2)

def sem_acento(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")

def norm(s):
    """Normaliza para comparar grafia antiga e nova (Posthumas/Póstumas, Braz/Brás, Eça/Eca...)."""
    s = sem_acento(s)
    for a, b in (("ph", "f"), ("th", "t"), ("y", "i"), ("z", "s"), ("w", "v"), ("k", "c"), ("ch", "c")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"(.)\1+", r"\1", s)          # letras dobradas: Posthumas/Postumas, Ressurreicao/Resurreicao
    return re.sub(r"\s+", " ", s).strip()

def parecido(titulo_item, titulo_livro):
    a = norm(titulo_item); b = norm(re.split(r"[;:]", titulo_livro)[0])
    if not a or not b: return 0
    if a == b: return 1.0
    if a in b.split(" ; ")[0] and len(a) >= 6: return 0.9
    import difflib
    return difflib.SequenceMatcher(None, a, b).ratio()

def candidatos_html(item):
    """Lista (id, título) do site do Gutenberg: busca por título e por autor, só português."""
    vistos, res = set(), []
    consultas = [item["busca"] + " " + item["sobrenome"],
                 "l.pt " + item["sobrenome"],
                 item["busca"]]
    for c in consultas:
        try:
            h = baixar("https://www.gutenberg.org/ebooks/search/?" + urllib.parse.urlencode({"query": c, "submit_search": "Go!"})).decode("utf-8", "replace")
        except Exception:
            continue
        for m in re.finditer(r'<li class="booklink">.*?href="/ebooks/(\d+)".*?class="title">([^<]+)<', h, re.S):
            if m.group(1) not in vistos:
                vistos.add(m.group(1)); res.append((m.group(1), m.group(2)))
        for m in re.finditer(r'href="/ebooks/(\d+)"', h):   # plano C: ids soltos, conferidos pelo cabeçalho
            if m.group(1) not in vistos:
                vistos.add(m.group(1)); res.append((m.group(1), ""))
    return res

def achar_html(item):
    """Plano B: busca no site do Gutenberg e confere idioma, título e autor no próprio texto."""
    cands = candidatos_html(item)
    cands.sort(key=lambda c: -parecido(item["busca"], c[1]) if c[1] else 0)
    sob = norm(item["sobrenome"])
    for gid, t in cands[:8]:
        if t and parecido(item["busca"], t) < 0.72: continue
        url = "https://www.gutenberg.org/cache/epub/%s/pg%s.txt" % (gid, gid)
        try: raw = baixar(url)
        except Exception: continue
        cab = norm(raw[:5000].decode("utf-8", "replace"))
        if "language portuguese" in cab and sob in cab and (norm(item["busca"]) in cab or parecido(item["busca"], t) >= 0.72):
            RAW[url] = raw
            return gid, url
    return None

def achar(item):
    """Procura o livro no Gutenberg (idioma pt) e devolve (id, url do texto)."""
    if item.get("gid"):                      # número fixo do Gutenberg, se informado em fontes.json
        url = "https://www.gutenberg.org/cache/epub/%s/pg%s.txt" % (item["gid"], item["gid"])
        return str(item["gid"]), url
    q = urllib.parse.urlencode({"languages": "pt", "search": item["busca"] + " " + item["sobrenome"]})
    try:
        d = json.loads(baixar(API + "?" + q))
    except Exception as e:
        log("   gutendex não respondeu (%s); tentando o site do Gutenberg" % type(e).__name__)
        return achar_html(item)
    sob = norm(item["sobrenome"])
    melhor = None
    for b in d.get("results", []):
        a = " ".join(norm(x.get("name", "")) for x in b.get("authors", []))
        if sob not in a: continue
        pt = parecido(item["busca"], b.get("title", ""))
        if pt < 0.72: continue
        fm = b.get("formats", {})
        url = next((fm[k] for k in fm if k.startswith("text/plain")), None)
        if url and (melhor is None or pt > melhor[2]): melhor = (b["id"], url, pt)
    return melhor[:2] if melhor else achar_html(item)

def limpar_gutenberg(txt):
    txt = txt.replace("\r\n", "\n").replace("\ufeff", "")
    m = re.search(r"\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*?\*\*\*", txt, re.S)
    if m: txt = txt[m.end():]
    m = re.search(r"\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK", txt)
    if m: txt = txt[:m.start()]
    return txt.strip()

def so_cp1252(s):
    return s.encode("cp1252", "replace").decode("cp1252")

TITULO = re.compile(r"^(cap[ií]tulo|livro|canto|parte|ato|prefácio|prefacio|introdu[cç][aã]o|[ivxlcdm]+\.?|\d+\.?)(\s|$)", re.I)

def paragrafos(txt):
    for bloco in re.split(r"\n\s*\n", txt):
        linhas = [l.strip() for l in bloco.split("\n") if l.strip()]
        if not linhas: continue
        yield linhas

def gerar_pdf(item, texto, saida, fonte_txt):
    corpo = ParagraphStyle("c", fontName="Times-Roman", fontSize=11.5, leading=16, alignment=TA_JUSTIFY, firstLineIndent=10, spaceAfter=4)
    verso = ParagraphStyle("v", parent=corpo, alignment=0, firstLineIndent=0, leftIndent=8, spaceAfter=7)
    cap = ParagraphStyle("h", fontName="Times-Bold", fontSize=15, leading=19, alignment=TA_CENTER, spaceBefore=18, spaceAfter=12, keepWithNext=1)
    capa_t = ParagraphStyle("ct", fontName="Times-Bold", fontSize=24, leading=29, alignment=TA_CENTER, spaceAfter=10, textColor=DOURADO)
    capa_a = ParagraphStyle("ca", fontName="Times-Roman", fontSize=15, leading=19, alignment=TA_CENTER, spaceAfter=6, textColor=colors.white)
    nota = ParagraphStyle("n", fontName="Times-Italic", fontSize=9, leading=12, alignment=TA_CENTER, textColor=DOURADO)

    class Doc(BaseDocTemplate):
        def afterFlowable(self, f):
            if getattr(f, "_cap", None):
                chave = "c%d" % self.page
                self.canv.bookmarkPage(chave)
                self.canv.addOutlineEntry(f._cap[:60], chave, 0, 0)

    doc = Doc(saida, pagesize=A5, leftMargin=14*mm, rightMargin=14*mm, topMargin=15*mm, bottomMargin=16*mm,
              title=item["titulo"], author=item["autor"], subject="Domínio público · JC ORGANIZA")
    def rodape(c, d):
        if d.page == 1:
            desenhar_capa(c, item, A5[0], A5[1]); return
        c.saveState(); c.setFont("Times-Roman", 9)
        c.drawCentredString(A5[0] / 2, 9*mm, str(d.page - 1) if d.page > 1 else "")
        c.restoreState()
    fr = Frame(doc.leftMargin, doc.bottomMargin, A5[0] - doc.leftMargin - doc.rightMargin, A5[1] - doc.topMargin - doc.bottomMargin)
    doc.addPageTemplates([PageTemplate(id="p", frames=[fr], onPage=rodape)])

    h = [Spacer(1, 52*mm), Paragraph(escape(so_cp1252(item["titulo"])), capa_t), Paragraph(escape(so_cp1252(item["autor"])), capa_a),
         Spacer(1, 26*mm), Paragraph("%s · %s" % (item["genero"], item["ano"]), nota),
         Paragraph(escape(so_cp1252(fonte_txt)), nota), PageBreak()]
    n_par = 0
    for linhas in paragrafos(texto):
        curto = len(linhas) == 1 and len(linhas[0]) <= 60
        eh_cap = curto and (linhas[0].isupper() or TITULO.match(linhas[0]))
        if eh_cap:
            p = Paragraph(escape(so_cp1252(linhas[0])), cap); p._cap = so_cp1252(linhas[0]); h.append(p)
        elif len(linhas) > 1 and max(len(l) for l in linhas) < 55:
            h.append(Paragraph("<br/>".join(escape(so_cp1252(l)) for l in linhas), verso))   # poesia: mantém os versos
        else:
            h.append(Paragraph(escape(so_cp1252(" ".join(linhas))), corpo))
        n_par += 1
    doc.build(h)
    return doc.page

def main():
    teste = "--teste" in sys.argv
    fontes = json.load(open(os.path.join(AQUI, "fontes.json"), encoding="utf-8"))
    if teste:
        it = fontes[0]
        txt = "CAPÍTULO I\n\n" + "\n\n".join("Este é o parágrafo %d do livro de teste, com acentuação: ação, coração, órgão, é, à, ü." % i * 6 for i in range(1, 60))
        n = gerar_pdf(it, txt, os.path.join(AQUI, "teste.pdf"), "PDF de teste do gerador")
        log("teste.pdf com", n, "páginas"); return
    feitos, falhas, seguidas = [], [], 0
    fila = list(fontes)
    log("Começando: %d livros candidatos, com limite de %d minutos." % (len(fila), LIMITE_MIN))
    for it in fila:
        if len(feitos) >= META: break
        if time.time() - INICIO > LIMITE_MIN * 60:
            log("Tempo limite atingido; salvando o que ficou pronto."); break
        if seguidas >= 8 and not feitos:
            log("8 falhas seguidas e nenhum livro pronto: parece não haver acesso ao Gutenberg. Parando."); break
        log("-> " + it["titulo"])
        # os 50 primeiros sempre são tentados; as reservas só entram se faltar livro
        saida = os.path.join(AQUI, it["id"] + ".pdf")
        try:
            if not REFAZER and os.path.exists(saida) and os.path.getsize(saida) > 20000:
                log("já existe:", it["titulo"]); tam = os.path.getsize(saida)
                feitos.append(dict(it, paginas=it.get("paginas", 0), mb=round(tam/1048576, 1))); continue
            ach = achar(it)
            if not ach: raise RuntimeError("não encontrado no Gutenberg")
            gid, url = ach
            raw = RAW.pop(url, None) or baixar(url)
            try: txt = raw.decode("utf-8")
            except UnicodeDecodeError: txt = raw.decode("latin-1")
            txt = limpar_gutenberg(txt)
            if len(txt) < 8000: raise RuntimeError("texto muito curto")
            pg = gerar_pdf(it, txt, saida, "Texto em domínio público · Projeto Gutenberg nº %s" % gid)
            tam = os.path.getsize(saida)
            log("ok: %-45s %4d páginas  %.1f MB" % (it["titulo"], pg, tam / 1048576))
            feitos.append(dict(it, paginas=pg, mb=round(tam / 1048576, 1))); seguidas = 0
            time.sleep(1)
        except Exception as e:
            log("FALHOU:", it["titulo"], "->", e); falhas.append(it["titulo"]); seguidas += 1
    cat = {"atualizado": time.strftime("%Y-%m-%d"),
           "livros": [{k: l[k] for k in ("id", "titulo", "autor", "genero", "ano", "paginas", "mb") if k in l} for l in feitos[:META]]}
    if feitos:   # nunca apaga o catálogo se nada deu certo
            json.dump(cat, open(os.path.join(AQUI, "livros.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    log("\n%d livros prontos. Falharam: %s" % (len(cat["livros"]), ", ".join(falhas) or "nenhum"))
    if not feitos: sys.exit("Nenhum livro foi gerado.")
    if len(cat["livros"]) < len(fontes): log("Aviso: só %d de %d livros candidatos. Rode de novo para tentar os que faltam (os já prontos são mantidos)." % (len(cat["livros"]), len(fontes)))

if __name__ == "__main__":
    main()
