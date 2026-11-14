// Napíš sám: 1) poskladaj vetu z kartičiek, 2) kocka – napíš vetu z vylosovaných slov.
// Tlačidlo Skontrolovať vždy povie, či je veta správna, a ukáže správne riešenie. Vety sa dajú uložiť do „zošita“ v prehliadači.
(function () {
  const start = () => document.querySelectorAll("[data-pisanie]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  // apostrof zo slovenskej klávesnice (´ ` ‘ ’) berieme ako '
  const apos = (t) => String(t || "").replace(/[´`‘’ʼ′]/g, "'");
  const norm = (t) => apos(t).toLowerCase().replace(/\s+/g, " ").trim();
  const bezInterp = (t) => norm(t).replace(/[.,!?;:]/g, " ").replace(/\s+/g, " ").trim();
  const slova = (t) => bezInterp(t).split(" ").filter(Boolean);
  const esc = (t) => GB.esc(t);

  // ---------- vysvetlenia typických chýb (prečo veta nie je správna) ----------
  const BE = { is: "be", are: "be", am: "be", was: "be", were: "be", has: "have", does: "do", goes: "go" };
  const GRAMATIKA = {
    will(text, typ) {
      const t = norm(text), w = slova(text), tipy = [];
      const po = [];
      w.forEach((s, i) => { if ((s === "will" || s === "won't" || /'ll$/.test(s)) && w[i + 1]) po.push(w[i + 1] === "not" ? w[i + 2] : w[i + 1]); });
      if (/\bwills\b/.test(t)) tipy.push("<b>will</b> sa nemení: nie <s>wills</s>, ale <b>will</b>.");
      const zlyZapor = /\b(willn'?t|will'nt|wont)\b/.test(t);
      if (zlyZapor && typ === "+") tipy.push("Kocka chce <b>kladnú</b> vetu – bez záporu.");
      else if (zlyZapor) tipy.push("Zápor sa píše <b>won't</b> – s apostrofom. Pomôže tlačidlo <b>Vložiť '</b>.");
      if (/^ill\b/.test(t) || /\b(youll|itll|theyll)\b/.test(t)) tipy.push("Skrátený tvar sa píše s apostrofom: <b>I'll, you'll, we'll, they'll</b>.");
      if (/\b(don't|doesn't|do|does|did) (\w+ )?will\b/.test(t) || /\bnot will\b/.test(t)) tipy.push("Pri <b>will</b> nepoužívame do / don't: <b>I won't go. Will you go?</b>");
      po.filter(Boolean).forEach((s) => {
        if (s === "to") tipy.push("Po <b>will</b> nepíšeme <i>to</i>: <b>will go</b>, nie <s>will to go</s>.");
        else if (BE[s]) tipy.push(`Po <b>will</b> ide základný tvar: <b>will ${BE[s]}</b>, nie <s>will ${esc(s)}</s>.`);
        else if (/ing$/.test(s) && s.length > 4) tipy.push("Po <b>will</b> ide základný tvar slovesa, bez -ing.");
        else if (/[^s]ed$/.test(s) && s.length > 4 && s !== "need") tipy.push("Po <b>will</b> ide základný tvar slovesa, nie minulý čas.");
        else if (/[^s]s$/.test(s) && s.length > 3 && !["this", "his", "us", "always", "bus", "yes", "its"].includes(s))
          tipy.push(`Po <b>will</b> ide základný tvar bez -s: <b>will ${esc(/(sh|ch|x|ss)es$/.test(s) ? s.slice(0, -2) : /ies$/.test(s) ? s.slice(0, -3) + "y" : s.slice(0, -1))}</b>, nie <s>will ${esc(s)}</s>.`);
      });
      const maZapor = zlyZapor || /\bwon't\b|\bwill not\b/.test(t);
      if (!zlyZapor) {
        if (typ === "-" && !maZapor) tipy.push("Kocka chce <b>zápor</b>: <b>won't</b> (= will not).");
        if (typ === "+" && maZapor) tipy.push("Kocka chce <b>kladnú</b> vetu – bez won't.");
        if (typ === "?" && !/^(will|won't)\b/.test(t)) tipy.push("V otázke ide <b>Will</b> na začiatok: <b>Will you…?</b>");
      }
      return [...new Set(tipy)];
    },
    "present-simple"(text, typ, u) {
      const t = norm(text), w = slova(text), tipy = [], v = u.sloveso, he = u.osoba[2] === "he";
      const z = v.z.split(" ")[0], sTvar = v.s.split(" ")[0];
      if (/\b(am|is|are|isn't|aren't)\b/.test(t) || /\b(i'm|you're|we're|they're|he's|she's)\b/.test(t))
        tipy.push(`V present simple pred sloveso nedávame am / is / are: <b>${esc(u.osoba[0])} ${esc(he ? v.s : v.z)}</b>.`);
      if (typ === "+") {
        if (/\b(don't|doesn't|not)\b/.test(t)) tipy.push("Kocka chce <b>kladnú</b> vetu – bez záporu.");
        else if (he && !w.includes(sTvar)) tipy.push(`Pri he / she / it má sloveso koncovku -s: <b>${esc(v.s)}</b>.`);
        else if (!he && w.includes(sTvar)) tipy.push(`Koncovka -s je len pri he / she / it. Tu je <b>${esc(v.z)}</b>.`);
      }
      if (typ === "-") {
        if (!/\b(don't|doesn't|do not|does not)\b/.test(t)) tipy.push(`Kocka chce <b>zápor</b>: <b>${he ? "doesn't" : "don't"}</b> + sloveso.`);
        else if (he && /\b(don't|do not)\b/.test(t)) tipy.push("Pri he / she / it je zápor <b>doesn't</b>.");
        else if (!he && /\b(doesn't|does not)\b/.test(t)) tipy.push("<b>Doesn't</b> je len pri he / she / it. Tu je <b>don't</b>.");
        if (w.includes(sTvar)) tipy.push(`Po doesn't ide základný tvar bez -s: <b>doesn't ${esc(z)}</b>.`);
      }
      if (typ === "?") {
        if (!/^(do|does)\b/.test(t)) tipy.push(`Otázka začína pomocným slovesom: <b>${he ? "Does" : "Do"} ${esc(u.osoba[1])}…?</b>`);
        else if (he && /^do\b/.test(t)) tipy.push("Pri he / she / it sa pýtame <b>Does</b>.");
        else if (!he && /^does\b/.test(t)) tipy.push("<b>Does</b> je len pri he / she / it. Tu je <b>Do</b>.");
        if (w.includes(sTvar)) tipy.push(`Po Does ide základný tvar bez -s: <b>${esc(z)}</b>.`);
      }
      return [...new Set(tipy)];
    },
    "present-continuous"(text, typ, u) { return tipyBe(text, typ, u, u.sloveso.ing, "present continuous"); },
    "going-to"(text, typ, u) {
      const t = norm(text), tipy = [];
      if (/\b(will|won't)\b/.test(t)) tipy.push("Kocka chce <b>BE going to</b>, nie will.");
      if (!/\bgoing\b/.test(t)) tipy.push("Chýba <b>going to</b>: BE + going to + sloveso.");
      else if (!/\bgoing to\b/.test(t)) tipy.push("Za going patrí <b>to</b>: going <b>to</b> " + esc(u.sloveso.z.split(" ")[0]) + ".");
      else if (/\bgoing to \w+ing\b/.test(t)) tipy.push(`Po going to ide základný tvar: <b>going to ${esc(u.sloveso.z)}</b>.`);
      return [...new Set(tipy.concat(tipyBe(text, typ, u, "going to " + u.sloveso.z, "BE going to", true)))];
    },
    "past-simple"(text, typ, u) {
      const t = norm(text), w = slova(text), tipy = [], v = u.sloveso;
      const z = v.z.split(" ")[0], m = v.m.split(" ")[0];
      if (/\b(was|were|wasn't|weren't)\b/.test(t)) tipy.push(`Was / were patrí len k slovesu be. Tu: <b>${esc(v.m)}</b>, <b>didn't ${esc(v.z)}</b>.`);
      if (/\b(don't|doesn't|do|does)\b/.test(t)) tipy.push("V minulom čase je pomocné sloveso <b>did / didn't</b>, nie do / does.");
      if (typ === "+") {
        if (/\b(didn't|did not)\b/.test(t)) tipy.push("Kocka chce <b>kladnú</b> vetu – bez didn't.");
        else if (!w.includes(m)) tipy.push(`Minulý tvar slovesa ${esc(z)} je <b>${esc(m)}</b>.`);
      }
      if (typ === "-") {
        if (!/\b(didn't|did not)\b/.test(t)) tipy.push("Kocka chce <b>zápor</b>: <b>didn't</b> + základný tvar.");
        if (m !== z && w.includes(m)) tipy.push(`Po didn't ide základný tvar: <b>didn't ${esc(z)}</b>, nie <s>didn't ${esc(m)}</s>.`);
      }
      if (typ === "?") {
        if (!/^did\b/.test(t)) tipy.push(`Otázka začína <b>Did</b>: <b>Did ${esc(u.osoba[1])} ${esc(z)}…?</b>`);
        if (m !== z && w.includes(m)) tipy.push(`Po Did ide základný tvar: <b>${esc(z)}</b>, nie <s>${esc(m)}</s>.`);
      }
      return [...new Set(tipy)];
    },
    "present-perfect"(text, typ, u) {
      const t = norm(text), w = slova(text), tipy = [], v = u.sloveso, he = u.osoba[2] === "he";
      const m = v.m.split(" ")[0], pp = v.pp.split(" ")[0];
      const maHave = /\b(have|haven't|i've|you've|we've|they've)\b/.test(t), maHas = /\b(has|hasn't)\b/.test(t) || /'s\b/.test(t);
      if (/\b(did|didn't)\b/.test(t)) tipy.push("V present perfect nepoužívame did: <b>have / has</b> + 3. tvar.");
      if (!maHave && !maHas) tipy.push(`Chýba <b>${he ? "has" : "have"}</b>: ${he ? "has" : "have"} + 3. tvar.`);
      else if (he && maHave && !maHas) tipy.push("Pri he / she / it je <b>has</b>, nie have.");
      else if (!he && /\b(has|hasn't)\b/.test(t)) tipy.push("<b>Has</b> je len pri he / she / it. Tu je <b>have</b>.");
      if (!w.includes(pp)) tipy.push(m !== pp && w.includes(m)
        ? `Po have / has ide 3. tvar: <b>${esc(pp)}</b>, nie <s>${esc(m)}</s>.`
        : `3. tvar slovesa ${esc(v.z.split(" ")[0])} je <b>${esc(pp)}</b>.`);
      const maZapor = /n't\b|\bnot\b/.test(t);
      if (typ === "-" && !maZapor) tipy.push(`Kocka chce <b>zápor</b>: <b>${he ? "hasn't" : "haven't"}</b>.`);
      if (typ === "+" && maZapor) tipy.push("Kocka chce <b>kladnú</b> vetu – bez záporu.");
      return [...new Set(tipy)];
    },
  };

  // spoločné tipy pre časy so slovesom BE (present continuous, BE going to)
  function tipyBe(text, typ, u, zvysok, nazov, bezIng) {
    const t = norm(text), tipy = [], o = u.osoba[2];
    const be = { i: "am", he: "is", are: "are" }[o];
    const najdene = [];
    if (/\bam\b|\bi'm\b/.test(t)) najdene.push("am");
    if (/\b(is|isn't)\b/.test(t) || /'s\b/.test(t)) najdene.push("is");
    if (/\b(are|aren't)\b/.test(t) || /'re\b/.test(t)) najdene.push("are");
    if (/\b(do|does|don't|doesn't|did|didn't)\b/.test(t)) tipy.push(`V ${nazov} nepoužívame do / does. Otázku aj zápor robí <b>BE</b> (am / is / are).`);
    if (!najdene.length) tipy.push(`Chýba sloveso <b>BE</b>: <b>${esc(u.osoba[0])} ${be} ${esc(zvysok)}</b>.`);
    else if (!najdene.includes(be)) tipy.push(`Pri <b>${esc(u.osoba[0])}</b> má BE tvar <b>${be}</b>.`);
    if (!bezIng && !slova(text).includes(u.sloveso.ing.split(" ")[0])) tipy.push(`Sloveso potrebuje -ing: <b>${esc(u.sloveso.ing)}</b>.`);
    const maZapor = /\bnot\b|n't\b/.test(t);
    if (typ === "-" && !maZapor) tipy.push(`Kocka chce <b>zápor</b>: BE + <b>not</b> (${o === "i" ? "I'm not" : o === "he" ? "isn't" : "aren't"}).`);
    if (typ === "+" && maZapor) tipy.push("Kocka chce <b>kladnú</b> vetu – bez not.");
    if (typ === "?" && !/^(am|is|are)\b/.test(t)) tipy.push(`V otázke ide BE na začiatok: <b>${be.charAt(0).toUpperCase() + be.slice(1)} ${esc(u.osoba[1])}…?</b>`);
    return tipy;
  }

  // všetky správne varianty vety z kocky (čas na konci aj na začiatku, dlhé aj skrátené tvary)
  const ZAMENA = ["i", "you", "we", "they", "he", "she", "it"];
  const vel = (x) => x.charAt(0).toUpperCase() + x.slice(1);
  // prisudky = všetko, čo môže nasledovať hneď za podmetom (" will go", "'ll go"…)
  function oznamovacie(u, prisudky) {
    const S = u.osoba[0], s = u.osoba[1], C = u.cas, out = [];
    prisudky.forEach((p) => out.push(`${S}${p} ${C}.`, `${vel(C)} ${s}${p}.`, `${vel(C)}, ${s}${p}.`));
    return out;
  }
  const RIESENIA = {
    will(u) {
      const s = u.osoba[1], V = u.sloveso.z;
      if (u.typ === "?") return [`Will ${s} ${V} ${u.cas}?`];
      if (u.typ === "-") return oznamovacie(u, [` won't ${V}`, ` will not ${V}`]);
      return oznamovacie(u, ZAMENA.includes(s.toLowerCase()) ? [` will ${V}`, `'ll ${V}`] : [` will ${V}`]);
    },
    "present-simple"(u) {
      const he = u.osoba[2] === "he", v = u.sloveso;
      if (u.typ === "?") return [`${he ? "Does" : "Do"} ${u.osoba[1]} ${v.z} ${u.cas}?`];
      if (u.typ === "-") return oznamovacie(u, he ? [` doesn't ${v.z}`, ` does not ${v.z}`] : [` don't ${v.z}`, ` do not ${v.z}`]);
      return oznamovacie(u, [` ${he ? v.s : v.z}`]);
    },
    "present-continuous"(u) { return sBe(u, u.sloveso.ing); },
    "going-to"(u) { return sBe(u, "going to " + u.sloveso.z); },
    "past-simple"(u) {
      const v = u.sloveso;
      if (u.typ === "?") return [`Did ${u.osoba[1]} ${v.z} ${u.cas}?`];
      if (u.typ === "-") return oznamovacie(u, [` didn't ${v.z}`, ` did not ${v.z}`]);
      return oznamovacie(u, [` ${v.m}`]);
    },
    "present-perfect"(u) {
      const he = u.osoba[2] === "he", v = u.sloveso, have = he ? "has" : "have";
      const skrat = he || ZAMENA.includes(u.osoba[1].toLowerCase());
      if (u.typ === "?") return [`${vel(have)} ${u.osoba[1]} ${v.pp} ${u.cas}?`];
      if (u.typ === "-") return oznamovacie(u, [` ${have}n't ${v.pp}`, ` ${have} not ${v.pp}`]);
      return oznamovacie(u, skrat ? [` ${have} ${v.pp}`, `${he ? "'s" : "'ve"} ${v.pp}`] : [` ${have} ${v.pp}`]);
    },
  };
  // vety so slovesom BE: am / is / are + zvyšok (playing…, going to play…)
  function sBe(u, zvysok) {
    const o = u.osoba[2], be = { i: "am", he: "is", are: "are" }[o], kr = { i: "'m", he: "'s", are: "'re" }[o];
    const skrat = o === "he" || ZAMENA.includes(u.osoba[1].toLowerCase());
    if (u.typ === "?") return [`${vel(be)} ${u.osoba[1]} ${zvysok} ${u.cas}?`];
    if (u.typ === "-") {
      const p = o === "i" ? [`'m not ${zvysok}`, ` am not ${zvysok}`] : [` ${be}n't ${zvysok}`, ` ${be} not ${zvysok}`];
      if (o !== "i" && skrat) p.push(`${kr} not ${zvysok}`);
      return oznamovacie(u, p);
    }
    return oznamovacie(u, skrat ? [` ${be} ${zvysok}`, `${kr} ${zvysok}`] : [` ${be} ${zvysok}`]);
  }
  const riesenia = (u, sada) => (RIESENIA[sada] || RIESENIA.will)(u);
  window.GBPisanie = { riesenia, GRAMATIKA, RIESENIA }; // pre kontrolu úloh

  function init(box) {
    const id = box.dataset.pisanie, lekcia = box.dataset.lekcia || id;
    const data = GB.data("data-pisanie-" + id) || {};
    const gram = GRAMATIKA[data.gramatika] || (() => []);
    const KLUC = "gb-zosit-" + lekcia;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), stav: $("[data-stav]"), zadanie: $("[data-zadanie]"),
      skladanie: $("[data-skladanie]"), banka: $("[data-banka]"), veta: $("[data-veta]"),
      pisanie: $("[data-pis]"), vstup: $("[data-vstup]"), apos: $("[data-apos]"),
      over: $("[data-over]"), znova: $("[data-znova]"), uloz: $("[data-uloz]"), dalsia: $("[data-dalsia]"),
      vysledok: $("[data-tipy]"), zosit: $("[data-zosit]"), zosList: $("[data-zosit-list]"), kopiruj: $("[data-kopiruj-zosit]"),
    };
    let zosit = [];
    try { zosit = JSON.parse(localStorage.getItem(KLUC)) || []; } catch (e) {}
    const ulozZosit = () => { try { localStorage.setItem(KLUC, JSON.stringify(zosit)); } catch (e) {} };

    const UROVNE = [["poskladaj", "1 · Poskladaj vetu"], ["kocka", "2 · Kocka 🎲"]].filter(([k]) => data[k]);
    let uroven = UROVNE[0][0], ix = 0, uloha = null, poskladane = [], skontrolovane = false, poslednaVeta = "";

    function kresliCipy() {
      el.cipy.textContent = "";
      UROVNE.forEach(([k, t]) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "trener__cip"; b.textContent = t;
        b.setAttribute("aria-pressed", k === uroven ? "true" : "false");
        b.addEventListener("click", () => { uroven = k; kresliCipy(); ukaz(); });
        el.cipy.append(b);
      });
    }
    const zamiesaj = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const nahodny = (a) => a[Math.floor(Math.random() * a.length)];
    const TYP = { "+": "oznamovacia veta", "-": "zápor", "?": "otázka" };
    const typTrieda = (t) => (t === "-" ? "zapor" : t === "?" ? "otazka" : "plus");

    function ukaz() {
      skontrolovane = false; poslednaVeta = "";
      el.vysledok.hidden = true; el.uloz.hidden = true; el.over.hidden = false; el.znova.hidden = true;
      const skladanie = uroven === "poskladaj";
      el.skladanie.hidden = !skladanie; el.pisanie.hidden = skladanie;
      if (skladanie) {
        const zoz = data.poskladaj; uloha = zoz[ix % zoz.length];
        el.stav.textContent = `veta ${(ix % zoz.length) + 1} / ${zoz.length}`;
        el.dalsia.textContent = "Ďalšia veta →";
        el.zadanie.innerHTML = "Poskladaj vetu z kartičiek. <span class=\"pis-pozn\">Jedna kartička je navyše!</span>";
        poskladane = [];
        uloha._karty = zamiesaj(uloha.veta.split(" ").concat(uloha.navyse || []).map((t, i) => ({ t, i })));
        kresliSkladanie();
      } else {
        const k = data.kocka;
        const sl = nahodny(k.slovesa);
        uloha = { osoba: nahodny(k.osoby), sloveso: typeof sl === "string" ? { z: sl } : sl, cas: nahodny(k.casy), typ: nahodny(k.typy) };
        el.stav.textContent = "kocka vybrala:";
        el.dalsia.textContent = "Hodiť kockou znova 🎲";
        el.zadanie.innerHTML = `<span class="pis-kocka" lang="en"><b>${esc(uloha.osoba[0])}</b> · <b>${esc(uloha.sloveso.z)}</b> · <b>${esc(uloha.cas)}</b></span>` +
          `<span class="pis-typ pis-typ--${typTrieda(uloha.typ)}">${TYP[uloha.typ]}</span>` +
          `<span class="pis-pozn">Napíš z týchto slov vetu ${k.pokyn || "s <i>will</i>"}.</span>`;
        el.vstup.value = ""; el.vstup.disabled = false;
      }
    }
    function kresliSkladanie() {
      el.banka.textContent = ""; el.veta.textContent = "";
      const pouzite = new Set(poskladane.map((k) => k.i));
      uloha._karty.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pis-karta"; b.lang = "en"; b.textContent = k.t; b.disabled = skontrolovane || pouzite.has(k.i);
        b.addEventListener("click", () => { poskladane.push(k); kresliSkladanie(); });
        el.banka.append(b);
      });
      if (!poskladane.length) { const p = document.createElement("span"); p.className = "pis-prazdne"; p.textContent = "Ťukaj na kartičky…"; el.veta.append(p); }
      poskladane.forEach((k, j) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pis-karta pis-karta--vo-vete"; b.lang = "en"; b.textContent = k.t; b.title = "Vrátiť späť"; b.disabled = skontrolovane;
        b.addEventListener("click", () => { poskladane.splice(j, 1); kresliSkladanie(); });
        el.veta.append(b);
      });
    }
    const spoj = (arr) => arr.join(" ").replace(/ ([.?!,])/g, "$1");

    function vysledok(ok, spravne, vysvetlenia = [], drobnosti = []) {
      el.vysledok.hidden = false;
      el.vysledok.className = "pis-tipy " + (ok ? "pis-tipy--ok" : "pis-tipy--zle");
      el.vysledok.innerHTML =
        `<p class="pis-verdikt">${ok ? "✓ Správne!" : "Nie celkom."}</p>` +
        (ok && drobnosti.length ? `<p>Len drobnosť: ${drobnosti.join(" ")}</p>` : "") +
        (!ok && vysvetlenia.length ? `<ul>${vysvetlenia.slice(0, 3).map((t) => `<li>${t}</li>`).join("")}</ul>` : "") +
        `<p class="pis-riesenie">${ok ? "Správna veta:" : "Správne je:"} <b lang="en">${esc(spravne)}</b></p>`;
    }
    function hlaska(t) { el.vysledok.hidden = false; el.vysledok.className = "pis-tipy"; el.vysledok.textContent = t; }

    el.over.addEventListener("click", () => {
      if (uroven === "poskladaj") {
        if (!poskladane.length) return hlaska("Najprv poskladaj vetu z kartičiek.");
        const moja = spoj(poskladane.map((k) => k.t)), spravna = spoj(uloha.veta.split(" "));
        const ok = [uloha.veta, ...(uloha.aj || [])].some((v) => norm(spoj(v.split(" "))) === norm(moja));
        const pocet = uloha.veta.split(" ").length, navyse = poskladane.filter((k) => k.i >= pocet).map((k) => k.t);
        const vys = [];
        if (!ok && navyse.length) vys.push(`Kartička <b lang="en">${esc(navyse[0])}</b> do vety nepatrí.` + (uloha.preco ? " " + uloha.preco : ""));
        else if (!ok && poskladane.length < pocet) vys.push("Niektoré kartičky ti ešte chýbali.");
        else if (!ok) vys.push("Slová sú správne, ale poradie nie." + (uloha.tip ? " " + uloha.tip : ""));
        skontrolovane = true; kresliSkladanie();
        vysledok(ok, ok ? moja : spravna, vys);
        el.over.hidden = true; poslednaVeta = ok ? moja : spravna; el.uloz.hidden = false; el.znova.hidden = ok;
        GB.udalost(`pisanie/${lekcia}/poskladaj/${ok ? "ok" : "chyba"}`, `Napíš sám ${lekcia}: poskladaj`);
        return;
      }
      const text = apos(el.vstup.value).trim();
      if (!text) { hlaska("Najprv napíš vetu."); el.vstup.focus(); return; }
      const moznosti = riesenia(uloha, data.gramatika);
      const zhoda = moznosti.find((m) => bezInterp(m) === bezInterp(text));
      const ok = !!zhoda, drobnosti = [];
      if (ok) {
        if (/^[a-z]/.test(text)) drobnosti.push("veta začína <b>veľkým písmenom</b>.");
        if (uloha.typ === "?" && !/\?$/.test(text)) drobnosti.push("na konci otázky je <b>otáznik ?</b>");
        else if (uloha.typ !== "?" && !/[.!]$/.test(text)) drobnosti.push("na konci vety je <b>bodka</b>.");
        if (/\bi\b/.test(text) || /\bi'll\b/.test(text)) drobnosti.push("<b>I</b> sa píše vždy veľkým.");
      }
      let vys = [];
      if (!ok) {
        // didnt, dont, isnt… – chýba len apostrof; ostatné chyby hľadáme už v opravenej vete
        const sApos = text.replace(/\b(did|do|does|is|are|was|were|have|has)nt\b/gi, "$1n't");
        if (sApos !== text) vys.push("Skrátený zápor sa píše s apostrofom: <b>" + esc(sApos.match(/\b\w+n't\b/)[0]) + "</b>. Pomôže tlačidlo <b>Vložiť '</b>.");
        vys = vys.concat(gram(sApos, uloha.typ, uloha));
        const tx = norm(text), os = uloha.osoba[1].toLowerCase();
        if (!(os === "i" ? /\bi\b|\bi'll\b/.test(tx) : tx.includes(os))) vys.push(`Chýba osoba z kocky: <b lang="en">${esc(uloha.osoba[0])}</b>.`);
        // zvyšok slovného spojenia (bez prvého slova – to mení tvar) musí vo vete ostať
        const zvysok = uloha.sloveso.z.toLowerCase().split(" ").slice(1).join(" ");
        if (!vys.length && (zvysok ? !tx.includes(zvysok) : !Object.values(uloha.sloveso).some((f) => tx.includes(f.toLowerCase()))))
          vys.push(`Použi presne slová z kocky: <b lang="en">${esc(uloha.sloveso.z)}</b>.`);
        if (!tx.includes(uloha.cas.toLowerCase())) vys.push(`Chýba čas z kocky: <b lang="en">${esc(uloha.cas)}</b>.`);
      }
      vysledok(ok, ok ? zhoda : moznosti[0], [...new Set(vys)], drobnosti);
      el.vstup.disabled = true; el.over.hidden = true; skontrolovane = true;
      poslednaVeta = ok ? zhoda : moznosti[0]; el.uloz.hidden = false; el.znova.hidden = ok;
      GB.udalost(`pisanie/${lekcia}/kocka/${ok ? "ok" : "chyba"}`, `Napíš sám ${lekcia}: kocka`);
    });
    el.dalsia.addEventListener("click", () => { ix++; ukaz(); });
    el.znova.addEventListener("click", () => { // tá istá úloha ešte raz
      skontrolovane = false; poslednaVeta = "";
      el.vysledok.hidden = true; el.uloz.hidden = true; el.znova.hidden = true; el.over.hidden = false;
      if (uroven === "poskladaj") { poskladane = []; kresliSkladanie(); }
      else { el.vstup.disabled = false; el.vstup.focus(); }
    });
    el.apos.addEventListener("mousedown", (e) => e.preventDefault()); // kurzor ostane v poli
    el.apos.addEventListener("click", () => {
      const v = el.vstup; if (v.disabled) return;
      const a = v.selectionStart ?? v.value.length, b = v.selectionEnd ?? a;
      v.value = v.value.slice(0, a) + "'" + v.value.slice(b);
      v.focus(); v.setSelectionRange(a + 1, a + 1);
    });

    // ---------- zošit ----------
    function kresliZosit() {
      el.zosit.hidden = !zosit.length;
      el.zosList.textContent = "";
      zosit.forEach((z, i) => {
        const li = document.createElement("li");
        const s = document.createElement("span"); s.lang = "en"; s.textContent = z;
        const x = document.createElement("button"); x.type = "button"; x.className = "pis-zmaz"; x.textContent = "✕"; x.setAttribute("aria-label", "Zmazať vetu");
        x.addEventListener("click", () => { zosit.splice(i, 1); ulozZosit(); kresliZosit(); });
        li.append(s, x); el.zosList.append(li);
      });
    }
    el.uloz.addEventListener("click", () => {
      if (!poslednaVeta) return;
      if (!zosit.includes(poslednaVeta)) zosit.push(poslednaVeta);
      ulozZosit(); kresliZosit(); el.uloz.hidden = true;
    });
    el.kopiruj.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(zosit.join("\n")); el.kopiruj.textContent = "Skopírované ✓"; }
      catch (e) { el.kopiruj.textContent = "Kopírovanie nevyšlo"; }
      setTimeout(() => (el.kopiruj.textContent = "Kopírovať všetky vety"), 2000);
    });

    kresliCipy(); ukaz(); kresliZosit();
  }
})();
