# Tabule – recepty

Jeden súbor = jedna tabuľa. Názov súboru = priečinok lekcie (`present-simple.json` → `src/lekcie/present-simple/`).
Ak lekcia má tabuľu, pri nadpise **Výklad** sa automaticky objaví tlačidlo „Nerozumiem – vysvetli mi to na Magickej tabuli“.
Všetky tabule sú na stránke `/tabula/`.

## Hlavička

- `lekcia`, `lekciaNazov` – kam vedie odkaz „Lekcia“
- `nazov` – nadpis na tabuli
- `skupina` – pod ktorým nadpisom sa otázka ukáže na stránke /tabula/: `pritomny`, `minuly`, `buducnost`, `otazky`, `vety`, `mnozstvo`, `pridavne`, `cas` (názvy a poradie sú v `SKUPINY` v `src/assets/js/tabula.js`; bez skupiny ide tabuľa do „Ďalšie“)
- `otazky` – 1–2 otázky, ktoré sa ukážu ako tlačidlá na stránke /tabula/
- `aj` (nepovinné) – ďalšie lekcie, pri ktorých sa má ukázať tlačidlo tabule, napr. `["passive-tenses"]`
- `kluce` – slová, podľa ktorých sa tabuľa nájde, keď žiak napíše vlastnú otázku (bez diakritiky)
- `kroky` – zoznam krokov

## Krok

- `kresli` – čo sa v tomto kroku dopíše na tabuľu (zoznam operácií nižšie)
- `popis` – vysvetlenie pod tabuľou (po slovensky, môže obsahovať `<b>`, `<i>`)
- `otazka` (nepovinné) – kontrolná otázka; „Ďalej“ sa odomkne až po správnej odpovedi
  `{ "text", "moznosti": [...], "spravna": 0, "napoveda": { "1": "vysvetlenie pre zlú možnosť 1" }, "vysvetlenie" }`
- `odkazy` (nepovinné) – tlačidlá na konci, napr. na tréner: `{ "text": "...", "url": "/lekcie/.../#h-pisanie" }`

## Operácie

| op | čo robí | príklad |
|---|---|---|
| `pis` | napíše riadok; `styl`: `veta` (predvolené), `nadpis2`, `poznamka` | `{ "op": "pis", "id": "z", "text": "She {play#v} football." }` |
| `znac` | dodatočne označí slovo: `preskrtni`, `podciarkni`, `krouzok` | `{ "op": "znac", "typ": "preskrtni", "ciel": "z.v" }` |
| `sipka` | šípka od slova k slovu s popisom (aj z jedného riadku do druhého) | `{ "op": "sipka", "od": "o.po", "k": "o.s", "text": "he/she/it → -s" }` |
| `stlpce` | dva (či viac) stĺpcov vedľa seba | pozri present-simple.json |
| `tabulka` | tabuľka; `hlavicka: true` = prvý riadok je hlavička | |
| `mriezka` + `scena` | obrázkové scény s kozou: `in`, `on`, `under`, `next to`, `between`, `behind`, `in front of`, `above` | pozri prepositions-of-place.json |
| `os` | časová os; `teraz` = poloha bodu TERAZ (0–100), `znacky` = čo je na osi | pozri present-perfect-just-for-since.json |
| `naos` | dokreslí ďalšie značky do osi, ktorá už na tabuli je | `{ "op": "naos", "os": "o", "znacky": [...] }` |
| `hodiny` | ručičkové hodiny (do `mriezka`); `zvyrazni`: `past` / `to` vyfarbí polovicu, `obluk` pridá šípku | `{ "op": "hodiny", "do": "g", "cas": "3:30", "zvyrazni": "past", "obluk": true, "popis": "…" }` |
| `lievik` | jeden pás lievika (`uroven` 0–2), pásy idú pod seba | pozri prepositions-of-time.json |

`mriezka` s `"velke": true` má väčšie obrázky (hodí sa pri 2–5 scénach). Scéna so `"siroka": true` zaberie celý riadok.

### Značky na časovej osi (`znacky`)

Polohy `x`, `od`, `do`, `k` sú čísla 0–100 (zľava doprava). Každá značka môže mať `text` (nad osou), `pod` (pod osou),
`farba` (`zlta`, `ruzova`, `modra`) a `riadok` (1, 2, 3 = vyššie nad osou, aby sa popisy neprekrývali).

| typ | čo kreslí | kedy |
|---|---|---|
| `bod` (`x`) | krížik | jeden krátky dej: *saw him yesterday* |
| `usek` (`od`, `do`) | zátvorka nad osou; `sipka: true` = šípka až po koniec, `ciarky: true` = čiarkovane | trvanie: *for five years*; „niekedy, nevieme kedy“ |
| `vlna` (`od`, `do`) | vlnovka | dej, ktorý práve prebieha(l): *was having a shower* |
| `body` (`od`, `do`, `pocet`) | rad krížikov | opakovaný dej: *plays every Saturday* |
| `skok` (`od`, `k`) | oblúk so šípkou | plán do budúcnosti, krok späť v nepriamej reči |

### Ďalšie scény (`scena`)

`jablka` (`pocet`), `mlieko` (`plne` 0–1), `kozy` (`kozy: [{ "w": 44, "text": "Bibi" }, …]` – kozy rôznej veľkosti),
`bus`, `auto`, `peso`, `mesto`, `stanica`.

## Značky v texte

`{slovo}` – bez zmeny, `{slovo#id}` – slovo, na ktoré sa dá neskôr odkázať (`blok.id`),
`{slovo|zlta}` – farba (`zlta`, `ruzova`, `modra`), `{slovo#id|zlta,krouzok}` – farba aj značka hneď pri písaní.

## Hlas (doplní sa neskôr)

1. Ku každému kroku pridaj `"hovor": "text, ktorý sa prečíta"` (hovorená podoba, bez symbolov a skratiek).
2. Skript vygeneruje zvuk do `src/tabula/zvuk/<lekcia>/krok-01.mp3`, `krok-02.mp3` …
3. Do hlavičky receptu pridaj `"hlas": true`. Tabuľa potom pri každom kroku prehrá zvuk
   a pod tabuľou sa objaví tlačidlo Zvuk / Bez zvuku. Bez `"hlas": true` funguje tabuľa bez zvuku ako doteraz.
