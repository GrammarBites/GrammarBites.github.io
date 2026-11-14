import path from "node:path";
import fs from "node:fs";

const temy = JSON.parse(fs.readFileSync("src/_data/zoznamTem.json", "utf8"));
const ucebnice = JSON.parse(fs.readFileSync("src/_data/zoznamUcebnic.json", "utf8"));

const roztriedData = JSON.parse(fs.readFileSync("src/_data/roztriedData.json", "utf8"));
const slovickaData = JSON.parse(fs.readFileSync("src/_data/slovickaData.json", "utf8"));

// ---------- Pred písomkou ----------
// Otázky jednej lekcie v jednotnom tvare { o: otázka, m: možnosti, s: správna, v: vysvetlenie (HTML) }.
// q = mini test lekcie, x = vety z trenažérov Roztrieď a Doplň slovo (ak ich lekcia má).
const escHtml = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function otazkyLekcie(l) {
  const d = l.data;
  const q = (d.test || []).map((t) => ({ o: t.otazka, m: t.moznosti, s: t.spravna, v: escHtml(t.vysvetlenie), ...(t.nemiesaj ? { n: 1 } : {}) }));
  const x = [];
  const rz = d.roztried && roztriedData[d.roztried];
  if (rz) for (const p of rz.polozky) {
    x.push({ o: escHtml(p.t) + (p.sk ? ` <span class="pp-sk">${escHtml(p.sk)}</span>` : ""), m: rz.kose.map((k) => escHtml(k.nazov)), s: rz.kose.findIndex((k) => k.id === p.k), v: p.v });
  }
  const sl = d.slovicka && slovickaData[d.slovicka];
  if (sl) for (const p of sl.vety || []) {
    x.push({ o: escHtml(p.t) + (p.z ? ` (${escHtml(p.z)})` : ""), m: [p.ok, ...p.zle].map(escHtml), s: 0, v: p.v });
  }
  // vety z bloku „Nájdi a oprav chybu" (len lekcie, ktoré ho majú): správna a chybná veta
  if (d.opravChybu) {
    const uz = ulohyOprav(fs.readFileSync(l.inputPath, "utf8"), l.fileSlug);
    if (uz.length >= 3) for (const u of uz) {
      x.push({ k: u.a, o: "Ktorá veta je správna?", m: [u.s, u.a, ...(u.y ? [u.y] : [])].map(escHtml), s: 0, v: u.v || "" });
    }
  }
  return { q, x: x.filter((o) => o.s >= 0) };
}
const lekcieUnitu = (lekcie, id, unit) =>
  lekcie
    .filter((l) => (l.data.ucebnice || []).some((u) => u.id === id && String(u.unit) === String(unit)))
    .sort((a, b) => (a.data.strana ?? 999) - (b.data.strana ?? 999) || a.date - b.date);
const POCET_PRED_PISOMKOU = 20;

const opravChybuData = JSON.parse(fs.readFileSync("src/_data/opravChybuData.json", "utf8"));

// ---------- Nájdi a oprav chybu ----------
// Úlohy sa berú z tabuľky „Časté chyby" v lekcii (riadok = chybná veta s <s>…</s> a správna s <b>…</b>)
// a z vlastných viet v src/_data/opravChybuData.json. Tvar úlohy: { a: chybná veta, s: správna veta,
// z: správna veta s <b> (zvýraznená oprava), b: opravená časť, v: vysvetlenie (nepovinné) }.
const odTagov = (h) => String(h).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, " ").trim();
const escH = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function ulohaZRiadku(lava, prava) {
  if (!/<s>/.test(lava) || !/<b>/.test(prava)) return null;
  let a = odTagov(lava), n = "";
  // slovenská poznámka v zátvorke na konci chybnej vety, napr. „(je ešte tam)“, sa nezobrazí vo vete, ale ako nápoveda
  const poz = a.match(/\s*\(([^)]*)\)\s*$/);
  if (poz) { n = poz[1]; a = a.slice(0, poz.index).trim(); }
  if (!/[.?!]$/.test(a)) return null; // len celé vety, nie útržky ako „since two years“
  const casti = prava.split(" / "); // dve správne verzie: prvá je hlavná, ostatné sa tiež uznajú
  const prva = odTagov(casti[0]);
  const b = odTagov((casti[0].match(/<b>(.*?)<\/b>/) || [, ""])[1]);
  const volitelne = /\([^)]*\)/.test(prva); // napr. „She has (got) a brother.“ – uznáme s aj bez (got)
  const s = volitelne ? prva.replace(/\s*\([^)]*\)/g, "") : prva;
  const d = casti.slice(1).map(odTagov);
  if (volitelne) d.push(prva.replace(/\(([^)]*)\)/g, "$1"));
  const z = escH(prva).replace(escH(b), `<b>${escH(b)}</b>`);
  return a && s && a !== s ? { a, s, z, b, ...(n ? { n } : {}), ...(d.length ? { d } : {}) } : null;
}
function ulohaZVety(sk) {
  // sk = [chybná veta, správna veta so {zvýraznenou} opravou, vysvetlenie, nápoveda (nepovinná)]
  // v zložených zátvorkách môže byť viac správnych možností oddelených " / " – prvá sa ukáže, ostatné sa tiež uznajú
  const [a, so, v, n, y] = sk;
  const vnutro = (so.match(/\{(.*?)\}/) || [, ""])[1];
  const mozn = vnutro.split(" / ");
  const sablona = (x) => so.replace(/\{(.*?)\}/, () => x);
  const s = sablona(mozn[0]).replace(/[{}]/g, "");
  const d = mozn.slice(1).map((x) => sablona(x));
  const b = mozn[0];
  const z = escH(so.replace(/\{(.*?)\}/, () => `{${mozn.join(" / ")}}`)).replace(/\{(.*?)\}/, "<b>$1</b>");
  return { a, s, z, b, ...(n ? { n } : {}), ...(v ? { v } : {}), ...(d.length ? { d } : {}), ...(y ? { y } : {}) };
}

