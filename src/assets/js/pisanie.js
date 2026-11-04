// Napíš sám: žiak tvorí vlastné vety. Nehodnotí sa správne/zle – tréner dáva tipy a ukáže vzorové vety.
// Vety sa dajú uložiť do „zošita“ len v tomto prehliadači.
(function () {
  const start = () => document.querySelectorAll("[data-pisanie]").forEach(init);
  if (window.GB) start(); else document.addEventListener("DOMContentLoaded", start);

  // apostrof zo slovenskej klávesnice (´ ` ‘ ’) berieme ako '
  const apos = (t) => String(t || "").replace(/[´`‘’ʼ′]/g, "'");
  const norm = (t) => apos(t).toLowerCase().replace(/\s+/g, " ").trim();
  const slova = (t) => norm(t).replace(/[.,!?;:]/g, " ").split(" ").filter(Boolean);
  const esc = (t) => GB.esc(t);

  // ---------- tipy podľa gramatiky ----------
  const BE = { is: "be", are: "be", am: "be", was: "be", were: "be", has: "have", does: "do", goes: "go" };
  const GRAMATIKA = {
    will(text, uloha) {
      const t = norm(text), w = slova(text), tipy = [];
      const po = []; // slová hneď po will / 'll / won't
      w.forEach((s, i) => { if ((s === "will" || s === "won't" || /'ll$/.test(s)) && w[i + 1]) po.push(w[i + 1] === "not" ? w[i + 2] : w[i + 1]); });
      if (/\bwills\b/.test(t)) tipy.push("<b>will</b> sa nemení: nie <s>wills</s>, ale <b>will</b>.");
      if (/\b(willn'?t|will'nt|wont)\b/.test(t)) tipy.push("Zápor sa píše <b>won't</b> – s apostrofom. Pomôže tlačidlo <b>Vložiť '</b>.");
      if (/^ill\b/.test(t) || /\b(youll|itll|theyll)\b/.test(t)) tipy.push("Skrátený tvar sa píše s apostrofom: <b>I'll, you'll, it'll, they'll</b>.");
      if (/\b(don't|doesn't|do|does|did) (\w+ )?will\b/.test(t) || /\bnot will\b/.test(t)) tipy.push("Pri <b>will</b> nepoužívame do / don't: <b>I won't go. Will you go?</b>");
      po.filter(Boolean).forEach((s) => {
        if (s === "to") tipy.push("Po <b>will</b> nepíšeme <i>to</i>: <b>will go</b>, nie <s>will to go</s>.");
        else if (BE[s]) tipy.push(`Po <b>will</b> ide základný tvar: <b>will ${BE[s]}</b>, nie <s>will ${esc(s)}</s>.`);
        else if (/ing$/.test(s) && s.length > 4) tipy.push(`Po <b>will</b> ide základný tvar slovesa, bez -ing: <b>will ${esc(s.replace(/ing$/, ""))}…</b>`);
        else if (/[^s]ed$/.test(s) && s.length > 4 && s !== "need") tipy.push("Po <b>will</b> ide základný tvar slovesa, nie minulý čas.");
        else if (/[^s]s$/.test(s) && s.length > 3 && !["this", "his", "us", "always", "bus", "yes", "its"].includes(s)) tipy.push(`Po <b>will</b> ide základný tvar bez -s: <b>will ${esc(/(sh|ch|x|ss)es$/.test(s) ? s.slice(0, -2) : /ies$/.test(s) ? s.slice(0, -3) + "y" : s.slice(0, -1))}</b>, nie <s>will ${esc(s)}</s>.`);
      });
      const maZapor = /\bwon't\b|\bwill not\b|\b(willn'?t|will'nt|wont)\b/.test(t), maWill = maZapor || /\bwill\b|'ll\b|\bill\b|\b(youll|itll|theyll)\b/.test(t);
      if (uloha.typ === "-" && !maZapor) tipy.push("Úloha chce <b>zápor</b>. Skús <b>won't</b> (= will not).");
      if (uloha.typ === "+" && maZapor) tipy.push("Úloha chce <b>kladnú</b> vetu – bez won't.");
      if (!maWill && !maZapor) tipy.push("V tejto úlohe treba <b>will</b> alebo skratku <b>'ll</b>.");
      if (uloha.typ === "?" && maWill && !/^((what|where|when|who|how|why|which)( \w+){0,2} )?(will|won't)\b/.test(t))
        tipy.push("V otázke ide <b>will</b> dopredu: <b>Will you…?</b> alebo <b>Where will you…?</b>");
      return [...new Set(tipy)];
    },
  };

  function vseobecne(text, uloha) {
    const t = apos(text).trim(), tipy = [];
    if (!t) return ["Napíš vetu – stačí krátka."];
    if (slova(t).length < 3) tipy.push("Skús napísať celú vetu – aspoň 3 slová.");
    if (/^[a-z]/.test(t)) tipy.push("Veta začína <b>veľkým písmenom</b>.");
    if (!/[.!?]$/.test(t)) tipy.push(uloha.typ === "?" ? "Otázka končí <b>otáznikom ?</b>" : "Na koniec vety patrí <b>bodka</b>.");
    else if (uloha.typ === "?" && !/\?$/.test(t)) tipy.push("Je to otázka – na konci má byť <b>otáznik ?</b>");
    else if ((uloha.typ === "+" || uloha.typ === "-") && /\?$/.test(t)) tipy.push("Toto nemá byť otázka – napíš oznamovaciu vetu s bodkou.");
    if (/\bi\b/.test(apos(text)) || /\bi'(ll|m|ve|d)\b/.test(apos(text))) tipy.push("<b>I</b> (ja) sa v angličtine píše vždy veľkým: <b>I</b>, <b>I'll</b>.");
    return tipy;
  }

  function init(box) {
    const id = box.dataset.pisanie, lekcia = box.dataset.lekcia || id;
    const data = GB.data("data-pisanie-" + id) || {};
    const gram = GRAMATIKA[data.gramatika] || (() => []);
    const KLUC = "gb-zosit-" + lekcia;
    const $ = (s) => box.querySelector(s);
    const el = {
      cipy: $("[data-cipy]"), karta: $("[data-karta]"), stav: $("[data-stav]"), zadanie: $("[data-zadanie]"),
      dlazdice: $("[data-dlazdice]"), skladanie: $("[data-skladanie]"), banka: $("[data-banka]"), veta: $("[data-veta]"),
      pisanie: $("[data-pis]"), vstup: $("[data-vstup]"), apos: $("[data-apos]"),
      over: $("[data-over]"), vzory: $("[data-vzory-tl]"), uloz: $("[data-uloz]"), dalsia: $("[data-dalsia]"),
      tipy: $("[data-tipy]"), vzoryBox: $("[data-vzory]"), zosit: $("[data-zosit]"), zosList: $("[data-zosit-list]"), kopiruj: $("[data-kopiruj-zosit]"),
    };
    let zosit = [];
    try { zosit = JSON.parse(localStorage.getItem(KLUC)) || []; } catch (e) {}
    const ulozZosit = () => { try { localStorage.setItem(KLUC, JSON.stringify(zosit)); } catch (e) {} };

    const UROVNE = [["poskladaj", "1 · Poskladaj vetu"], ["dokonci", "2 · Dokonči vetu"], ["napis", "3 · Napíš sám"], ["kocka", "Kocka"]].filter(([k]) => data[k]);
    let uroven = UROVNE[0][0], ix = { poskladaj: 0, dokonci: 0, napis: 0, kocka: 0 }, uloha = null, poskladane = [];

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
    const TYP = { "+": "oznamovacia veta", "-": "zápor", "?": "otázka", "": "" };

    function kocka() {
      const k = data.kocka, o = nahodny(k.osoby), v = nahodny(k.slovesa), c = nahodny(k.casy), typ = nahodny(k.typy);
      const vz = typ === "+" ? `${o[0]} will ${v} ${c}.` : typ === "-" ? `${o[0]} won't ${v} ${c}.` : `Will ${o[1]} ${v} ${c}?`;
      return { osoba: o, sloveso: v, cas: c, typ, vzory: [vz] };
    }

    function ukaz() {
      el.tipy.hidden = true; el.vzoryBox.hidden = true; el.uloz.hidden = true;
      const zoz = data[uroven];
      if (uroven === "kocka") { uloha = kocka(); el.stav.textContent = "kocka vybrala:"; }
      else { uloha = zoz[ix[uroven] % zoz.length]; el.stav.textContent = `úloha ${(ix[uroven] % zoz.length) + 1} / ${zoz.length}`; }
      el.dalsia.textContent = uroven === "kocka" ? "Hodiť kockou znova 🎲" : "Ďalšia úloha →";
      const skladanie = uroven === "poskladaj";
      el.skladanie.hidden = !skladanie; el.pisanie.hidden = skladanie;
      el.vzory.hidden = skladanie;
      if (skladanie) {
        el.zadanie.innerHTML = "Poskladaj vetu z kartičiek. <span class=\"pis-pozn\">Jedna kartička je navyše!</span>";
        poskladane = [];
        const karty = uloha.veta.split(" ").concat(uloha.navyse || []);
        uloha._karty = zamiesaj(karty.map((t, i) => ({ t, i })));
        kresliSkladanie();
      } else if (uroven === "kocka") {
        el.zadanie.innerHTML = `<span class="pis-kocka" lang="en"><b>${esc(uloha.osoba[0])}</b> · <b>${esc(uloha.sloveso)}</b> · <b>${esc(uloha.cas)}</b></span>` +
          `<span class="pis-typ pis-typ--${uloha.typ === "-" ? "zapor" : uloha.typ === "?" ? "otazka" : "plus"}">${TYP[uloha.typ]}</span>` +
          `<span class="pis-pozn">Napíš z týchto slov vetu s <i>will</i>.</span>`;
        el.vstup.value = "";
      } else {
        el.zadanie.innerHTML = esc(uloha.situacia) + (uloha.typ ? ` <span class="pis-typ pis-typ--${uloha.typ === "-" ? "zapor" : uloha.typ === "?" ? "otazka" : "plus"}">${TYP[uloha.typ]}</span>` : "");
        el.vstup.value = uloha.zaciatok ? uloha.zaciatok + " " : "";
      }
    }
    function kresliSkladanie() {
      el.banka.textContent = ""; el.veta.textContent = "";
      const pouzite = new Set(poskladane.map((k) => k.i));
      uloha._karty.forEach((k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pis-karta"; b.lang = "en"; b.textContent = k.t; b.disabled = pouzite.has(k.i);
        b.addEventListener("click", () => { poskladane.push(k); kresliSkladanie(); el.tipy.hidden = true; });
        el.banka.append(b);
      });
      if (!poskladane.length) { const p = document.createElement("span"); p.className = "pis-prazdne"; p.textContent = "Ťukaj na kartičky…"; el.veta.append(p); }
      poskladane.forEach((k, j) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "pis-karta pis-karta--vo-vete"; b.lang = "en"; b.textContent = k.t; b.title = "Vrátiť späť";
        b.addEventListener("click", () => { poskladane.splice(j, 1); kresliSkladanie(); el.tipy.hidden = true; });
        el.veta.append(b);
      });
    }
    const spoj = (arr) => arr.join(" ").replace(/ ([.?!,])/g, "$1");

    function tipy(zoznam, dobre) {
      el.tipy.hidden = false;
      el.tipy.className = "pis-tipy" + (dobre ? " pis-tipy--ok" : "");
      el.tipy.innerHTML = dobre
        ? `<p><b>Vyzerá to výborne!</b> Nenašiel som nič, čo by som opravil.</p>`
        : `<p><b>Tipy na vylepšenie:</b></p><ul>${zoznam.map((t) => `<li>${t}</li>`).join("")}</ul><p class="pis-pozn">Oprav vetu a skús znova – alebo si pozri príklady.</p>`;
    }
    function ukazVzory() {
      el.vzoryBox.hidden = false;
      el.vzoryBox.innerHTML = `<p><b>Takto by to mohlo vyzerať:</b></p><ul lang="en">${uloha.vzory.map((v) => `<li>${esc(v)}</li>`).join("")}</ul><p class="pis-pozn">Tvoja veta môže byť iná – a aj tak správna.</p>`;
    }

    el.over.addEventListener("click", () => {
      if (uroven === "poskladaj") {
        const moja = spoj(poskladane.map((k) => k.t)), spravna = spoj(uloha.veta.split(" "));
        if (!poskladane.length) return tipy(["Ťukaj na kartičky v správnom poradí."], false);
        if (norm(moja) === norm(spravna)) { tipy([], true); el.vzoryBox.hidden = true; return; }
        const t = [];
        if (poskladane.some((k) => (uloha.navyse || []).includes(k.t) && k.i >= uloha.veta.split(" ").length)) t.push(`Kartička <b>${esc(poskladane.find((k) => k.i >= uloha.veta.split(" ").length).t)}</b> je navyše – do vety nepatrí.`);
        if (poskladane.length < uloha.veta.split(" ").length) t.push("Ešte ti chýbajú niektoré kartičky.");
        const prva = uloha.veta.split(" ")[0];
        if (poskladane[0] && poskladane[0].t !== prva) t.push("Pozri sa, ktoré slovo začína veľkým písmenom – to ide na začiatok.");
        if (!t.length) t.push("Skoro! Skús vymeniť poradie niektorých slov.");
        tipy(t, false);
        return;
      }
      const text = el.vstup.value;
      let t = vseobecne(text, uloha);
      if (uloha.zaciatok) {
        const z = norm(uloha.zaciatok);
        if (!norm(text).startsWith(z)) t.push(`Nechaj začiatok vety: <b lang="en">${esc(uloha.zaciatok)}</b> …`);
        else if (slova(text).length <= slova(uloha.zaciatok).length) t = ["Dokonči vetu – dopíš, čo urobíš."];
      }
      if (uroven === "kocka") {
        const tx = norm(text);
        const os = uloha.osoba[1].toLowerCase();
        if (!(os === "i" ? /\bi\b|\bi'll\b/.test(tx) : tx.includes(os))) t.push(`Nezabudni na osobu: <b lang="en">${esc(uloha.osoba[0])}</b>.`);
        if (!tx.includes(uloha.sloveso.split(" ")[0])) t.push(`Použi sloveso: <b lang="en">${esc(uloha.sloveso)}</b>.`);
        if (!tx.includes(uloha.cas.toLowerCase())) t.push(`Pridaj čas: <b lang="en">${esc(uloha.cas)}</b>.`);
      }
      // poradie: najprv gramatika, potom úloha, nakoniec veľké písmeno a bodka; naraz najviac 3 tipy
      const g = apos(text).trim() ? gram(text, uloha) : [];
      const formalne = t.filter((x) => /veľkým|bodka|otáznik|Napíš vetu|aspoň 3/.test(x)), ostatne = t.filter((x) => !formalne.includes(x));
      t = [...new Set([...g, ...ostatne, ...formalne])];
      const navyse = t.length - 3;
      t = t.slice(0, 3);
      if (navyse > 0) t.push(`<span class="pis-pozn">Keď toto opravíš, pozriem sa ďalej (ešte ${navyse === 1 ? "1 drobnosť" : navyse < 5 ? navyse + " drobnosti" : navyse + " drobností"}).</span>`);
      tipy(t, !t.length);
      el.uloz.hidden = !apos(text).trim();
      GB.udalost(`pisanie/${lekcia}/${uroven}`, `Napíš sám: ${lekcia} (${uroven})`);
    });
    el.vzory.addEventListener("click", ukazVzory);
    el.dalsia.addEventListener("click", () => { ix[uroven]++; ukaz(); });
    el.apos.addEventListener("mousedown", (e) => e.preventDefault()); // nech kurzor ostane v poli
    el.apos.addEventListener("click", () => {
      const v = el.vstup, a = v.selectionStart ?? v.value.length, b = v.selectionEnd ?? a;
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
      const v = apos(el.vstup.value).trim(); if (!v) return;
      if (!zosit.includes(v)) zosit.push(v);
      ulozZosit(); kresliZosit();
      el.uloz.hidden = true;
    });
    el.kopiruj.addEventListener("click", async () => {
      const txt = zosit.join("\n");
      try { await navigator.clipboard.writeText(txt); el.kopiruj.textContent = "Skopírované ✓"; }
      catch (e) { el.kopiruj.textContent = "Kopírovanie nevyšlo"; }
      setTimeout(() => (el.kopiruj.textContent = "Kopírovať všetky vety"), 2000);
    });

    kresliCipy(); ukaz(); kresliZosit();
  }
})();
