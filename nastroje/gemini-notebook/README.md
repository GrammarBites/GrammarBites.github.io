# Zdroje pre AI zošit (Gemini Notebook / Copilot Notebooks)

Skript poskladá z webu súbory na nahratie do AI zošita: lekcie podľa gramatických tém (výklad, Magická tabuľa krok po kroku, Nájdi a oprav chybu, mini testy), zlaté pravidlá, nepravidelné slovesá a prehľad ročníkov a unitov. Na web nemá vplyv – priečinok `nastroje/` sa nezverejňuje.

```
npm run build                                  # výklad sa berie z hotových stránok v _site
pip install pyyaml markdownify
python3 nastroje/gemini-notebook/generuj.py . zdroje-gemini
```

Vznikne 12 súborov `01-…md` až `12-…md` (bezplatný zošit berie max. 50 zdrojov). Pokyny do nastavení chatu sú v `POKYNY-pre-chat.txt`.
Po pridaní lekcií skript spusti znova a v zošite nahraď staré zdroje novými.
