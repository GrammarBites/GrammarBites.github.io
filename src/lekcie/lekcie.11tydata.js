import fs from "node:fs";

// Ročník sa určí automaticky podľa učebnice a unitu (src/_data/zoznamRocnikov.json → rozsah).
// Pole "rocniky" v lekcii sa pridá, ak je lekcia aj v učebnici mimo rozpisu (napr. vlastne – Vlastné materiály),
// alebo ak nemá žiadnu učebnicu z rozpisu.
const zoznamRocnikov = JSON.parse(fs.readFileSync("src/_data/zoznamRocnikov.json", "utf8"));

export function rocnikyPreUcebnice(ucebnice = []) {
  const out = new Set();
  for (const u of ucebnice) {
    for (const r of zoznamRocnikov) {
      for (const z of r.rozsah || []) {
        if (z.id !== u.id) continue;
        if (!z.units || !u.unit || z.units.includes(String(u.unit))) out.add(r.cislo);
      }
    }
  }
  return [...out].sort((a, b) => a - b);
}

export default {
  layout: "layouts/lekcia.njk",
  permalink: "/lekcie/{{ page.fileSlug }}/",
  eleventyComputed: {
    rocniky: (data) => {
      const auto = rocnikyPreUcebnice(data.ucebnice);
      const mimoRozpisu = (data.ucebnice || []).some(
        (u) => !zoznamRocnikov.some((r) => (r.rozsah || []).some((z) => z.id === u.id))
      );
      if (!auto.length || mimoRozpisu) return [...new Set([...auto, ...(data.rocniky || [])])].sort((a, b) => a - b);
      return auto;
    },
  },
};
