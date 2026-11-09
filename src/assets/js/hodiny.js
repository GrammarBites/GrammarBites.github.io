// Tréner hodín: čítanie a nastavovanie ručičkových hodín po anglicky.
// Úroveň 1: o'clock, quarter past, half past, quarter to. Úroveň 2: po 5 minútach.
(function () {
  const start = () => document.querySelectorAll("[data-hodiny]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  const NUM = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const MIN = { 5: "five", 10: "ten", 15: "quarter", 20: "twenty", 25: "twenty-five", 30: "half" };
  const SK_NA = ["dvanásť", "jednu", "dve", "tri", "štyri", "päť", "šesť", "sedem", "osem", "deväť", "desať", "jedenásť", "dvanásť"];
  const SK_POL = ["dvanástej", "jednej", "druhej", "tretej", "štvrtej", "piatej", "šiestej", "siedmej", "ôsmej", "deviatej", "desiatej", "jedenástej", "dvanástej"];
  const SK_HOD = ["dvanásť hodín", "jedna hodina", "dve hodiny", "tri hodiny", "štyri hodiny", "päť hodín", "šesť hodín", "sedem hodín", "osem hodín", "deväť hodín", "desať hodín", "jedenásť hodín", "dvanásť hodín"];
  const h12 = (h) => ((h - 1 + 120) % 12) + 1;

  // čas → anglická fráza (bez "It's")
  function povedz(h, m) {
    if (m === 0) return `${NUM[h]} o'clock`;
    if (m <= 30) return `${MIN[m]} past ${NUM[h]}`;
    return `${MIN[60 - m]} to ${NUM[h12(h + 1)]}`;
  }
  function slovensky(h, m) {
    const d = h12(h + 1);
    if (m === 0) return SK_HOD[h];
    if (m === 15) return `štvrť na ${SK_NA[d]}`;
    if (m === 30) return `pol ${SK_POL[d]}`;
    if (m === 45) return `trištvrte na ${SK_NA[d]}`;
    return null;
  }
  const digit = (h, m) => `${h}:${String(m).padStart(2, "0")}`;

  function init(box) {
    const $ = (s) => box.querySelector(s);
    const el = {
      urovne: $("[data-urovne]"), rezimy: $("[data-rezimy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"),
      otazka: $("[data-otazka]"), svg: $("[data-cifernik]"), ovl: $("[data-ovladanie]"), pokyn: $("[data-pokyn]"), moznosti: $("[data-moznosti]"),
      over: $("[data-over]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"), koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"),
      dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    const KLUC = "gb-hodiny", KOLO = 10;
    let pamat = { rekord1: 0, rekord2: 0 };
    try { pamat = Object.assign(pamat, JSON.parse(localStorage.getItem(KLUC)) || {}); } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };

    let uroven = 1, rezim = "mix", ulohy = [], ix = 0, body = 0, q = null, hotovo = false;
    let nast = { h: 12, m: 0 }; // nastavené používateľom
    const krokMin = () => (uroven === 1 ? 15 : 5);

    // ---------- kreslenie ciferníka ----------
    const NS = "http://www.w3.org/2000/svg";
    const tag = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
    const C = 150;
    const svg = el.svg;
    tag("circle", { cx: C, cy: C, r: 138, class: "hd-ram" }, svg);
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180, vel = i % 5 === 0;
      const r1 = vel ? 116 : 124, r2 = 130;
      tag("line", { x1: C + r1 * Math.sin(a), y1: C - r1 * Math.cos(a), x2: C + r2 * Math.sin(a), y2: C - r2 * Math.cos(a), class: vel ? "hd-ciarka hd-ciarka--h" : "hd-ciarka" }, svg);
    }
    for (let i = 1; i <= 12; i++) {
      const a = (i * 30 * Math.PI) / 180;
      const t = tag("text", { x: C + 96 * Math.sin(a), y: C - 96 * Math.cos(a) + 9, class: "hd-cislo" }, svg); t.textContent = i;
    }
    const rucH = tag("line", { x1: C, y1: C, x2: C, y2: C - 66, class: "hd-ruc hd-ruc--h hd-ruc--hlavna" }, svg);
    const rucM = tag("line", { x1: C, y1: C, x2: C, y2: C - 108, class: "hd-ruc hd-ruc--m hd-ruc--hlavna" }, svg);
    const duch = tag("g", { class: "hd-duch" }, svg);
    const duchH = tag("line", { x1: C, y1: C, x2: C, y2: C - 66, class: "hd-ruc hd-ruc--h" }, duch);
    const duchM = tag("line", { x1: C, y1: C, x2: C, y2: C - 108, class: "hd-ruc hd-ruc--m" }, duch);
    tag("circle", { cx: C, cy: C, r: 8, class: "hd-stred" }, svg);
    const toc = (ln, uhol) => ln.setAttribute("transform", `rotate(${uhol} ${C} ${C})`);
    function ukaz(h, m, h_ = rucH, m_ = rucM) { toc(h_, (h % 12) * 30 + m * 0.5); toc(m_, m * 6); }

    // ťahanie ručičiek
    let tahane = null;
    const uholZ = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 300 - C, y = ((ev.clientY - r.top) / r.height) * 300 - C;
      return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    };
    function podlaUhla(kt, uhol) {
      if (kt === "m") {
        const k = krokMin();
        let m = Math.round(uhol / 6 / k) * k % 60;
        nast.m = m;
      } else {
        let h = Math.round((uhol - nast.m * 0.5) / 30);
        nast.h = h12(((h % 12) + 12) % 12 || 12);
      }
      ukaz(nast.h, nast.m);
    }
    svg.addEventListener("pointerdown", (ev) => {
      if (!q || q.typ !== "nastav" || hotovo) return;
      const uhol = uholZ(ev);
      const mU = (nast.m * 6) % 360, hU = ((nast.h % 12) * 30 + nast.m * 0.5) % 360;
      const blizko = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 300 - C, y = ((ev.clientY - r.top) / r.height) * 300 - C;
      const dist = Math.hypot(x, y);
      // bližšie k stredu a k malej ručičke → hodinová, inak minútová
      tahane = blizko(uhol, hU) < blizko(uhol, mU) || (dist < 70 && blizko(uhol, hU) < 40) ? "h" : "m";
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add("hd-hodiny--tahanie");
      podlaUhla(tahane, uhol);
      ev.preventDefault();
    });
    svg.addEventListener("pointermove", (ev) => { if (tahane) podlaUhla(tahane, uholZ(ev)); });
    const pusti = () => { tahane = null; svg.classList.remove("hd-hodiny--tahanie"); };
    svg.addEventListener("pointerup", pusti);
    svg.addEventListener("pointercancel", pusti);
    el.ovl.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-krok]"); if (!b || hotovo) return;
      const [kt, d] = b.dataset.krok.split(":"); const s = Number(d);
      if (kt === "h") nast.h = h12(nast.h + s);
      else { nast.m = (nast.m + s * krokMin() + 60) % 60; }
      ukaz(nast.h, nast.m);
    });

    // ---------- úlohy ----------
    const nahodny = (a) => a[Math.floor(Math.random() * a.length)];
    function zamiesaj(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function nahodnyCas(pouzite) {
      const minuty = uroven === 1 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      for (let i = 0; i < 50; i++) {
        let m = nahodny(minuty);
        if (uroven === 2 && i < 30 && [0, 15, 30, 45].includes(m) && Math.random() < 0.6) continue; // viac päťminútových
        const h = 1 + Math.floor(Math.random() * 12), k = `${h}:${m}`;
        if (!pouzite.has(k)) { pouzite.add(k); return { h, m }; }
      }
      return { h: 3, m: 0 };
    }
    function zleMoznosti(h, m) {
      const spravna = povedz(h, m), set = new Set([spravna]), out = [];
      const pridaj = (hh, mm) => { const t = povedz(h12(hh), mm); if (!set.has(t)) { set.add(t); out.push(t); } };
      // typické chyby: past ↔ to, hodina o jednu vedľa (pol štvrtej ≠ half past four), vymenené ručičky
      if (m !== 0 && m !== 30) pridaj(m < 30 ? h - 1 : h + 1, 60 - m); // past ↔ to
      pridaj(m > 30 ? h - 1 : h + 1, m); // „slovenská“ hodina (pol štvrtej → half past four)
      pridaj(m > 30 ? h + 1 : h - 1, m);
      if (m === 0) { pridaj(h, 30); pridaj(h + 1, 0); }
      const hm = Math.round(m / 5) % 12 || 12, mh = (h % 12) * 5;
      if (uroven === 2 || mh % 15 === 0) pridaj(hm, mh); // vymenené ručičky
      while (out.length < 3) { const c = nahodnyCas(new Set([`${h}:${m}`, ...out])); pridaj(c.h, c.m); }
      return zamiesaj(out).slice(0, 3);
    }
    function generuj() {
      const pouzite = new Set(), out = [];
      for (let i = 0; i < KOLO; i++) {
        const c = nahodnyCas(pouzite);
        let typ = rezim === "mix" ? (i % 5 === 1 || i % 5 === 3 ? "nastav" : "citaj") : rezim;
        out.push({ typ, ...c });
      }
      return zamiesaj(out);
    }

    function noveKolo() {
      ulohy = generuj(); ix = 0; body = 0;
      el.koniec.hidden = true; el.karta.hidden = false;
      dalsia();
    }
    const rekord = () => pamat[`rekord${uroven}`] || 0;
    function skore() { el.skore.textContent = `body ${body}` + (rekord() ? ` · rekord ${rekord()}` : ""); }
    function dalsia() {
      if (ix >= ulohy.length) return koniec();
      q = ulohy[ix]; hotovo = false;
      el.stav.textContent = `${ix + 1} / ${ulohy.length}`; skore();
      el.spatna.hidden = true; el.spatna.className = "trener__spatna"; el.dalej.hidden = true;
      el.moznosti.textContent = ""; duch.classList.remove("je-vidno");
      svg.classList.toggle("hd-hodiny--nastav", q.typ === "nastav");
      if (q.typ === "citaj") {
        el.otazka.textContent = "What time is it?";
        el.pokyn.textContent = "Pozri sa na hodiny a vyber správnu odpoveď.";
        el.ovl.hidden = true; el.over.hidden = true;
        ukaz(q.h, q.m);
        zamiesaj([povedz(q.h, q.m), ...zleMoznosti(q.h, q.m)]).forEach((t) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "trener__cip hd-moznost"; b.lang = "en"; b.textContent = `It's ${t}.`;
          b.dataset.t = t;
          b.addEventListener("click", () => vyhodnot(t === povedz(q.h, q.m), b));
          el.moznosti.append(b);
        });
      } else {
        el.otazka.innerHTML = `<span lang="en">It's ${GB.esc(povedz(q.h, q.m))}.</span>`;
        el.pokyn.textContent = "Nastav hodiny: potiahni ručičky alebo použi tlačidlá.";
        el.ovl.hidden = false; el.over.hidden = false; el.over.disabled = false;
        nast = { h: 12, m: 0 }; ukaz(12, 0);
      }
    }
    el.over.addEventListener("click", () => {
      if (hotovo) return;
      vyhodnot(nast.h === q.h && nast.m === q.m, null);
    });
    function vyhodnot(ok, tlacidlo) {
      if (hotovo) return;
      hotovo = true;
      if (ok) body++;
      const spravna = povedz(q.h, q.m);
      el.moznosti.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        if (b.dataset.t === spravna) b.classList.add("hd-moznost--ok");
        else if (b === tlacidlo) b.classList.add("hd-moznost--zle");
      });
      el.over.hidden = true;
      let text = `<b lang="en">It's ${GB.esc(spravna)}.</b> = ${digit(q.h, q.m)}`;
      const sk = slovensky(q.h, q.m);
      if (sk) text += ` (${GB.esc(sk)})`;
      text += ".";
      if (q.typ === "nastav" && !ok) {
        ukaz(q.h, q.m, duchH, duchM); duch.classList.add("je-vidno");
        text += ` Zelené ručičky ukazujú správny čas, ty máš nastavené ${digit(nast.h, nast.m)}.`;
      }
      if (!ok) text += tip(q.h, q.m);
      el.spatna.classList.add(ok ? "trener__spatna--ok" : "trener__spatna--zle");
      el.spatna.innerHTML = (ok ? "Správne! " : "Nie celkom. ") + text;
      el.spatna.hidden = false; skore();
      el.dalej.textContent = ix + 1 < ulohy.length ? "Ďalšia úloha →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function tip(h, m) {
      if (m === 30) return ` Pozor: <span lang="en">half past ${NUM[h]}</span> = pol ${SK_POL[h12(h + 1)]} – v angličtine hovoríme hodinu, ktorá <b>už bola</b>.`;
      if (m > 30) return ` Za polovicou počítame minúty <b lang="en">to</b> (do) nasledujúcej hodiny.`;
      if (m > 0) return ` Do polovice počítame minúty <b lang="en">past</b> (po) hodine, ktorá už bola.`;
      return "";
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = ulohy.length, dobre = body / n >= 0.8;
      if (body > rekord()) pamat[`rekord${uroven}`] = body;
      uloz();
      el.vysledok.textContent = `Máš ${body} z ${n} bodov. ` + (body === n ? (uroven === 1 ? "Výborne! Skús úroveň 2 – po päť minút." : "Výborne, hodiny ovládaš!") : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`hodiny/u${uroven}/${body}-z-${n}`, `Hodiny ${uroven}: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }

    // ---------- výber ----------
    const UROVNE = [[1, "1 · o'clock, quarter, half"], [2, "2 · po päť minút"]];
    const REZIMY = [["mix", "Všetko"], ["citaj", "Prečítaj čas"], ["nastav", "Nastav hodiny"]];
    function cipy(kam, zoznam, akt, nastav) {
      kam.textContent = "";
      zoznam.forEach(([id, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        if (typeof id === "number") b.lang = "en";
        b.setAttribute("aria-pressed", id === akt ? "true" : "false");
        b.addEventListener("click", () => { nastav(id); kresliCipy(); noveKolo(); });
        kam.append(b);
      });
    }
    function kresliCipy() {
      cipy(el.urovne, UROVNE, uroven, (v) => (uroven = v));
      cipy(el.rezimy, REZIMY, rezim, (v) => (rezim = v));
    }
    el.dalej.addEventListener("click", () => { ix++; dalsia(); });
    el.dalsie.addEventListener("click", noveKolo);
    kresliCipy();
    noveKolo();
  }
})();
