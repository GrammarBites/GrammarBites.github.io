// Tréner vzťažných viet: spoj dve vety do jednej (nájdi opakované slovo → who / which / that / where → opakované slovo vypadne).
(function () {
  const start = () => document.querySelectorAll("[data-vztazne]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ZAM = ["who", "which", "that", "where"];
  const INE = { who: "which", which: "who", where: "which" };

  function init(box) {
    const data = GB.data("data-vztazne") || {};
    const vsetky = data.vety || [];
    const KOLO = 8, KLUC = "gb-vztazne";
    const $ = (s) => box.querySelector(s);
    const el = {
      karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), v1: $("[data-v1]"), v2: $("[data-v2]"),
      krok: $("[data-krok]"), moznosti: $("[data-moznosti]"), vysl: $("[data-vysl]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = { rekord: 0 };
    try { pamat = Object.assign(pamat, JSON.parse(localStorage.getItem(KLUC)) || {}); } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let vety = [], ix = 0, body = 0, q = null, krok = 0, chyba = false, zvolene = null;

    const hlasenie = (t, ok) => { el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle"); el.spatna.innerHTML = t; el.spatna.hidden = false; };
    function veta1() {
      const i = q.a.indexOf(q.ant);
      el.v1.innerHTML = GB.esc(q.a.slice(0, i)) + `<span class="vz-ant${krok > 0 ? " vz-ant--zap" : ""}">${GB.esc(q.ant)}</span>` + GB.esc(q.a.slice(i + q.ant.length));
    }
    function veta2() {
      el.v2.textContent = "";
      q.b.forEach((w, i) => {
        const opak = i === q.r && krok > 0;
        const e = document.createElement(krok === 0 ? "button" : "span");
        e.className = "vz-slovo" + (opak ? " vz-slovo--opak" : "") + (opak && krok > 1 ? " vz-slovo--von" : "");
        if (krok === 0) { e.type = "button"; e.addEventListener("click", () => klik(i, e)); }
        e.textContent = w; el.v2.append(e, " ");
      });
      if (krok > 1) { const z = document.createElement("span"); z.className = "vz-zam"; z.textContent = zvolene; el.v2.prepend(z, " "); }
    }
    function tlacidla(list, pri, trieda = "") {
      el.moznosti.textContent = "";
      list.forEach((t) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip vz-moznost " + trieda; b.lang = "en"; b.textContent = t;
        b.addEventListener("click", () => pri(t, b));
        el.moznosti.append(b);
      });
    }
    const zle = (b, t) => { chyba = true; if (b) { b.classList.add("vz-moznost--zle"); b.disabled = true; } hlasenie("Skús ešte raz. " + t, false); };
    function ukaz() {
      veta1(); veta2(); el.moznosti.textContent = ""; el.vysl.hidden = true;
      if (krok === 0) el.krok.innerHTML = "<b>Krok 1:</b> Ťukni na slovo v druhej vete, ktoré <b>opakuje</b> niečo z prvej vety.";
      else if (krok === 1) {
        el.krok.innerHTML = `<b>Krok 2:</b> Čím ho nahradíš? (<span lang="en">${GB.esc(q.ant)}</span> = ${q.rel === "who" ? "človek" : q.rel === "where" ? "miesto" : "vec alebo zviera"})`;
        tlacidla(ZAM, (t, b) => {
          if (!q.ok.includes(t)) return zle(b, t === "where" ? "Where použijeme len pri mieste, keď v druhej vete je <i lang=\"en\">there</i>." : t === "who" ? "Who je len pre ľudí." : t === "which" ? "Which je pre veci a zvieratá, nie pre ľudí." : "That tu nemôže byť – pri mieste s there použijeme where.");
          zvolene = t; krok = 2;
          hlasenie(`<b lang="en">${t}</b> – ` + (t === "that" ? "that môže byť pri ľuďoch aj veciach." : t === "who" ? "pre ľudí." : t === "which" ? "pre veci a zvieratá." : "pre miesto (namiesto there).") + ` Ide na začiatok druhej vety a <b lang="en">${GB.esc(q.b[q.r].replace(/\W+$/, ""))}</b> vypadne – v relative clause je len raz.`, true);
          ukaz();
        });
      } else if (krok === 2) {
        el.krok.innerHTML = "<b>Krok 3:</b> Ktorá spojená veta je správna?";
        const ina = q.spoj.replace(new RegExp(`\\b${q.rel}\\b`), INE[q.rel]);
        const spr = zvolene === q.rel ? q.spoj : q.spoj.replace(new RegExp(`\\b${q.rel}\\b`), zvolene);
        tlacidla(zamiesaj([spr, q.zle.replace(new RegExp(`\\b${q.rel}\\b`), zvolene), ina]), (t, b) => {
          if (t !== spr) return zle(b, t === ina ? "Pozri sa na zámeno – sedí k slovu z prvej vety?" : `<span lang="en">${GB.esc(q.b[q.r].replace(/\W+$/, ""))}</span> tam nesmie zostať – už ho zastupuje <span lang="en">${zvolene}</span>.`);
          hotovo(spr);
        }, "vz-moznost--veta");
      }
    }
    function klik(i, e) {
      if (i === q.r) { krok = 1; hlasenie(`Áno! <b lang="en">${GB.esc(q.b[i].replace(/\W+$/, ""))}</b> = <b lang="en">${GB.esc(q.ant)}</b> – je to tá istá ${q.rel === "who" ? "osoba" : q.rel === "where" ? "miesto" : "vec"}.`, true); return ukaz(); }
      e.classList.add("vz-slovo--zle"); zle(null, "Toto slovo v prvej vete nemá dvojníka. Hľadaj he / she / it / him / her / there…");
    }
    function hotovo(veta) {
      if (!chyba) body++;
      el.moznosti.textContent = ""; el.krok.innerHTML = "";
      const p = veta.slice(-1), w = veta.slice(0, -1).split(" "), k = w.indexOf(zvolene);
      const pred = w.slice(0, k).join(" "), rc = w.slice(k, k + q.b.length).join(" "), po = w.slice(k + q.b.length).join(" ");
      el.vysl.innerHTML = `<span lang="en">${GB.esc(pred)} <mark>${GB.esc(rc)}</mark>${po ? " " + GB.esc(po) : ""}${p}</span>`;
      el.vysl.hidden = false;
      skore();
      hlasenie(`${chyba ? "Hotovo." : "Výborne, bez chyby!"} Žltou je <b>relative clause</b>. ${GB.esc(q.sk)}`, !chyba);
      el.dalej.textContent = ix + 1 < vety.length ? "Ďalšia dvojica →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    const skore = () => { el.skore.textContent = `body ${body}` + (pamat.rekord ? ` · rekord ${pamat.rekord}` : ""); };
    function dalsia() {
      if (ix >= vety.length) return koniec();
      q = vety[ix]; krok = 0; chyba = false; zvolene = null;
      el.stav.textContent = `${ix + 1} / ${vety.length}`; skore();
      el.spatna.hidden = true; el.dalej.hidden = true; ukaz();
    }
    function noveKolo() { vety = zamiesaj(vsetky).slice(0, KOLO); ix = 0; body = 0; el.koniec.hidden = true; el.karta.hidden = false; dalsia(); }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = vety.length, dobre = body / n >= 0.75;
      if (body > (pamat.rekord || 0)) pamat.rekord = body;
      uloz();
      el.vysledok.textContent = `${body} z ${n} dvojíc si spojil bez jedinej chyby. ` + (body === n ? "Perfektné!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`vztazne/${body}-z-${n}`, `Relative clauses: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    el.dalej.addEventListener("click", () => { ix++; dalsia(); });
    el.dalsie.addEventListener("click", noveKolo);
    noveKolo();
  }
})();
