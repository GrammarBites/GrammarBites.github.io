// Tréner trpného rodu: činná veta → trpná v 4 krokoch (predmet → be → 3. stĺpec → by).
(function () {
  const start = () => document.querySelectorAll("[data-pasivum]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  const BE = { ps: ["is", "are"], past: ["was", "were"], pp: ["has been", "have been"], will: ["will be"], pc: ["is being", "are being"] };
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const zakl = (q) => q.base || q.v.replace(/([^s])s$/, "$1").replace(/ie$/, "y");
  function ing(b) {
    if (/ie$/.test(b)) return b.slice(0, -2) + "ying";
    if (/[^e]e$/.test(b)) return b.slice(0, -1) + "ing";
    if (/^[^aeiou]*[aeiou][bdgmnprt]$/.test(b)) return b + b.slice(-1) + "ing";
    return b + "ing";
  }
  const reg = (b) => (/e$/.test(b) ? b + "d" : b + "ed");

  function init(box) {
    const data = GB.data("data-pasivum") || {};
    const vsetky = data.vety || [], CASY = data.casy || {};
    const len = box.dataset.pasivum === "present";
    const KOLO = 8, KLUC = "gb-pasivum" + (len ? "-p" : "");
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), vyber: $("[data-vyber]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"),
      cas: $("[data-cas]"), aktiv: $("[data-aktiv]"), sloty: $("[data-sloty]"), krok: $("[data-krok]"), moznosti: $("[data-moznosti]"),
      spatna: $("[data-spatna]"), dalej: $("[data-dalej]"), koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"),
      dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = { rekord: 0 };
    try { pamat = Object.assign(pamat, JSON.parse(localStorage.getItem(KLUC)) || {}); } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };

    let rezim = "mix", vety = [], ix = 0, body = 0, q = null, krok = 0, chyba = false, agent = null;
    if (len) el.vyber.hidden = true;

    const NAZVY = ["Predmet → podmet", "be", "3. stĺpec", "by + agent"];
    function sloty() {
      const hodn = [krok > 0 ? q.O : "", krok > 1 ? q.be : "", krok > 2 ? q.pp : "", krok > 3 ? (agent ? q.ag : "—") : ""];
      el.sloty.innerHTML = NAZVY.map((n, i) => `<div class="ps-slot${i === krok ? " ps-slot--akt" : ""}${hodn[i] ? " ps-slot--plny" : ""}"><span class="ps-slot__n">${i + 1} · ${n}</span><span class="ps-slot__h" lang="en">${GB.esc(hodn[i]) || "&nbsp;"}</span></div>`).join("");
    }
    function aktivna(oznac) {
      const casti = [["s", q.s], ["v", q.v], ["o", q.o]].concat(q.x ? [["x", q.x]] : []);
      el.aktiv.innerHTML = "";
      casti.forEach(([k, t], i) => {
        const b = document.createElement(krok === 0 ? "button" : "span");
        b.className = "ps-slovo" + (oznac && k === "o" ? " ps-slovo--o" : "") + (oznac && k === "s" ? " ps-slovo--s" : "");
        if (krok === 0) { b.type = "button"; b.addEventListener("click", () => klikSlovo(k, b)); }
        b.textContent = t; el.aktiv.append(b);
        if (i < casti.length - 1) el.aktiv.append(" ");
      });
      el.aktiv.append(".");
    }
    function noveKolo() {
      const zdroj = vsetky.filter((v) => (len ? v.t === "ps" : rezim === "mix" || v.t === rezim));
      vety = zamiesaj(zdroj).slice(0, KOLO); ix = 0; body = 0;
      el.koniec.hidden = true; el.karta.hidden = false; dalsia();
    }
    function skore() { el.skore.textContent = `body ${body}` + (pamat.rekord ? ` · rekord ${pamat.rekord}` : ""); }
    function dalsia() {
      if (ix >= vety.length) return koniec();
      q = vety[ix]; krok = 0; chyba = false; agent = null;
      el.stav.textContent = `${ix + 1} / ${vety.length}`; skore();
      el.cas.textContent = CASY[q.t] || "";
      el.dalej.hidden = true; ukazKrok();
    }
    function hlasenie(t, ok) {
      el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle");
      el.spatna.innerHTML = t; el.spatna.hidden = false;
    }
    function tlacidla(list, spravne, pri) {
      el.moznosti.textContent = "";
      list.forEach((t) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip ps-moznost"; b.lang = "en"; b.textContent = t;
        b.addEventListener("click", () => pri(t, b));
        el.moznosti.append(b);
      });
    }
    function zle(b, text) { chyba = true; if (b) { b.classList.add("ps-moznost--zle"); b.disabled = true; } hlasenie("Skús ešte raz. " + text, false); }
    function dalejKrok(text) { krok++; hlasenie(text, true); ukazKrok(true); }
    function ukazKrok(poHlaseni) {
      if (!poHlaseni) el.spatna.hidden = true;
      sloty(); aktivna(krok > 0);
      el.moznosti.textContent = "";
      if (krok === 0) {
        el.krok.innerHTML = "<b>Krok 1:</b> Ťukni na <b>predmet</b> činnej vety – čo / koho sa niečo robí.";
      } else if (krok === 1) {
        el.krok.innerHTML = `<b>Krok 2:</b> Pridaj <b>be</b> v správnom tvare. Nový podmet je <b lang="en">${GB.esc(q.O)}</b>` + (len ? "." : `, čas: <b>${GB.esc(CASY[q.t])}</b>.`);
        let opts;
        if (len) opts = ["is", "are", "am", "be"];
        else { const ine = Object.entries(BE).filter(([k]) => k !== q.t).flatMap(([, v]) => v);
          opts = [...new Set([...BE[q.t], ...zamiesaj(ine).slice(0, 4 - BE[q.t].length)])]; }
        tlacidla(zamiesaj(opts), q.be, (t, b) => (t === q.be ? dalejKrok(`<span lang="en">${GB.esc(q.O)} <b>${q.be}</b></span> – ` + (BE[q.t].length > 1 ? (/are|were|have/.test(q.be) ? "podmet je v množnom čísle." : "podmet je v jednotnom čísle.") : "be v správnom čase.")) : zle(b, t === "be" ? "Be musí mať tvar podľa podmetu (is / are)." : BE[q.t].includes(t) ? "Pozri, či je nový podmet jednotné alebo množné číslo." : "Čas sa nemení – mení sa len tvar be.")));
      } else if (krok === 2) {
        const b0 = zakl(q);
        el.krok.innerHTML = `<b>Krok 3:</b> Sloveso <b lang="en">${GB.esc(b0)}</b> daj do <b>3. stĺpca</b> (past participle).`;
        const opts = [...new Set([q.pp, b0, q.ps, ing(b0), q.pp === reg(b0) ? null : reg(b0)].filter(Boolean))];
        const vyber = [q.pp, ...zamiesaj(opts.filter((o) => o !== q.pp)).slice(0, 3)];
        tlacidla(zamiesaj(vyber), q.pp, (t, b) => (t === q.pp ? dalejKrok(`<span lang="en">${GB.esc(b0)} – ${GB.esc(q.ps)} – <b>${GB.esc(q.pp)}</b></span>`) : zle(b, t === q.ps && q.ps !== q.pp ? "To je 2. stĺpec (minulý čas). Treba 3. stĺpec." : /ing$/.test(t) ? "Tvar -ing sem nepatrí." : "Hľadaj 3. stĺpec – past participle.")));
      } else if (krok === 3) {
        el.krok.innerHTML = `<b>Krok 4:</b> Treba agenta <b lang="en">by…</b>? (kto to robí)`;
        tlacidla([`+ ${q.ag}`, "bez agenta"], null, (t, b) => {
          const s = t !== "bez agenta";
          const ok = q.a === "opt" || (q.a === "need" && s) || (q.a === "drop" && !s);
          if (!ok) return zle(b, q.a === "need" ? "Tu je dôležité, KTO to urobil – agenta necháme." : `<span lang="en">${GB.esc(q.ag)}</span> nič nové nehovorí (niekto, ľudia, oni) – vynecháme ho.`);
          agent = s; krok = 4; hotovo();
        });
      }
    }
    function klikSlovo(k, b) {
      if (k === "o") return dalejKrok(`<span lang="en"><b>${GB.esc(q.o)}</b></span> je predmet – v trpnom rode bude na začiatku vety ako podmet.`);
      b.classList.add("ps-slovo--zle");
      zle(null, k === "s" ? "To je podmet – ten, kto činnosť robí. Hľadáme predmet." : k === "v" ? "To je sloveso. Hľadáme predmet – čo / koho sa robí." : "Toto je doplnenie (kde, kedy). Hľadáme predmet.");
    }
    function hotovo() {
      sloty(); aktivna(true); el.moznosti.textContent = "";
      if (!chyba) body++;
      skore();
      const veta = `${q.O} ${q.be} ${q.pp}${agent ? " " + q.ag : ""}${q.x ? " " + q.x : ""}.`;
      const pozn = q.a === "opt" ? " Agent je tu nepovinný – správne je s ním aj bez neho." : "";
      el.krok.innerHTML = "";
      hlasenie(`${chyba ? "Hotovo." : "Výborne, bez chyby!"} <b lang="en">${GB.esc(veta)}</b><br>${GB.esc(q.sk)}${pozn}`, !chyba);
      el.dalej.textContent = ix + 1 < vety.length ? "Ďalšia veta →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = vety.length, dobre = body / n >= 0.75;
      if (body > (pamat.rekord || 0)) pamat.rekord = body;
      uloz();
      el.vysledok.textContent = `${body} z ${n} viet si premenil bez jedinej chyby. ` + (body === n ? "Perfektné!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`pasivum/${body}-z-${n}`, `Pasívum: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    const REZIMY = [["mix", "Všetky časy"], ["ps", "present simple"], ["past", "past simple"], ["pp", "present perfect"], ["will", "will"], ["pc", "present continuous"]];
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
    if (!len) kresliCipy();
    noveKolo();
  }
})();
