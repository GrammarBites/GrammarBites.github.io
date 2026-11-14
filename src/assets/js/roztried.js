// Tréner Roztrieď: ku každej vete vyber správnu možnosť (some / any, for / since…). 10 viet v kole, po každej vysvetlenie.
// Údaje: src/_data/roztriedData.json. Rekord sa pamätá len v tomto prehliadači.
(function () {
  const start = () => document.querySelectorAll("[data-roztried]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function init(box) {
    const id = box.dataset.roztried, lekcia = box.dataset.lekcia || id;
    const data = GB.data("data-roztried-" + id);
    if (!data || !data.polozky || !data.polozky.length) return;
    const KOLO = Math.min(10, data.polozky.length), KLUC = "gb-roztried-" + id;
    const kose = Object.fromEntries(data.kose.map((k) => [k.id, k]));
    const $ = (s) => box.querySelector(s);
    const el = {
      karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), veta: $("[data-veta]"), sk: $("[data-sk]"),
      moznosti: $("[data-moznosti]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), chyby: $("[data-chyby]"), dalsie: $("[data-dalsie]"),
      dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let rekord = 0;
    try { rekord = Number(localStorage.getItem(KLUC)) || 0; } catch (e) {}
    let kolo = [], ix = 0, body = 0, chyby = [], q = null;

    // čo sa doplní do medzery (presný tvar, inak text koša)
    const vypln = (p) => (p.o !== undefined ? p.o : kose[p.k].vlozit !== undefined ? kose[p.k].vlozit : kose[p.k].nazov);
    // veta ako HTML; doplnene = null → prázdna medzera
    function vetaHtml(p, doplnene, trieda) {
      const [pred, po] = GB.esc(p.t).split("___");
      if (doplnene === null) return `${pred}<span class="rz-medzera" aria-label="medzera">___</span>${po}`;
      if (doplnene === "") return `${pred.replace(/\s+$/, "")}<span class="rz-nic ${trieda}" title="bez predložky">∅</span>${po.replace(/^(\s)/, "$1")}`;
      return `${pred}<b class="rz-doplnene ${trieda}">${GB.esc(doplnene)}</b>${po}`;
    }
    const vetaText = (p) => p.t.replace(/\s*___\s*/, (m) => (vypln(p) === "" ? " " : m.replace("___", vypln(p)))).replace(/\s+([.,!?])/g, "$1").trim();
    const skore = () => (el.skore.textContent = `body ${body}`);

    function ukaz() {
      q = kolo[ix];
      el.stav.textContent = `${ix + 1} / ${kolo.length}`;
      el.veta.innerHTML = vetaHtml(q, null);
      el.sk.hidden = !q.sk; el.sk.textContent = q.sk || "";
      el.spatna.hidden = true; el.dalej.hidden = true;
      el.moznosti.textContent = "";
      data.kose.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "rz-kos"; b.dataset.id = k.id;
        b.innerHTML = `<span class="rz-kos__nazov" lang="en">${GB.esc(k.nazov)}</span>` + (k.popis ? `<span class="rz-kos__popis">${GB.esc(k.popis)}</span>` : "");
        b.addEventListener("click", () => odpovedz(b));
        el.moznosti.append(b);
      });
      skore();
    }
    function odpovedz(b) {
      const ok = b.dataset.id === q.k;
      if (ok) body++; else chyby.push(q);
      el.moznosti.querySelectorAll("button").forEach((x) => {
        x.disabled = true;
        if (x.dataset.id === q.k) x.classList.add("rz-kos--ok");
        else if (x === b) x.classList.add("rz-kos--zle");
      });
      el.veta.innerHTML = vetaHtml(q, vypln(q), "rz--ok"); // v medzere je vždy správna odpoveď
      el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle");
      el.spatna.innerHTML = (ok ? "Správne! " : `Nie celkom – správne je <b lang="en">${GB.esc(kose[q.k].nazov)}</b>. `) + (q.v || "");
      el.spatna.hidden = false;
      skore();
      el.dalej.textContent = ix + 1 < kolo.length ? "Ďalej →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    function noveKolo() {
      // každý kôš aspoň raz (ak sa dá), zvyšok náhodne
      const podla = data.kose.map((k) => zamiesaj(data.polozky.filter((p) => p.k === k.id)));
      const prve = podla.map((z) => z[0]).filter(Boolean);
      const zvysok = zamiesaj(data.polozky.filter((p) => !prve.includes(p)));
      kolo = zamiesaj(prve.slice(0, KOLO).concat(zvysok.slice(0, KOLO - Math.min(prve.length, KOLO))));
      ix = 0; body = 0; chyby = [];
      el.koniec.hidden = true; el.karta.hidden = false; ukaz();
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = kolo.length, dobre = body / n >= 0.8, novy = rekord > 0 && body > rekord;
      if (body > rekord) { rekord = body; try { localStorage.setItem(KLUC, String(rekord)); } catch (e) {} }
      el.vysledok.textContent = `Máš ${body} z ${n} bodov. ` +
        (body === n ? "Perfektné, všetko si roztriedil správne!" : dobre ? "Skvelá práca!" : "Pozri si výklad a skús ďalšie kolo.") +
        (novy && body < n ? " Nový rekord!" : "");
      el.chyby.innerHTML = chyby.length ? "Pozor na tieto vety:<ul>" + chyby.map((p) => `<li lang="en">${GB.esc(vetaText(p))}</li>`).join("") + "</ul>" : "";
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      GB.udalost(`roztried/${lekcia}/${body}-z-${n}`, `Roztrieď ${lekcia}: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    el.dalej.addEventListener("click", () => { ix++; if (ix < kolo.length) ukaz(); else koniec(); });
    el.dalsie.addEventListener("click", () => { noveKolo(); el.karta.scrollIntoView({ block: "nearest" }); });
    noveKolo();
  }
})();
