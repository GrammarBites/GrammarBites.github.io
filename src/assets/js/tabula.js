// Tabuľa – vysvetlenie krok po kroku kriedou na tabuli.
// Recepty sú v src/_data/tabule/<lekcia>.json (formát je popísaný v src/_data/tabule/README.md).
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const KOZA = "/assets/img/postavy/koza-zvedava.png";
  const MALO_POHYBU = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (t) => (window.GB ? GB.esc(t) : String(t));

  // ---------- Značky v texte: {slovo}, {slovo#id}, {slovo|zlta}, {slovo#id|ruzova,krouzok} ----------
  const FARBY = ["zlta", "ruzova", "modra", "biela"];
  function rozparsuj(text) {
    const tokeny = []; const re = /\{([^#|}]+)(?:#([\w-]+))?(?:\|([\w,]+))?\}/g;
    let pos = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > pos) tokeny.push({ t: text.slice(pos, m.index) });
      tokeny.push({ t: m[1], id: m[2], znacky: m[3] ? m[3].split(",") : [] });
      pos = re.lastIndex;
    }
    if (pos < text.length) tokeny.push({ t: text.slice(pos) });
    return tokeny;
  }
  function htmlTextu(text, blokId) {
    return rozparsuj(text).map((k) => {
      if (k.znacky === undefined) return esc(k.t);
      const farba = k.znacky.find((z) => FARBY.includes(z));
      const id = k.id ? ` data-s="${blokId}.${k.id}"` : "";
      return `<span class="tb-s${farba ? " tb-" + farba : ""}"${id}>${esc(k.t)}</span>`;
    }).join("");
  }
  const grafZnacky = (text, blokId) => rozparsuj(text).flatMap((k) =>
    (k.znacky || []).filter((z) => !FARBY.includes(z)).map((z) => ({ typ: z, ciel: k.id ? `${blokId}.${k.id}` : null })))
    .filter((z) => z.ciel);

  // ---------- Kriedové scény (predložky miesta) ----------
  const L = (a, b, c, d, k = "") => `<path class="tk ${k}" pathLength="1" d="M${a} ${b}L${c} ${d}"/>`;
  const zem = () => L(10, 150, 190, 150, "tk-zem");
  function krabica(x, w, h, otvorena) {
    const t = 150 - h, d = 12;
    return `<rect class="tk tk-f" pathLength="1" x="${x}" y="${t}" width="${w}" height="${h}"/>` +
      `<path class="tk tk-f" pathLength="1" d="M${x + w} ${t}L${x + w + d} ${t - d}L${x + w + d} ${150 - d}L${x + w} 150Z"/>` +
      (otvorena ? L(x, t, x + d, t - d) : `<path class="tk tk-f" pathLength="1" d="M${x} ${t}L${x + d} ${t - d}L${x + w + d} ${t - d}L${x + w} ${t}Z"/>`);
  }
  // koza: x = stred, y = spodok obrázka, w = šírka
  const koza = (x, y, w) => { const h = w * 226 / 259; return `<image class="tb-koza" href="${KOZA}" x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}"/>`; };
  const stol = () => `<rect class="tk tk-f" pathLength="1" x="30" y="70" width="140" height="8"/>` + L(42, 78, 42, 150) + L(158, 78, 158, 150);
  const SCENY = {
    in: () => zem() + L(82, 88, 142, 88) + koza(106, 128, 70) + krabica(70, 60, 50, true),
    on: () => zem() + krabica(64, 64, 46) + koza(102, 98, 66),
    under: () => zem() + stol() + koza(100, 150, 70),
    "next to": () => zem() + krabica(22, 60, 50) + koza(146, 150, 66),
    between: () => zem() + krabica(8, 44, 40) + krabica(136, 44, 40) + koza(100, 150, 62),
    behind: () => zem() + koza(104, 114, 64) + krabica(56, 80, 40),
    "in front of": () => zem() + krabica(64, 64, 74) + koza(98, 166, 68),
    above: () => zem() + krabica(70, 60, 36) + `<rect class="tk tk-f" pathLength="1" x="36" y="62" width="128" height="6"/>` + koza(100, 62, 58),
  };

  function init(app) {
    const recepty = GB.data("data-tabule") || {};
    const $ = (s) => app.querySelector(s);
    const el = {
      vyber: $("[data-vyber]"), form: $("[data-otazka-form]"), pole: $("[data-otazka-pole]"), cipy: $("[data-cipy]"), nic: $("[data-nic]"),
      tabula: $("[data-tabula]"), ram: $("[data-ram]"), plocha: $("[data-plocha]"), nadpis: $("[data-nadpis]"), cap: $("[data-popis]"),
      spat: $("[data-spat]"), dalej: $("[data-dalej]"), stav: $("[data-stav]"), znova: $("[data-znova]"), cela: $("[data-cela]"), ina: $("[data-ina]"),
    };
    const zoznam = Object.entries(recepty).map(([id, r]) => ({ id, ...r }));
    let r = null, krok = 0, znacky = [], zodpovedane = new Set(), casovace = [];
    let svg = null;

    // ---------- výber otázky ----------
    el.cipy.innerHTML = zoznam.flatMap((x) => (x.otazky || [x.nazov]).slice(0, 2).map((q) =>
      `<button type="button" class="tb-cip" data-id="${x.id}">${esc(q)}</button>`)).join("");
    el.cipy.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) otvor(b.dataset.id, true); });
    el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = GB.normalizuj(el.pole.value);
      if (!q) return;
      const slova = q.split(/[^a-z0-9'-]+/).filter((w) => w.length > 1);
      let naj = null, max = 0;
      zoznam.forEach((x) => {
        const kluce = [x.nazov, ...(x.otazky || []), ...(x.kluce || [])].map(GB.normalizuj);
        let s = 0;
        kluce.forEach((k) => { if (q.includes(k)) s += 3; });
        slova.forEach((w) => { if (kluce.some((k) => k.split(/[^a-z0-9'-]+/).includes(w))) s += 1; });
        if (s > max) { max = s; naj = x.id; }
      });
      GB.udalost("tabula/otazka", "Tabuľa: otázka");
      if (naj && max >= 2) { el.nic.hidden = true; otvor(naj, true); }
      else {
        el.nic.hidden = false;
        el.nic.querySelector("a").href = GB.odkaz("hladat/") + (GB.preview ? "" : "") + "?q=" + encodeURIComponent(el.pole.value);
      }
    });

    // ---------- otvorenie tabule ----------
    function otvor(id, zapisHash) {
      r = recepty[id]; if (!r) return;
      if (zapisHash && location.hash !== "#" + id) history.pushState(null, "", "#" + id);
      el.vyber.hidden = true; el.tabula.hidden = false;
      el.nadpis.textContent = r.nazov;
      el.ina.hidden = false;
      const spat = app.querySelector("[data-spat-lekcia]");
      spat.href = GB.odkaz("lekcie/" + (r.lekcia || id) + "/");
      spat.textContent = "Lekcia: " + (r.lekciaNazov || r.lekcia || id);
      zodpovedane = new Set();
      ukaz(0, true);
      el.tabula.scrollIntoView({ behavior: MALO_POHYBU ? "auto" : "smooth", block: "start" });
      GB.udalost("tabula/" + id, "Tabuľa: " + r.nazov);
    }
    function zatvor() {
      stopni(); r = null;
      el.tabula.hidden = true; el.vyber.hidden = false;
      if (location.hash) history.pushState(null, "", location.pathname + location.search);
    }
    el.ina.addEventListener("click", zatvor);
    const zHashu = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id && recepty[id]) otvor(id, false); else if (r) zatvor(); };
    window.addEventListener("hashchange", zHashu);
    window.addEventListener("popstate", zHashu);

    // ---------- kreslenie ----------
    function stopni() { casovace.forEach(clearTimeout); casovace = []; }
    function ukaz(n, anim) {
      stopni();
      krok = n; znacky = [];
      el.plocha.innerHTML = "";
      svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "tb-vrstva"); svg.setAttribute("aria-hidden", "true");
      el.plocha.append(svg);
      let t = 0;
      r.kroky.slice(0, n + 1).forEach((k, i) => {
        const terazAnim = anim && i === n && !MALO_POHYBU;
        (k.kresli || []).forEach((op) => { t = vykonaj(op, terazAnim, terazAnim ? t : 0); });
      });
      prekresliZnacky(false);
      popis();
      if (anim && !MALO_POHYBU) {
        const novy = el.plocha.querySelectorAll(".tb-novy");
        const posledny = novy[novy.length - 1];
        if (posledny) casovace.push(setTimeout(() => posledny.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200));
      }
    }

    // vráti čas (s), kedy skončí táto operácia
    function vykonaj(op, anim, t) {
      const blok = (cls, html, id) => {
        const d = document.createElement("div");
        d.className = "tb-blok " + cls + (anim ? " tb-novy" : "");
        if (id) d.dataset.blok = id;
        d.innerHTML = html;
        const kam = op.do ? el.plocha.querySelector(`[data-blok="${op.do}"]`) : null;
        (kam || el.plocha).insertBefore(d, kam ? null : svg);
        return d;
      };
      const odhal = (d, trvanie) => {
        if (!anim) return t;
        d.style.setProperty("--d", t + "s"); d.style.setProperty("--trv", trvanie + "s");
        d.classList.add("tb-pise");
        return t + trvanie + 0.15;
      };
      const pridajZnacky = (zoz, od) => { zoz.forEach((z, i) => znacky.push({ ...z, anim, t: od + i * 0.5 })); return od + (zoz.length ? zoz.length * 0.5 + 0.3 : 0); };
      switch (op.op) {
        case "pis": {
          const typ = op.styl || "veta";
          const d = blok("tb-" + typ + (op.farba ? " tb-" + op.farba : ""), htmlTextu(op.text, op.id || "x" + Math.random().toString(36).slice(2, 7)), op.id);
          const tr = Math.min(2.2, 0.35 + op.text.replace(/\{|\}|#[\w-]+|\|[\w,]+/g, "").length * 0.035);
          const kon = odhal(d, tr);
          return pridajZnacky(op.id ? grafZnacky(op.text, op.id) : [], kon);
        }
        case "znac": return pridajZnacky([{ typ: op.typ, ciel: op.ciel, text: op.text }], t);
        case "sipka": {
          const b = el.plocha.querySelector(`[data-blok="${String(op.od).split(".")[0]}"]`);
          if (b) b.classList.add("tb-pod-sipkou");
          return pridajZnacky([{ typ: "sipka", od: op.od, k: op.k, text: op.text }], t);
        }
        case "tabulka": {
          const riadky = op.riadky.map((rr, ri) => `<tr>${rr.map((c, ci) => {
            const tag = op.hlavicka && ri === 0 ? "th" : "td";
            return `<${tag}>${htmlTextu(c, `${op.id || "t"}.${ri}-${ci}`)}</${tag}>`;
          }).join("")}</tr>`).join("");
          const d = blok("tb-tabulka", `<table>${riadky}</table>`, op.id);
          if (!anim) return t;
          let tt = t;
          d.querySelectorAll("tr").forEach((tr) => { tr.style.setProperty("--d", tt + "s"); tr.style.setProperty("--trv", ".6s"); tr.classList.add("tb-pise"); tt += 0.45; });
          return tt + 0.3;
        }
        case "stlpce": {
          const html = op.stlpce.map((s) => `<div class="tb-stlpec"><p class="tb-stlpec__nadpis">${htmlTextu(s.nadpis, "h")}</p>${s.riadky.map((x) => `<p>${htmlTextu(x, "r")}</p>`).join("")}</div>`).join("");
          const d = blok("tb-stlpce", html, op.id);
          if (!anim) return t;
          let tt = t;
          d.querySelectorAll(".tb-stlpec").forEach((s) => { s.style.setProperty("--d", tt + "s"); s.style.setProperty("--trv", "1.1s"); s.classList.add("tb-pise"); tt += 1.1; });
          return tt + 0.2;
        }
        case "mriezka": blok("tb-mriezka", "", op.id); return t;
        case "scena": {
          const kresba = SCENY[op.typ];
          const d = blok("tb-scena", `<svg viewBox="0 0 200 165" role="img" aria-label="${esc(op.alt || op.typ)}">${kresba ? kresba() : ""}</svg><p>${htmlTextu(op.popis || op.typ, "p")}</p>`);
          const tahy = [...d.querySelectorAll(".tk")];
          if (!anim) { d.classList.add("tb-hotovo"); return t; }
          tahy.forEach((p, i) => p.style.transitionDelay = (t + i * 0.12) + "s");
          const koniec = t + tahy.length * 0.12 + 0.4;
          d.querySelectorAll(".tb-koza").forEach((im) => im.style.transitionDelay = koniec + "s");
          d.querySelector("p").style.transitionDelay = (koniec + 0.2) + "s";
          requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("tb-kresli")));
          return koniec + 0.6;
        }
        default: return t;
      }
    }

    // ---------- značky nad textom (podčiarknutie, krúžok, prečiarknutie, šípka) ----------
    function box(ciel) {
      const s = ciel && el.plocha.querySelector(`[data-s="${ciel}"]`);
      if (!s) return null;
      const a = s.getBoundingClientRect(), p = el.plocha.getBoundingClientRect();
      return { x: a.left - p.left, y: a.top - p.top, w: a.width, h: a.height };
    }
    function prekresliZnacky(okamzite) {
      if (!svg) return;
      svg.innerHTML = "";
      znacky.forEach((z) => {
        let d = "", cls = "tb-z", popisok = null;
        if (z.typ === "sipka") {
          const a = box(z.od), b = box(z.k); if (!a || !b) return;
          const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2, y = Math.max(a.y + a.h, b.y + b.h) + 2;
          const hlbka = Math.min(46, 18 + Math.abs(x2 - x1) * 0.12);
          d = `M${x1} ${a.y + a.h}Q${(x1 + x2) / 2} ${y + hlbka} ${x2} ${b.y + b.h + 2}`;
          const uhol = Math.atan2((b.y + b.h + 2) - (y + hlbka), x2 - (x1 + x2) / 2);
          const hx = x2, hy = b.y + b.h + 2, l = 11;
          d += `M${hx - l * Math.cos(uhol - 0.5)} ${hy - l * Math.sin(uhol - 0.5)}L${hx} ${hy}L${hx - l * Math.cos(uhol + 0.5)} ${hy - l * Math.sin(uhol + 0.5)}`;
          cls += " tb-z--sipka";
          if (z.text) popisok = { x: Math.max(60, (x1 + x2) / 2), y: y + hlbka / 2 + 26, text: z.text };
        } else {
          const b = box(z.ciel); if (!b) return;
          if (z.typ === "podciarkni") { const y = b.y + b.h - 2; d = `M${b.x - 2} ${y}Q${b.x + b.w / 2} ${y + 6} ${b.x + b.w + 3} ${y - 1}`; cls += " tb-z--zlta"; }
          else if (z.typ === "krouzok") { const cx = b.x + b.w / 2, cy = b.y + b.h * 0.56, rx = b.w / 2 + 7, ry = b.h * 0.36;
            d = `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx * 0.98} ${cy + 3}A${rx} ${ry} 0 0 1 ${cx - rx + 6} ${cy - ry * 0.6}`; cls += " tb-z--zlta"; }
          else if (z.typ === "preskrtni") { d = `M${b.x - 4} ${b.y + b.h * 0.62}L${b.x + b.w + 4} ${b.y + b.h * 0.42}`; cls += " tb-z--ruzova"; }
          else return;
        }
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d); p.setAttribute("class", cls); p.setAttribute("pathLength", "1");
        svg.append(p);
        let txt = null;
        if (popisok) {
          txt = document.createElementNS(NS, "text");
          txt.setAttribute("x", popisok.x); txt.setAttribute("y", popisok.y); txt.setAttribute("class", "tb-z-text");
          txt.textContent = popisok.text; svg.append(txt);
        }
        if (z.anim && !okamzite) {
          p.style.strokeDashoffset = "1";
          if (txt) txt.style.opacity = "0";
          casovace.push(setTimeout(() => { p.style.transition = "stroke-dashoffset .5s ease"; p.style.strokeDashoffset = "0"; if (txt) { txt.style.transition = "opacity .4s"; txt.style.opacity = "1"; } }, z.t * 1000 + 30));
        }
      });
      znacky.forEach((z) => { z.anim = okamzite ? false : z.anim; });
    }
    const ro = new ResizeObserver(() => { if (r) prekresliZnacky(true); });
    ro.observe(el.plocha);

    // ---------- popis kroku, kontrolná otázka, odkazy ----------
    function popis() {
      const k = r.kroky[krok], spolu = r.kroky.length;
      let html = `<p class="tb-popis__text">${k.popis || ""}</p>`;
      const q = k.otazka;
      if (q) {
        html += `<div class="tb-otazka"><p class="tb-otazka__text">${q.text}</p><div class="tb-otazka__moznosti">${q.moznosti.map((m, i) => `<button type="button" class="tb-moznost" data-m="${i}">${esc(m)}</button>`).join("")}</div><p class="tb-otazka__spatna" role="status" aria-live="polite"></p></div>`;
      }
      if (k.odkazy) html += `<div class="tb-odkazy">${k.odkazy.map((o) => `<a class="tlacidlo tlacidlo--male" href="${GB.odkaz(o.url.replace(/^\//, ""))}">${esc(o.text)}</a>`).join("")}</div>`;
      el.cap.innerHTML = html;
      el.stav.textContent = `${krok + 1} / ${spolu}`;
      el.spat.disabled = krok === 0;
      const posledny = krok === spolu - 1;
      el.dalej.hidden = posledny;
      el.znova.hidden = !posledny;
      const zamkni = q && !zodpovedane.has(krok);
      el.dalej.disabled = !!zamkni;
      el.dalej.textContent = zamkni ? "Najprv odpovedz" : "Ďalej →";
      if (q) {
        el.cap.querySelectorAll(".tb-moznost").forEach((b) => b.addEventListener("click", () => {
          const ok = Number(b.dataset.m) === q.spravna;
          const sp = el.cap.querySelector(".tb-otazka__spatna");
          if (ok) {
            b.classList.add("tb-moznost--ok");
            el.cap.querySelectorAll(".tb-moznost").forEach((x) => x.disabled = true);
            sp.innerHTML = "✓ " + (q.vysvetlenie || "Správne!");
            zodpovedane.add(krok);
            el.dalej.disabled = false; el.dalej.textContent = "Ďalej →"; el.dalej.focus();
          } else {
            b.classList.remove("tb-moznost--zle"); void b.offsetWidth; b.classList.add("tb-moznost--zle");
            sp.innerHTML = "Ešte nie. " + ((q.napoveda && q.napoveda[b.dataset.m]) || "Skús to znova.");
          }
        }));
        if (zodpovedane.has(krok)) {
          const b = el.cap.querySelector(`[data-m="${q.spravna}"]`); b.classList.add("tb-moznost--ok");
          el.cap.querySelectorAll(".tb-moznost").forEach((x) => x.disabled = true);
          el.cap.querySelector(".tb-otazka__spatna").innerHTML = "✓ " + (q.vysvetlenie || "Správne!");
        }
      }
      if (posledny) GB.udalost("tabula-dokoncena/" + (r.lekcia || ""), "Tabuľa dokončená: " + r.nazov);
    }

    el.dalej.addEventListener("click", () => { if (r && krok < r.kroky.length - 1) ukaz(krok + 1, true); });
    el.spat.addEventListener("click", () => { if (r && krok > 0) ukaz(krok - 1, false); });
    el.znova.addEventListener("click", () => { if (r) { zodpovedane = new Set(); ukaz(0, true); } });
    el.cela.addEventListener("click", () => {
      try { document.fullscreenElement ? document.exitFullscreen() : el.ram.requestFullscreen().catch(() => {}); } catch (e) {}
    });
    document.addEventListener("keydown", (e) => {
      if (!r || el.tabula.hidden || e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight" && !el.dalej.disabled && !el.dalej.hidden) { e.preventDefault(); el.dalej.click(); }
      if (e.key === "ArrowLeft" && !el.spat.disabled) { e.preventDefault(); el.spat.click(); }
    });

    zHashu();
  }

  const start = () => document.querySelectorAll("[data-tabula-app]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);
})();
