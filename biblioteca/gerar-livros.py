#!/usr/bin/env python3
"""BIBLIOTECA do JC ORGANIZA: baixa livros em português que já são de domínio público
(Projeto Gutenberg) e gera um PDF de cada um, pensado para a tela do celular.

Uso:   pip install reportlab && python3 biblioteca/gerar-livros.py
       python3 biblioteca/gerar-livros.py --teste     (sem internet: gera 1 PDF de exemplo)

Lê  biblioteca/fontes.json  (50 livros + reservas) e escreve:
  biblioteca/<id>.pdf   um PDF por livro
  biblioteca/livros.json   catálogo final que o app lê (só entram os livros que deram certo, no máximo 50)
Se um livro não for encontrado, o próximo da lista de reservas entra no lugar."""
import json, os, re, sys, time, urllib.parse, urllib.request
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, NextPageTemplate

def log(*a):
    print(*a, flush=True)

AQUI = os.path.dirname(os.path.abspath(__file__))
API = "https://gutendex.com/books/"
META = 50

RAW = {}
INICIO = time.time()
LIMITE_MIN = 40   # para sozinho depois disso e salva o que já ficou pronto

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

def achar_html(item):
    """Plano B: busca no site do Gutenberg e confere idioma, título e autor no próprio texto."""
    q = urllib.parse.urlencode({"query": item["busca"] + " " + item["sobrenome"], "submit_search": "Go!"})
    h = baixar("https://www.gutenberg.org/ebooks/search/?" + q).decode("utf-8", "replace")
    ids = []
    for m in re.finditer(r'href="/ebooks/(\d+)"', h):
        if m.group(1) not in ids: ids.append(m.group(1))
    tit = sem_acento(item["busca"]); sob = sem_acento(item["sobrenome"])
    for gid in ids[:5]:
        url = "https://www.gutenberg.org/cache/epub/%s/pg%s.txt" % (gid, gid)
        try: raw = baixar(url)
        except Exception: continue
        cab = sem_acento(raw[:4000].decode("utf-8", "replace"))
        if "language: portuguese" in cab and tit in cab and sob in cab:
            RAW[url] = raw
            return gid, url
    return None

def achar(item):
    """Procura o livro no Gutenberg (idioma pt) e devolve (id, url do texto)."""
    q = urllib.parse.urlencode({"languages": "pt", "search": item["busca"] + " " + item["sobrenome"]})
    try:
        d = json.loads(baixar(API + "?" + q))
    except Exception as e:
        log("   gutendex não respondeu (%s); tentando o site do Gutenberg" % type(e).__name__)
        return achar_html(item)
    tit = sem_acento(item["busca"]); sob = sem_acento(item["sobrenome"])
    melhor = None
    for b in d.get("results", []):
        t = sem_acento(b.get("title", ""))
        a = " ".join(sem_acento(x.get("name", "")) for x in b.get("authors", []))
        if sob not in a: continue
        if tit not in t and t.split(" ; ")[0].strip() != tit: continue
        fm = b.get("formats", {})
        url = next((fm[k] for k in fm if k.startswith("text/plain")), None)
        if url and (melhor is None or len(t) < melhor[2]): melhor = (b["id"], url, len(t))
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
    capa_t = ParagraphStyle("ct", fontName="Times-Bold", fontSize=24, leading=29, alignment=TA_CENTER, spaceAfter=10)
    capa_a = ParagraphStyle("ca", fontName="Times-Roman", fontSize=15, leading=19, alignment=TA_CENTER, spaceAfter=6)
    nota = ParagraphStyle("n", fontName="Times-Italic", fontSize=9, leading=12, alignment=TA_CENTER)

    class Doc(BaseDocTemplate):
        def afterFlowable(self, f):
            if getattr(f, "_cap", None):
                chave = "c%d" % self.page
                self.canv.bookmarkPage(chave)
                self.canv.addOutlineEntry(f._cap[:60], chave, 0, 0)

    doc = Doc(saida, pagesize=A5, leftMargin=14*mm, rightMargin=14*mm, topMargin=15*mm, bottomMargin=16*mm,
              title=item["titulo"], author=item["autor"], subject="Domínio público · JC ORGANIZA")
    def rodape(c, d):
        c.saveState(); c.setFont("Times-Roman", 9)
        c.drawCentredString(A5[0] / 2, 9*mm, str(d.page - 1) if d.page > 1 else "")
        c.restoreState()
    fr = Frame(doc.leftMargin, doc.bottomMargin, A5[0] - doc.leftMargin - doc.rightMargin, A5[1] - doc.topMargin - doc.bottomMargin)
    doc.addPageTemplates([PageTemplate(id="p", frames=[fr], onPage=rodape)])

    h = [Spacer(1, 45*mm), Paragraph(escape(so_cp1252(item["titulo"])), capa_t), Paragraph(escape(so_cp1252(item["autor"])), capa_a),
         Spacer(1, 30*mm), Paragraph("%s · %s" % (item["genero"], item["ano"]), nota),
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
    log("Começando: %d livros, com limite de %d minutos." % (META, LIMITE_MIN))
    for it in fila:
        if len(feitos) >= META: break
        if time.time() - INICIO > LIMITE_MIN * 60:
            log("Tempo limite atingido; salvando o que ficou pronto."); break
        if seguidas >= 5:
            log("5 falhas seguidas: parece não haver acesso ao Gutenberg. Parando."); break
        log("-> " + it["titulo"])
        # os 50 primeiros sempre são tentados; as reservas só entram se faltar livro
        saida = os.path.join(AQUI, it["id"] + ".pdf")
        try:
            if os.path.exists(saida) and os.path.getsize(saida) > 20000:
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
    if len(cat["livros"]) < META: sys.exit("Atenção: só %d de %d livros." % (len(cat["livros"]), META))

if __name__ == "__main__":
    main()
