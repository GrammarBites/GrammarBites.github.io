// Tréner „Nákupný košík“: počítateľné × nepočítateľné, much / many, a few / a little, obaly.
(function () {
  const start = () => document.querySelectorAll("[data-kosik]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clen = (w) => (/^[aeiou]/.test(w) ? "an" : "a");

  function init(box) {
    const data = GB.data("data-kosik") || {};
    const KLUC = "gb-kosik";
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"),
      vec: $("[data-vec]"), emoji: $("[data-emoji]"), slovo: $("[data-slovo]"), sk: $("[data-sk]"), kosiky: $("[data-kosiky]"),
      veta: $("[data-veta]"), moznosti: $("[data-moznosti]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      kosC: $("[data-kos='c']"), kosU: $("[data-kos='u']"), obsC: $("[data-obsah='c']"), obsU: $("[data-obsah='u']"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = "mix", ulohy = [], ix = 0, body = 0, q = null, hotovo = false;

    function hlasenie(t, ok) { el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle"); el.spatna.innerHTML = t; el.spatna.hidden = false; }
    function dalejBtn() { el.dalej.textContent = ix + 1 < ulohy.length ? "Ďalej →" : "Výsledok →"; el.dalej.hidden = false; el.dalej.focus({ preventScroll: true }); }
    const skore = () => { el.skore.textContent = `body ${body}` + (pamat["r-" + rezim] ? ` · rekord ${pamat["r-" + rezim]}` : ""); };

    function vyprazdni() { el.obsC.textContent = ""; el.obsU.textContent = ""; }
    function pridaj(kam, v, ok) {
      const s = document.createElement("span");
      s.className = "ks-polozka" + (ok ? "" : " ks-polozka--zle"); s.title = v.en; s.textContent = v.e;
      (kam ? el.obsC : el.obsU).append(s);
    }
    function vyberKos(pocitatelne) {
      if (hotovo || !q || q.typ !== "trid") return;
      hotovo = true;
      const ok = pocitatelne === q.v.c;
      if (ok) body++;
      pridaj(q.v.c, q.v, ok);
      const v = q.v;
      const info = v.c
        ? `<b lang="en">${clen(v.en)} ${GB.esc(v.en)} → two ${GB.esc(v.pl)}</b> · <span lang="en">How many ${GB.esc(v.pl)}?</span>`
        : `<b lang="en">${GB.esc(v.en)}</b> – bez a / an aj bez -s · <span lang="en">How much ${GB.esc(v.en)}?</span> · spočítaš cez obal: <b lang="en">${GB.esc(v.kus)}</b>`;
      hlasenie((ok ? "Správne! " : v.c ? "Nie celkom – dá sa spočítať po kusoch. " : "Nie celkom – nedá sa spočítať po kusoch. ") + info, ok);
      [el.kosC, el.kosU].forEach((k) => (k.disabled = true));
      (v.c ? el.kosC : el.kosU).classList.add("ks-kos--ok");
      if (!ok) (pocitatelne ? el.kosC : el.kosU).classList.add("ks-kos--zle");
      skore(); dalejBtn();
    }
    el.kosC.addEventListener("click", () => vyberKos(true));
    el.kosU.addEventListener("click", () => vyberKos(false));

    function dalsia() {
      if (ix >= ulohy.length) return koniec();
      q = ulohy[ix]; hotovo = false;
      el.stav.textContent = `${ix + 1} / ${ulohy.length}`; skore();
      el.spatna.hidden = true; el.dalej.hidden = true;
      [el.kosC, el.kosU].forEach((k) => { k.disabled = false; k.classList.remove("ks-kos--ok", "ks-kos--zle"); });
      const trid = q.typ === "trid";
      el.vec.hidden = !trid; el.kosiky.hidden = !trid;
      el.veta.hidden = trid; el.moznosti.hidden = trid; el.moznosti.textContent = "";
      if (trid) {
        el.emoji.textContent = q.v.e; el.slovo.textContent = q.v.en; el.sk.textContent = q.v.sk;
      } else {
        el.veta.innerHTML = GB.esc(q.v.v).replace("___", '<span class="co-medzera">…</span>');
        zamiesaj(q.v.f.map((f, i) => [f, i])).forEach(([f, i]) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "trener__cip ks-moznost"; b.lang = "en"; b.textContent = f;
          b.addEventListener("click", () => odpoved(i, b));
          el.moznosti.append(b);
        });
      }
    }
    function odpoved(i, b) {
      if (hotovo) return;
      hotovo = true;
      const ok = i === q.v.ok;
      if (ok) body++;
      el.moznosti.querySelectorAll("button").forEach((x) => {
        x.disabled = true;
        if (x.textContent === q.v.f[q.v.ok]) x.classList.add("ks-moznost--ok");
        else if (x === b) x.classList.add("ks-moznost--zle");
      });
      el.veta.innerHTML = GB.esc(q.v.v).replace("___", `<b class="co-doplnene">${GB.esc(q.v.f[q.v.ok])}</b>`);
      hlasenie((ok ? "Správne! " : "Nie celkom. ") + GB.esc(q.v.why), ok);
      skore(); dalejBtn();
    }
    function noveKolo() {
      const veci = zamiesaj(data.veci || []).map((v) => ({ typ: "trid", v }));
      const vety = zamiesaj(data.vety || []).map((v) => ({ typ: "veta", v }));
      ulohy = rezim === "trid" ? veci.slice(0, 12) : rezim === "vety" ? vety.slice(0, 10) : [...veci.slice(0, 6), ...vety.slice(0, 6)];
      ix = 0; body = 0; vyprazdni();
      el.koniec.hidden = true; el.karta.hidden = false; dalsia();
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = ulohy.length, dobre = body / n >= 0.8, k = "r-" + rezim;
      if (body > (pamat[k] || 0)) pamat[k] = body;
      uloz();
      el.vysledok.textContent = `Máš ${body} z ${n} bodov. ` + (body === n ? "Perfektný nákup!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`kosik/${rezim}/${body}-z-${n}`, `Košík: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    const REZIMY = [["mix", "Všetko"], ["trid", "Roztrieď do košíkov"], ["vety", "much / many, a few / a little, obaly"]];
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
