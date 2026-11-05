#!/usr/bin/env python3
"""Robô do Atacadão (JC ORGANIZA).

  python scripts/atacadao.py coletar   -> procura folhetos em PDF no site e baixa os novos
                                          para folhetos/atacadao/
  python scripts/atacadao.py ler       -> lê todos os PDFs de folhetos/atacadao/ e grava
                                          promocoes/atacadao.json (é o que o app lê)

Também dá para colocar PDFs à mão na pasta folhetos/atacadao/ (pelo celular, no GitHub):
o robô roda sozinho e o app atualiza.
"""
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "folhetos" / "atacadao"
SAIDA = RAIZ / "promocoes" / "atacadao.json"
DEBUG = RAIZ / "debug-atacadao"
PAGINAS = [
    "https://www.atacadao.com.br/loja/olinda",
    "https://www.atacadao.com.br/institucional/nossas-lojas",
    "https://www.atacadao.com.br/catalogo",
]
DIAS_GUARDAR_VENCIDO = 14  # PDFs vencidos há mais que isso são apagados da pasta


def hoje():
    # horário de Brasília (UTC-3), sem depender do fuso do servidor
    return (dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) - dt.timedelta(hours=3)).date()


# ----------------------------------------------------------------- leitura dos PDFs
def preco(txt):
    m = re.search(r"R\$\s*([\d.]+,\d{2})", txt or "")
    return float(m.group(1).replace(".", "").replace(",", ".")) if m else 0.0


def datas(txt, ref_ano=None):
    """'05/11/2026' ou '05/11 a 08/11/2026' ou '28/12 a 03/01/2027' -> (ini, fim) em ISO."""
    d = re.findall(r"(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?", txt or "")
    if not d:
        return None
    def mk(dia, mes, ano):
        ano = int(ano) if ano else (ref_ano or hoje().year)
        ano += 2000 if ano < 100 else 0
        return dt.date(ano, int(mes), int(dia))
    ult = d[-1]
    fim = mk(ult[0], ult[1], ult[2])
    if len(d) == 1:
        return fim.isoformat(), fim.isoformat()
    p = d[0]
    ini = mk(p[0], p[1], p[2] or str(fim.year))
    if ini > fim:  # virada de ano
        ini = ini.replace(year=ini.year - 1)
    return ini.isoformat(), fim.isoformat()


def nome_desc(prod):
    """'Café X (vácuo, 250 g)' -> ('Café X', 'vácuo, 250 g')."""
    p = re.sub(r"\s+", " ", (prod or "").replace("\n", " ")).strip()
    m = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", p)
    if m and m.group(1):
        return m.group(1).strip(), m.group(2).strip()
    return p, ""


def ler_pdf(caminho):
    import pdfplumber

    itens, setor, validade = [], "", ""
    with pdfplumber.open(caminho) as pdf:
        cab = (pdf.pages[0].extract_text() or "") if pdf.pages else ""
        m = re.search(r"Setor:\s*(.+)", cab)
        setor = m.group(1).strip() if m else ""
        m = re.search(r"v[aá]lida?:\s*(.+)", cab, re.I)
        validade = m.group(1).strip() if m else ""
        for pg in pdf.pages:
            for tab in pg.extract_tables():
                for lin in tab:
                    if not lin or len(lin) < 2:
                        continue
                    p = preco(lin[1])
                    if p <= 0:
                        continue  # cabeçalho ou linha sem preço
                    n, d = nome_desc(lin[0])
                    if not n:
                        continue
                    if len(lin) >= 4 and not validade:
                        validade = (lin[3] or "").replace("\n", " ")
                    if len(lin) >= 3 and not setor:
                        setor = re.sub(r"\s+", " ", (lin[2] or ""))
                    itens.append([n, d, p])
    return setor, validade, itens


