// Tréner časovej osi: present perfect × past simple a for × since.
(function () {
  const start = () => document.querySelectorAll("[data-casovaos]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
  const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const NS = "http://www.w3.org/2000/svg";
  const tag = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
  const X0 = 30, XT = 520, X1 = 580, Y = 120; // os: X0 … TERAZ (XT) … X1
  const DRUH = {
    kedy: "Vieme, KEDY sa to stalo – a je to hotové, uzavreté. → past simple",
    skusenost: "Skúsenosť: niekedy doteraz, nevieme kedy. → present perfect",
    vysledok: "Stalo sa to v minulosti, ale výsledok vidno TERAZ. → present perfect",
    trvanie: "Začalo to v minulosti a trvá to dodnes. → present perfect",
    prave: "Spojené s teraz (just, yet, already). → present perfect",
  };

  function init(box) {
    const data = GB.data("data-casovaos") || {};
    const zaklad = box.dataset.casovaos === "forsince" ? "forsince" : "cas";
    const KOLO = 10, KLUC = "gb-casovaos";
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), skore: $("[data-skore]"), svg: $("[data-os]"),
      veta: $("[data-veta]"), krok: $("[data-krok]"), moznosti: $("[data-moznosti]"), spatna: $("[data-spatna]"), dalej: $("[data-dalej]"),
      koniec: $("[data-koniec]"), vysledok: $("[data-vysledok]"), dalsie: $("[data-dalsie]"), dobre: $("[data-obr-dobre]"), zle: $("[data-obr-zle]"),
    };
    let pamat = {};
    try { pamat = JSON.parse(localStorage.getItem(KLUC)) || {}; } catch (e) {}
    const uloz = () => { try { localStorage.setItem(KLUC, JSON.stringify(pamat)); } catch (e) {} };
    let rezim = zaklad, ulohy = [], ix = 0, body = 0, q = null, krok = 0, chyba = false;

    // ---------- os ----------
    function os() {
      const s = el.svg; s.textContent = "";
      tag("line", { x1: X0, y1: Y, x2: X1, y2: Y, class: "co-os" }, s);
      tag("path", { d: `M${X1} ${Y} l-14 -8 v16 z`, class: "co-hrot" }, s);
      tag("line", { x1: XT, y1: Y - 26, x2: XT, y2: Y + 26, class: "co-teraz" }, s);
      const t = tag("text", { x: XT, y: Y + 52, class: "co-popis co-popis--teraz" }, s); t.textContent = "TERAZ";
      const m = tag("text", { x: X0 - 4, y: Y + 52, class: "co-popis co-popis--l" }, s); m.textContent = "minulosť";
    }
    const px = (x) => X0 + 20 + x * (XT - X0 - 60);
    function text(x, y, t, c = "") { const e = tag("text", { x, y, class: "co-stitok " + c }, el.svg); e.textContent = t; return e; }
    function kresliCas(qq) {
      os(); const s = el.svg;
      if (qq.druh === "kedy") {
        if (qq.od != null) { tag("line", { x1: px(qq.od), y1: Y, x2: px(qq.x), y2: Y, class: "co-usek co-usek--ps" }, s); }
        tag("circle", { cx: px(qq.x), cy: Y, r: 11, class: "co-bod co-bod--ps" }, s);
        text(Math.min(Math.max(px(qq.x), 110), XT - 120), Y - 30, qq.sig, "co-stitok--ps");
        text(Math.min(Math.max(px(qq.x), 120), XT - 150), Y + 86, "hotovo, uzavreté", "co-mensi");
      } else if (qq.druh === "trvanie") {
        tag("line", { x1: px(0.25), y1: Y, x2: XT, y2: Y, class: "co-usek co-usek--pp" }, s);
        tag("circle", { cx: px(0.25), cy: Y, r: 9, class: "co-bod co-bod--pp" }, s);
        text((px(0.25) + XT) / 2, Y - 30, qq.sig, "co-stitok--pp");
      } else if (qq.druh === "skusenost") {
        [0.15, 0.45, 0.75].forEach((x) => text(px(x), Y + 9, "?", "co-otaznik"));
        tag("path", { d: `M${px(0.05)} ${Y - 22} Q ${(px(0.05) + XT) / 2} ${Y - 70} ${XT - 6} ${Y - 26}`, class: "co-obluk" }, s);
        text((px(0.05) + XT) / 2, Y - 62, qq.sig + " – niekedy doteraz", "co-stitok--pp");
      } else {
        tag("circle", { cx: px(0.85), cy: Y, r: 10, class: "co-bod co-bod--pp" }, s);
        tag("path", { d: `M${px(0.85) + 6} ${Y - 14} Q ${(px(0.85) + XT) / 2} ${Y - 50} ${XT - 4} ${Y - 24}`, class: "co-obluk" }, s);
        text(px(0.6), Y - 40, qq.druh === "prave" ? qq.sig + " → teraz" : "výsledok vidno teraz", "co-stitok--pp");
      }
    }
    function kresliFS(qq, odhal) {
      os(); const s = el.svg, a = px(0.4);
      if (!odhal) { tag("line", { x1: a, y1: Y, x2: XT, y2: Y, class: "co-usek co-usek--sivy" }, s); return; }
      tag("line", { x1: a, y1: Y, x2: XT, y2: Y, class: "co-usek co-usek--pp" }, s);
      if (qq.ok === "since") {
        tag("line", { x1: a, y1: Y - 34, x2: a, y2: Y + 8, class: "co-vlajka" }, s);
        tag("path", { d: `M${a} ${Y - 34} h34 l-8 9 l8 9 h-34 z`, class: "co-vlajka-plachta" }, s);
        text(a, Y - 46, "since " + qq.z, "co-stitok--ps");
        text(a, Y + 52, "začiatok (bod)", "co-mensi");
      } else {
        tag("path", { d: `M${a} ${Y - 18} v-14 H${XT} v14`, class: "co-zatvorka" }, s);
        text((a + XT) / 2, Y - 44, "for " + qq.z, "co-stitok--pp");
        text((a + XT) / 2, Y + 52, "dĺžka (ako dlho)", "co-mensi");
      }
    }

    // ---------- priebeh ----------
    const hlasenie = (t, ok) => { el.spatna.className = "trener__spatna " + (ok ? "trener__spatna--ok" : "trener__spatna--zle"); el.spatna.innerHTML = t; el.spatna.hidden = false; };
    const zle = (b, t) => { chyba = true; if (b) { b.classList.add("co-moznost--zle"); b.disabled = true; } hlasenie("Skús ešte raz. " + t, false); };
    function tlacidla(list, pri, en = true) {
      el.moznosti.textContent = "";
      list.forEach(([hodn, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip co-moznost"; if (en) b.lang = "en"; b.innerHTML = t;
        b.addEventListener("click", () => pri(hodn, b));
        el.moznosti.append(b);
      });
    }
    const jePP = () => q.druh !== "kedy";
    function vetaHtml(vypln) {
      const gap = vypln ? `<b class="co-doplnene">${GB.esc(vypln)}</b>` : `<span class="co-medzera">${q.typ === "fs" ? "for / since" : "…"}</span>`;
      if (q.typ === "fs") return GB.esc(q.v).replace("___", gap);
      if (!vypln) return GB.esc(q.v).replace("___", gap + ` <span class="co-inf">(${GB.esc(q.inf || "")})</span>`);
      if (vypln && vypln.includes("…")) { const [a, b] = vypln.split(" … "); return GB.esc(q.v).replace("___", `<b class="co-doplnene">${GB.esc(a)}</b>`).replace("___", `<b class="co-doplnene">${GB.esc(b)}</b>`); }
      return GB.esc(q.v).replace("___", gap);
    }
    function ukaz() {
      el.veta.innerHTML = vetaHtml(null);
      if (q.typ === "fs") {
        kresliFS(q, false);
        el.krok.innerHTML = "Pozri sa na slovo za medzerou: je to <b>začiatok</b> (bod na osi), alebo <b>dĺžka</b> (úsek)?";
        tlacidla([["since", "since – od (začiatok)"], ["for", "for – (po dobu) koľko"]], (h, b) => {
          if (h !== q.ok) return zle(b, q.ok === "since" ? `<span lang="en">${GB.esc(q.z)}</span> je bod v čase – kedy to začalo.` : `<span lang="en">${GB.esc(q.z)}</span> je dĺžka – ako dlho to trvá.`);
          hotovo(q.ok);
        }, false);
        return;
      }
      os();
      if (krok === 0) {
        el.krok.innerHTML = "<b>Krok 1:</b> Kam to patrí na časovej osi?";
        tlacidla([["kedy", "● hotové v minulosti – vieme KEDY"], ["pp", "→ spojené s TERAZ"]], (h, b) => {
          const ok = (h === "kedy") === !jePP();
          if (!ok) return zle(b, `Pozri na <b lang="en">${GB.esc(q.sig)}</b>. ` + (jePP() ? "Nehovorí presne kedy – je to spojené s dneškom." : "Hovorí, kedy presne to bolo – je to uzavreté."));
          krok = 1; kresliCas(q); hlasenie(DRUH[q.druh], true); ukaz2();
        }, false);
      }
    }
    function ukaz2() {
      el.krok.innerHTML = "<b>Krok 2:</b> Vyber správny tvar slovesa.";
      tlacidla(q.f.map((f, i) => [i, GB.esc(f)]), (i, b) => {
        if (i !== q.ok) return zle(b, jePP() ? "Na osi je to spojené s TERAZ → present perfect (have / has + 3. stĺpec)." : "Na osi je to hotové v minulosti → past simple.");
        hotovo(q.f[q.ok]);
      });
    }
    function hotovo(vypln) {
      if (!chyba) body++;
      if (q.typ === "fs") kresliFS(q, true); else kresliCas(q);
      el.veta.innerHTML = vetaHtml(vypln);
      el.moznosti.textContent = ""; el.krok.innerHTML = "";
      hlasenie(`${chyba ? "Hotovo." : "Výborne, bez chyby!"} ${GB.esc(q.sk)}`, !chyba);
      skore();
      el.dalej.textContent = ix + 1 < ulohy.length ? "Ďalšia veta →" : "Výsledok →";
      el.dalej.hidden = false; el.dalej.focus({ preventScroll: true });
    }
    const kluc = () => "rekord-" + rezim;
    const skore = () => { el.skore.textContent = `body ${body}` + (pamat[kluc()] ? ` · rekord ${pamat[kluc()]}` : ""); };
    function dalsia() {
      if (ix >= ulohy.length) return koniec();
      q = ulohy[ix]; krok = 0; chyba = false;
      el.stav.textContent = `${ix + 1} / ${ulohy.length}`; skore();
      el.spatna.hidden = true; el.dalej.hidden = true; ukaz();
    }
    function noveKolo() {
      const c = (data.cas || []).map((x) => ({ ...x, typ: "cas" })), f = (data.forsince || []).map((x) => ({ ...x, typ: "fs" }));
      ulohy = rezim === "cas" ? zamiesaj(c).slice(0, KOLO) : rezim === "forsince" ? zamiesaj(f).slice(0, KOLO) : zamiesaj([...zamiesaj(c).slice(0, 6), ...zamiesaj(f).slice(0, 4)]);
      ix = 0; body = 0; el.koniec.hidden = true; el.karta.hidden = false; dalsia();
    }
    function koniec() {
      el.karta.hidden = true; el.koniec.hidden = false;
      const n = ulohy.length, dobre = body / n >= 0.8;
      if (body > (pamat[kluc()] || 0)) pamat[kluc()] = body;
      uloz();
      el.vysledok.textContent = `${body} z ${n} viet bez chyby. ` + (body === n ? "Perfektné!" : dobre ? "Skvelá práca!" : "Skús ďalšie kolo.");
      el.dobre.hidden = !dobre; el.zle.hidden = dobre;
      if (GB.udalost) GB.udalost(`casovaos/${rezim}/${body}-z-${n}`, `Časová os: ${body}/${n}`);
      el.dalsie.focus({ preventScroll: true });
    }
    const REZIMY = [["cas", "present perfect × past simple"], ["forsince", "for × since"], ["mix", "Všetko"]];
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
