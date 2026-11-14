// Nájdi a oprav chybu: žiak dostane vetu (4 s typickou chybou, 1 správnu), chybu prepíše a stlačí Skontrolovať.
// Správnu vetu stačí potvrdiť tlačidlom „Veta je v poriadku“. Skrátené aj dlhé tvary (isn't = is not) berieme ako rovnaké.
// Nič sa neukladá ani neposiela, len anonymný výsledok kola do štatistík.
(function () {
  const start = () => document.querySelectorAll("[data-oprav]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  const POCET = 5; // viet v kole: 4 s chybou + 1 správna
  const apos = (t) => String(t || "").replace(/[´`‘’ʼ′]/g, "'");
  // porovnávame bez veľkých písmen, bez interpunkcie a so skrátenými tvarmi rozpísanými (isn't = is not)
  const norm = (t) => (" " + apos(t).toLowerCase() + " ")
    .replace(/\bwon't\b/g, "will not").replace(/\bcan't\b/g, "can not").replace(/\bcannot\b/g, "can not").replace(/\bshan't\b/g, "shall not")
    .replace(/n't\b/g, " not").replace(/'m\b/g, " am").replace(/'re\b/g, " are").replace(/'ll\b/g, " will").replace(/'ve\b/g, " have")
    .replace(/\b(he|she|it|that|there|here|what|who|where)'s\b/g, "$1 is")
    .replace(/[.,!?;:"“”]/g, " ").replace(/\s+/g, " ").trim();
  const bezApostrofov = (t) => apos(t).toLowerCase().replace(/[.,!?;:"“”']/g, "").replace(/\s+/g, " ").trim();
  const zamiesaj = (pole) => {
    const p = [...pole];
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    return p;
  };

  function init(root) {
    const lekcia = root.dataset.lekcia;
    const ulohy = GB.data("data-oprav-" + lekcia) || [];
    const $ = (s) => root.querySelector(s);
    const el = {
      karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), vstup: $("[data-vstup]"), apos: $("[data-apos]"),
      vysledok: $("[data-vysledok]"), over: $("[data-over]"), ok: $("[data-ok]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), zaver: $("[data-zaver]"), dalsie: $("[data-dalsie]"),
    };
    let kolo = [], i = 0, body = 0, hotovo = false;

    function noveKolo() {
      const mix = zamiesaj(ulohy);
      const sChybou = mix.slice(0, Math.min(POCET - 1, mix.length - 1));
      // veta bez chyby = správna verzia úlohy, ktorá v tomto kole nie je, aby nikdy neprezradila inú vetu
      const zvysok = mix.slice(sChybou.length);
      const spravna = zvysok.length ? { ...zvysok[0], bezChyby: true, a: zvysok[0].s } : null;
      kolo = zamiesaj(spravna ? [...sChybou, spravna] : sChybou);
      i = 0; body = 0;
      el.koniec.hidden = true;
      el.karta.hidden = false;
      ukaz();
    }

    function ukaz() {
      const u = kolo[i];
      hotovo = false;
      el.stav.textContent = `Veta ${i + 1} z ${kolo.length}`;
      el.skore.textContent = `body ${body}`;
      el.vstup.value = u.a;
      el.vstup.disabled = false;
      el.vysledok.hidden = true;
      el.vysledok.className = "trener__spatna oc-vysledok";
      el.over.hidden = false; el.ok.hidden = false; el.dalej.hidden = true;
      el.dalej.textContent = i === kolo.length - 1 ? "Hotovo →" : "Ďalej →";
    }

    function ukazVysledok(dobre, text, u) {
      hotovo = true;
      if (dobre) body++;
      el.skore.textContent = `body ${body}`;
      el.vstup.disabled = true;
      el.vysledok.className = "trener__spatna oc-vysledok " + (dobre ? "trener__spatna--ok" : "trener__spatna--zle");
      el.vysledok.innerHTML = `<span class="oc-verdikt">${text}</span> ` +
        (u.bezChyby || dobre ? "" : `Správne je: <span class="oc-spravne" lang="en">${u.z}</span> `) + (u.v || "");
      el.vysledok.hidden = false;
      el.over.hidden = true; el.ok.hidden = true; el.dalej.hidden = false;
      el.dalej.focus();
    }

    function skontroluj() {
      if (hotovo) return;
      const u = kolo[i];
      const text = apos(el.vstup.value).trim();
      if (!text) { el.vstup.focus(); return; }
      const zhoda = norm(text) === norm(u.s);
      if (u.bezChyby) {
        // veta bola správna: žiak ju buď nechal, alebo „opravil“
        return zhoda ? ukazVysledok(true, "Presne, táto veta bola v poriadku.", u) : ukazVysledok(false, "Táto veta bola správna – opravovať sa v nej nič nemalo.", u);
      }
      if (zhoda) return ukazVysledok(true, "Správne!", u);
      if (norm(text) === norm(u.a)) return ukazVysledok(false, "Veta je stále rovnaká – chyba v nej ešte je.", u);
      if (bezApostrofov(text) === bezApostrofov(u.s)) return ukazVysledok(false, "Skoro! Skrátený tvar sa píše s apostrofom (pomôže tlačidlo Vložiť ').", u);
      if (u.b && norm(text).includes(norm(u.b))) return ukazVysledok(false, "Opravu máš dobre, ale vo zvyšku vety máš niečo inak.", u);
      return ukazVysledok(false, "Nie celkom.", u);
    }

    function jeVPoriadku() {
      if (hotovo) return;
      const u = kolo[i];
      u.bezChyby ? ukazVysledok(true, "Presne, táto veta bola v poriadku.", u) : ukazVysledok(false, "V tejto vete chyba bola.", u);
    }

    function dalej() {
      if (i < kolo.length - 1) { i++; ukaz(); el.vstup.focus(); return; }
      const n = kolo.length, dobre = body / n >= 0.8;
      el.zaver.textContent = `Máš ${body} z ${n} správne. ` + (body === n ? "Žiadna chyba ti neunikla!" : dobre ? "Skvelá práca!" : "Pozri si ešte raz výklad a skús ďalšie kolo.");
      el.koniec.querySelector("[data-obr-dobre]").hidden = !dobre;
      el.koniec.querySelector("[data-obr-zle]").hidden = dobre;
      el.karta.hidden = true;
      el.koniec.hidden = false;
      GB.udalost(`oprav-chybu/${lekcia}/${body}-z-${n}`, `Nájdi a oprav chybu ${lekcia}: ${body}/${n}`);
    }

    el.over.addEventListener("click", skontroluj);
    el.ok.addEventListener("click", jeVPoriadku);
    el.dalej.addEventListener("click", dalej);
    el.dalsie.addEventListener("click", () => { noveKolo(); el.vstup.focus(); });
    el.vstup.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); hotovo ? dalej() : skontroluj(); } });
    el.apos.addEventListener("mousedown", (e) => e.preventDefault()); // kurzor ostane v poli
    el.apos.addEventListener("click", () => {
      if (el.vstup.disabled) return;
      const a = el.vstup.selectionStart ?? el.vstup.value.length, b = el.vstup.selectionEnd ?? a;
      el.vstup.setRangeText("'", a, b, "end");
      el.vstup.focus();
    });
    noveKolo();
  }
})();
