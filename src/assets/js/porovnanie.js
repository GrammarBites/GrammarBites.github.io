// Tréner „Súťaž kariet“: druhý a tretí stupeň prídavných mien podľa čísel na kartách.
(function () {
  const start = () => document.querySelectorAll("[data-porovnanie]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // balíčky kariet: hodnoty sú približné
  const BALICKY = {
    zvierata: {
      nazov: "Zvieratá", slovo: "animal",
      karty: [
        { en: "cheetah", sk: "gepard", e: "🐆", rychlost: 110, vaha: 50, vyska: 0.8 },
        { en: "horse", sk: "kôň", e: "🐎", rychlost: 70, vaha: 500, vyska: 1.6 },
        { en: "elephant", sk: "slon", e: "🐘", rychlost: 40, vaha: 6000, vyska: 3.2 },
        { en: "giraffe", sk: "žirafa", e: "🦒", rychlost: 55, vaha: 1200, vyska: 5.5 },
        { en: "mouse", sk: "myš", e: "🐭", rychlost: 13, vaha: 0.02, vyska: 0.05 },
        { en: "tortoise", sk: "korytnačka", e: "🐢", rychlost: 0.3, vaha: 250, vyska: 0.7 },
        { en: "dog", sk: "pes", e: "🐕", rychlost: 45, vaha: 30, vyska: 0.6 },
        { en: "rabbit", sk: "zajac", e: "🐇", rychlost: 55, vaha: 2, vyska: 0.25 },
        { en: "brown bear", sk: "medveď hnedý", e: "🐻", rychlost: 50, vaha: 400, vyska: 1.2 },
        { en: "goat", sk: "koza", e: "🐐", rychlost: 25, vaha: 60, vyska: 0.8 },
      ],
      vlastnosti: [
        { k: "rychlost", jed: "km/h", ikona: "⚡", hore: ["fast", "faster", "the fastest"], dole: ["slow", "slower", "the slowest"] },
        { k: "vaha", jed: "kg", ikona: "⚖️", hore: ["heavy", "heavier", "the heaviest"], dole: ["light", "lighter", "the lightest"] },
        { k: "vyska", jed: "m", ikona: "📏", hore: ["tall", "taller", "the tallest"], dole: ["short", "shorter", "the shortest"] },
      ],
    },
    obchod: {
      nazov: "Obchod", slovo: "thing",
      karty: [
        { en: "pencil", sk: "ceruzka", e: "✏️", cena: 1 },
        { en: "book", sk: "kniha", e: "📕", cena: 15 },
        { en: "football", sk: "lopta", e: "⚽", cena: 25 },
        { en: "bike", sk: "bicykel", e: "🚲", cena: 350 },
        { en: "phone", sk: "mobil", e: "📱", cena: 600 },
        { en: "laptop", sk: "notebook", e: "💻", cena: 900 },
        { en: "car", sk: "auto", e: "🚗", cena: 18000 },
        { en: "guitar", sk: "gitara", e: "🎸", cena: 200 },
      ],
      vlastnosti: [
        { k: "cena", jed: "€", ikona: "🏷️", hore: ["expensive", "more expensive", "the most expensive"], dole: ["cheap", "cheaper", "the cheapest"] },
      ],
    },
    test: {
      nazov: "Výsledky testu", slovo: "result",
      karty: [
        { en: "Tom", sk: "Tom", e: "👦", body: 95, osoba: true },
        { en: "Anna", sk: "Anna", e: "👧", body: 80, osoba: true },
        { en: "Jake", sk: "Jake", e: "🧒", body: 45, osoba: true },
        { en: "Lucy", sk: "Lucy", e: "👩‍🦰", body: 62, osoba: true },
        { en: "Max", sk: "Max", e: "🧑", body: 30, osoba: true },
      ],
      vlastnosti: [
        { k: "body", jed: "bodov", ikona: "📝", hore: ["good", "better", "the best"], dole: ["bad", "worse", "the worst"], veta: true },
      ],
    },
  };
  // chybné tvary
  function zleTvary(adj, comp, sup, druhy) {
    const z = new Set();
    if (druhy) {
      if (comp.startsWith("more ")) { z.add(adj + "er than"); z.add(comp + " then"); z.add(adj + " than"); }
      else if (adj === "good" || adj === "bad") { z.add(adj === "good" ? "gooder than" : "badder than"); z.add("more " + adj + " than"); z.add(sup.replace("the ", "") + " than"); }
      else { z.add("more " + adj + " than"); z.add(comp + " then"); z.add(sup.replace("the ", "") + " than"); if (/y$/.test(adj)) z.add(adj + "er than"); }
    } else {
      if (sup.startsWith("the most")) { z.add("the " + adj + "est"); z.add(comp.replace("more", "the more")); z.add(sup.replace("the ", "")); }
      else if (adj === "good" || adj === "bad") { z.add(adj === "good" ? "the goodest" : "the baddest"); z.add("the " + comp); z.add(sup.replace("the ", "")); }
      else { z.add("the most " + adj); z.add("the " + comp); z.add(sup.replace("the ", "")); if (/y$/.test(adj)) z.add("the " + adj + "est"); }
    }
    return [...z];
  }
  const cislo = (v, jed) => (jed === "€" ? `${v.toLocaleString("sk-SK")} €` : `${String(v).replace(".", ",")} ${jed}`);

  function init(box) {
    const KLUC = "gb-porovnanie", KOLO = 10;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), karty: $("[data-karty]"),
      otazka: $("[data-otazka]"), krok: $("[data-krok]"), moznosti: $("[data-moznosti]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = box.dataset.porovnanie === "comp" ? "comp" : "mix", ulohy = [], ix = 0, body = 0, q = null, krok = 0, chyba = false;

    const hlasenie = (t, ok) => { el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle"); el.spatna.innerHTML = t; el.spatna.hidden = false; };
    const skore = () => { el.skore.textContent = `body ${body}` + (pamat["r-" + rezim] ? ` · rekord ${pamat["r-" + rezim]}` : ""); };
    const meno = (k) => (k.osoba ? k.en : "the " + k.en);
    const Meno = (k) => { const m = meno(k); return m[0].toUpperCase() + m.slice(1); };

    function kresliKarty(klik) {
      el.karty.textContent = ""; el.karty.dataset.pocet = q.karty.length;
      const hs = q.karty.map((k) => k[q.v.k]), max = Math.max(...hs), lin = max / Math.max(Math.min(...hs), 1e-9) < 25;
      q.karty.forEach((k) => {
        const c = document.createElement(klik ? "button" : "div");
        if (klik) { c.type = "button"; c.addEventListener("click", () => klikKarta(k, c)); }
        c.className = "pc-karta"; c.dataset.en = k.en;
        const pod = Math.max(4, (lin ? k[q.v.k] / max : Math.sqrt(k[q.v.k] / max)) * 100);
        c.innerHTML = `<span class="pc-emoji" aria-hidden="true">${k.e}</span><span class="pc-meno" lang="en">${GB.esc(k.en)}</span><span class="pc-sk">${GB.esc(k.sk)}</span>` +
          `<span class="pc-stat">${q.v.ikona} ${GB.esc(cislo(k[q.v.k], q.v.jed))}</span><span class="pc-bar"><span style="width:${pod}%"></span></span>`;
        el.karty.append(c);
      });
    }
    function tlacidla(list, pri) {
      el.moznosti.textContent = "";
      list.forEach((t) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip pc-moznost"; b.lang = "en"; b.textContent = t;
        b.addEventListener("click", () => pri(t, b));
        el.moznosti.append(b);
      });
    }
    const zle = (b, t) => { chyba = true; if (b) { b.classList.add("pc-moznost--zle"); b.disabled = true; } hlasenie("Skús ešte raz. " + t, false); };

    function ukazComp() {
      const [A, B] = q.karty, vacsie = A[q.v.k] > B[q.v.k];
      const ok = (vacsie ? q.v.hore : q.v.dole)[1] + " than", opak = (vacsie ? q.v.dole : q.v.hore)[1] + " than";
      const subj = A.osoba ? `${A.en}'s result` : Meno(A), obj = A.osoba ? `${B.en}'s` : meno(B);
      el.otazka.innerHTML = `<span lang="en">${GB.esc(subj)} is <span class="co-medzera">…</span> ${GB.esc(obj)}.</span>`;
      el.krok.innerHTML = "Pozri sa na čísla a vyber správne porovnanie.";
      const zl = zleTvary(...(vacsie ? q.v.hore : q.v.dole), true);
      const moz = zamiesaj([ok, opak, ...zamiesaj(zl).slice(0, 2)]);
      tlacidla(moz, (t, b) => {
        if (t === ok) return hotovo(`<b lang="en">${GB.esc(subj)} is ${GB.esc(ok)} ${GB.esc(obj)}.</b>`);
        if (t === opak) return zle(b, `Pozri na čísla: ${GB.esc(cislo(A[q.v.k], q.v.jed))} × ${GB.esc(cislo(B[q.v.k], q.v.jed))}.`);
        zle(b, pravidlo((vacsie ? q.v.hore : q.v.dole), true));
      });
    }
    function pravidlo(tvary, druhy) {
      const [adj, comp, sup] = tvary;
      if (adj === "good" || adj === "bad") return `${adj} je nepravidelné: ${adj} – ${comp} – ${sup}.`;
      if (comp.startsWith("more")) return `Dlhé prídavné meno: more / the most – ${comp}, ${sup}.`;
      if (/y$/.test(adj)) return `Na konci -y → -ier / -iest: ${comp}, ${sup}.`;
      return druhy ? `Krátke prídavné meno: -er + than – ${comp} than.` : `Krátke prídavné meno: the + -est – ${sup}.`;
    }
    function ukazSup() {
      const tvary = q.smer === "hore" ? q.v.hore : q.v.dole;
      const hodn = q.karty.map((k) => k[q.v.k]), cil = q.smer === "hore" ? Math.max(...hodn) : Math.min(...hodn);
      q.vitaz = q.karty.find((k) => k[q.v.k] === cil);
      if (krok === 0) {
        el.otazka.innerHTML = `<span lang="en">Which ${q.osoba ? "student got" : q.bal.slovo + " is"} <b>${GB.esc(q.osoba ? tvary[2] + " result" : tvary[2])}</b>?</span>`;
        el.krok.innerHTML = "<b>Krok 1:</b> Ťukni na správnu kartu.";
        el.moznosti.textContent = "";
        kresliKarty(true);
      } else {
        kresliKarty(false);
        el.karty.querySelector(`[data-en="${q.vitaz.en}"]`).classList.add("pc-karta--vitaz");
        el.otazka.innerHTML = `<span lang="en">${GB.esc(Meno(q.vitaz))} ${q.osoba ? "got" : "is"} <span class="co-medzera">…</span> ${q.osoba ? "result" : q.bal.slovo + " here"}.</span>`;
        el.krok.innerHTML = "<b>Krok 2:</b> Vyber správny tvar.";
        tlacidla(zamiesaj([tvary[2], ...zamiesaj(zleTvary(...tvary, false)).slice(0, 3)]), (t, b) => {
          if (t !== tvary[2]) return zle(b, pravidlo(tvary, false));
          hotovo(`<b lang="en">${GB.esc(Meno(q.vitaz))} ${q.osoba ? "got" : "is"} ${GB.esc(tvary[2])} ${q.osoba ? "result" : q.bal.slovo + " here"}.</b>`);
        });
      }
    }
    function klikKarta(k, c) {
      if (krok !== 0) return;
      if (k !== q.vitaz) { c.classList.add("pc-karta--zle"); return zle(null, "Pozri sa ešte raz na čísla na kartách."); }
      krok = 1; hlasenie(`Áno, ${GB.esc(k.sk)}: ${GB.esc(cislo(k[q.v.k], q.v.jed))}.`, true); ukazSup();
    }
    function hotovo(veta) {
      if (!chyba) body++;
      el.moznosti.textContent = ""; el.krok.innerHTML = "";
      kresliKarty(false);
      if (q.typ === "sup") el.karty.querySelector(`[data-en="${q.vitaz.en}"]`).classList.add("pc-karta--vitaz");
      el.otazka.innerHTML = veta;
      hlasenie(chyba ? "Hotovo." : "Výborne, bez chyby!", !chyba); skore();
      el.dalej.textContent = ix + 1 < ulohy.length ? "Ďalšia úloha →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function dalsia() {
      if (ix >= ulohy.length) return koniec();
      q = ulohy[ix]; krok = 0; chyba = false;
      el.stav.textContent = `${ix + 1} / ${ulohy.length}`; skore();
      el.spatna.hidden = true; el.dalej.hidden = true;
      if (q.typ === "comp") { kresliKarty(false); ukazComp(); } else ukazSup();
    }
    function uloha(typ) {
      const bk = zamiesaj(Object.keys(BALICKY).filter((k) => k !== "test" || Math.random() < 0.5))[0], bal = BALICKY[bk];
      const v = zamiesaj(bal.vlastnosti)[0], n = typ === "comp" ? 2 : 4;
      let karty;
      for (let i = 0; i < 30; i++) { karty = zamiesaj(bal.karty).slice(0, n); const h = karty.map((k) => k[v.k]); if (new Set(h).size === h.length) break; }
      return { typ, bal, v, karty, smer: Math.random() < 0.5 ? "hore" : "dole", osoba: !!karty[0].osoba };
    }
    function noveKolo() {
      ulohy = Array.from({ length: KOLO }, (_, i) => uloha(rezim === "mix" ? (i % 2 ? "sup" : "comp") : rezim));
      ix = 0; body = 0; el.koniec.hidden = true; el.karta.hidden = false; dalsia();
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = ulohy.length, dobre = body / n >= 0.8, k = "r-" + rezim;
      if (body > (pamat[k] || 0)) pamat[k] = body;
      uloz();
      el.vysledok.textContent = `${body} z ${n} úloh bez chyby. ` + (body === n ? "Si the best!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`porovnanie/${rezim}/${body}-z-${n}`, `Porovnanie: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    const REZIMY = [["comp", "Porovnaj dve (-er, more)"], ["sup", "Kto je naj? (-est, most)"], ["mix", "Všetko"]];
    function kresliCipy() {
      el.cipy.textContent = "";
      REZIMY.forEach(([id, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        b.setAttribute("aria-pressed", id === rezim ? "true" : "false");
        b.addEventListener("click", () => { rezim = id; kresliCipy(); noveKolo(); });
        el.cipy.append(b);
      });
    }
    el.dalej.addEventListener("click", () => { ix++; dalsia(); });
    el.dalsie.addEventListener("click", noveKolo);
    kresliCipy(); noveKolo();
  }
})();
