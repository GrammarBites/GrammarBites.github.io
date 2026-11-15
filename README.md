# Grammar Bites

**Small lessons. Big progress.** Krátke lekcie anglickej gramatiky pre žiakov 4.–9. ročníka.

Web je statický (Eleventy) a zverejňuje sa automaticky cez GitHub Pages pri každej zmene vo vetve `main`.

## Štruktúra

```
src/
  lekcie/<nazov-lekcie>/index.md   ← jedna lekcia = jeden priečinok (údaje, výklad, test)
  lekcie/<nazov-lekcie>/video.mp4  ← video, infografika, náhľad v tom istom priečinku
  _data/zoznamUcebnic.json         ← učebnice, unity a gramatika v nich
  _data/zoznamRocnikov.json        ← ročník → učebnice a unity (podľa toho sa lekcii určí ročník)
  _data/zoznamTem.json             ← gramatické témy
  _data/slovnik.json               ← SK ↔ EN výrazy pre vyhľadávanie
  _data/nepravidelneSlovesa.json   ← nepravidelné slovesá po rodinách (pre tréner, učebnica = posledné pole)
  _data/site.js                    ← nastavenia (adresa webu, kľúč kontaktného formulára)
  pred-pisomkou/index.njk          ← „Pred písomkou": 20 náhodných otázok z unitu (berie mini testy lekcií
                                     a vety z trénerov Roztrieď a Doplň slovo, plus vety z bloku Nájdi a oprav chybu ako
                                     otázku „Ktorá veta je správna?“ – správna, chybná a (ak je v opravChybuData ako 5. prvok) druhá chybná veta; nič sa nepíše zvlášť)
  assets/img/postavy/              ← koza a učiteľ (PNG s priehľadným pozadím)
sablona/index.md                   ← šablóna novej lekcie s vysvetlivkami
```

## Nová lekcia

1. Skopíruj `sablona/` do `src/lekcie/nazov-lekcie/`.
2. Pridaj video a infografiku, vyplň údaje, zmaž riadok `koncept: true`.
3. Nahraj na GitHub. Web sa aktualizuje približne do 2 minút.

## Výklad pod tlačidlom

Výklad v lekcii je predvolene schovaný pod tlačidlom „Ukázať výklad“, aby stránka nebola príliš dlhá. Ak ho má mať niektorá lekcia stále rozbalený, pridaj do jej údajov `vykladSchovany: false`.

## Poradie blokov

Blok „Nájdi a oprav chybu“ (`opravChybu: true`) je predvolene za blokom „Napíš sám“. Ak má byť pred ním, pridaj do lekcie `opravPredPisanim: true`.

## Súvisiace lekcie („Hodí sa k tejto lekcii“)

Pod lekciou sa ponúknu tri lekcie primerané úrovni: nikdy nie také, ktoré sa preberajú až vo vyššom ročníku než táto lekcia. Prednosť má rovnaký unit, potom spoločná téma a blízky ročník (filter `suvisiaceLekcie` v `eleventy.config.js`). Ak chceš pri niektorej lekcii vybrať lekcie ručne, pridaj do jej údajov `suvisiace: [present-simple, present-simple-otazky]` – tie pôjdu ako prvé.

## Lokálne spustenie

```
npm install
npm start        # http://localhost:8080
```

## Kontaktný formulár

Na https://web3forms.com zadaj e-mail, kam majú chodiť správy. Kľúč, ktorý príde, vlož do `src/_data/site.js` (`web3formsKey`).
