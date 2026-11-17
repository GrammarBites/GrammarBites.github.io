// Magická tabuľa – chat bez AI: porozumie otázke žiaka (preklepy, chýbajúca diakritika, skloňovanie, synonymá)
// a nájde k nej tabuľu alebo lekciu. Nič nevymýšľa – odpovedá len obsahom webu.
// Typické chyby, ktoré žiak môže napísať priamo ako vetu, sú v zozname CHYBY nižšie (dajú sa dopĺňať).
// Spoločné pomôcky na „chápavé“ hľadanie (používa ich chat Magickej tabule aj vyhľadávanie v hlavičke)
window.GBFuzzy = (function () {
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
  // slovo -> kľúč na porovnávanie (bez apostrofov a spojovníkov: don't = dont)
  const kluc = (w) => w.replace(/['-]/g, "");
  const KONCOVKY = ["ovych", "ami", "och", "ych", "ymi", "eho", "emu", "ove", "ovy", "ova", "om", "ou", "ov", "ej", "ym", "ia", "ie", "iu", "y", "a", "e", "i", "o", "u"];
  function koren(w) {
    if (w.length < 5) return w;
    for (const k of KONCOVKY) if (w.endsWith(k) && w.length - k.length >= 4) return w.slice(0, -k.length);
    return w;
  }
  const slova = (t) => norm(t).split(/[^a-z0-9'-]+/).map(kluc).filter(Boolean);

  // Damerau–Levenshtein (vzdialenosť úprav vrátane prehodenia susedných písmen)
  function vzdialenost(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; } for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      let naj = Infinity;
      for (let j = 1; j <= b.length; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        naj = Math.min(naj, d[i][j]);
      }
      if (naj > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  // ako veľmi sa slovo žiaka (q) podobá na slovo z materiálov (t): 0–1
  const pamat = new Map();
  function podobnost(q, t) {
    if (q === t) return 1;
    const kk = q + "|" + t; if (pamat.has(kk)) return pamat.get(kk);
    let s = 0;
    if (koren(q) === koren(t) && q.length >= 5 && t.length >= 5 && Math.abs(q.length - t.length) <= 2 && koren(q).length >= 5) s = 0.9;
    else {
      const L = Math.min(q.length, t.length);
      const max = L >= 9 ? 3 : L >= 6 ? 2 : L >= 5 ? 1 : (L === 4 && q.length === t.length) ? 1 : 0;
      if (max) {
        // k/c a podobné zámeny na začiatku sú bežné (kontinuus, kondicional), inak chceme rovnaké prvé písmeno
        const zac = q[0] === t[0] || ("kc".includes(q[0]) && "kc".includes(t[0])) || L >= 7;
        const dv = zac ? Math.min(vzdialenost(q, t, max), vzdialenost(koren(q), koren(t), max)) : 9;
        if (dv <= max) s = dv === 0 ? 0.85 : dv === 1 ? 0.8 : dv === 2 ? 0.68 : 0.55;
      }
      if (!s && q.length >= 5 && t.length > q.length && t.startsWith(q)) s = 0.7; // pasiv -> pasivum
    }
    pamat.set(kk, s); return s;
  }

  return { norm, kluc, koren, slova, podobnost };
})();

function vytvorMotor(DATA) {
  const { norm, koren, slova, podobnost } = window.GBFuzzy;

  // ---------- zoznam "dokumentov": tabule + lekcie ----------
  const docs = [];
  const pridaj = (typ, id, ref, polia) => {
    const frazy = [];
    polia.forEach(([texty, vaha, titul]) => (texty || []).forEach((t) => {
      if (titul) t = String(t || "").split(/\s[–-]\s|[?:(]/)[0];
      const s = slova(t); if (s.length) frazy.push({ s, vaha, text: t, titul: !!titul });
    }));
    docs.push({ typ, id, ref, frazy });
  };
  DATA.boards.forEach((b) => pridaj("tabula", b.id, b, [[b.k, 3], [b.q, 2], [[b.n, b.ln], 2]]));
  DATA.lessons.forEach((l) => pridaj("lekcia", l.id, l, [[[l.t, l.sk], 3, true], [l.k, 2], [[l.p], 0.5]]));
  const tabulaPre = {}; DATA.boards.forEach((b) => { tabulaPre[b.id] = b; (b.aj || []).forEach((x) => { tabulaPre[x] = tabulaPre[x] || b; }); });
  const lekciaPre = {}; DATA.lessons.forEach((l) => { lekciaPre[l.id] = l; });

  // vzácnosť slova: slovo, ktoré je skoro všade (a, kedy, preco), váži málo
  const df = new Map();
  docs.forEach((d) => { const v = new Set(); d.frazy.forEach((f) => f.s.forEach((w) => v.add(w))); v.forEach((w) => df.set(w, (df.get(w) || 0) + 1)); });
  const idf = (w) => Math.log(1 + docs.length / (df.get(w) || 0.5)) / Math.log(1 + docs.length);
  const slovnik = [...df.keys()];
  const VATA = new Set(["preco", "kedy", "ako", "alebo", "nie", "je", "sa", "co", "ked", "ale", "tam", "tu", "mam", "ma", "som", "si", "sme", "po", "anglicky", "poviem", "povedat", "pise", "pisat", "napisat", "pouzit", "pouzivat", "pouziva", "pouzivam", "rozdiel", "medzi", "kam", "dat", "znamena", "viem", "neviem", "nerozumiem", "vysvetli", "prosim", "ten", "ta", "ci", "aj", "uz", "len", "byt", "ze", "toto", "tomu", "veta", "vete", "vetu", "slovo", "treba", "musim", "chcem", "aky", "robi", "tvori", "the", "is", "of", "and", "what", "how", "why", "vo", "pri", "ja", "ty", "mi", "ti"]);

  const SYN = (DATA.syn || []).map((g) => g.map((x) => slova(x)));
  const obsahuje = (q, f) => { for (let i = 0; i + f.length <= q.length; i++) { let ok = true; for (let j = 0; j < f.length; j++) if (podobnost(q[i + j], f[j]) < 0.68) { ok = false; break; } if (ok) return true; } return false; };

  // typické chyby, ktoré žiak napíše priamo ako vetu
  const CHYBY = [
    [/\b(he|she|it)\s+(dont|do not)\b/, "present-simple", "he / she / it + don't"],
    [/\bdid(nt)?\s+(not\s+)?\w+\s+(went|came|saw|ate|took|made|got|had|was|bought|wrote)\b/, "past-simple", "did + minulý tvar"],
    [/\bif\s+(i|you|he|she|it|we|they)\s+will\b/, "first-conditional", "if + will"],
    [/\bmore\s+\w+er\b/, "comparative-adjectives", "more + -er"],
    [/\b(does|doesnt)\s+(he|she|it)\s+\w+[^s\s]s\b/, "present-simple-otazky", "does + sloveso s -s"]
  ];

  function hladaj(text) {
    const q0 = slova(text);
    const veta = q0.join(" ");
    let q = q0.slice();
    // synonymá: ak žiak napíše výraz zo skupiny, hľadáme aj podľa ostatných
    const navyse = [];
    SYN.forEach((g) => { if (g.some((f) => obsahuje(q0, f))) g.forEach((f) => navyse.push(f)); });

    const pochopene = new Map(); // slovo žiaka -> ako som ho pochopil
    const vysl = docs.map((d) => {
      let sk = 0; const zhody = [];
      q.forEach((w) => {
        if (VATA.has(w)) return;
        let naj = 0, najT = null;
        d.frazy.forEach((f) => f.s.forEach((t) => {
          const p = podobnost(w, t); if (!p) return;
          const h = p * f.vaha * idf(t) / Math.sqrt(f.s.length);
          if (h > naj) { naj = h; najT = t; }
        }));
        if (naj) { sk += naj; zhody.push([w, najT]); }
      });
      // celé slovné spojenia (present perfect, how much, trpny rod…) vážia viac než jednotlivé slová
      d.frazy.forEach((f) => {
        if (f.s.length < 2 || f.vaha < 2) return;
        if (obsahuje(q, f.s)) sk += 0.9 * f.vaha * f.s.reduce((a, t) => a + idf(t), 0);
      });
      // žiak napísal presne názov lekcie (present continuous) -> tá lekcia má prednosť pred príbuznými
      const obsah = q.filter((w) => !VATA.has(w));
      if (d.frazy.some((f) => f.titul && obsah.length && obsah.length <= f.s.length + 1 && obsahuje(obsah, f.s))) sk += 5;
      navyse.forEach((f) => { if (d.frazy.some((x) => x.vaha >= 2 && x.s.length === f.length && x.s.every((t, i) => t === f[i]))) sk += 1.2; });
      return { d, sk, zhody };
    });
    CHYBY.forEach(([re, id, popis]) => { if (re.test(veta)) { const v = vysl.find((x) => x.d.typ === "tabula" && x.d.id === id); if (v) { v.sk += 6; v.chyba = popis; } } });

    // tabuľa a lekcia k tej istej téme = jeden výsledok
    const temy = new Map();
    vysl.forEach((v) => {
      if (v.sk <= 0) return;
      const t = temy.get(v.d.id) || { id: v.d.id, sk: 0, casti: [] };
      t.casti.push(v); temy.set(v.d.id, t);
    });
    const zoznam = [...temy.values()].map((t) => {
      const s = t.casti.map((c) => c.sk).sort((a, b) => b - a);
      t.sk = s[0] + 0.3 * (s[1] || 0);
      t.tabula = tabulaPre[t.id] || null; t.lekcia = lekciaPre[t.id] || null;
      if (t.casti.some((c) => c.d.typ === "tabula")) t.sk *= 1.1;
      t.chyba = (t.casti.find((c) => c.chyba) || {}).chyba;
      t.zhody = t.casti.sort((a, b) => b.sk - a.sk)[0].zhody;
      return t;
    }).sort((a, b) => b.sk - a.sk);

    // čo zo slov žiaka vôbec poznáme (pre "ako som to pochopil" a pre rozhodnutie, či je to k téme)
    q.forEach((w) => {
      if (VATA.has(w)) return;
      let naj = 0, najT = null;
      for (const t of slovnik) { const p = podobnost(w, t); if (p > naj) { naj = p; najT = t; if (p === 1) break; } }
      if (najT) pochopene.set(w, { ako: najT, p: naj });
    });
    const zname = [...pochopene.values()].reduce((a, x) => a + x.p * idf(x.ako), 0);
    return { zoznam, pochopene, zname, slova: q };
  }

  const PRAH = 1.8; // pod týmto skóre radšej poviem "neviem", než by som hádal
  function odpovedz(text) {
    const r = hladaj(text);
    const [a, b, c] = r.zoznam;
    const opravy = [...r.pochopene.entries()].filter(([w, x]) => w !== x.ako && x.p < 1).map(([w, x]) => [w, x.ako]);
    const zaklad = { opravy, slova: r.slova, kandidati: r.zoznam.slice(0, 4).map((t) => ({ id: t.id, sk: +t.sk.toFixed(2) })) };
    // koľko z "obsahových" slov otázky sa v téme naozaj našlo
    const obsah = r.slova.filter((w) => !VATA.has(w));
    const pokrytie = a && obsah.length ? new Set(a.zhody.map((z) => z[0])).size / new Set(obsah).size : 0;
    if (!a || a.sk < PRAH || (pokrytie < 0.5 && !a.chyba)) return { ...zaklad, typ: "nic" };
    if (b && b.sk >= a.sk * 0.82 && !a.chyba) {
      const moznosti = [a, b]; if (c && c.sk >= a.sk * 0.82) moznosti.push(c);
      return { ...zaklad, typ: "upresni", moznosti };
    }
    return { ...zaklad, typ: "odpoved", tema: a };
  }
  function tema(id) { return { id, tabula: tabulaPre[id] || null, lekcia: lekciaPre[id] || null }; }
  return { odpovedz, tema, norm, slova };
}
window.vytvorMotor = vytvorMotor;
if (typeof module !== "undefined") module.exports = { vytvorMotor };
