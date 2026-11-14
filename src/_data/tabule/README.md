# Tabule – recepty

Jeden súbor = jedna tabuľa. Názov súboru = priečinok lekcie (`present-simple.json` → `src/lekcie/present-simple/`).
Ak lekcia má tabuľu, pri nadpise **Výklad** sa automaticky objaví tlačidlo „Nerozumiem – vysvetli mi to na tabuli“.
Všetky tabule sú na stránke `/tabula/`.

## Hlavička

- `lekcia`, `lekciaNazov` – kam vedie odkaz „Lekcia“
- `nazov` – nadpis na tabuli
- `otazky` – 1–2 otázky, ktoré sa ukážu ako tlačidlá na stránke /tabula/
- `kluce` – slová, podľa ktorých sa tabuľa nájde, keď žiak napíše vlastnú otázku (bez diakritiky)
- `kroky` – zoznam krokov

## Krok

- `kresli` – čo sa v tomto kroku dopíše na tabuľu (zoznam operácií nižšie)
- `popis` – vysvetlenie pod tabuľou (po slovensky, môže obsahovať `<b>`, `<i>`)
- `otazka` (nepovinné) – kontrolná otázka; „Ďalej“ sa odomkne až po správnej odpovedi
  `{ "text", "moznosti": [...], "spravna": 0, "napoveda": { "1": "vysvetlenie pre zlú možnosť 1" }, "vysvetlenie" }`
- `odkazy` (nepovinné) – tlačidlá na konci, napr. na trenažér: `{ "text": "...", "url": "/lekcie/.../#h-pisanie" }`

## Operácie

| op | čo robí | príklad |
|---|---|---|
| `pis` | napíše riadok; `styl`: `veta` (predvolené), `nadpis2`, `poznamka` | `{ "op": "pis", "id": "z", "text": "She {play#v} football." }` |
| `znac` | dodatočne označí slovo: `preskrtni`, `podciarkni`, `krouzok` | `{ "op": "znac", "typ": "preskrtni", "ciel": "z.v" }` |
| `sipka` | šípka od slova k slovu s popisom | `{ "op": "sipka", "od": "o.po", "k": "o.s", "text": "he/she/it → -s" }` |
| `stlpce` | dva (či viac) stĺpcov vedľa seba | pozri present-simple.json |
| `tabulka` | tabuľka; `hlavicka: true` = prvý riadok je hlavička | |
| `mriezka` + `scena` | obrázkové scény s kozou: `in`, `on`, `under`, `next to`, `between`, `behind`, `in front of`, `above` | pozri prepositions-of-place.json |

## Značky v texte

`{slovo}` – bez zmeny, `{slovo#id}` – slovo, na ktoré sa dá neskôr odkázať (`blok.id`),
`{slovo|zlta}` – farba (`zlta`, `ruzova`, `modra`), `{slovo#id|zlta,krouzok}` – farba aj značka hneď pri písaní.

## Hlas (doplní sa neskôr)

1. Ku každému kroku pridaj `"hovor": "text, ktorý sa prečíta"` (hovorená podoba, bez symbolov a skratiek).
2. Skript vygeneruje zvuk do `src/tabula/zvuk/<lekcia>/krok-01.mp3`, `krok-02.mp3` …
3. Do hlavičky receptu pridaj `"hlas": true`. Tabuľa potom pri každom kroku prehrá zvuk
   a pod tabuľou sa objaví tlačidlo Zvuk / Bez zvuku. Bez `"hlas": true` funguje tabuľa bez zvuku ako doteraz.
