// Hra s nepravidelnými slovesami: pexeso a rýchlik (60 sekúnd).
(function () {
  const start = () => document.querySelectorAll("[data-hra-slovesa]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function reg(b) {
    if (/e$/.test(b)) return b + "d";
    if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + "ied";
    if (/^[^aeiou]*[aeiou][bdgmnprt]$/.test(b)) return b + b.slice(-1) + "ed";
    return b + "ed";
  }

  function init(box) {
    const data = GB.data("data-hra-slovesa") || {};
    const kniha = box.dataset.kniha, pp = box.dataset.tvar === "pp";
    // zoznam slovies: { z, t, sk, ine:[], p2 }
    const PP = {};
    (data.rodinyPP || []).forEach((r) => r.slovesa.forEach((s) => { PP[s[0]] = [s[1], ...(s[2] || [])]; }));
    let slovesa = [];
    (data.rodiny || []).forEach((r) => r.slovesa.forEach((s) => {
      if (kniha && s[4] && !s[4].includes(kniha)) return;
      if (s[0] === s[1] && !pp) return; // cut → cut je v hre nudné
      const p3 = PP[s[0]];
      if (pp && !p3) return;
      slovesa.push({ z: s[0], p2: s[1], sk: s[2], ine2: s[3] || [], p3: p3 ? p3[0] : null, ine3: p3 ? p3.slice(1) : [] });
    }));
    const odpoved = (v) => (pp ? v.p3 : v.p2);
    const ine = (v) => (pp ? v.ine3 : v.ine2);
    const NAZOV = pp ? "3. tvar" : "minulý tvar";
    const KLUC = "gb-hra-slovesa-" + (kniha || "vsetky") + (pp ? "-pp" : "");
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), pex: $("[data-pexeso]"), mriezka: $("[data-mriezka]"), pexStav: $("[data-pex-stav]"),
      ryc: $("[data-rychlik]"), cas: $("[data-cas]"), body: $("[data-body]"), sloveso: $("[data-sloveso]"), vyznam: $("[data-vyznam]"),
      moznosti: $("[data-moznosti]"), start: $("[data-start]"), spatna: $("[data-spatna]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), znova: $("[data-znova]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = "pexeso", hodiny = null;
    const zastav = () => { if (hodiny) clearInterval(hodiny); hodiny = null; };

    // ---------- pexeso ----------
    let otocene = [], tahy = 0, pary = 0, zaciatok = 0, zamok = false;
    function pexeso() {
      zastav(); el.koniec.hidden = true; el.pex.hidden = false; el.ryc.hidden = true;
      const vyber = zamiesaj(slovesa.filter((v) => odpoved(v) !== v.z)).slice(0, 6);
      const karty = zamiesaj(vyber.flatMap((v, i) => [{ i, t: v.z, druh: "z", v }, { i, t: odpoved(v), druh: "p", v }]));
      el.mriezka.textContent = ""; otocene = []; tahy = 0; pary = 0; zaciatok = 0; zamok = false;
      karty.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "hs-karta hs-karta--" + k.druh; b.setAttribute("aria-label", "Zakrytá karta");
        b.innerHTML = `<span class="hs-karta__rub" aria-hidden="true">?</span><span class="hs-karta__lic" lang="en">${GB.esc(k.t)}</span>`;
        b.addEventListener("click", () => otoc(b, k));
        el.mriezka.append(b);
      });
      stavPex();
    }
    function stavPex(text) {
      const rek = pamat.pexeso ? ` · rekord ${pamat.pexeso} ťahov` : "";
      el.pexStav.innerHTML = text || `Nájdi dvojice: <b>základný tvar</b> (modrá) + <b>${NAZOV}</b> (oranžová). Ťahy: ${tahy} · dvojice: ${pary} / 6${rek}`;
    }
    function otoc(b, k) {
      if (zamok || b.classList.contains("je-otocena") || b.classList.contains("je-par")) return;
      if (!zaciatok) zaciatok = Date.now();
      b.classList.add("je-otocena"); b.setAttribute("aria-label", k.t);
      otocene.push([b, k]);
      if (otocene.length < 2) return;
      tahy++;
      const [[b1, k1], [b2, k2]] = otocene;
      if (k1.i === k2.i && k1.druh !== k2.druh) {
        [b1, b2].forEach((x) => x.classList.add("je-par"));
        pary++; otocene = [];
        stavPex(`Správne! <b lang="en">${GB.esc(k1.v.z)} – ${GB.esc(odpoved(k1.v))}</b> (${GB.esc(k1.v.sk)}). Ťahy: ${tahy} · dvojice: ${pary} / 6`);
        if (pary === 6) setTimeout(koniecPex, 700);
      } else {
        zamok = true;
        stavPex(`Nie je to dvojica. Ťahy: ${tahy} · dvojice: ${pary} / 6`);
        setTimeout(() => { [b1, b2].forEach((x) => { x.classList.remove("je-otocena"); x.setAttribute("aria-label", "Zakrytá karta"); }); otocene = []; zamok = false; }, 1100);
      }
    }
    function koniecPex() {
      const s = Math.round((Date.now() - zaciatok) / 1000);
      const novy = !pamat.pexeso || tahy < pamat.pexeso;
      if (novy) { pamat.pexeso = tahy; uloz(); }
      ukazKoniec(`Hotovo! ${tahy} ťahov za ${s} s.` + (novy ? " To je tvoj nový rekord!" : ` Rekord: ${pamat.pexeso} ťahov.`), novy || tahy <= 12);
      if (GB.udalost) GB.udalost(`hra-slovesa/pexeso/${tahy}`, `Pexeso: ${tahy} ťahov`);
    }

    // ---------- rýchlik ----------
    let body = 0, seria = 0, zvysok = 60, aktual = null, fronta = [], chyby = [];
    function rychlik() {
      zastav(); el.koniec.hidden = true; el.pex.hidden = true; el.ryc.hidden = false;
      el.start.hidden = false; el.moznosti.textContent = ""; el.sloveso.textContent = "60 sekúnd"; el.vyznam.textContent = `Ku každému slovesu vyber ${NAZOV}. Koľko ich stihneš?`;
      el.spatna.hidden = true; el.cas.style.setProperty("--p", 1); el.body.textContent = pamat.rychlik ? `rekord ${pamat.rychlik}` : "";
    }
    function startRychlik() {
      body = 0; seria = 0; zvysok = 60; fronta = zamiesaj(slovesa); chyby = [];
      el.start.hidden = true;
      const t0 = Date.now();
      hodiny = setInterval(() => {
        zvysok = Math.max(0, 60 - (Date.now() - t0) / 1000);
        el.cas.style.setProperty("--p", zvysok / 60);
        if (zvysok <= 0) { zastav(); koniecRychlik(); }
      }, 100);
      dalsieSloveso();
    }
    function dalsieSloveso() {
      if (!fronta.length) fronta = zamiesaj(slovesa);
      aktual = fronta.pop();
      el.sloveso.textContent = aktual.z; el.vyznam.textContent = aktual.sk;
      el.body.textContent = `body ${body}` + (seria >= 3 ? ` · séria ${seria} 🔥` : "");
      const spr = odpoved(aktual), zle = new Set();
      [reg(aktual.z), pp ? aktual.p2 : aktual.p3, aktual.z, aktual.p2 + "ed"].forEach((w) => { if (w && w !== spr && !ine(aktual).includes(w)) zle.add(w); });
      const moz = zamiesaj([spr, ...zamiesaj([...zle]).slice(0, 2)]);
      el.moznosti.textContent = "";
      moz.forEach((w) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip hs-moznost"; b.lang = "en"; b.textContent = w;
        b.addEventListener("click", () => klik(w, b));
        el.moznosti.append(b);
      });
    }
    function klik(w, b) {
      if (!hodiny) return;
      const ok = w === odpoved(aktual);
      if (ok) { body++; seria++; el.spatna.hidden = true; }
      else {
        seria = 0; chyby.push(aktual);
        el.spatna.className = "trener__spatna trener__spatna--zle";
        el.spatna.innerHTML = `<span lang="en">${GB.esc(aktual.z)} → <b>${GB.esc(odpoved(aktual))}</b></span> (${GB.esc(aktual.sk)})`;
        el.spatna.hidden = false;
      }
      b.classList.add(ok ? "hs-moznost--ok" : "hs-moznost--zle");
      setTimeout(dalsieSloveso, ok ? 150 : 600);
    }
    function koniecRychlik() {
      el.moznosti.textContent = "";
      const novy = body > (pamat.rychlik || 0);
      if (novy) { pamat.rychlik = body; uloz(); }
      const ch = [...new Map(chyby.map((v) => [v.z, v])).values()].slice(0, 6);
      ukazKoniec(`Čas vypršal! Máš ${body} bodov.` + (novy ? " Nový rekord!" : ` Rekord: ${pamat.rychlik}.`) +
        (ch.length ? ` Zopakuj si: ${ch.map((v) => `${v.z} – ${odpoved(v)}`).join(", ")}.` : ""), novy || body >= 15);
      if (GB.udalost) GB.udalost(`hra-slovesa/rychlik/${body}`, `Rýchlik: ${body}`);
    }

    function ukazKoniec(t, dobre) {
      el.koniec.hidden = false; el.vysledok.textContent = t;
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      el.znova.focus({ preventScroll: true });
    }
    const REZIMY = [["pexeso", "Pexeso"], ["rychlik", "Rýchlik – 60 sekúnd"]];
    function kresliCipy() {
      el.cipy.textContent = "";
      REZIMY.forEach(([id, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        b.setAttribute("aria-pressed", id === rezim ? "true" : "false");
        b.addEventListener("click", () => { rezim = id; kresliCipy(); spusti(); });
        el.cipy.append(b);
      });
    }
    const spusti = () => (rezim === "pexeso" ? pexeso() : rychlik());
    el.start.addEventListener("click", startRychlik);
    el.znova.addEventListener("click", () => { el.koniec.hidden = true; spusti(); if (rezim === "rychlik") startRychlik(); });
    kresliCipy(); spusti();
  }
})();
