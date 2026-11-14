// Pred písomkou: zmiešaný test z hotových otázok všetkých lekcií jedného unitu.
// Adresa: /pred-pisomkou/#project-4/6 (učebnica/unit). Bez # sa ukáže výber unitu.
// Otázky pripravuje filter predPisomkou v eleventy.config.js (mini testy + vety z trenažérov).
(function () {
  const app = document.querySelector("[data-pp]");
  const D = GB.data("data-pred-pisomkou");
  if (!app || !D) return;

  const $ = (s) => app.querySelector(s);
  const el = {
    vyber: $("[data-vyber]"), obal: $("[data-test-obal]"), nadpis: $("[data-nadpis]"), omrvinka: $("[data-omrvinka]"),
    uvod: $("[data-uvod]"), lekcie: $("[data-lekcie]"), form: $("[data-form]"), otazky: $("[data-otazky]"),
    chyba: $("[data-chyba]"), skontroluj: $("[data-skontroluj]"), stav: $("[data-stav]"), vysledok: $("[data-vysledok]"),
    vysledokText: $("[data-vysledok-text]"), zopakuj: $("[data-zopakuj]"), po: $("[data-po]"), nove: $("[data-nove]"),
    naUnit: $("[data-na-unit]"),
  };
  const titulok = document.title;
  let unit = null;      // { kniha, unit }
  let otazky = [];      // otázky práve zobrazeného testu
  let hotovo = false;   // test je skontrolovaný
  let upozornene = false;

  const zamiesaj = (pole) => {
    const p = [...pole];
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  };
  const tvar = (n, jeden, dva, pat) => (n === 1 ? jeden : n >= 2 && n <= 4 ? dva : pat);
  const bezTagov = (t) => { const d = document.createElement("div"); d.innerHTML = t; return d.textContent; };

  function najdi(hash) {
    const [knihaId, unitId] = decodeURIComponent(hash.replace(/^#/, "")).split("/");
    const kniha = D.knihy.find((k) => k.id === knihaId);
    const u = kniha && kniha.units.find((x) => x.id === unitId);
    return u ? { kniha, unit: u } : null;
  }

  // Z každej lekcie postupne po jednej otázke, aby bol v teste celý unit.
  // V lekcii idú najprv otázky mini testu spolu s najviac 5 vetami z trenažéra; zvyšné vety
  // z trenažéra prídu na rad, len keď by inak otázok nebolo dosť.
  function vyberOtazky(u) {
    const rady = zamiesaj(u.lekcie).map((slug) => {
      const L = D.lekcie[slug];
      const x = zamiesaj(L.x);
      return [...zamiesaj([...L.q, ...x.slice(0, 5)]), ...x.slice(5)].map((q) => ({ ...q, lekcia: slug }));
    });
    const von = [];
    const videne = new Set();
    while (von.length < D.pocet && rady.some((r) => r.length)) {
      for (const r of rady) {
        if (von.length >= D.pocet) break;
        const q = r.shift();
        if (!q) continue;
        const kluc = q.k ? GB.normalizuj(q.k) : GB.normalizuj(bezTagov(q.o));
        if (videne.has(kluc)) continue;
        videne.add(kluc);
        von.push(q);
      }
    }
    return zamiesaj(von);
  }

  function vykresli() {
    otazky = vyberOtazky(unit.unit);
    hotovo = false;
    upozornene = false;
    el.otazky.innerHTML = otazky.map((q, i) => {
      const poradie = q.n ? q.m.map((_, j) => j) : zamiesaj(q.m.map((_, j) => j));
      return `<fieldset class="otazka" data-i="${i}">
        <legend><span class="otazka__cislo">${i + 1}</span> <span lang="en">${q.o}</span></legend>
        <div class="moznosti">${poradie.map((j) =>
          `<label class="moznost"><input type="radio" name="pp${i}" value="${j}"> <span lang="en">${q.m[j]}</span></label>`).join("")}</div>
        <p class="otazka__spatna" hidden></p>
      </fieldset>`;
    }).join("");
    el.chyba.hidden = true;
    el.vysledok.hidden = true;
    el.po.hidden = true;
    el.skontroluj.hidden = false;
    el.skontroluj.textContent = "Skontrolovať odpovede";
    ukazStav();
  }

  function ukazStav() {
    const n = el.otazky.querySelectorAll("input:checked").length;
    el.stav.hidden = hotovo;
    el.stav.textContent = `Zodpovedané: ${n} z ${otazky.length}`;
  }

  function otvor(u) {
    unit = u;
    const cislo = u.unit.id === "intro" ? "Introduction" : `Unit ${u.unit.id}`;
    const nazov = `${u.kniha.nazov} · ${cislo}`;
    el.nadpis.textContent = nazov;
    el.omrvinka.textContent = nazov;
    document.title = `Pred písomkou: ${nazov} · Grammar Bites`;
    const n = u.unit.pocet;
    el.uvod.textContent = (u.unit.id === "intro" ? "" : u.unit.nazov + (/[.?!…]$/.test(u.unit.nazov) ? " " : ". ")) +
      `${n} ${tvar(n, "náhodná otázka", "náhodné otázky", "náhodných otázok")} z gramatiky celého unitu. Nič sa neukladá – skúšaj, koľkokrát chceš.` +
      (n < D.pocet ? ` (K tomuto unitu je zatiaľ len ${n} ${tvar(n, "otázka", "otázky", "otázok")}.)` : "");
    el.lekcie.innerHTML = "Otázky sú z lekcií: " + u.unit.lekcie.map((s) =>
      `<a class="stitok" href="${GB.odkaz(D.lekcie[s].url)}" lang="en">${GB.esc(D.lekcie[s].t)}</a>`).join(" ");
    el.naUnit.href = GB.odkaz(`ucebnice/${u.kniha.id}/`) + `#unit-${u.unit.id}`;
    vykresli();
    el.vyber.hidden = true;
    el.obal.hidden = false;
    window.scrollTo(0, 0);
    el.nadpis.focus({ preventScroll: true });
    GB.udalost(`pred-pisomkou/${u.kniha.id}/${u.unit.id}`, `Pred písomkou: ${nazov}`);
  }

  function zavri() {
    unit = null;
    document.title = titulok;
    el.obal.hidden = true;
    el.vyber.hidden = false;
    window.scrollTo(0, 0);
  }

  function podlaAdresy() {
    const u = najdi(location.hash);
    if (u) otvor(u); else zavri();
  }

  el.otazky.addEventListener("change", () => {
    ukazStav();
    if (upozornene) { el.chyba.hidden = true; upozornene = false; el.skontroluj.textContent = "Skontrolovať odpovede"; }
  });

  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (hotovo) return;
    const pole = [...el.otazky.querySelectorAll(".otazka")];
    const chybaju = pole.filter((f) => !f.querySelector("input:checked")).map((f) => Number(f.dataset.i) + 1);
    // Pri dlhom teste sa ľahko stane, že žiak niečo preskočí – najprv ho upozorníme.
    if (chybaju.length && !upozornene) {
      upozornene = true;
      el.chyba.textContent = (chybaju.length === otazky.length
        ? "Ešte si neoznačil žiadnu odpoveď."
        : `Ešte ti ${tvar(chybaju.length, "chýba otázka", "chýbajú otázky", "chýbajú otázky")} č. ${chybaju.join(", ")}.`) +
        " Doplň ich, alebo stlač tlačidlo ešte raz a ukážem ti správne odpovede.";
      el.chyba.hidden = false;
      el.skontroluj.textContent = "Skontrolovať aj tak";
      return;
    }
    hotovo = true;
    let spravne = 0;
    const chyby = {};
    pole.forEach((f) => {
      const q = otazky[Number(f.dataset.i)];
      const vybrana = f.querySelector("input:checked");
      const spatna = f.querySelector(".otazka__spatna");
      const spravnaMoznost = f.querySelector(`input[value="${q.s}"]`).closest(".moznost");
      spravnaMoznost.classList.add("moznost--spravna");
      if (vybrana && Number(vybrana.value) === q.s) {
        spravne++;
        f.classList.add("je-spravne");
        spatna.innerHTML = "Správne! " + q.v;
      } else {
        f.classList.add("je-zle");
        if (vybrana) vybrana.closest(".moznost").classList.add("moznost--zla");
        chyby[q.lekcia] = (chyby[q.lekcia] || 0) + 1;
        const L = D.lekcie[q.lekcia];
        spatna.innerHTML = (vybrana ? "Nie celkom. " : "Bez odpovede. ") +
          `Správne je: „${GB.esc(spravnaMoznost.textContent.trim())}“. ${q.v} ` +
          `<a class="pp-do-lekcie" href="${GB.odkaz(L.url)}">Lekcia: <span lang="en">${GB.esc(L.t)}</span></a>`;
      }
      spatna.hidden = false;
      f.querySelectorAll("input").forEach((i) => (i.disabled = true));
    });

    const n = otazky.length;
    const dobre = spravne / n >= 0.8;
    el.vysledokText.textContent = `Máš ${spravne} z ${n} správne. ` +
      (spravne === n ? "Výborne, na písomku si pripravený!" : dobre ? "Skvelá práca! Pozri si ešte, kde si zaváhal." : "Nevadí – teraz vieš, čo si ešte zopakovať.");
    const zoznam = unit.unit.lekcie.filter((s) => chyby[s]).sort((a, b) => chyby[b] - chyby[a]);
    el.zopakuj.innerHTML = zoznam.length
      ? "<p>Zopakuj si:</p><ul>" + zoznam.map((s) =>
          `<li><a href="${GB.odkaz(D.lekcie[s].url)}"><b lang="en">${GB.esc(D.lekcie[s].t)}</b></a> <span>(${chyby[s]} ${tvar(chyby[s], "chyba", "chyby", "chýb")})</span></li>`).join("") + "</ul>"
      : "";
    el.vysledok.querySelector("[data-obr-dobre]").hidden = !dobre;
    el.vysledok.querySelector("[data-obr-zle]").hidden = dobre;
    el.chyba.hidden = true;
    el.vysledok.hidden = false;
    el.po.hidden = false;
    el.skontroluj.hidden = true;
    ukazStav();
    GB.udalost(`pred-pisomkou/${unit.kniha.id}/${unit.unit.id}/${spravne}-z-${n}`, `Pred písomkou ${unit.kniha.nazov} U${unit.unit.id}: ${spravne}/${n}`);
    el.vysledok.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  });

  el.nove.addEventListener("click", () => {
    vykresli();
    window.scrollTo(0, 0);
    el.nadpis.focus({ preventScroll: true });
  });

  app.querySelectorAll("[data-spat]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    history.pushState(null, "", location.pathname + location.search);
    zavri();
  }));

  window.addEventListener("hashchange", podlaAdresy);
  podlaAdresy();
})();
