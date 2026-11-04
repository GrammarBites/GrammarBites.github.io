---
# ŠABLÓNA NOVEJ LEKCIE
# 1. Skopíruj tento priečinok do src/lekcie/ a premenuj ho, napr. src/lekcie/present-perfect/
#    (názov priečinka = adresa lekcie: .../lekcie/present-perfect/)
# 2. Vlož do neho video.mp4, nahlad.jpg, infografika.png, infografika.pdf
# 3. Vyplň údaje nižšie a napíš výklad pod čiarou.

title: Present perfect                 # anglický názov
nazovSk: Predprítomný čas              # slovenský názov
popis: Krátky popis po slovensky (1–2 vety), zobrazí sa na karte lekcie.
date: 2026-11-15                       # dátum zverejnenia
rocniky: [7]                           # doplní sa samo podľa učebnice a unitu (rozpis: src/_data/zoznamRocnikov.json);
                                       # ručne len pri vlastných materiáloch (id: vlastne)
strana: 57                             # strana v učebnici – určuje poradie lekcií v rámci unitu
ucebnice:                              # učebnice a unity (id: family-and-friends-2, project-2 … project-5, vlastne)
  - { id: project-3, unit: "5" }
  - { id: project-4, unit: "2" }
temy: [pritomne-casy]                  # pritomne-casy, minule-casy, buduce-casy, podmienkove-vety,
                                       # modalne-slovesa, otazky, prislovky, trpny-rod, ostatne
klucoveSlova: [have been, ever, never, already, yet]

video: video.mp4                       # alebo namiesto toho:  youtube: ID_VIDEA
# videoFormat: na-sirku                # len pre video 16:9 (štandard je na výšku 9:16)
poster: poster.jpg                     # obrázok pred spustením videa
nahlad: nahlad.jpg                     # obrázok na kartu (nepovinné)
infografika: infografika.jpg
infografikaPdf: infografika.pdf

koza: koza-zvedava                     # póza kozy: koza-zvedava, koza-premysla, koza-cita,
                                       # koza-oslavuje, koza-nechape, koza-zmurka
otazkaKozy: "Have you ever eaten a book?"

bite:                                  # Grammar Bite dňa
  tip: "Krátky tip po slovensky."
  priklad: "Example sentence in English."

test:                                  # 3–5 otázok; spravna = poradie správnej možnosti od 0
  - otazka: "I ___ never been to London."
    moznosti: ["has", "have", "am"]
    spravna: 1
    vysvetlenie: "With I we use have."
koncept: true                          # kým je true, lekcia sa na webe nezobrazí – na zverejnenie zmaž
---

## Pravidlo

Výklad po slovensky (Markdown), príklady po anglicky. Nadpisy: ## Pravidlo, ## Oznamovacia veta, ## Pozor na to, ## Časté chyby.
