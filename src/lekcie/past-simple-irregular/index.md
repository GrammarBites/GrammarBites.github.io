---
title: "Past simple: irregular verbs"
nazovSk: Nepravidelné slovesá v minulom čase – po rodinách
popis: "go → went, buy → bought, sing → sang. 75 nepravidelných slovies z Project 2 v 11 rodinách – a tréner, v ktorom si ich precvičíš."
date: 2026-11-04T09:30:00
rocniky: [5]
strana: 36
ucebnice:
  - { id: project-2, unit: "3" }
temy: [minule-casy]
klucoveSlova: [past simple, irregular verbs, nepravidelné slovesá, minulý čas, minulý tvar, zoznam slovies, tabuľka slovies, went, bought, saw, was, were, had, did, rodiny slovies, tréner, precvičovanie, 3C]
video: video.mp4
poster: poster.jpg
infografika: infografika.jpg
infografikaPdf: infografika.pdf
hraSlovesa: true
trener: project-2
koza: koza-cita
otazkaKozy: "I ate a book yesterday!"
bite:
  tip: "Nepravidelné slovesá nemajú -ed. Uč sa ich po rodinách: buy → bought, bring → brought, think → thought."
  priklad: "I went to school. · She bought a cake. · We sang a song."
test:
  - otazka: "Yesterday I ___ to the cinema."
    moznosti: ["goed", "went", "go"]
    spravna: 1
    vysvetlenie: "Go je samotár: go → went. Goed neexistuje."
  - otazka: "My mum ___ a new bike for me last week."
    moznosti: ["buyed", "bought", "brought"]
    spravna: 1
    vysvetlenie: "buy → bought (kúpila). Pozor, brought je minulý tvar od bring (priniesť)."
  - otazka: "Which verb is in the family <b>sing → sang</b>?"
    moznosti: ["swim → swam", "fly → flew", "keep → kept"]
    spravna: 0
    vysvetlenie: "Pri swim → swam sa samohláska zmení na a, rovnako ako pri sing → sang."
  - otazka: "Did you ___ the match on Saturday?"
    moznosti: ["saw", "see", "seed"]
    spravna: 1
    vysvetlenie: "V otázke s did je základný tvar: Did you see…? Minulý tvar nesie did."
  - otazka: "We ___ at home because it was cold."
    moznosti: ["was", "were", "be"]
    spravna: 1
    vysvetlenie: "be → was / were. Pri we, you, they je were."
---

**Pravidelné** slovesá majú v minulom čase koncovku *-ed* (*play → played*). **Nepravidelné** slovesá ju nemajú. Ich minulý tvar sa treba naučiť: *go → went, eat → ate, buy → bought*.

Dobrá správa: tvar je rovnaký pre všetky osoby. *I went, you went, she went, they went.* Výnimkou je len **be → was / were**.

## Ako sa ich naučiť

Nepravidelné slovesá netreba biflovať podľa abecedy. Väčšina z nich sa mení **podľa rovnakého vzorca**, a takéto slovesá tvoria **rodiny**. Keď vieš *buy → bought*, ľahšie si zapamätáš aj *bring → brought* a *think → thought*.

- Každý deň si zober **jednu rodinu**.
- Hovor nahlas: *buy – bought, bring – brought…*
- Vymysli s každým slovesom jednu vetu o sebe.
- Na konci si všetko precvič v **tréneri** nižšie.

## Rodiny slovies

<table class="chyby tvary rodiny">
<thead><tr><th scope="col">rodina</th><th scope="col">slovesá</th></tr></thead>
<tbody>
{%- for r in nepravidelneSlovesa.rodiny | slovesaPreKnihu(trener) %}
<tr><td><b>{{ r.nazov }}</b><br><span class="rodiny__vzor">{{ r.vzor }}</span></td><td lang="en">{% for s in r.slovesa %}<span class="par">{{ s[0] }} → <b>{{ s[1] }}</b>{% if not loop.last %} ·{% endif %}</span> {% endfor %}</td></tr>
{%- endfor %}
</tbody>
</table>

**Pozor na výslovnosť:** *read* [ríd] → *read* [red]. Píše sa rovnako, ale znie inak.

## Vo vetách

- *I **went** to the park yesterday.* – Včera som išiel do parku.
- *My dad **bought** a new car.* – Otec kúpil nové auto.
- *We **sang** a song at school.* – V škole sme spievali pieseň.
- *She **wrote** a letter to her grandma.* – Napísala list babke.
- *They **were** tired after the trip.* – Po výlete boli unavení.

## Pozor na to

- **Otázka a zápor = základný tvar.** Minulosť nesie *did*, sloveso sa vráti do základného tvaru: *Did you **go**?* (nie ~~Did you went?~~), *I didn't **see** it* (nie ~~didn't saw~~). Viac v lekcii [Past simple: positive, negative, questions](/lekcie/past-simple/).
- **Žiadne -ed navyše.** ~~goed, buyed, eated~~ neexistujú.
- **bought × brought.** *bought* = kúpil (buy), *brought* = priniesol (bring).
- **learnt, burnt, smelt, spelt** môžeš napísať aj s *-ed*: *learned, burned…* Oba tvary sú správne.

## Časté chyby

<table class="chyby">
<thead><tr><th scope="col">✗ Nesprávne</th><th scope="col">✓ Správne</th></tr></thead>
<tbody>
<tr><td>I <s>goed</s> to school.</td><td>I <b>went</b> to school.</td></tr>
<tr><td>She <s>buyed</s> a T-shirt.</td><td>She <b>bought</b> a T-shirt.</td></tr>
<tr><td>Did you <s>saw</s> the film?</td><td>Did you <b>see</b> the film?</td></tr>
<tr><td>We <s>was</s> at home.</td><td>We <b>were</b> at home.</td></tr>
</tbody>
</table>
