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
  };

  // všetky správne varianty vety z kocky (čas na konci aj na začiatku, will / 'll, won't / will not)
  const ZAMENA = ["i", "you", "we", "they", "he", "she", "it"];
  function riesenia(u) {
    const S = u.osoba[0], s = u.osoba[1], V = u.sloveso, C = u.cas;
    const vel = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    if (u.typ === "?") return [`Will ${s} ${V} ${C}?`];
    const out = [];
    (u.typ === "+" ? ["will"] : ["won't", "will not"]).forEach((f) => {
      out.push(`${S} ${f} ${V} ${C}.`, `${vel(C)} ${s} ${f} ${V}.`, `${vel(C)}, ${s} ${f} ${V}.`);
      if (f === "will" && ZAMENA.includes(s.toLowerCase())) out.push(`${S}'ll ${V} ${C}.`, `${vel(C)} ${s}'ll ${V}.`, `${vel(C)}, ${s}'ll ${V}.`);
    });
    return out;
  }

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
        uloha = { osoba: nahodny(k.osoby), sloveso: nahodny(k.slovesa), cas: nahodny(k.casy), typ: nahodny(k.typy) };
        el.stav.textContent = "kocka vybrala:";
        el.dalsia.textContent = "Hodiť kockou znova 🎲";
        el.zadanie.innerHTML = `<span class="pis-kocka" lang="en"><b>${esc(uloha.osoba[0])}</b> · <b>${esc(uloha.sloveso)}</b> · <b>${esc(uloha.cas)}</b></span>` +
          `<span class="pis-typ pis-typ--${typTrieda(uloha.typ)}">${TYP[uloha.typ]}</span>` +
          `<span class="pis-pozn">Napíš z týchto slov vetu s <i>will</i>.</span>`;
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
        const ok = norm(moja) === norm(spravna);
        const pocet = uloha.veta.split(" ").length, navyse = poskladane.filter((k) => k.i >= pocet).map((k) => k.t);
        const vys = [];
        if (!ok && navyse.length) vys.push(`Kartička <b lang="en">${esc(navyse[0])}</b> do vety nepatrí.`);
        else if (!ok && poskladane.length < pocet) vys.push("Niektoré kartičky ti ešte chýbali.");
        else if (!ok) vys.push("Slová sú správne, ale poradie nie.");
        skontrolovane = true; kresliSkladanie();
        vysledok(ok, spravna, vys);
        el.over.hidden = true; poslednaVeta = spravna; el.uloz.hidden = false; el.znova.hidden = ok;
        GB.udalost(`pisanie/${lekcia}/poskladaj/${ok ? "ok" : "chyba"}`, `Napíš sám ${lekcia}: poskladaj`);
        return;
      }
      const text = apos(el.vstup.value).trim();
      if (!text) { hlaska("Najprv napíš vetu."); el.vstup.focus(); return; }
      const moznosti = riesenia(uloha);
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
        vys = gram(text, uloha.typ);
        const tx = norm(text), os = uloha.osoba[1].toLowerCase();
        if (!(os === "i" ? /\bi\b|\bi'll\b/.test(tx) : tx.includes(os))) vys.push(`Chýba osoba z kocky: <b lang="en">${esc(uloha.osoba[0])}</b>.`);
        if (!tx.includes(uloha.sloveso.toLowerCase())) vys.push(`Použi presne slová z kocky: <b lang="en">${esc(uloha.sloveso)}</b>.`);
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
