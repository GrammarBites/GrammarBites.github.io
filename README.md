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
  assets/img/postavy/              ← koza a učiteľ (PNG s priehľadným pozadím)
sablona/index.md                   ← šablóna novej lekcie s vysvetlivkami
```

## Nová lekcia

1. Skopíruj `sablona/` do `src/lekcie/nazov-lekcie/`.
2. Pridaj video a infografiku, vyplň údaje, zmaž riadok `koncept: true`.
3. Nahraj na GitHub. Web sa aktualizuje približne do 2 minút.

## Lokálne spustenie

```
npm install
npm start        # http://localhost:8080
```

## Kontaktný formulár

Na https://web3forms.com zadaj e-mail, kam majú chodiť správy. Kľúč, ktorý príde, vlož do `src/_data/site.js` (`web3formsKey`).
