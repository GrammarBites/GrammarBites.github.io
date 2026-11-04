// Tréner rodostromu: kto je kto v rodine (Project 3, 1C). Vzťahy sa počítajú z rodostromu, otázky sa generujú náhodne.
(function () {
  const start = () => document.querySelectorAll("[data-rodostrom]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  const MUZ = { father: "mother", son: "daughter", brother: "sister", husband: "wife", grandfather: "grandmother", uncle: "aunt", nephew: "niece", grandson: "granddaughter", cousin: "cousin" };
  const ZENA = Object.fromEntries(Object.entries(MUZ).map(([a, b]) => [b, a]));
  const slovoPre = (muz, s) => (s === "m" ? muz : MUZ[muz]);
  const SLOVA_M = ["grandfather", "father", "son", "brother", "husband", "uncle", "nephew", "cousin", "grandson"];
  const SLOVA_F = SLOVA_M.map((w) => MUZ[w]);
  const PORADIE = ["an only child", "the eldest", "the youngest", "a middle child", "twins"];

  function init(box) {
    const data = GB.data("data-rodostrom") || {};
    const stromy = data.stromy || [];
    if (!stromy.length) return;
    const SK = data.slova || {}, SKP = data.poradie || {};
    const KLUC = "gb-rodostrom";
    const KOLO = 10;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), nazov: $("[data-nazov]"),
      svg: $("[data-strom]"), otazka: $("[data-otazka]"), pokyn: $("[data-pokyn]"), moznosti: $("[data-moznosti]"),
      spatna: $("[data-spatna]"), dalej: $("[data-dalej]"), koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"),
      dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = { rekord: 0 };
    try { pamat = Object.assign(pamat, JSON.parse(localStorage.getItem(KLUC)) || {}); } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };

    let rezim = "mix", stromIndex = Math.floor(Math.random() * stromy.length);
    let strom, O, otazky = [], ix = 0, body = 0, aktualna = null, odpovedane = false;

    // ---------- vzťahy ----------
    const rod = (o) => (o.rodicia || []).map((id) => O[id]).filter(Boolean);
    const surodenci = (a, b) => a !== b && a.rodicia && b.rodicia && a.rodicia.length && a.rodicia.every((r) => b.rodicia.includes(r));
    const dieta = (o) => strom.osoby.filter((x) => (x.rodicia || []).includes(o.id));
    const jej = (o) => (o.s === "f" ? "jej" : "jeho");
    const manzRola = (o) => (o.s === "f" ? "manželka" : "manžel");

    // X je Y-ov/a ___ ? → { slovo, cesta: [id…], kroky: [text…] } alebo null
    function vztah(X, Y) {
      if (X === Y) return null;
      const PY = rod(Y), PX = rod(X);
      const v = (muz, cesta, kroky) => ({ slovo: slovoPre(muz, X.s), cesta: [Y.id, ...cesta.map((o) => o.id)], kroky });
      if (X.manzel === Y.id) return v("husband", [X], [`${manzRola(X)} ${X.meno}`]);
      if (PY.includes(X)) return v("father", [X], [`rodič ${X.meno}`]);
      if (PX.includes(Y)) return v("son", [X], [`dieťa ${X.meno}`]);
      if (surodenci(X, Y)) return v("brother", [X], [`súrodenec ${X.meno} (rovnakí rodičia)`]);
      for (const p of PY) if (rod(p).includes(X)) return v("grandfather", [p, X], [`rodič ${p.meno}`, `${jej(p)} rodič ${X.meno}`]);
      for (const p of PX) if (rod(p).includes(Y)) return v("grandson", [p, X], [`dieťa ${p.meno}`, `${jej(p)} dieťa ${X.meno}`]);
      for (const p of PY) {
        if (surodenci(X, p)) return v("uncle", [p, X], [`rodič ${p.meno}`, `${jej(p)} súrodenec ${X.meno}`]);
        const s = X.manzel && O[X.manzel];
        if (s && surodenci(s, p)) return v("uncle", [p, s, X], [`rodič ${p.meno}`, `${jej(p)} súrodenec ${s.meno}`, `${jej(s)} ${manzRola(X)} ${X.meno}`]);
      }
      for (const p of PX) {
        if (surodenci(p, Y)) return v("nephew", [p, X], [`súrodenec ${p.meno}`, `${jej(p)} dieťa ${X.meno}`]);
        const s = Y.manzel && O[Y.manzel];
        if (s && surodenci(p, s)) return v("nephew", [s, p, X], [`${manzRola(s)} ${s.meno}`, `${jej(s)} súrodenec ${p.meno}`, `${jej(p)} dieťa ${X.meno}`]);
      }
      for (const p of PY) for (const q of PX) if (surodenci(p, q)) return v("cousin", [p, q, X], [`rodič ${p.meno}`, `${jej(p)} súrodenec ${q.meno}`, `${jej(q)} dieťa ${X.meno}`]);
      return null;
    }
    function poradie(o) {
      const sur = strom.osoby.filter((x) => surodenci(x, o));
      if (!o.rodicia || !o.rodicia.length) return null;
      if (!sur.length) return "an only child";
      if (o.vek == null) return null;
      if (sur.some((x) => x.vek === o.vek)) return "twins";
      const starsi = sur.filter((x) => x.vek > o.vek).length, mladsi = sur.filter((x) => x.vek < o.vek).length;
      if (!starsi) return "the eldest";
      if (!mladsi) return "the youngest";
      return "a middle child";
    }

    // ---------- kreslenie ----------
    const NS = "http://www.w3.org/2000/svg";
    const RY = { 1: 70, 2: 228, 3: 386 }, WW = 600;
    const px = (o) => (WW * o.x) / 100;
    function tag(n, a, rodic) { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (rodic) rodic.append(e); return e; }
    function kresli() {
      const svg = el.svg; svg.textContent = "";
      svg.setAttribute("viewBox", `0 0 ${WW} 478`);
      const ciary = tag("g", { class: "rs-ciary" }, svg);
      // manželia
      strom.osoby.forEach((o) => { const m = o.manzel && O[o.manzel]; if (m && px(o) < px(m)) tag("line", { x1: px(o) + 24, y1: RY[o.g] - 4, x2: px(m) - 24, y2: RY[o.g] - 4, class: "rs-ciara" }, ciary); });
      // deti
      const skupiny = {};
      strom.osoby.forEach((o) => { if (o.rodicia && o.rodicia.length) (skupiny[o.rodicia.join("+")] ||= []).push(o); });
      Object.entries(skupiny).forEach(([k, deti]) => {
        const rodicia = k.split("+").map((id) => O[id]).filter(Boolean);
        if (!rodicia.length) return;
        const mx = rodicia.reduce((s, r) => s + px(r), 0) / rodicia.length, py = RY[rodicia[0].g] - 4, cy = RY[deti[0].g];
        const by = (py + cy) / 2 + 14;
        tag("line", { x1: mx, y1: py, x2: mx, y2: by, class: "rs-ciara" }, ciary);
        const xs = deti.map(px).concat([mx]);
        tag("line", { x1: Math.min(...xs), y1: by, x2: Math.max(...xs), y2: by, class: "rs-ciara" }, ciary);
        deti.forEach((d) => tag("line", { x1: px(d), y1: by, x2: px(d), y2: cy - 40, class: "rs-ciara" }, ciary));
      });
      // osoby
      strom.osoby.forEach((o) => {
        const g = tag("g", { class: `rs-osoba rs-osoba--${o.s}`, "data-id": o.id, transform: `translate(${px(o)},${RY[o.g]})`, tabindex: "-1", role: "button", "aria-label": o.meno }, svg);
        tag("circle", { r: 40, cy: 0, class: "rs-kruh" }, g);
        tag("circle", { r: 12, cy: -18, class: "rs-telo" }, g);
        tag("path", { d: "M-17 24 v-14 a17 16 0 0 1 34 0 v14 z", class: "rs-telo" }, g);
        const t = tag("text", { y: 64, class: "rs-meno" }, g); t.textContent = o.meno;
        if (o.vek != null) { const a = tag("text", { y: 86, class: "rs-vek" }, g); a.textContent = `${o.vek} r.`; }
        g.addEventListener("click", () => klik(o));
      });
    }
    function oznac(map) { // {id: trieda}
      el.svg.querySelectorAll(".rs-osoba").forEach((g) => {
        g.classList.remove("je-a", "je-b", "je-ok", "je-zle", "je-cesta");
        const t = map[g.dataset.id]; if (t) t.split(" ").filter(Boolean).forEach((c) => g.classList.add(c));
      });
    }

    // ---------- otázky ----------
    function zamiesaj(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function generuj() {
      const vsetky = [];
      for (const Y of strom.osoby) for (const X of strom.osoby) {
        const r = vztah(X, Y);
        if (r) vsetky.push({ typ: "kto", X, Y, r, kluc: `kto-${X.id}-${Y.id}` });
      }
      // nájdi: Y + slovo (jedinečné podľa Y a slova)
      const najdi = {};
      vsetky.forEach((q) => { const k = `najdi-${q.Y.id}-${q.r.slovo}`; (najdi[k] ||= { typ: "najdi", Y: q.Y, slovo: q.r.slovo, spravni: [], kluc: k }).spravni.push(q); });
      const por = strom.osoby.map((o) => ({ typ: "poradie", X: o, p: poradie(o), kluc: `por-${o.id}` })).filter((q) => q.p);
      const zdroj = { kto: vsetky, najdi: Object.values(najdi), poradie: por };
      if (rezim !== "mix") return zamiesaj(zdroj[rezim]).slice(0, KOLO);
      // mix: 4 kto, 4 nájdi, 2 poradie, s rôznymi slovami
      const vyber = (arr, n) => { const out = [], slova = new Set(); for (const q of zamiesaj(arr)) { const s = q.r ? q.r.slovo : q.slovo || q.p; if (slova.has(s) && out.length < arr.length - n) continue; slova.add(s); out.push(q); if (out.length >= n) break; } return out; };
      return zamiesaj([...vyber(zdroj.kto, 4), ...vyber(zdroj.najdi, 4), ...vyber(zdroj.poradie, 2)]);
    }

    function noveKolo() {
      strom = stromy[stromIndex % stromy.length]; stromIndex++;
      O = Object.fromEntries(strom.osoby.map((o) => [o.id, o]));
      el.nazov.textContent = strom.nazov;
      kresli();
      otazky = generuj(); ix = 0; body = 0;
      el.koniec.hidden = true; el.karta.hidden = false;
      dalsia();
    }
    function dalsia() {
      if (ix >= otazky.length) return koniec();
      aktualna = otazky[ix]; odpovedane = false;
      el.stav.textContent = `${ix + 1} / ${otazky.length}`;
      el.skore.textContent = `body ${body}` + (pamat.rekord ? ` · rekord ${pamat.rekord}` : "");
      el.spatna.hidden = true; el.spatna.className = "trener__spatna"; el.dalej.hidden = true;
      el.moznosti.textContent = "";
      el.svg.classList.toggle("rs-strom--klik", aktualna.typ === "najdi");
      const q = aktualna;
      if (q.typ === "kto") {
        oznac({ [q.X.id]: "je-a", [q.Y.id]: "je-b" });
        el.otazka.innerHTML = `<b class="rs-a">${GB.esc(q.X.meno)}</b> is <b class="rs-b">${GB.esc(q.Y.meno)}'s</b> …`;
        el.pokyn.textContent = "Pozri sa do rodostromu a vyber správne slovo.";
        const zoznam = q.X.s === "m" ? SLOVA_M : SLOVA_F;
        const ine = zamiesaj(zoznam.filter((w) => w !== q.r.slovo && !(w === "cousin" && q.r.slovo === "cousin"))).slice(0, 3);
        moznosti(zamiesaj([q.r.slovo, ...ine]), q.r.slovo);
      } else if (q.typ === "najdi") {
        oznac({ [q.Y.id]: "je-b" });
        el.otazka.innerHTML = `Ťukni na: <b class="rs-b">${GB.esc(q.Y.meno)}'s</b> <b>${GB.esc(q.slovo)}</b>`;
        el.pokyn.textContent = q.spravni.length > 1 ? `V rodostrome je viac správnych osôb (${q.spravni.length}) – stačí jedna.` : "Ťukni na osobu v rodostrome.";
      } else {
        oznac({ [q.X.id]: "je-a" });
        const sur = strom.osoby.filter((x) => surodenci(x, q.X));
        el.otazka.innerHTML = `<b class="rs-a">${GB.esc(q.X.meno)}</b>: „${q.p === "twins" ? "We're" : "I'm"} …“`;
        el.pokyn.textContent = sur.length ? "Pozri sa na vek súrodencov v rodostrome." : "Má súrodencov?";
        moznosti(q.p === "twins" ? zamiesaj(["twins", "the eldest", "the youngest", "an only child"]) : zamiesaj(PORADIE.filter((p) => p !== "twins")), q.p);
      }
    }
    function moznosti(list, spravna) {
      list.forEach((m) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip rs-moznost"; b.lang = "en"; b.textContent = m;
        b.addEventListener("click", () => odpoved(m === spravna, b, m));
        el.moznosti.append(b);
      });
    }
    function klik(o) {
      if (odpovedane || !aktualna || aktualna.typ !== "najdi") return;
      const dobra = aktualna.spravni.find((q) => q.X === o);
      odpoved(!!dobra, null, o);
    }
    function vysvetli(r, X, Y) {
      return `${Y.meno} → ${r.kroky.join(" → ")} = <b lang="en">${GB.esc(X.meno)} is ${GB.esc(Y.meno)}'s ${GB.esc(r.slovo)}</b>` +
        (SK[r.slovo] ? ` (${GB.esc(SK[r.slovo])})` : "");
    }
    function odpoved(ok, tlacidlo, hodnota) {
      if (odpovedane) return;
      odpovedane = true;
      const q = aktualna;
      if (ok) body++;
      el.moznosti.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        const spr = (q.typ === "kto" && b.textContent === q.r.slovo) || (q.typ === "poradie" && b.textContent === q.p);
        if (spr) b.classList.add("rs-moznost--ok");
        else if (b === tlacidlo) b.classList.add("rs-moznost--zle");
      });
      let text = "";
      if (q.typ === "kto") {
        const m = {}; q.r.cesta.forEach((id) => (m[id] = "je-cesta")); m[q.X.id] = "je-a je-cesta"; m[q.Y.id] = "je-b je-cesta";
        oznac(m); text = vysvetli(q.r, q.X, q.Y);
      } else if (q.typ === "najdi") {
        const vzor = ok ? q.spravni.find((s) => s.X === hodnota) : q.spravni[0];
        const m = {}; vzor.r.cesta.forEach((id) => (m[id] = "je-cesta")); m[q.Y.id] = "je-b je-cesta";
        q.spravni.forEach((s) => (m[s.X.id] = (m[s.X.id] || "") + " je-ok"));
        if (!ok) m[hodnota.id] = "je-zle";
        oznac(m);
        const zle = !ok ? (() => { const r = vztah(hodnota, q.Y); return `${GB.esc(hodnota.meno)} je ${r ? `<span lang="en">${GB.esc(q.Y.meno)}'s ${GB.esc(r.slovo)}</span>` : "z inej vetvy rodiny"}. `; })() : "";
        text = zle + vysvetli(vzor.r, vzor.X, q.Y);
      } else {
        const sur = strom.osoby.filter((x) => surodenci(x, q.X));
        oznac(Object.fromEntries([[q.X.id, "je-a je-cesta"], ...sur.map((s) => [s.id, "je-cesta"])]));
        text = sur.length
          ? `Súrodenci: ${[q.X, ...sur].sort((a, b) => b.vek - a.vek).map((s) => `${GB.esc(s.meno)} (${s.vek})`).join(", ")} → <b lang="en">${q.p}</b> (${GB.esc(SKP[q.p] || "")})`
          : `${GB.esc(q.X.meno)} nemá súrodencov → <b lang="en">${q.p}</b> (${GB.esc(SKP[q.p] || "")})`;
      }
      el.spatna.classList.add(ok ? "trener__spatna--ok" : "trener__spatna--zle");
      el.spatna.innerHTML = (ok ? "Správne! " : "Nie celkom. ") + text;
      el.spatna.hidden = false;
      el.skore.textContent = `body ${body}` + (pamat.rekord ? ` · rekord ${pamat.rekord}` : "");
      el.dalej.textContent = ix + 1 < otazky.length ? "Ďalšia otázka →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = otazky.length, dobre = body / n >= 0.8;
      if (body > (pamat.rekord || 0)) pamat.rekord = body;
      uloz();
      el.vysledok.textContent = `Máš ${body} z ${n} bodov. ` + (body === n ? "Výborne, v rodostrome sa vyznáš!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo – príde iná rodina.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      GB.udalost(`rodostrom/${body}-z-${n}`, `Rodostrom: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }

    // ---------- ovládanie ----------
    const REZIMY = [["mix", "Všetko"], ["kto", "Kto je to?"], ["najdi", "Nájdi v rodostrome"], ["poradie", "Poradie detí"]];
    function kresliCipy() {
      el.cipy.textContent = "";
      REZIMY.forEach(([id, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        b.setAttribute("aria-pressed", id === rezim ? "true" : "false");
        b.addEventListener("click", () => { rezim = id; kresliCipy(); stromIndex--; noveKolo(); });
        el.cipy.append(b);
      });
    }
    el.dalej.addEventListener("click", () => { ix++; dalsia(); });
    el.dalsie.addEventListener("click", noveKolo);
    kresliCipy();
    noveKolo();
  }
})();
