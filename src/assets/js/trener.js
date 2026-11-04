// Tréner nepravidelných slovies: napíš minulý tvar. Pokrok (chyby, najdlhšia séria) sa pamätá len v tomto prehliadači.
(function () {
  // skript je v tele stránky pred spolocne.js – počkáme, kým sa načíta GB
  const start = () => document.querySelectorAll("[data-trener]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  function init(box) {
    const kniha = box.dataset.trener;
    const lekcia = box.dataset.lekcia || "trener";
    const rodiny = GB.data("data-trener-" + kniha) || [];
    const vsetky = rodiny.flatMap((r) => r.slovesa.map((s) => ({ inf: s[0], past: s[1], sk: s[2], ine: s[3] || [], rodina: r })));
    if (!vsetky.length) return;

    const KLUC = "gb-trener-" + kniha;
    const KOLO = 10;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), seria: $("[data-seria]"),
      rodina: $("[data-rodina]"), sloveso: $("[data-sloveso]"), vyznam: $("[data-vyznam]"), form: $("[data-form]"),
      vstup: $("[data-vstup]"), over: $("[data-over]"), napoveda: $("[data-napoveda]"), neviem: $("[data-neviem]"),
      spatna: $("[data-spatna]"), koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), zoznamChyb: $("[data-zoznam-chyb]"),
      dalsie: $("[data-dalsie]"), pomoc: $("[data-pomoc]"), lenChyby: $("[data-len-chyby]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };

    // ---- pamäť (localStorage môže chýbať – vtedy len v premennej) ----
    let pamat = { chyby: {}, najSeria: 0 };
    try { pamat = Object.assign(pamat, JSON.parse(localStorage.getItem(KLUC)) || {}); } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };

    let vyber = "vsetky";      // "vsetky" | id rodiny | "chyby"
    let fronta = [], spravne = 0, seria = 0, chybyKola = [], aktualne = null, odpovedane = false, povodne = 0, celkom = 0, poradie = 0;

    // ---- výber rodiny ----
    function cip(id, text, pocet) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "trener__cip"; b.dataset.id = id;
      b.innerHTML = `${GB.esc(text)} <span>${pocet}</span>`;
      b.setAttribute("aria-pressed", id === vyber ? "true" : "false");
      b.addEventListener("click", () => { vyber = id; kresliCipy(); noveKolo(); });
      return b;
    }
    function kresliCipy() {
      el.cipy.textContent = "";
      el.cipy.append(cip("vsetky", "Všetky", vsetky.length));
      rodiny.forEach((r) => el.cipy.append(cip(r.id, r.nazov, r.slovesa.length)));
      const n = pocetChyb();
      if (n) { const c = cip("chyby", "Moje chyby", n); c.classList.add("trener__cip--chyby"); el.cipy.append(c); }
    }
    const pocetChyb = () => vsetky.filter((v) => pamat.chyby[v.inf]).length;

    function zdroj() {
      if (vyber === "chyby") { const z = vsetky.filter((v) => pamat.chyby[v.inf]); return z.length ? z : vsetky; }
      if (vyber === "vsetky") return vsetky;
      return vsetky.filter((v) => v.rodina.id === vyber);
    }
    function zamiesaj(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

    function noveKolo(fokus = true) {
      const z = zamiesaj(zdroj());
      const v = z.slice(0, Math.min(KOLO, z.length));
      while (v.length < Math.min(KOLO, 6)) v.push(...zamiesaj(z).slice(0, Math.min(KOLO, 6) - v.length)); // malá rodina: zopakuj
      fronta = v.map((x) => ({ v: x, opak: false }));
      povodne = celkom = fronta.length; poradie = 0; spravne = 0; chybyKola = [];
      el.koniec.hidden = true; el.karta.hidden = false;
      dalsia(fokus);
    }

    function dalsia(fokus = true) {
      if (!fronta.length) return koniec();
      const polozka = fronta.shift();
      aktualne = polozka.v; aktualne._opak = polozka.opak;
      odpovedane = false; poradie++;
      el.stav.textContent = `${poradie} / ${celkom}`;
      el.sloveso.textContent = aktualne.inf;
      el.vyznam.textContent = aktualne.sk;
      el.rodina.hidden = true;
      el.spatna.hidden = true; el.spatna.className = "trener__spatna";
      el.vstup.value = ""; el.vstup.disabled = false; el.vstup.classList.remove("je-ok", "je-zle");
      el.over.textContent = "Skontrolovať";
      el.napoveda.disabled = false; el.neviem.disabled = false; el.pomoc.hidden = false;
      if (fokus) el.vstup.focus({ preventScroll: true });
    }

    const norm = (t) => String(t || "").toLowerCase().replace(/[’']/g, "'").replace(/\s*[\/,]\s*/g, "/").replace(/\s+/g, " ").trim();
    function jeSpravne(odp) {
      const o = norm(odp);
      if (!o) return false;
      const moznosti = [aktualne.past, ...aktualne.ine].map(norm);
      if (moznosti.includes(o)) return true;
      // be: was / were – stačí jeden aj oba v ľubovoľnom poradí
      if (aktualne.past.includes("/")) {
        const ok = norm(aktualne.past).split("/");
        const ja = o.split("/").filter(Boolean);
        return ja.length > 0 && ja.every((x) => ok.includes(x));
      }
      return false;
    }

    function vyhodnot(neviem) {
      if (odpovedane) return dalsia();
      const odp = el.vstup.value;
      if (!neviem && !norm(odp)) { el.vstup.focus(); return; }
      odpovedane = true;
      const ok = !neviem && jeSpravne(odp);
      const vzor = `${aktualne.inf} → ${aktualne.past}`;
      el.vstup.disabled = true;
      el.napoveda.disabled = true; el.neviem.disabled = true; el.pomoc.hidden = true;
      el.rodina.hidden = false;
      el.rodina.textContent = `Rodina: ${aktualne.rodina.nazov} · ${aktualne.rodina.vzor}`;
      if (ok) {
        if (!aktualne._opak) spravne++;
        seria++;
        if (seria > (pamat.najSeria || 0)) pamat.najSeria = seria;
        if (pamat.chyby[aktualne.inf]) { pamat.chyby[aktualne.inf]--; if (pamat.chyby[aktualne.inf] <= 0) delete pamat.chyby[aktualne.inf]; }
        el.vstup.classList.add("je-ok");
        el.spatna.classList.add("trener__spatna--ok");
        el.spatna.textContent = pochvala() + " " + vzor;
      } else {
        seria = 0;
        const vrati = !aktualne._opak;
        if (vrati) { chybyKola.push(aktualne); fronta.push({ v: aktualne, opak: true }); celkom++; }
        pamat.chyby[aktualne.inf] = Math.min(3, (pamat.chyby[aktualne.inf] || 0) + 2); // musí ho 2× trafiť
        el.vstup.classList.add("je-zle");
        el.spatna.classList.add("trener__spatna--zle");
        el.spatna.innerHTML = (neviem ? "Nevadí. " : "Nie celkom. ") + "Správne je: <b lang=\"en\">" + GB.esc(vzor) + "</b>" +
          (vrati ? " · na konci kola sa k nemu vrátime." : "");
      }
      uloz();
      el.seria.textContent = `séria ${seria}` + (pamat.najSeria ? ` · rekord ${pamat.najSeria}` : "");
      el.stav.textContent = `${poradie} / ${celkom}`;
      el.spatna.hidden = false;
      el.over.textContent = fronta.length ? "Ďalšie →" : "Výsledok →";
      el.over.disabled = false;
      el.over.focus({ preventScroll: true });
    }
    function pochvala() { return ["Správne!", "Výborne!", "Super!", "Presne tak!", "Paráda!"][Math.floor(Math.random() * 5)]; }

    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const dobre = spravne / Math.max(1, povodne) >= 0.8;
      el.vysledok.textContent = `Na prvý pokus ${spravne} z ${povodne}. ` +
        (spravne === povodne ? "Bez chyby, si nepravidelný majster!" : dobre ? "Skvelá práca!" : "Nevzdávaj sa, s každým kolom to pôjde lepšie.");
      el.zoznamChyb.textContent = chybyKola.length ? "Na zopakovanie: " + chybyKola.map((v) => `${v.inf} → ${v.past}`).join(" · ") : "";
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      el.lenChyby.hidden = !pocetChyb();
      kresliCipy();
      GB.udalost(`trener/${lekcia}/${spravne}-z-${povodne}`, `Tréner ${lekcia}: ${spravne}/${povodne}`);
      el.dalsie.focus({ preventScroll: true });
    }

    el.form.addEventListener("submit", (e) => { e.preventDefault(); vyhodnot(false); });
    el.over.addEventListener("click", (e) => { if (odpovedane) { e.preventDefault(); dalsia(); } });
    el.neviem.addEventListener("click", () => vyhodnot(true));
    el.napoveda.addEventListener("click", () => {
      el.rodina.hidden = false;
      el.rodina.textContent = `Nápoveda: rodina ${aktualne.rodina.nazov} · napr. ${aktualne.rodina.vzor}`;
      el.vstup.focus({ preventScroll: true });
    });
    el.dalsie.addEventListener("click", () => { if (vyber === "chyby" && !pocetChyb()) vyber = "vsetky"; kresliCipy(); noveKolo(); });
    el.lenChyby.addEventListener("click", () => { vyber = "chyby"; kresliCipy(); noveKolo(); });

    kresliCipy();
    noveKolo(false); // prvé kolo bez presunu kurzora, aby stránka neskočila na tréner
    el.seria.textContent = "séria 0" + (pamat.najSeria ? ` · rekord ${pamat.najSeria}` : "");
  }
})();