// Úlohy „Nájdi a oprav chybu" z tabuľky „Časté chyby" v obsahu lekcie + vlastné vety lekcie
function ulohyOprav(obsah, slug) {
  const uloha = [];
  const tab = String(obsah || "").match(/<table class="chyby">[\s\S]*?<\/table>/);
  if (tab) for (const r of tab[0].matchAll(/<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) {
    const u = ulohaZRiadku(r[1], r[2]);
    if (u) uloha.push(u);
  }
  for (const v of (opravChybuData[slug] || {}).vety || []) uloha.push(ulohaZVety(v));
  return uloha;
}

// PREVIEW=1 → odkazy na priečinky dostanú "index.html" (náhľad mimo servera)
const PREVIEW = process.env.PREVIEW === "1";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/lekcie/**/*.{mp4,webm,png,jpg,jpeg,webp,pdf}");
  eleventyConfig.addPassthroughCopy("src/pravidla/**/*.{mp4,webm,png,jpg,jpeg,webp,pdf}");
  eleventyConfig.addPassthroughCopy("src/ako-na-to/*.{mp4,jpg,pdf}");
  eleventyConfig.addPassthroughCopy("src/tabula/zvuk/**/*.mp3");
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  // ---------- Kolekcie ----------
  eleventyConfig.addCollection("lekcie", (api) =>
    api
      .getFilteredByGlob("src/lekcie/*/index.md")
      .filter((l) => !l.data.koncept)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("pravidla", (api) =>
    api.getFilteredByGlob("src/pravidla/*/index.md").sort((a, b) => a.data.cislo - b.data.cislo)
  );
  eleventyConfig.addCollection("temySObsahom", (api) => {
    const lekcie = api.getFilteredByGlob("src/lekcie/*/index.md").filter((l) => !l.data.koncept);
    return temy.filter((t) => lekcie.some((l) => (l.data.temy || []).includes(t.id)));
  });

  // ---------- Filtre ----------
  // Tabuľa pre lekciu: vlastná (src/_data/tabule/<lekcia>.json) alebo cudzia, ktorá ju uvádza v "aj"
  eleventyConfig.addFilter("tabulaPre", (tabule, slug) => {
    if (!tabule) return "";
    if (tabule[slug]) return slug;
    return Object.keys(tabule).find((id) => (tabule[id].aj || []).includes(slug)) || "";
  });
  eleventyConfig.addFilter("preRocnik", (lekcie, cislo) =>
    lekcie.filter((l) => (l.data.rocniky || []).includes(Number(cislo)))
  );
  eleventyConfig.addFilter("preUcebnicu", (lekcie, id, unit) =>
    lekcie.filter((l) =>
      (l.data.ucebnice || []).some((u) => u.id === id && (unit === undefined || String(u.unit) === String(unit)))
    )
  );
  eleventyConfig.addFilter("preTemu", (lekcie, id) =>
    lekcie.filter((l) => (l.data.temy || []).includes(id))
  );
  // poradie v rámci unitu: podľa strany v učebnici (strana), inak podľa dátumu
  eleventyConfig.addFilter("podlaStrany", (lekcie) =>
    [...lekcie].sort((a, b) => (a.data.strana ?? 999) - (b.data.strana ?? 999) || a.date - b.date)
  );
  // stránka ročníka: lekcie v poradí, v akom sa preberajú (učebnica → unit → strana);
  // lekcia sa ukáže len raz, pri prvom unite ročníka, ku ktorému patrí
  eleventyConfig.addFilter("podlaUnitov", (lekcie, rocnik) => {
    const poradie = (a, b) => (a.data.strana ?? 999) - (b.data.strana ?? 999) || a.date - b.date;
    const pouzite = new Set();
    const skupiny = [];
    for (const z of rocnik.rozsah || []) {
      const kniha = ucebnice.find((k) => k.id === z.id);
      if (!kniha) continue;
      const units = z.units || (kniha.units || []).map((u) => String(u.id));
      for (const uid of units) {
        const vUnite = lekcie
          .filter((l) => !pouzite.has(l.url) &&
            (l.data.ucebnice || []).some((u) => u.id === z.id && String(u.unit) === String(uid)))
          .sort(poradie);
        if (!vUnite.length) continue;
        vUnite.forEach((l) => pouzite.add(l.url));
        const unit = (kniha.units || []).find((x) => String(x.id) === String(uid));
        skupiny.push({
          id: `${z.id}-${uid}`,
          kniha: z.id,
          unit: String(uid),
          nadpis: `${kniha.nazov} · ${uid === "intro" ? "Introduction" : `Unit ${uid}`}`,
          tema: unit && uid !== "intro" ? unit.nazov : "",
          odkaz: `/ucebnice/${z.id}/#unit-${uid}`,
          lekcie: vUnite,
        });
      }
    }
    const zvysok = lekcie.filter((l) => !pouzite.has(l.url)).sort((a, b) => a.date - b.date);
    if (zvysok.length) {
      skupiny.push({ id: "dalsie", nadpis: skupiny.length ? "Hodí sa po celý rok" : "", tema: "", odkaz: "", lekcie: zvysok });
    }
    return skupiny;
  });
  // Pred písomkou: koľko otázok dostane žiak z daného unitu (najviac 20; 0 = tlačidlo sa neukáže)
  eleventyConfig.addFilter("pocetPredPisomkou", (lekcie, id, unit) => {
    const spolu = lekcieUnitu(lekcie, id, unit).reduce((n, l) => { const o = otazkyLekcie(l); return n + o.q.length + o.x.length; }, 0);
    return Math.min(POCET_PRED_PISOMKOU, spolu);
  });
  // Pred písomkou: všetky otázky pre stránku /pred-pisomkou/ (unity → lekcie → otázky)
  eleventyConfig.addFilter("predPisomkou", (lekcie) => {
    const vsetky = {};
    const knihy = [];
    for (const k of ucebnice) {
      const units = [];
      for (const u of k.units || []) {
        const sOtazkami = lekcieUnitu(lekcie, k.id, u.id).filter((l) => { const o = otazkyLekcie(l); return o.q.length + o.x.length; });
        if (!sOtazkami.length) continue;
        for (const l of sOtazkami) {
          vsetky[l.fileSlug] ??= { t: l.data.title, sk: l.data.nazovSk || "", url: l.url.replace(/^\//, ""), ...otazkyLekcie(l) };
        }
        const spolu = sOtazkami.reduce((n, l) => n + vsetky[l.fileSlug].q.length + vsetky[l.fileSlug].x.length, 0);
        units.push({ id: String(u.id), nazov: u.nazov, lekcie: sOtazkami.map((l) => l.fileSlug), pocet: Math.min(POCET_PRED_PISOMKOU, spolu) });
      }
      if (units.length) knihy.push({ id: k.id, nazov: k.nazov, farba: k.farba, units });
    }
    return { pocet: POCET_PRED_PISOMKOU, knihy, lekcie: vsetky };
  });
  // Nájdi a oprav chybu: úlohy z tabuľky „Časté chyby" v obsahu lekcie + vlastné vety lekcie
  eleventyConfig.addFilter("opravChybu", (obsah, slug) => ulohyOprav(obsah, slug));
  eleventyConfig.addFilter("bezStranky", (lekcie, url) => lekcie.filter((l) => l.url !== url));
  eleventyConfig.addFilter("head", (arr, n) => (n < 0 ? arr.slice(n) : arr.slice(0, n)));
  eleventyConfig.addFilter("tema",(id) => temy.find((t) => t.id === id) || { id, nazov: id, en: id });
  eleventyConfig.addFilter("ucebnica", (id) => ucebnice.find((u) => u.id === id) || { id, nazov: id, units: [] });
  eleventyConfig.addFilter("unitNazov", (u) => {
    const kniha = ucebnice.find((k) => k.id === u.id);
    if (!kniha) return u.id;
    if (!u.unit) return kniha.nazov;
    const unit = kniha.units.find((x) => String(x.id) === String(u.unit));
    const cislo = u.unit === "intro" ? "Introduction" : `Unit ${u.unit}`;
    return `${kniha.nazov} · ${cislo}`;
  });
  eleventyConfig.addFilter("datum", (d) =>
    new Date(d).toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" })
  );
  // "Project 2 · Unit 5–6" – rozsah učebnice v danom ročníku
  eleventyConfig.addFilter("rozsahText", (z) => {
    const kniha = ucebnice.find((k) => k.id === z.id);
    const nazov = kniha ? kniha.nazov : z.id;
    if (!z.units || !z.units.length) return nazov;
    const cisla = z.units.filter((u) => u !== "intro");
    const intro = z.units.includes("intro") ? "Introduction, " : "";
    const rozsah = cisla.length > 1 ? `${cisla[0]}–${cisla[cisla.length - 1]}` : cisla[0];
    return `${nazov} · ${intro}Unit ${rozsah}`;
  });
  // nepravidelné slovesá z danej učebnice (tréner), bez prázdnych rodín
  eleventyConfig.addFilter("slovesaPreKnihu", (rodiny, kniha) =>
    (rodiny || [])
      .map((r) => ({ id: r.id, nazov: r.nazov, vzor: r.vzor, slovesa: r.slovesa.filter((s) => !kniha || (s[4] || []).includes(kniha)).map((s) => s.slice(0, 4)) }))
      .filter((r) => r.slovesa.length)
  );
  // rodiny podľa 3. tvaru: [základný, 2. tvar, význam, iné 2., 3. tvar, iné 3.]
  eleventyConfig.addFilter("slovesaPPPreKnihu", (data, kniha) => {
    const zakl = {};
    (data.rodiny || []).forEach((r) => r.slovesa.forEach((s) => (zakl[s[0]] = s)));
    return (data.rodinyPP || [])
      .map((r) => ({ id: r.id, nazov: r.nazov, vzor: r.vzor, slovesa: r.slovesa
        .filter((s) => !kniha || (s[3] || []).includes(kniha))
        .map((s) => { const z = zakl[s[0]] || [s[0], "", "", []]; return [s[0], z[1], z[2], z[3] || [], s[1], s[2] || []]; }) }))
      .filter((r) => r.slovesa.length);
  });
  eleventyConfig.addFilter("isoDatum", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("rocnikyText", (r = []) =>
    r.length ? r.map((x) => `${x}.`).join(", ") + " ročník" : ""
  );
  eleventyConfig.addFilter("bezLomky", (u) => String(u).replace(/^\//, ""));

  // Údaje pre vyhľadávanie a Grammar Bite dňa
  eleventyConfig.addFilter("indexLekcii", (lekcie) =>
    lekcie.map((l) => ({
      url: l.url.replace(/^\//, ""),
      title: l.data.title,
      sk: l.data.nazovSk || "",
      popis: l.data.popis || "",
      temy: (l.data.temy || []).map((id) => {
        const t = temy.find((x) => x.id === id);
        return t ? { id, sk: t.nazov, en: t.en } : { id, sk: id, en: id };
      }),
      rocniky: l.data.rocniky || [],
      ucebnice: (l.data.ucebnice || []).map((u) => ({
        id: u.id,
        unit: u.unit ? String(u.unit) : "",
        nazov: (ucebnice.find((k) => k.id === u.id) || {}).nazov || u.id,
      })),
      slova: l.data.klucoveSlova || [],
      bite: l.data.bite || null,
      datum: new Date(l.date).toISOString().slice(0, 10),
    }))
  );

  // ---------- Relatívne odkazy ----------
  // Všetky odkazy "/..." sa prepíšu na relatívne, takže web funguje
  // na GitHub Pages pod akýmkoľvek názvom repozitára aj v náhľade.
  eleventyConfig.addTransform("relativne-odkazy", function (content) {
    const out = this.page.outputPath;
    if (!out || !out.endsWith(".html")) return content;
    const outDir = eleventyConfig.directories?.output || "_site";
    const rel = path.relative(path.dirname(out), outDir) || ".";
    const root = rel === "." ? "./" : rel.split(path.sep).join("/") + "/";
    return content
      .replace(/(\s(?:href|src|action|poster|data-href)=")\/(?!\/)([^"]*)"/g, (m, attr, p) => {
        let target = p;
        if (PREVIEW) {
          const [, cesta, zvysok] = target.match(/^([^?#]*)(.*)$/);
          if (cesta === "" || cesta.endsWith("/")) target = cesta + "index.html" + zvysok;
        }
        return `${attr}${root}${target}"`;
      })
      .replace(/data-root="[^"]*"/, `data-root="${root}" data-preview="${PREVIEW ? 1 : 0}"`);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
