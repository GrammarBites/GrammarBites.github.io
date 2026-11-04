---
title: "Irregular verbs: past participle"
nazovSk: 3. tvar nepravidelných slovies – go, went, gone
popis: "buy – bought – bought, sing – sang – sung, write – wrote – written. 3. tvar 76 nepravidelných slovies z Project 3 po rodinách – a tréner na 2. aj 3. tvar."
date: 2026-11-04T10:45:00
rocniky: [7]
strana: 58
ucebnice:
  - { id: project-3, unit: "5" }
temy: [pritomne-casy]
klucoveSlova: [past participle, 3. tvar, tretí tvar, minulé príčastie, irregular verbs, nepravidelné slovesá, present perfect, predprítomný čas, been, gone, seen, done, eaten, written, A-B-C, tabuľka slovies, tréner, 5A, 5B]
video: video.mp4
poster: poster.jpg
infografika: infografika.jpg
infografikaPdf: infografika.pdf
trener: project-3
trenerTvar: pp
koza: koza-zvedava
otazkaKozy: "Have you ever eaten a book?"
bite:
  tip: "Pri polovici nepravidelných slovies je 3. tvar rovnaký ako 2.: buy – bought – bought. Stačí vedieť minulý čas!"
  priklad: "I have bought · I have seen · I have written"
test:
  - otazka: "I have never ___ a horse."
    moznosti: ["rode", "ridden", "ride"]
    spravna: 1
    vysvetlenie: "Present perfect = have + 3. tvar. ride – rode – ridden."
  - otazka: "She has ___ a new phone."
    moznosti: ["bought", "buyed", "buy"]
    spravna: 0
    vysvetlenie: "buy – bought – bought: 2. a 3. tvar sú rovnaké (A – B – B)."
  - otazka: "Which verb has the pattern <b>A – B – A</b> (3. tvar = základný)?"
    moznosti: ["come – came – come", "go – went – gone", "sit – sat – sat"]
    spravna: 0
    vysvetlenie: "Pri come, become a run je 3. tvar rovnaký ako základný."
  - otazka: "Have you ___ my keys? I can't find them."
    moznosti: ["saw", "seen", "see"]
    spravna: 1
    vysvetlenie: "see – saw – seen. Po have je 3. tvar seen."
  - otazka: "swim – swam – ___"
    moznosti: ["swum", "swimmed", "swam"]
    spravna: 0
    vysvetlenie: "Rodina i – a – u: swim – swam – swum, ako sing – sang – sung."
---

Pre **present perfect** potrebuješ **3. tvar** slovesa (past participle): *I have **seen**, she has **written***. Pri pravidelných slovesách je to jednoduché – 3. tvar je rovnaký ako minulý čas: *play – played – played*. Nepravidelné slovesá treba vedieť ako **trojicu**.

## Dobrá správa

Takmer polovica nepravidelných slovies má **2. a 3. tvar rovnaký**. Ak vieš minulý čas, vieš aj 3. tvar:

- *buy – bought – **bought***, *make – made – **made***, *feel – felt – **felt***

Ešte jednoduchšie sú slovesá, ktoré sa **nemenia vôbec**: *cut – cut – cut, put – put – put*. A tri slovesá majú 3. tvar rovnaký ako **základný**: *come – came – **come***, *become – became – **become***, *run – ran – **run***.

## Štyri typy

<table class="chyby tvary">
<thead><tr><th scope="col">typ</th><th scope="col">čo to znamená</th><th scope="col">príklad</th></tr></thead>
<tbody>
<tr><td><b>A – A – A</b></td><td>všetky tri tvary rovnaké</td><td>cut – cut – <b>cut</b></td></tr>
<tr><td><b>A – B – B</b></td><td>3. tvar = 2. tvar</td><td>buy – bought – <b>bought</b></td></tr>
<tr><td><b>A – B – A</b></td><td>3. tvar = základný tvar</td><td>come – came – <b>come</b></td></tr>
<tr><td><b>A – B – C</b></td><td>všetky tri tvary iné – tieto sa uč najviac</td><td>write – wrote – <b>written</b></td></tr>
</tbody>
</table>

## Rodiny slovies

<table class="chyby tvary rodiny">
<thead><tr><th scope="col">rodina</th><th scope="col">slovesá</th></tr></thead>
<tbody>
{%- for r in nepravidelneSlovesa | slovesaPPPreKnihu(trener) %}
<tr><td><b>{{ r.nazov }}</b><br><span class="rodiny__vzor">{{ r.vzor }}</span></td><td lang="en">{% for s in r.slovesa %}<span class="par">{{ s[0] }} – {{ s[1] }} – <b>{{ s[4] }}</b>{% if not loop.last %} ·{% endif %}</span> {% endfor %}</td></tr>
{%- endfor %}
</tbody>
</table>

## Vo vetách

- *I have **lost** my phone.* – Stratil som mobil.
- *Have you ever **eaten** sushi?* – Jedol si niekedy sushi?
- *She has **written** three books.* – Napísala tri knihy.
- *We haven't **seen** the new film.* – Nový film sme ešte nevideli.
- *They have **gone** to London.* – Odišli do Londýna (a ešte sú tam).

Ako sa tvorí present perfect a kedy ho použiť, nájdeš v lekcii [Present perfect](/lekcie/present-perfect/).

## Pozor na to

- **gone × been.** *She has **gone** to London* = odišla a je tam. *She has **been** to London* = bola tam (a už sa vrátila).
- **Nie 2. tvar po have.** ~~I have saw~~ → *I have **seen***, ~~she has went~~ → *she has **gone***.
- **got** – v britskej angličtine je 3. tvar *got* (*I have got*), v americkej aj *gotten*.
- **lie – lay – lain** (ležať). Netreba si ho mýliť s pravidelným *lie – lied – lied* (klamať).

## Časté chyby

<table class="chyby">
<thead><tr><th scope="col">✗ Nesprávne</th><th scope="col">✓ Správne</th></tr></thead>
<tbody>
<tr><td>I have <s>saw</s> it.</td><td>I have <b>seen</b> it.</td></tr>
<tr><td>She has <s>went</s> home.</td><td>She has <b>gone</b> home.</td></tr>
<tr><td>We have <s>ate</s> pizza.</td><td>We have <b>eaten</b> pizza.</td></tr>
<tr><td>He has <s>wrote</s> a letter.</td><td>He has <b>written</b> a letter.</td></tr>
</tbody>
</table>
