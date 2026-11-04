import path from "node:path";
import fs from "node:fs";

const temy = JSON.parse(fs.readFileSync("src/_data/zoznamTem.json", "utf8"));
const ucebnice = JSON.parse(fs.readFileSync("src/_data/zoznamUcebnic.json", "utf8"));

// PREVIEW=1 → odkazy na priečinky dostanú "index.html" (náhľad mimo servera)
const PREVIEW = process.env.PREVIEW === "1";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/lekcie/**/*.{mp4,webm,png,jpg,jpeg,webp,pdf}");
  eleventyConfig.addPassthroughCopy("src/pravidla/**/*.{mp4,webm,png,jpg,jpeg,webp,pdf}");
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