def ler():
    PASTA.mkdir(parents=True, exist_ok=True)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    h = hoje()
    listas, erros = [], []
    for pdf in sorted(PASTA.glob("*.pdf")):
        try:
            setor, validade, itens = ler_pdf(pdf)
            dd = datas(validade)
            if not itens or not dd:
                erros.append(f"{pdf.name}: sem itens ({len(itens)}) ou sem validade ({validade!r})")
                continue
            ini, fim = dd
            if dt.date.fromisoformat(fim) < h - dt.timedelta(days=DIAS_GUARDAR_VENCIDO):
                pdf.unlink()
                print(f"apagado (vencido): {pdf.name}")
                continue
            if dt.date.fromisoformat(fim) < h:
                print(f"vencido, fora do app: {pdf.name}")
                continue
            listas.append({"t": setor or pdf.stem, "ini": ini, "fim": fim, "arq": pdf.name, "itens": itens})
            print(f"ok: {pdf.name} -> {len(itens)} itens, {ini} a {fim}")
        except Exception as e:  # um PDF ruim não derruba os outros
            erros.append(f"{pdf.name}: {e}")
    for e in erros:
        print("AVISO:", e)
    listas.sort(key=lambda x: (x["ini"], x["t"]))
    novo = {"mercado": "atacadao", "listas": listas}
    antigo = {}
    if SAIDA.exists():
        try:
            antigo = json.loads(SAIDA.read_text(encoding="utf-8"))
        except Exception:
            pass
    if {k: v for k, v in antigo.items() if k != "atualizado"} == novo:
        print("Nada mudou.")
        return
    novo["atualizado"] = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None).replace(microsecond=0).isoformat() + "Z"
    SAIDA.write_text(json.dumps(novo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Gravado {SAIDA.relative_to(RAIZ)}: {len(listas)} listas.")
    if erros and not listas:
        sys.exit(1)


# ----------------------------------------------------------------- coleta no site
def coletar():
    """Abre as páginas do Atacadão num navegador (o site é montado por JavaScript), junta os
    links de PDF que aparecerem (no HTML e nas respostas de rede) e baixa os que ainda não temos.
    Tudo o que encontrar é anotado em debug-atacadao/relatorio.txt."""
    from playwright.sync_api import sync_playwright

    PASTA.mkdir(parents=True, exist_ok=True)
    DEBUG.mkdir(exist_ok=True)
    achados, rel = {}, []
    with sync_playwright() as p:
        nav = p.chromium.launch()
        ctx = nav.new_context(locale="pt-BR", viewport={"width": 1280, "height": 900})
        for url in PAGINAS:
            pg = ctx.new_page()
            vistos = []

            def resp(r, vistos=vistos):
                u = r.url
                ct = (r.headers.get("content-type") or "").lower()
                if "pdf" in ct or u.lower().split("?")[0].endswith(".pdf"):
                    achados[u] = "rede"
                if re.search(r"folheto|encarte|catalogo|leaflet|flyer", u, re.I):
                    vistos.append(f"{r.status} {ct[:30]} {u[:200]}")

            pg.on("response", resp)
            try:
                pg.goto(url, wait_until="networkidle", timeout=60000)
                pg.wait_for_timeout(3000)
                for a in pg.eval_on_selector_all("a[href]", "els=>els.map(e=>e.href)"):
                    if a.lower().split("?")[0].endswith(".pdf"):
                        achados[a] = "link"
                pg.screenshot(path=str(DEBUG / (hashlib.md5(url.encode()).hexdigest()[:6] + ".png")))
                rel.append(f"[{url}] título={pg.title()!r}; respostas de folheto/encarte: {len(vistos)}")
                rel += ["   " + v for v in vistos[:30]]
            except Exception as e:
                rel.append(f"[{url}] erro: {e}")
            pg.close()
        # baixa só PDFs de ofertas (evita regulamentos, políticas etc.)
        for u, origem in achados.items():
            nome = re.sub(r"[^A-Za-z0-9._-]", "_", u.split("?")[0].rsplit("/", 1)[-1]) or "folheto.pdf"
            alvo = PASTA / nome
            rel.append(f"PDF ({origem}): {u} -> {nome}{' (já existe)' if alvo.exists() else ''}")
            if alvo.exists():
                continue
            try:
                r = ctx.request.get(u, timeout=60000)
                if r.ok and r.body()[:4] == b"%PDF":
                    alvo.write_bytes(r.body())
                    rel.append("   baixado")
            except Exception as e:
                rel.append(f"   falhou: {e}")
        nav.close()
    if not achados:
        rel.append("Nenhum PDF encontrado no site nesta rodada.")
    (DEBUG / "relatorio.txt").write_text("\n".join(rel) + "\n", encoding="utf-8")
    print("\n".join(rel))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "coletar":
        coletar()
    elif cmd == "ler":
        ler()
    else:
        print(__doc__)
        sys.exit(2)
