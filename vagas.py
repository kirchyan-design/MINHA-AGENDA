#!/usr/bin/env python3
"""Coleta vagas CLT (Recife, Olinda, Paulista, Jaboatão) e grava vagas/clt.json, que o app lê no menu CLT.
Fontes: API pública do portal Gupy (sem chave) e Adzuna (opcional: secrets ADZUNA_ID e ADZUNA_KEY).
Se nenhuma fonte responder, o arquivo anterior é mantido (nunca fica vazio)."""
import json, os, re, sys, hashlib, urllib.request, urllib.parse, datetime as dt

CID = {"Recife": "R", "Olinda": "O", "Paulista": "P", "Jaboatão dos Guararapes": "J"}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SAIDA = os.path.join(ROOT, "vagas", "clt.json")
REL = os.path.join(ROOT, "debug-vagas")
log = []

def L(m):
    print(m); log.append(m)

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; MinhaAgendaBot/1.0)", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def limpa(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()

AREAS = [
 ("apr", r"aprendiz|estagi"), ("sau", r"enfermeir|técnico de enfermagem|médic|farmac|dentista|fisioterap|nutricion|psicólog|saúde"),
 ("edu", r"professor|pedagog|educador|instrutor"), ("tec", r"desenvolvedor|programador|suporte|\bti\b|telecom|dados|sistemas|redes"),
 ("fin", r"financeir|contábil|contador|fiscal|tesouraria|faturamento|contas a"), ("rh", r"recursos humanos|recrutador|\brh\b|departamento pessoal"),
 ("ate", r"atendente|atendimento|cobrança|telemarketing|call center|sac\b"), ("com", r"vendedor|vendas|comercial|promotor|caixa|loja|balconista"),
 ("log", r"motorista|estoque|estoquista|almoxarif|logístic|entregador|ajudante de carga|separador|conferente|expedição"),
 ("ind", r"produção|operador de máquina|industrial|soldador|embalador"), ("cons", r"pedreiro|eletricista|mecânic|manuten|marceneiro|serralheiro|pintor|obra"),
 ("ali", r"cozinh|garçom|garcom|bartender|padeiro|açougue|restaurante|hotel|copeiro"), ("ser", r"limpeza|vigilante|porteiro|segurança|zelador|serviços gerais|jardineiro"),
 ("adm", r"administrativ|assistente|secretári|recepcion|auxiliar"),
]
SUP = r"analista|engenheir|enfermeir|advogad|pedagog|contador|gerente|coordenador|médic|psicólog|nutricion|farmac|supervisor|arquitet|desenvolvedor|especialista"
FUN = r"limpeza|ajudante|servente|serviços gerais|porteiro|zelador|auxiliar de cozinha|auxiliar de produção|embalador|jardineiro|copeiro"

def area(t):
    for k, rx in AREAS:
        if re.search(rx, t, re.I): return k
    return "adm"

def nivel(t):
    if re.search(SUP, t, re.I): return "S"
    if re.search(FUN, t, re.I): return "F"
    return "M"

def extras(txt):
    x = {}
    ben = []
    for m in re.findall(r"vale[- ](?:transporte|refeição|alimentação)|plano (?:de saúde|odontológico)|seguro de vida|cesta básica|comiss(?:ão|ões)|premiação|PLR|auxílio[- ][a-zçã]+", txt, re.I):
        m = m.capitalize()
        if m not in ben: ben.append(m)
    if ben: x["b"] = ", ".join(ben)
    h = []
    for rx in [r"\d{1,2}h(?:\d{2})?\s*(?:às|as|a|-|–)\s*\d{1,2}h(?:\d{2})?", r"segunda a (?:sexta|sábado|sabado)[^.;,]{0,25}", r"escala\s*\d+\s*[x×]\s*\d+", r"\d{2}\s*h(?:oras)?\s*semanais"]:
        m = re.search(rx, txt, re.I)
        if m: h.append(m.group(0).strip())
    if h: x["h"] = " · ".join(h)
    m = re.search(r"[\w.+\-]+@[\w\-]+(?:\.[\w\-]+)+", txt)
    if m: x["em"] = m.group(0).lower()
    m = re.search(r"R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}", txt)
    if m: x["s"] = m.group(0)
    return x

