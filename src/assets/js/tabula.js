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

  // ---------- Ďalšie scény s kozou: množstvo, porovnanie, cestovanie ----------
  const kruh = (x, y, r, k = "") => `<circle class="tk ${k}" pathLength="1" cx="${x}" cy="${y}" r="${r}"/>`;
  const napis = (x, y, text, k = "") => `<text class="tk-text ${k}" x="${x}" y="${y}">${esc(text)}</text>`;
  Object.assign(SCENY, {
    // jablká v radoch po 4 (počítateľné): { "typ": "jablka", "pocet": 7 }
    jablka: (op) => {
      const n = Math.max(1, Math.min(12, op.pocet || 6)); let h = zem();
      for (let i = 0; i < n; i++) {
        const x = 22 + (i % 4) * 24, y = 139 - Math.floor(i / 4) * 24;
        h += kruh(x, y, 10, "tk-f") + L(x, y - 10, x + 4, y - 16);
      }
      return h + koza(156, 150, 62);
    },
    // pohár mlieka (nepočítateľné): { "typ": "mlieko", "plne": 0.8 }
    mlieko: (op) => {
      const pl = Math.max(0.05, Math.min(0.95, op.plne == null ? 0.8 : op.plne));
      const hore = 62, dole = 150, y = dole - (dole - hore) * pl;
      const xl = (yy) => 30 + (yy - hore) * 0.1, xr = (yy) => 98 - (yy - hore) * 0.1;
      return zem() + `<path class="tk tk-biela" pathLength="1" d="M${xl(y)} ${y}L${xr(y)} ${y}L${xr(dole)} ${dole}L${xl(dole)} ${dole}Z"/>` +
        `<path class="tk" pathLength="1" d="M${xl(hore)} ${hore}L${xl(dole)} ${dole}L${xr(dole)} ${dole}L${xr(hore)} ${hore}"/>` + koza(156, 150, 62);
    },
    // kozy rôznej veľkosti: { "typ": "kozy", "kozy": [{ "w": 36, "text": "big" }, { "w": 56, "text": "bigger" }] }
    kozy: (op) => {
      const zoz = op.kozy || [{ w: 40 }, { w: 64 }], medzera = 10;
      const spolu = zoz.reduce((a, k) => a + k.w, 0) + medzera * (zoz.length - 1);
      let x = (200 - spolu) / 2, h = L(6, 138, 194, 138, "tk-zem");
      zoz.forEach((k) => {
        h += koza(x + k.w / 2, 138, k.w) + (k.text ? napis(x + k.w / 2, 157, k.text, k.farba ? "tb-" + k.farba : "") : "");
        x += k.w + medzera;
      });
      return h;
    },
    // autobus / vlak (by bus, on the bus)
    bus: () => zem() + koza(100, 130, 56) + `<rect class="tk tk-f" pathLength="1" x="28" y="104" width="144" height="34" rx="4"/>` +
      `<path class="tk" pathLength="1" d="M28 104L28 62Q28 54 36 54L164 54Q172 54 172 62L172 104"/>` + L(64, 54, 64, 104) + L(136, 54, 136, 104) +
      kruh(60, 140, 10, "tk-f") + kruh(140, 140, 10, "tk-f"),
    // auto (by car, in the car)
    auto: () => zem() + koza(106, 126, 46) + `<rect class="tk tk-f" pathLength="1" x="36" y="106" width="136" height="30" rx="8"/>` +
      `<path class="tk" pathLength="1" d="M66 106Q72 72 96 72L124 72Q144 74 152 106"/>` + kruh(68, 138, 11, "tk-f") + kruh(142, 138, 11, "tk-f"),
    // pešo (on foot)
    peso: () => zem() + L(22, 104, 44, 104) + L(14, 120, 42, 120) + L(22, 136, 44, 136) + koza(112, 150, 74),
    // mesto (arrive in)
    mesto: () => zem() + `<rect class="tk tk-f" pathLength="1" x="14" y="84" width="30" height="66"/>` + `<rect class="tk tk-f" pathLength="1" x="48" y="56" width="34" height="94"/>` +
      `<rect class="tk tk-f" pathLength="1" x="86" y="96" width="30" height="54"/>` + L(56, 72, 74, 72) + L(56, 90, 74, 90) + L(56, 108, 74, 108) + L(22, 100, 36, 100) + L(22, 118, 36, 118) + L(94, 112, 108, 112) + koza(158, 150, 56),
    // stanica (arrive at)
    stanica: () => zem() + `<rect class="tk tk-f" pathLength="1" x="22" y="88" width="100" height="62"/>` + `<path class="tk tk-f" pathLength="1" d="M14 88L72 58L130 88Z"/>` +
      `<rect class="tk" pathLength="1" x="62" y="120" width="20" height="30"/>` + napis(72, 110, "STATION") + koza(162, 150, 56),
  });

  // ---------- Časová os ----------
  // x: 0–100 (0 = dávna minulosť, 100 = budúcnosť); "riadok": 0, 1, 2 = o koľko vyššie je značka nad osou
  const OS_Y = 100, osX = (p) => 16 + p * 2.88;
  const gT = (x, y, text, k = "") => `<text class="tg-t tg-novy ${k}" x="${x}" y="${y}">${esc(text)}</text>`;
  const gP = (d, k = "") => `<path class="tg tg-novy ${k}" pathLength="1" d="${d}"/>`;
  const hrot = (x, y, uhol, l = 8) => `M${x - l * Math.cos(uhol - 0.5)} ${y - l * Math.sin(uhol - 0.5)}L${x} ${y}L${x - l * Math.cos(uhol + 0.5)} ${y - l * Math.sin(uhol + 0.5)}`;
  function osZnacky(zoz) {
    let h = "", minY = 60;
    (zoz || []).forEach((z) => {
      const f = z.farba ? " tg-" + z.farba : "", r = (z.riadok || 0) * 20;
      let cx = 0, ty = 0;
      if (z.typ === "bod") {
        const x = osX(z.x); cx = x; ty = OS_Y - 15 - r;
        h += gP(`M${x - 6} ${OS_Y - 6}L${x + 6} ${OS_Y + 6}M${x + 6} ${OS_Y - 6}L${x - 6} ${OS_Y + 6}`, "tg-hruba" + f);
        if (r) h += gP(`M${x} ${OS_Y - 10}L${x} ${ty + 4}`, "tg-tenka" + f);
      } else if (z.typ === "usek") {
        const x1 = osX(z.od), x2 = osX(z.do), y0 = OS_Y - 13 - r; cx = (x1 + x2) / 2; ty = y0 - 6;
        const d = z.sipka ? `M${x1} ${y0 + 7}L${x1} ${y0}L${x2} ${y0}` + hrot(x2, y0, 0) : `M${x1} ${y0 + 7}L${x1} ${y0}L${x2} ${y0}L${x2} ${y0 + 7}`;
        h += z.ciarky ? `<path class="tg tg-ciarky tg-novy${f}" d="${d}"/>` : gP(d, f);
      } else if (z.typ === "vlna") {
        const x1 = osX(z.od), x2 = osX(z.do), y0 = OS_Y - 14 - r; cx = (x1 + x2) / 2; ty = y0 - 9;
        let d = `M${x1} ${y0}`;
        for (let x = x1, i = 0; x < x2 - 0.5; x += 8, i++) d += `Q${x + 4} ${y0 + (i % 2 ? 6 : -6)} ${Math.min(x + 8, x2)} ${y0}`;
        h += gP(d, f);
      } else if (z.typ === "body") {
        const x1 = osX(z.od), x2 = osX(z.do), n = Math.max(2, z.pocet || 4); cx = (x1 + x2) / 2; ty = OS_Y - 15 - r;
        let d = "";
        for (let i = 0; i < n; i++) { const x = x1 + (x2 - x1) * i / (n - 1); d += `M${x - 4.5} ${OS_Y - 4.5}L${x + 4.5} ${OS_Y + 4.5}M${x + 4.5} ${OS_Y - 4.5}L${x - 4.5} ${OS_Y + 4.5}`; }
        h += gP(d, "tg-hruba" + f);
      } else if (z.typ === "skok") {
        const x1 = osX(z.od), x2 = osX(z.k), ya = OS_Y - 14 - r, mx = (x1 + x2) / 2; cx = mx; ty = ya - 27;
        h += gP(`M${x1} ${ya}Q${mx} ${ya - 40} ${x2} ${ya}` + hrot(x2, ya, Math.atan2(40, x2 - mx)), f);
      } else return;
      if (z.text) { h += gT(cx, ty, z.text, f); minY = Math.min(minY, ty - 16); }
      if (z.pod) h += gT(cx, OS_Y + 21 + (z.podRiadok || 0) * 14, z.pod, "tg-t--mala" + f);
    });
    return { h, minY };
  }
  function osSvg(op) {
    const teraz = op.teraz === false ? null : osX(op.teraz == null ? 70 : op.teraz);
    let h = gP(`M8 ${OS_Y}L312 ${OS_Y}` + hrot(312, OS_Y, 0));
    if (teraz != null) h += gP(`M${teraz} ${OS_Y - 13}L${teraz} ${OS_Y + 13}`, "tg-hruba tg-zlta") + gT(teraz, OS_Y + 29, op.terazText || "TERAZ", "tg-t--mala tg-zlta");
    if (op.popisky !== false) h += gT(8, OS_Y + 46, "minulosť", "tg-t--roh tg-t--vlavo") + gT(312, OS_Y + 46, "budúcnosť", "tg-t--roh tg-t--vpravo");
    const z = osZnacky(op.znacky);
    return `<svg viewBox="0 ${z.minY} 320 ${152 - z.minY}" data-min="${z.minY}" role="img" aria-label="${esc(op.alt || "Časová os")}">${h}${z.h}</svg>`;
  }

  // ---------- Hodiny ----------
  // { "op": "hodiny", "cas": "3:30", "zvyrazni": "past" | "to", "obluk": true, "popis": "..." }
  function hodinySvg(op) {
    const [hod, min] = String(op.cas || "3:00").split(":").map(Number);
    const cx = 100, cy = 84, R = 58, rad = Math.PI / 180;
    const bod = (uhol, r) => [cx + r * Math.sin(uhol * rad), cy - r * Math.cos(uhol * rad)];
    const f2 = (a) => a.map((n) => n.toFixed(1)).join(" ");
    let h = "";
    if (op.zvyrazni) {
      const past = op.zvyrazni === "past";
      h += `<path class="tg-plocha tg-novy tg-plocha--${past ? "ruzova" : "modra"}" d="M${cx} ${cy - R}A${R} ${R} 0 0 ${past ? 1 : 0} ${cx} ${cy + R}Z"/>`;
    }
    h += `<circle class="tg tg-novy" pathLength="1" cx="${cx}" cy="${cy}" r="${R}"/>`;
    let ciarky = "";
    for (let i = 0; i < 12; i++) ciarky += `M${f2(bod(i * 30, R - (i % 3 ? 5 : 8)))}L${f2(bod(i * 30, R))}`;
    h += gP(ciarky, "tg-tenka");
    [[12, 0], [3, 90], [6, 180], [9, 270]].forEach(([c, u]) => { const b = bod(u, R - 17); h += gT(b[0], b[1] + 5, c, "tg-t--cislo"); });
    if (op.obluk) {
      const od = op.zvyrazni === "to" ? min * 6 : 0, po = op.zvyrazni === "to" ? 360 : min * 6, ro = R + 8;
      const a = bod(od, ro), b = bod(po === 360 ? 359.5 : po, ro);
      h += gP(`M${f2(a)}A${ro} ${ro} 0 ${po - od > 180 ? 1 : 0} 1 ${f2(b)}` + hrot(b[0], b[1], Math.atan2(Math.sin(po * rad), Math.cos(po * rad))), op.zvyrazni === "to" ? "tg-modra" : "tg-ruzova");
    }
    h += gP(`M${cx} ${cy}L${f2(bod((hod % 12 + min / 60) * 30, 30))}`, "tg-ruc");
    h += gP(`M${cx} ${cy}L${f2(bod(min * 6, 46))}`, "tg-hruba tg-zlta");
    h += `<circle class="tg-stred tg-novy" cx="${cx}" cy="${cy}" r="4"/>`;
    return `<svg viewBox="24 10 152 148" role="img" aria-label="${esc(op.alt || "Hodiny: " + op.cas)}">${h}</svg>`;
  }

  function init(app) {
    const recepty = GB.data("data-tabule") || {};
    const $ = (s) => app.querySelector(s);
    const el = {
      vyber: $("[data-vyber]"), cipy: $("[data-cipy]"),
      tabula: $("[data-tabula]"), ram: $("[data-ram]"), plocha: $("[data-plocha]"), nadpis: $("[data-nadpis]"), cap: $("[data-popis]"),
      spat: $("[data-spat]"), dalej: $("[data-dalej]"), stav: $("[data-stav]"), znova: $("[data-znova]"), cela: $("[data-cela]"), ina: $("[data-ina]"), zvuk: $("[data-zvuk]"),
    };
    const zoznam = Object.entries(recepty).map(([id, r]) => ({ id, ...r }));
    let r = null, krok = 0, znacky = [], zodpovedane = new Set(), casovace = [];
    let svg = null;

    // ---------- hlas (ak má tabuľa v recepte "hlas": true, prehrá src/tabula/zvuk/<id>/krok-01.mp3 …) ----------
    const prehravac = new Audio();
    let zvukZap = true;
    try { zvukZap = localStorage.getItem("gb-tabula-zvuk") !== "0"; } catch (e) {}
    const nastavZvuk = () => { el.zvuk.setAttribute("aria-pressed", String(zvukZap)); el.zvuk.textContent = zvukZap ? "🔊 Zvuk" : "🔇 Bez zvuku"; };
    nastavZvuk();
    el.zvuk.addEventListener("click", () => {
      zvukZap = !zvukZap; nastavZvuk();
      try { localStorage.setItem("gb-tabula-zvuk", zvukZap ? "1" : "0"); } catch (e) {}
      if (!zvukZap) prehravac.pause(); else hovor();
    });
    function hovor() {
      prehravac.pause();
      if (!r || !r.hlas || !zvukZap) return;
      prehravac.src = GB.odkaz(`tabula/zvuk/${r.id}/krok-${String(krok + 1).padStart(2, "0")}.mp3`);
      prehravac.play().catch(() => {});
    }

    // ---------- výber otázky ----------
    // otázky sú zoskupené podľa témy ("skupina" v recepte); poradie a názvy skupín sú v SKUPINY
    const SKUPINY = [["pritomny", "Prítomný čas"], ["minuly", "Minulý a predprítomný čas"], ["buducnost", "Budúcnosť a podmienkové vety"], ["otazky", "Otázky"],
      ["vety", "Slovesá a vety"], ["mnozstvo", "Členy, množstvo a zámená"], ["pridavne", "Prídavné mená a príslovky"], ["cas", "Hodiny a predložky"], ["", "Ďalšie"]];
    const znama = (x) => SKUPINY.some(([k]) => k && k === x.skupina);
    el.cipy.innerHTML = SKUPINY.map(([kluc, nazov]) => {
      const v = zoznam.filter((x) => kluc ? x.skupina === kluc : !znama(x));
      if (!v.length) return "";
      return `<section class="tb-skupina"><h2 class="tb-skupina__nadpis">${esc(nazov)}</h2><div class="tb-cipy">${v.map((x) =>
        `<button type="button" class="tb-cip" data-id="${x.id}">${esc((x.otazky || [x.nazov])[0])}</button>`).join("")}</div></section>`;
    }).join("");
    el.cipy.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) otvor(b.dataset.id, true); });
    // otázka napísaná vlastnými slovami → chat (tabula-chat.js)
    if (window.GBTabulaChat && window.vytvorMotor) GBTabulaChat({ app, recepty, otvor: (id, h) => otvor(id, h) });

    // ---------- otvorenie tabule ----------
    function otvor(id, zapisHash) {
      r = recepty[id]; if (!r) return;
      r.id = id;
      el.zvuk.hidden = !r.hlas;
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
      stopni(); prehravac.pause(); r = null;
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
      hovor();
      if (anim && !MALO_POHYBU) {
        const novy = el.plocha.querySelectorAll(".tb-novy");
        const posledny = novy[novy.length - 1];
        if (posledny) casovace.push(setTimeout(() => posledny.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200));
      }
    }

    // vráti čas (s), kedy skončí táto operácia
    function vykonaj(op, anim, t) {
      ozivGraf.anim = anim;
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
          const odB = String(op.od).split(".")[0], kB = String(op.k).split(".")[0];
          const b = el.plocha.querySelector(`[data-blok="${odB}"]`);
          if (b) b.classList.add(odB === kB ? "tb-pod-sipkou" : "tb-nad-sipkou");
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
        case "mriezka": blok("tb-mriezka" + (op.velke ? " tb-mriezka--velke" : ""), "", op.id); return t;
        case "scena": {
          const kresba = SCENY[op.typ];
          const d = blok("tb-scena" + (op.siroka ? " tb-scena--siroka" : ""), `<svg viewBox="${op.typ === "kozy" ? "0 48 200 117" : "0 0 200 165"}" role="img" aria-label="${esc(op.alt || op.typ)}">${kresba ? kresba(op) : ""}</svg><p>${htmlTextu(op.popis || op.typ, "p")}</p>`);
          const tahy = [...d.querySelectorAll(".tk")];
          if (!anim) { d.classList.add("tb-hotovo"); return t; }
          tahy.forEach((p, i) => p.style.transitionDelay = (t + i * 0.12) + "s");
          const koniec = t + tahy.length * 0.12 + 0.4;
          d.querySelectorAll(".tb-koza, .tk-text").forEach((im) => im.style.transitionDelay = koniec + "s");
          d.querySelector("p").style.transitionDelay = (koniec + 0.2) + "s";
          requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("tb-kresli")));
          return koniec + 0.6;
        }
        case "os": {
          const d = blok("tb-os", osSvg(op), op.id);
          return ozivGraf(d, t);
        }
        case "naos": {
          // dokreslí značky do časovej osi, ktorá už na tabuli je: { "op": "naos", "os": "o", "znacky": [...] }
          const sv = el.plocha.querySelector(`[data-blok="${op.os}"] svg`);
          if (!sv) return t;
          const z = osZnacky(op.znacky), min = Math.min(Number(sv.dataset.min), z.minY);
          sv.dataset.min = min; sv.setAttribute("viewBox", `0 ${min} 320 ${152 - min}`);
          sv.insertAdjacentHTML("beforeend", z.h);
          return ozivGraf(sv, t);
        }
        case "hodiny": {
          const d = blok("tb-scena tb-hodiny tb-hotovo", hodinySvg(op) + `<p>${htmlTextu(op.popis || op.cas, "p")}</p>`, op.id);
          const kon = ozivGraf(d, t);
          if (anim) { const p = d.querySelector("p"); p.style.opacity = "0"; casovace.push(setTimeout(() => { p.style.transition = "opacity .4s"; p.style.opacity = ""; }, kon * 1000 - 300)); }
          return kon;
        }
        case "lievik": {
          // pás lievika: { "op": "lievik", "uroven": 0–2, "text": "{in|ruzova}", "popis": "mesiac · rok", "priklady": "in July, in 2026" }; pásy idú pod seba
          let obal = [...el.plocha.children].reverse().find((x) => x.classList && x.classList.contains("tb-lievik"));
          if (!obal || op.novy) { obal = document.createElement("div"); obal.className = "tb-blok tb-lievik"; el.plocha.insertBefore(obal, svg); }
          const u = Math.max(0, Math.min(2, op.uroven || 0)), sir = [100, 74, 48, 22], a = (100 - sir[u]) / 2, b = (100 - sir[u + 1]) / 2;
          const d = document.createElement("div");
          d.className = "tb-lievik__rad" + (anim ? " tb-novy" : "");
          d.innerHTML = `<div class="tb-lievik__pas"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M${a} 0L${100 - a} 0L${100 - b} 40L${b} 40Z"/></svg><span>${htmlTextu(op.text || "", "l")}</span></div><p>${htmlTextu(op.popis || "", "l")}${op.priklady ? `<small>${htmlTextu(op.priklady, "l")}</small>` : ""}</p>`;
          obal.append(d);
          return odhal(d, 0.9);
        }
        default: return t;
      }
    }

    // nové čiary a texty v grafike (.tg-novy) sa postupne dokreslia
    function ozivGraf(d, t) {
      const anim = ozivGraf.anim;
      const prvky = [...d.querySelectorAll(".tg-novy")];
      if (!anim) { prvky.forEach((p) => p.classList.remove("tg-novy")); return t; }
      prvky.forEach((p, i) => { p.classList.add("tg-cak"); p.style.transitionDelay = (t + i * 0.16) + "s"; });
      requestAnimationFrame(() => requestAnimationFrame(() => prvky.forEach((p) => p.classList.remove("tg-cak", "tg-novy"))));
      return t + prvky.length * 0.16 + 0.6;
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
          if (b.y > a.y + a.h * 0.8 || a.y > b.y + b.h * 0.8) {
            // šípka do ďalšieho riadku (zdrojový riadok má pod sebou voľné miesto)
            const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
            const y1 = a.y + a.h - 1, y2 = b.y + 5;
            d = `M${x1} ${y1}Q${(x1 + x2) / 2 + 18} ${(y1 + y2) / 2} ${x2} ${y2}`;
            const uhol = Math.atan2(y2 - (y1 + y2) / 2, x2 - ((x1 + x2) / 2 + 18)), l = 11;
            d += `M${x2 - l * Math.cos(uhol - 0.5)} ${y2 - l * Math.sin(uhol - 0.5)}L${x2} ${y2}L${x2 - l * Math.cos(uhol + 0.5)} ${y2 - l * Math.sin(uhol + 0.5)}`;
            cls += " tb-z--sipka";
            if (z.text) popisok = { x: Math.max(x1, x2) + 26, y: (y1 + y2) / 2 + 7, text: z.text, vlavo: true };
          } else {
          const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2, y = Math.max(a.y + a.h, b.y + b.h) + 2;
          const hlbka = Math.min(46, 18 + Math.abs(x2 - x1) * 0.12);
          d = `M${x1} ${a.y + a.h}Q${(x1 + x2) / 2} ${y + hlbka} ${x2} ${b.y + b.h + 2}`;
          const uhol = Math.atan2((b.y + b.h + 2) - (y + hlbka), x2 - (x1 + x2) / 2);
          const hx = x2, hy = b.y + b.h + 2, l = 11;
          d += `M${hx - l * Math.cos(uhol - 0.5)} ${hy - l * Math.sin(uhol - 0.5)}L${hx} ${hy}L${hx - l * Math.cos(uhol + 0.5)} ${hy - l * Math.sin(uhol + 0.5)}`;
          cls += " tb-z--sipka";
          if (z.text) popisok = { x: Math.max(60, (x1 + x2) / 2), y: y + hlbka / 2 + 26, text: z.text };
          }
        } else {
          const b = box(z.ciel); if (!b) return;
          if (z.typ === "podciarkni") { const y = b.y + b.h - 2; d = `M${b.x - 2} ${y}Q${b.x + b.w / 2} ${y + 6} ${b.x + b.w + 3} ${y - 1}`; cls += " tb-z--zlta"; }
          else if (z.typ === "krouzok") { const cx = b.x + b.w / 2, cy = b.y + b.h * 0.56, rx = Math.max(b.w / 2 + 8, 17), ry = Math.max(b.h * 0.4, 15);
            d = `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}l6 -4`; cls += " tb-z--zlta"; }
          else if (z.typ === "preskrtni") { d = `M${b.x - 4} ${b.y + b.h * 0.62}L${b.x + b.w + 4} ${b.y + b.h * 0.42}`; cls += " tb-z--ruzova"; }
          else return;
        }
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d); p.setAttribute("class", cls); p.setAttribute("pathLength", "1");
        svg.append(p);
        let txt = null;
        if (popisok) {
          txt = document.createElementNS(NS, "text");
          txt.setAttribute("x", popisok.x); txt.setAttribute("y", popisok.y); txt.setAttribute("class", "tb-z-text" + (popisok.vlavo ? " tb-z-text--vlavo" : ""));
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
