#!/usr/bin/env python3
"""Zdroje pre Gemini Notebook z webu Grammar Bites.
Použitie: python3 generuj.py <repo GrammarBites.github.io (po npm run build)> <výstupný priečinok>
"""
import glob, html, json, os, re, sys
import yaml
from markdownify import markdownify

REPO, OUT = sys.argv[1], sys.argv[2]
SRC = os.path.join(REPO, "src")
SITE = os.path.join(REPO, "_site")
WEB = "https://grammarbites.github.io"
os.makedirs(OUT, exist_ok=True)

def nacitaj(p): return json.load(open(os.path.join(SRC, "_data", p), encoding="utf-8"))
UCEBNICE = {u["id"]: u for u in nacitaj("zoznamUcebnic.json")}
TEMY = nacitaj("zoznamTem.json")
OPRAV = nacitaj("opravChybuData.json")
TABULE = {}
for f in glob.glob(os.path.join(SRC, "_data", "tabule", "*.json")):
    d = json.load(open(f, encoding="utf-8"))
    for lid in [d["lekcia"]] + d.get("aj", []):
        TABULE.setdefault(lid, d)

def front(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n?(.*)", t, re.S)
    return yaml.safe_load(m.group(1)), m.group(2)

def text(h):
    """krátke HTML (popisy, vysvetlenia) -> čistý text s **tučným**"""
    h = re.sub(r"</?(b|strong)>", "**", str(h or ""))
    h = re.sub(r"</?(i|em)>", "*", h)
    h = re.sub(r"<br\s*/?>", " ", h)
    h = re.sub(r"<[^>]+>", "", h)
    return html.unescape(h).strip()

def krieda(t, riadok=None, preskrtnute=()):
    """{slovo#id|farba} -> slovo; prečiarknuté slovo -> ~~slovo~~ a veta dostane značku ✗"""
    chyba = [False]
    def f(m):
        w, i, z = m.group(1), m.group(2), (m.group(3) or "")
        if "preskrtni" in z or (riadok and i and f"{riadok}.{i}" in preskrtnute):
            chyba[0] = True; return f"~~{w}~~"
        return w
    out = re.sub(r"\{([^#|}]+)(?:#([\w-]+))?(?:\|([\w,]+))?\}", f, str(t))
    return f"✗ {out} (chybná veta)" if chyba[0] else out

def oprava(s):  # "They are {playing} football" -> They are **playing** football
    return re.sub(r"\{([^}]*)\}", lambda m: "**" + m.group(1).split("|")[0] + "**", s)

def html_na_md(h):
    md = markdownify(h, heading_style="ATX", bullets="-", strip=["img", "svg", "button", "video", "source"])
    md = re.sub(r"\]\((?:\.\./)+|\]\(/(?!/)", f"]({WEB}/", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()

def vyklad_zo_stranky(cesta):
    """Výklad z hotovej stránky (_site) – tam sú už rozbalené všetky vložené časti."""
    p = os.path.join(SITE, cesta, "index.html")
    if not os.path.exists(p): return ""
    h = open(p, encoding="utf-8").read()
    m = re.search(r'<section class="blok blok--vyklad"[^>]*>(.*?)</section>', h, re.S)
    if not m: return ""
    vnutro = m.group(1)
    vnutro = re.sub(r"<h2[^>]*id=\"h-vyklad\"[^>]*>.*?</h2>", "", vnutro, flags=re.S)  # nadpis bloku
    vnutro = re.sub(r"<(a|div)[^>]*class=\"[^\"]*tlacidlo[^\"]*\"[^>]*>.*?</\1>", "", vnutro, flags=re.S)  # tlačidlá
    md = html_na_md(vnutro)
    md = re.sub(r"^#{1,2} ", "### ", md, flags=re.M)  # nadpisy výkladu pod úroveň lekcie
    md = re.sub(r"^(Ukázať výklad|Skryť výklad|pravidlo, príklady a časté chyby)\s*$", "", md, flags=re.M)
    return md.strip()

def ucebnice_text(l):
    out = []
    for u in l.get("ucebnice") or []:
        k = UCEBNICE.get(u["id"], {"nazov": u["id"], "units": []})
        if u.get("unit"):
            un = next((x for x in k.get("units", []) if x["id"] == str(u["unit"])), None)
            nm = "Introduction" if str(u["unit"]) == "intro" else f"Unit {u['unit']}"
            out.append(f"{k['nazov']} – {nm}" + (f" ({un['nazov']})" if un and un.get("nazov") and str(u["unit"]) != "intro" else ""))
        else:
            out.append(k["nazov"])
    return "; ".join(out)

# ---------- lekcie ----------
lekcie = []
for f in sorted(glob.glob(os.path.join(SRC, "lekcie", "*", "index.md"))):
    y, telo = front(f)
    if y.get("koncept"): continue
    y["id"] = os.path.basename(os.path.dirname(f))
    lekcie.append(y)

def tabula_md(d):
    r = [f"### Vysvetlenie krok po kroku (Magická tabuľa): {d['nazov']}",
         f"Otázka žiaka: *{d['otazky'][0]}*" + (f" (aj: {'; '.join(d['otazky'][1:])})" if len(d["otazky"]) > 1 else ""),
         f"Na webe: {WEB}/tabula/#{d['lekcia']}", ""]
    # čo sa na tabuli (hocikedy) prečiarkne: "riadok.slovo"
    prec = {o.get("ciel") for k in d["kroky"] for o in k.get("kresli", []) if o.get("op") == "znac" and o.get("typ") == "preskrtni"}
    for i, k in enumerate(d["kroky"], 1):
        r.append(f"**Krok {i}.** {text(k.get('popis'))}")
        na_tabuli = []
        for o in k.get("kresli", []):
            if o.get("op") == "pis": na_tabuli.append(krieda(o["text"], o.get("id"), prec))
            elif o.get("op") == "stlpce":
                for s in o.get("stlpce", []):
                    na_tabuli.append(f"{krieda(s.get('nadpis',''))}: " + " / ".join(krieda(x) for x in s.get("riadky", [])))
            elif o.get("op") == "tabulka":
                for riadok in o.get("riadky", []):
                    na_tabuli.append(" | ".join(krieda(x) for x in riadok))
        if na_tabuli:
            r.append("Na tabuli: " + " · ".join(x for x in na_tabuli if x.strip()))
        q = k.get("otazka")
        if q:
            sp = q["moznosti"][q["spravna"]]
            r.append(f"Kontrolná otázka: {q['text']} Možnosti: {' / '.join(q['moznosti'])}. Správne: **{sp}** – {text(q.get('vysvetlenie'))}")
        r.append("")
    return "\n".join(r).strip()

def lekcia_md(l):
    url = f"{WEB}/lekcie/{l['id']}/"
    r = [f"## {l['title']}" + (f" – {l['nazovSk']}" if l.get("nazovSk") else "")]
    info = []
    if l.get("rocniky"): info.append("Ročník: " + ", ".join(f"{x}." for x in l["rocniky"]))
    uc = ucebnice_text(l)
    if uc: info.append("Učebnica: " + uc)
    info.append(f"Lekcia na webe: {url}")
    r.append("\n".join(f"- {x}" for x in info))
    if l.get("popis"): r.append(f"**O čom je lekcia:** {l['popis']}")
    b = l.get("bite") or {}
    if b.get("tip"): r.append(f"**V skratke:** {b['tip']}")
    if b.get("priklad"): r.append(f"**Príklad:** {b['priklad']}")
    if l.get("klucoveSlova"):
        r.append("Súvisiace slová (žiaci sa môžu pýtať aj takto): " + ", ".join(str(x) for x in l["klucoveSlova"]))
    v = vyklad_zo_stranky(f"lekcie/{l['id']}")
    if v: r.append("### Výklad\n\n" + v)
    if l["id"] in TABULE: r.append(tabula_md(TABULE[l["id"]]))
    vety = (OPRAV.get(l["id"]) or {}).get("vety") if isinstance(OPRAV.get(l["id"]), dict) else None
    if vety:
        rr = ["### Typické chyby slovenských žiakov (Nájdi a oprav chybu)"]
        for v_ in vety:
            if not v_[0] or v_[0] == oprava(v_[1]).replace("**", ""):
                rr.append(f"- *{oprava(v_[1]).replace('**','')}* – veta je správna." + (f" {text(v_[2])}" if len(v_) > 2 and v_[2] else ""))
            else:
                rr.append(f"- ✗ *{v_[0]}* → ✓ *{oprava(v_[1])}*" + (f" – {text(v_[2])}" if len(v_) > 2 and v_[2] else ""))
        r.append("\n".join(rr))
    if l.get("test"):
        rr = ["### Mini test z lekcie (so správnymi odpoveďami)"]
        for i, q in enumerate(l["test"], 1):
            sp = q["moznosti"][q["spravna"]]
            rr.append(f"{i}. {q['otazka']} – možnosti: {' / '.join(map(str, q['moznosti']))} – správne: **{sp}** – {q.get('vysvetlenie','')}".strip())
            for k, z in (q.get("zle") or {}).items():
                rr.append(f"   - Prečo nie *{q['moznosti'][int(k)]}*: {z}")
        r.append("\n".join(rr))
    return "\n\n".join(r)

def poradie(l):
    ro = l.get("rocniky") or [99]
    return (min(ro), l.get("strana") or 0, l["title"])

subory = []
UVOD = ("Zdroj: web Grammar Bites ({web}) – anglická gramatika pre žiakov 4.–9. ročníka základnej školy na Slovensku, "
        "podľa učebníc Family and Friends 2 a Project 4th edition (2–5). Výklad je po slovensky, príklady po anglicky. "
        "Autor: Mgr. Róbert Rusnák, učiteľ angličtiny. Toto je jediný zdroj vysvetlení – odpovedaj podľa neho.")
for i, t in enumerate(TEMY, 2):
    ls = sorted([l for l in lekcie if (l.get("temy") or ["ostatne"])[0] == t["id"]], key=poradie)
    if not ls: continue
    nazov = f"{i:02d}-{t['id']}.md"
    obsah = [f"# Grammar Bites – {t['nazov']} ({t['en']})", UVOD.format(web=WEB),
             f"Lekcie v tomto súbore ({len(ls)}): " + "; ".join(l["title"] for l in ls)]
    obsah += [lekcia_md(l) for l in ls]
    open(os.path.join(OUT, nazov), "w", encoding="utf-8").write("\n\n".join(obsah) + "\n")
    subory.append((nazov, len(ls)))

# ---------- zlaté pravidlá ----------
pr = []
for f in sorted(glob.glob(os.path.join(SRC, "pravidla", "*", "index.md"))):
    y, _ = front(f); y["id"] = os.path.basename(os.path.dirname(f)); pr.append(y)
pr.sort(key=lambda y: y.get("cislo", 99))
obsah = ["# Grammar Bites – Zlaté pravidlá", UVOD.format(web=WEB),
         "Zlaté pravidlá sú univerzálne pravidlá angličtiny, ktoré platia vo všetkých ročníkoch a učebniciach. "
         f"Prehľad: {WEB}/pravidla/"]
for y in pr:
    sekcia = [f"## Zlaté pravidlo č. {y.get('cislo')}: {y['title']}", f"Na webe: {WEB}/pravidla/{y['id']}/"]
    if y.get("popis"): sekcia.append(f"**V skratke:** {y['popis']}")
    if y.get("priklad"): sekcia.append(f"**Príklad:** {y['priklad']}")
    v = vyklad_zo_stranky(f"pravidla/{y['id']}")
    if v: sekcia.append(v)
    obsah.append("\n\n".join(sekcia))
open(os.path.join(OUT, "11-zlate-pravidla.md"), "w", encoding="utf-8").write("\n\n".join(obsah) + "\n")
subory.append(("11-zlate-pravidla.md", len(pr)))

# ---------- nepravidelné slovesá ----------
ns = nacitaj("nepravidelneSlovesa.json"); tab = nacitaj("tabulkaSloviesData.json")["slovesa"]
obsah = ["# Grammar Bites – Nepravidelné slovesá (irregular verbs)", UVOD.format(web=WEB),
         f"Tabuľka a tréner na webe: {WEB}/lekcie/irregular-verbs-table/ a {WEB}/lekcie/irregular-verbs-complete/",
         "V 5. ročníku sa učí 75 slovies z učebnice Project 2 – len základný tvar a minulý tvar (past simple), bez 3. tvaru. "
         "V 6.–9. ročníku školský zoznam so všetkými tromi tvarmi.",
         "## Rodiny slovies (ako sa ich učiť po skupinách)"]
for r_ in ns["rodiny"]:
    riadky = ", ".join(f"{s[0]} – {s[1]} ({s[2]})" for s in r_["slovesa"])
    obsah.append(f"### {r_['nazov']} (vzor: {r_.get('vzor','')})\n{r_.get('tip','')}\n\n{riadky}")
def riadok(s): return f"| {s['z']} | {s['p']} | {s['pp']} | {s['sk']} |"
obsah.append("## Zoznam pre 5. ročník (Project 2, 75 slovies; 3. tvar sa v 5. ročníku neučí)\n\n| základný tvar | minulý tvar | 3. tvar | význam |\n|---|---|---|---|\n" + "\n".join(riadok(s) for s in tab if s.get("r5")))
obsah.append("## Školský zoznam (6.–9. ročník)\n\n| základný tvar | minulý tvar (past simple) | 3. tvar (past participle) | význam |\n|---|---|---|---|\n" + "\n".join(riadok(s) for s in tab if s.get("skola")))
obsah.append("## Ďalšie nepravidelné slovesá (mimo školského zoznamu)\n\n| základný tvar | minulý tvar | 3. tvar | význam |\n|---|---|---|---|\n" + "\n".join(riadok(s) for s in tab if not s.get("skola")))
open(os.path.join(OUT, "12-nepravidelne-slovesa.md"), "w", encoding="utf-8").write("\n\n".join(obsah) + "\n")
subory.append(("12-nepravidelne-slovesa.md", len(tab)))

# ---------- prehľad: čo sa kedy učí ----------
rocniky = nacitaj("zoznamRocnikov.json")
obsah = ["# Grammar Bites – Prehľad: čo sa učí v ktorom ročníku a unite", UVOD.format(web=WEB),
         "Použi tento prehľad, keď sa žiak pýta, čo sa učí v jeho ročníku, v ktorom unite je nejaká téma, "
         "alebo čo sa má naučiť na písomku z unitu. Test „Pred písomkou“ (20 náhodných otázok z unitu) je na "
         f"{WEB}/pred-pisomkou/ – opakuje len gramatiku; na písomku treba aj slovíčka, Everyday English a ďalšie časti unitu z učebnice."]
for ro in rocniky:
    ls = sorted([l for l in lekcie if ro["cislo"] in (l.get("rocniky") or [])], key=poradie)
    rozsah = []
    for rz in ro.get("rozsah", []):
        k = UCEBNICE[rz["id"]]; u = rz.get("units")
        rozsah.append(k["nazov"] + (" – unity " + ", ".join("Intro" if x == "intro" else x for x in u) if u else ""))
    sekcia = [f"## {ro['nazov']}", "Učebnica: " + "; ".join(rozsah)]
    sekcia.append("\n".join(f"- {l['title']}" + (f" – {l['nazovSk']}" if l.get('nazovSk') else "") + f" ({ucebnice_text(l) or 'hodí sa po celý rok'}) – {WEB}/lekcie/{l['id']}/" for l in ls) or "Zatiaľ bez lekcií.")
    obsah.append("\n\n".join(sekcia))
obsah.append("## Gramatika v unitoch učebníc")
for k in UCEBNICE.values():
    if not k.get("units"): continue
    riad = [f"### {k['nazov']}"]
    for u in k["units"]:
        nm = "Introduction" if u["id"] == "intro" else f"Unit {u['id']} – {u.get('nazov','')}"
        ls = [l["title"] for l in lekcie if any(x["id"] == k["id"] and str(x.get("unit")) == u["id"] for x in l.get("ucebnice") or [])]
        riad.append(f"- {nm}: gramatika {', '.join(u.get('gramatika', []))}" + (f". Lekcie na webe: {'; '.join(ls)}" if ls else ". Lekcia na webe zatiaľ nie je."))
    obsah.append("\n".join(riad))
open(os.path.join(OUT, "01-prehlad-rocniky-a-unity.md"), "w", encoding="utf-8").write("\n\n".join(obsah) + "\n")
subory.insert(0, ("01-prehlad-rocniky-a-unity.md", len(lekcie)))

json.dump(subory, open(os.path.join(OUT, ".subory.json"), "w"))
for n, c in subory:
    w = len(open(os.path.join(OUT, n), encoding="utf-8").read().split())
    print(f"{n:38} {c:4}  {w:7} slov")