def data_br(iso):
    try: return dt.datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception: return ""

def gupy():
    out = []
    for cidade, cid in CID.items():
        achou = False
        for base in ("https://portal.api.gupy.io/api/v1/jobs", "https://portal.api.gupy.io/api/job"):
            try:
                for off in (0, 100, 200):
                    q = urllib.parse.urlencode({"jobName": "", "name": "", "city": cidade, "state": "Pernambuco", "limit": 100, "offset": off})
                    d = get(base + "?" + q)
                    itens = d.get("data") or []
                    for j in itens:
                        if not re.search(r"effective|apprentice|clt", str(j.get("type", "")), re.I) and j.get("type"): continue
                        cidj = CID.get(j.get("city") or cidade, cid)
                        desc = limpa(j.get("description"))
                        t = j.get("name", "")
                        v = {"id": "g" + hashlib.sha1((j.get("jobUrl") or t + cidade).encode()).hexdigest()[:10], "cid": cidj, "c": t, "e": j.get("careerPageName") or j.get("companyName") or "",
                             "a": area(t), "n": nivel(t), "d": data_br(j.get("publishedDate", "")), "f": "Gupy", "u": j.get("jobUrl") or j.get("careerPageUrl") or "",
                             "m": {"on-site": "Presencial", "hybrid": "Híbrido", "remote": "Remoto"}.get(j.get("workplaceType"), ""), "o": desc[:240]}
                        v.update(extras(desc)); out.append(v); achou = True
                    if len(itens) < 100: break
                if achou: break
            except Exception as e:
                L(f"gupy {base} {cidade}: {e}")
        L(f"gupy {cidade}: {'ok' if achou else 'sem vagas'}")
    return out

def adzuna():
    i, k = os.environ.get("ADZUNA_ID"), os.environ.get("ADZUNA_KEY")
    if not (i and k): L("adzuna: sem chave, pulei"); return []
    out = []
    for cidade, cid in CID.items():
        try:
            q = urllib.parse.urlencode({"app_id": i, "app_key": k, "results_per_page": 50, "where": cidade + ", PE", "content-type": "application/json"})
            for j in get("https://api.adzuna.com/v1/api/jobs/br/search/1?" + q).get("results", []):
                t = j.get("title", ""); desc = limpa(j.get("description"))
                v = {"id": "z" + str(j.get("id")), "cid": cid, "c": t, "e": (j.get("company") or {}).get("display_name", ""), "a": area(t), "n": nivel(t),
                     "d": data_br(j.get("created", "")), "f": "Adzuna", "u": j.get("redirect_url", ""), "l": (j.get("location") or {}).get("display_name", ""), "o": desc[:240]}
                v.update(extras(desc))
                if j.get("salary_min") and j.get("salary_max"):
                    f = lambda n: "R$ " + f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    v["s"] = f(j["salary_min"]) if j["salary_min"] == j["salary_max"] else f"{f(j['salary_min'])} a {f(j['salary_max'])}"
                out.append(v)
            L(f"adzuna {cidade}: ok")
        except Exception as e:
            L(f"adzuna {cidade}: {e}")
    return out

def main():
    vistos, vagas = set(), []
    for v in gupy() + adzuna():
        if v["id"] in vistos or not v["c"]: continue
        vistos.add(v["id"]); vagas.append(v)
    os.makedirs(REL, exist_ok=True)
    agora = (dt.datetime.utcnow() - dt.timedelta(hours=3)).strftime("%d/%m/%Y %H:%M")
    if vagas:
        json.dump({"atualizado": agora, "vagas": vagas}, open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        L(f"{len(vagas)} vagas gravadas")
    else:
        L("Nenhuma vaga coletada: mantive o arquivo anterior.")
    open(os.path.join(REL, "relatorio.txt"), "w", encoding="utf-8").write("\n".join(log))

main()
