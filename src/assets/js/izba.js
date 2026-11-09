// Tréner predložiek miesta: kde je koza v izbe? (in, on, under, next to, between, behind, in front of)
(function () {
  const start = () => document.querySelectorAll("[data-izba]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // x = stred, y = spodok kozy, w = šírka, z: "za" (pred nábytkom) / "box" (v krabici) / "" (navrchu)
  const MIESTA = [
    { id: "in-box", en: "in the box", sk: "v krabici", x: 70, y: 312, w: 110, z: "box", hx: 70, hy: 300 },
    { id: "on-table", en: "on the table", sk: "na stole", x: 300, y: 236, w: 110, z: "", hx: 300, hy: 196 },
    { id: "under-table", en: "under the table", sk: "pod stolom", x: 300, y: 338, w: 96, z: "", hx: 300, hy: 300 },
    { id: "between", en: "between the box and the table", sk: "medzi krabicou a stolom", x: 170, y: 340, w: 88, z: "", hx: 170, hy: 302 },
    { id: "next-sofa", en: "next to the sofa", sk: "vedľa gauča", x: 652, y: 340, w: 78, z: "", hx: 652, hy: 306 },
    { id: "behind-sofa", en: "behind the sofa", sk: "za gaučom", x: 520, y: 236, w: 110, z: "za", hx: 520, hy: 176 },
    { id: "on-sofa", en: "on the sofa", sk: "na gauči", x: 520, y: 285, w: 110, z: "", hx: 520, hy: 250 },
    { id: "front-sofa", en: "in front of the sofa", sk: "pred gaučom", x: 520, y: 392, w: 120, z: "", hx: 520, hy: 362 },
  ];
  const PRED = { "in-box": "in", "on-table": "on", "under-table": "under", between: "between", "next-sofa": "next to", "behind-sofa": "behind", "on-sofa": "on", "front-sofa": "in front of" };

  function init(box) {
    const KLUC = "gb-izba", KOLO = 10;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), svg: $("[data-izba-svg]"),
      otazka: $("[data-otazka]"), pokyn: $("[data-pokyn]"), moznosti: $("[data-moznosti]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    const KOZA = box.dataset.koza || "/assets/img/postavy/koza-zvedava.png";
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = "mix", ulohy = [], ix = 0, body = 0, q = null, hotovo = false;

    // ---------- kreslenie izby ----------
    const NS = "http://www.w3.org/2000/svg";
    const tag = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
    function koza(p, m, zle) {
      const h = m.w * 0.87;
      tag("image", { href: KOZA, x: m.x - m.w / 2, y: m.y - h, width: m.w, height: h, class: "iz-koza" + (zle ? " iz-koza--zle" : "") }, p);
    }
    function kresli(goat, zle, spoty) {
      const s = el.svg; s.textContent = "";
      tag("rect", { x: 0, y: 0, width: 700, height: 340, class: "iz-stena" }, s);
      tag("rect", { x: 0, y: 340, width: 700, height: 70, class: "iz-podlaha" }, s);
      tag("line", { x1: 0, y1: 340, x2: 700, y2: 340, class: "iz-ciara" }, s);
      // okno
      tag("rect", { x: 30, y: 50, width: 110, height: 100, rx: 6, class: "iz-okno" }, s);
      tag("line", { x1: 85, y1: 50, x2: 85, y2: 150, class: "iz-ciara iz-tenka" }, s);
      tag("line", { x1: 30, y1: 100, x2: 140, y2: 100, class: "iz-ciara iz-tenka" }, s);
      // lampa nad stolom
      tag("line", { x1: 300, y1: 0, x2: 300, y2: 70, class: "iz-ciara iz-tenka" }, s);
      tag("path", { d: "M270 100 L280 70 L320 70 L330 100 Z", class: "iz-lampa" }, s);
      // obraz nad gaučom
      tag("rect", { x: 480, y: 60, width: 80, height: 60, rx: 4, class: "iz-obraz" }, s);
      tag("path", { d: "M486 112 l20 -26 l14 16 l10 -10 l24 20 z", class: "iz-obraz-hory" }, s);
      if (goat && goat.z === "za") koza(s, goat, zle);
      // gauč
      tag("rect", { x: 435, y: 205, width: 170, height: 70, rx: 18, class: "iz-gauc" }, s);
      tag("rect", { x: 430, y: 262, width: 180, height: 50, rx: 12, class: "iz-gauc iz-gauc--sed" }, s);
      tag("rect", { x: 422, y: 240, width: 26, height: 72, rx: 10, class: "iz-gauc" }, s);
      tag("rect", { x: 592, y: 240, width: 26, height: 72, rx: 10, class: "iz-gauc" }, s);
      tag("line", { x1: 442, y1: 312, x2: 442, y2: 340, class: "iz-ciara" }, s);
      tag("line", { x1: 598, y1: 312, x2: 598, y2: 340, class: "iz-ciara" }, s);
      // stôl
      tag("rect", { x: 220, y: 228, width: 160, height: 14, rx: 4, class: "iz-stol" }, s);
      tag("line", { x1: 235, y1: 242, x2: 235, y2: 340, class: "iz-noha" }, s);
      tag("line", { x1: 365, y1: 242, x2: 365, y2: 340, class: "iz-noha" }, s);
      // krabica (zadná stena)
      tag("rect", { x: 15, y: 250, width: 110, height: 90, class: "iz-krabica iz-krabica--zad" }, s);
      if (goat && goat.z === "box") koza(s, goat, zle);
      tag("rect", { x: 15, y: 272, width: 110, height: 68, class: "iz-krabica" }, s);
      tag("path", { d: "M15 272 l-12 -22 M125 272 l12 -22", class: "iz-ciara" }, s);
      if (goat && !goat.z) koza(s, goat, zle);
      if (spoty) MIESTA.forEach((m) => {
        const g = tag("g", { class: "iz-spot", tabindex: "0", role: "button", "aria-label": m.en, "data-id": m.id }, s);
        tag("circle", { cx: m.hx, cy: m.hy, r: 22, class: "iz-spot__kruh" }, g);
        g.addEventListener("click", () => polozKozu(m));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); polozKozu(m); } });
      });
    }

    // ---------- úlohy ----------
    const hlasenie = (t, ok) => { el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle"); el.spatna.innerHTML = t; el.spatna.hidden = false; };
    const skore = () => { el.skore.textContent = `body ${body}` + (pamat["r-" + rezim] ? ` · rekord ${pamat["r-" + rezim]}` : ""); };
    function dalsia() {
      if (ix >= ulohy.length) return koniec();
      q = ulohy[ix]; hotovo = false;
      el.stav.textContent = `${ix + 1} / ${ulohy.length}`; skore();
      el.spatna.hidden = true; el.dalej.hidden = true; el.moznosti.textContent = "";
      if (q.typ === "kde") {
        kresli(q.m, false, false);
        el.otazka.innerHTML = `<span lang="en">Where's the goat?</span>`;
        el.pokyn.textContent = "Vyber, kde je koza.";
        const ine = zamiesaj(MIESTA.filter((m) => m !== q.m && PRED[m.id] !== PRED[q.m.id])).slice(0, 3);
        zamiesaj([q.m, ...ine]).forEach((m) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "trener__cip iz-moznost"; b.lang = "en"; b.textContent = `It's ${m.en}.`; b.dataset.id = m.id;
          b.addEventListener("click", () => vyhodnot(m === q.m, m, b));
          el.moznosti.append(b);
        });
      } else {
        kresli(null, false, true);
        el.otazka.innerHTML = `<span lang="en">Put the goat <b>${GB.esc(q.m.en)}</b>!</span>`;
        el.pokyn.textContent = "Ťukni na krúžok v izbe, kam patrí koza.";
      }
    }
    function polozKozu(m) {
      if (hotovo || !q || q.typ !== "poloz") return;
      vyhodnot(m === q.m, m, null);
    }
    function vyhodnot(ok, m, b) {
      if (hotovo) return;
      hotovo = true;
      if (ok) body++;
      if (q.typ === "poloz") {
        kresli(m, !ok, false);
        if (!ok) { tag("circle", { cx: q.m.hx, cy: q.m.hy, r: 26, class: "iz-spravne" }, el.svg); }
      }
      el.moznosti.querySelectorAll("button").forEach((x) => {
        x.disabled = true;
        if (x.dataset.id === q.m.id) x.classList.add("iz-moznost--ok");
        else if (x === b) x.classList.add("iz-moznost--zle");
      });
      let t = `<b lang="en">The goat is ${GB.esc(q.m.en)}.</b> – Koza je ${GB.esc(q.m.sk)}.`;
      if (!ok) t += q.typ === "poloz" ? ` Zelený krúžok ukazuje správne miesto. Koza teraz stojí <span lang="en">${GB.esc(m.en)}</span> (${GB.esc(m.sk)}).` : ` <span lang="en">${GB.esc(m.en)}</span> = ${GB.esc(m.sk)}.`;
      hlasenie((ok ? "Správne! " : "Nie celkom. ") + t, ok);
      skore();
      el.dalej.textContent = ix + 1 < ulohy.length ? "Ďalej →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function noveKolo() {
      const mm = zamiesaj([...MIESTA, ...MIESTA]).slice(0, KOLO);
      ulohy = mm.map((m, i) => ({ m, typ: rezim === "mix" ? (i % 2 ? "poloz" : "kde") : rezim }));
      ix = 0; body = 0; el.koniec.hidden = true; el.karta.hidden = false; dalsia();
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = ulohy.length, dobre = body / n >= 0.8, k = "r-" + rezim;
      if (body > (pamat[k] || 0)) pamat[k] = body;
      uloz();
      el.vysledok.textContent = `Máš ${body} z ${n} bodov. ` + (body === n ? "Perfektné, kozu nájdeš všade!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`izba/${rezim}/${body}-z-${n}`, `Predložky: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    const REZIMY = [["mix", "Všetko"], ["kde", "Kde je koza?"], ["poloz", "Polož kozu"]];
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
