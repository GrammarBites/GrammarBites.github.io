// Tréner slovnej zásoby: pexeso (slovo ↔ odvodené slovo / preklad) a Doplň slovo do vety.
// Údaje: src/_data/slovickaData.json. Rekordy sa pamätajú len v tomto prehliadači.
(function () {
  const start = () => document.querySelectorAll("[data-slovicka]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function init(box) {
    const id = box.dataset.slovicka;
    const data = GB.data("data-slovicka-" + id);
    if (!data) return;
    const KLUC = "gb-slovicka-" + id, PAROV = 6, KOLO = Math.min(10, data.vety.length);
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), pex: $("[data-pexeso]"), mriezka: $("[data-mriezka]"), pexStav: $("[data-pex-stav]"),
      dop: $("[data-doplnit]"), stav: $("[data-stav]"), skore: $("[data-skore]"), veta: $("[data-veta]"), moznosti: $("[data-moznosti]"),
      spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), chyby: $("[data-chyby]"), znova: $("[data-znova]"),
      dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = "doplnit";

    // ---------- pexeso ----------
    let otocene = [], tahy = 0, pary = 0, zamok = false, vyber = [];
    const preklad = (p) => (p[2] && p[2] !== p[1] ? ` (${GB.esc(p[2])})` : "");
    function pexeso() {
      el.koniec.hidden = true; el.pex.hidden = false; el.dop.hidden = true;
      // 6 dvojíc, žiadne slovo dvakrát
      const pouzite = new Set(); vyber = [];
      for (const p of zamiesaj(data.pary)) {
        if (vyber.length === PAROV) break;
        if (pouzite.has(p[0]) || pouzite.has(p[1])) continue;
        pouzite.add(p[0]); pouzite.add(p[1]); vyber.push(p);
      }
      const karty = zamiesaj(vyber.flatMap((p, i) => [{ i, t: p[0], druh: "z" }, { i, t: p[1], druh: "p" }]));
      el.mriezka.textContent = ""; otocene = []; tahy = 0; pary = 0; zamok = false;
      karty.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "hs-karta hs-karta--" + k.druh; b.setAttribute("aria-label", "Zakrytá karta");
        b.innerHTML = `<span class="hs-karta__rub" aria-hidden="true">?</span><span class="hs-karta__lic"${k.druh === "p" && data.pravy === "po slovensky" ? "" : ' lang="en"'}>${GB.esc(k.t)}</span>`;
        b.addEventListener("click", () => otoc(b, k));
        el.mriezka.append(b);
      });
      stavPex();
    }
    function stavPex(text) {
      const rek = pamat.pexeso ? ` · rekord ${pamat.pexeso} ťahov` : "";
      el.pexStav.innerHTML = (text ? text + " " : `Nájdi dvojice: <b>${GB.esc(data.lavy)}</b> (modrá) + <b>${GB.esc(data.pravy)}</b> (oranžová). `) + `Ťahy: ${tahy} · dvojice: ${pary} / ${vyber.length}${rek}`;
    }
    function otoc(b, k) {
      if (zamok || b.classList.contains("je-otocena") || b.classList.contains("je-par")) return;
      b.classList.add("je-otocena"); b.setAttribute("aria-label", k.t);
      otocene.push([b, k]);
      if (otocene.length < 2) return;
      tahy++;
      const [[b1, k1], [b2, k2]] = otocene;
      if (k1.i === k2.i && k1.druh !== k2.druh) {
        [b1, b2].forEach((x) => x.classList.add("je-par"));
        pary++; otocene = [];
        const p = vyber[k1.i];
        stavPex(`Správne! <b lang="en">${GB.esc(p[0])}</b> – <b>${GB.esc(p[1])}</b>${preklad(p)}.`);
        if (pary === vyber.length) setTimeout(koniecPex, 700);
      } else {
        zamok = true;
        stavPex("Nie je to dvojica.");
        setTimeout(() => { [b1, b2].forEach((x) => { x.classList.remove("je-otocena"); x.setAttribute("aria-label", "Zakrytá karta"); }); otocene = []; zamok = false; }, 1100);
      }
    }
    function koniecPex() {
      const novy = !pamat.pexeso || tahy < pamat.pexeso;
      if (novy) { pamat.pexeso = tahy; uloz(); }
      ukazKoniec(`Všetky dvojice máš za ${tahy} ťahov.` + (novy ? " Nový rekord!" : ""), tahy <= vyber.length * 2, "");
      GB.udalost(`slovicka/${id}/pexeso/${tahy}`, `Pexeso ${id}: ${tahy} ťahov`);
    }

    // ---------- doplnit slovo ----------
    let kolo = [], ix = 0, body = 0, chyby = [], q = null;
    function doplnit() {
      el.koniec.hidden = true; el.pex.hidden = true; el.dop.hidden = false;
      kolo = zamiesaj(data.vety).slice(0, KOLO); ix = 0; body = 0; chyby = [];
      ukaz();
    }
    const vetaHtml = (v, vypln) => {
      const [a, b] = GB.esc(v.t).split("___");
      const stred = vypln ? `<b class="rz-doplnene rz--ok">${GB.esc(vypln)}</b>` : `<span class="rz-medzera" aria-label="medzera">___</span>` + (v.z ? ` <span class="co-inf">(${GB.esc(v.z)})</span>` : "");
      return a + stred + b;
    };
    const skore = () => (el.skore.textContent = `body ${body}` + (pamat.doplnit ? ` · rekord ${pamat.doplnit}` : ""));
    function ukaz() {
      q = kolo[ix];
      el.stav.textContent = `${ix + 1} / ${kolo.length}`; skore();
      el.veta.innerHTML = vetaHtml(q, null);
      el.spatna.hidden = true; el.dalej.hidden = true; el.moznosti.textContent = "";
      zamiesaj([q.ok, ...q.zle]).forEach((t) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip hs-moznost"; b.lang = "en"; b.textContent = t;
        b.addEventListener("click", () => odpovedz(t, b));
        el.moznosti.append(b);
      });
    }
    function odpovedz(t, b) {
      const ok = t === q.ok;
      if (ok) body++; else chyby.push(q);
      el.moznosti.querySelectorAll("button").forEach((x) => {
        x.disabled = true;
        if (x.textContent === q.ok) x.classList.add("hs-moznost--ok");
        else if (x === b) x.classList.add("hs-moznost--zle");
      });
      el.veta.innerHTML = vetaHtml(q, q.ok);
      el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle");
      el.spatna.innerHTML = (ok ? "Správne! " : `Nie celkom – správne je <b lang="en">${GB.esc(q.ok)}</b>. `) + (q.v || "");
      el.spatna.hidden = false; skore();
      el.dalej.textContent = ix + 1 < kolo.length ? "Ďalej →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function koniecDop() {
      const n = kolo.length, novy = pamat.doplnit > 0 && body > pamat.doplnit;
      if (body > (pamat.doplnit || 0)) { pamat.doplnit = body; uloz(); }
      const zoznam = chyby.length ? "Pozor na tieto vety:<ul>" + chyby.map((v) => `<li lang="en">${GB.esc(v.t.replace("___", v.ok))}</li>`).join("") + "</ul>" : "";
      ukazKoniec(`Máš ${body} z ${n} bodov. ` + (body === n ? "Perfektné!" : body / n >= 0.8 ? "Skvelá práca!" : "Pozri si výklad a skús to znova.") + (novy ? " Nový rekord!" : ""), body / n >= 0.8, zoznam);
      GB.udalost(`slovicka/${id}/doplnit/${body}-z-${n}`, `Doplň slovo ${id}: ${body}/${n}`);
    }

    function ukazKoniec(text, dobre, zoznam) {
      el.pex.hidden = true; el.dop.hidden = true; el.koniec.hidden = false;
      el.vysledok.textContent = text; el.chyby.innerHTML = zoznam;
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      el.znova.focus({ preventScroll: true });
    }
    const spusti = () => (rezim === "pexeso" ? pexeso() : doplnit());
    const REZIMY = [["doplnit", "Doplň slovo"], ["pexeso", "Pexeso"]];
    function kresliCipy() {
      el.cipy.textContent = "";
      REZIMY.forEach(([r, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        b.setAttribute("aria-pressed", r === rezim ? "true" : "false");
        b.addEventListener("click", () => { rezim = r; kresliCipy(); spusti(); });
        el.cipy.append(b);
      });
    }
    el.dalej.addEventListener("click", () => { ix++; if (ix < kolo.length) ukaz(); else koniecDop(); });
    el.znova.addEventListener("click", spusti);
    kresliCipy(); spusti();
  }
})();
