// Vyhľadávanie v lekciách a v obsahu učebníc (SK aj EN, bez ohľadu na diakritiku)
(function () {
  const N = GB.normalizuj;
  const lekcie = GB.data("data-lekcie") || [];
  const ucebnice = GB.data("data-ucebnice") || [];
  const rocniky = GB.data("data-rocniky") || [];
  const skupiny = (GB.data("data-slovnik") || []).map((g) => g.map(N));

  const form = document.querySelector("[data-hladanie]");
  const pole = document.getElementById("q");
  const fR = document.getElementById("f-rocnik");
  const fU = document.getElementById("f-ucebnica");
  const fT = document.getElementById("f-tema");
  const outL = document.querySelector("[data-vysledky]");
  const outU = document.querySelector("[data-unity]");
  const sekU = document.querySelector("[data-unity-sekcia]");
  const suhrn = document.querySelector("[data-suhrn]");
  const nic = document.querySelector("[data-nic]");

  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const zhoda = (text, term) => term && new RegExp("(^|[^a-z0-9])" + reEsc(term)).test(text);

  // Rozšírenie dopytu o synonymá zo slovníka
  function rozsir(q) {
    const terms = new Set([q]);
    skupiny.forEach((g) => {
      if (g.some((t) => zhoda(q, t) || (q.length >= 4 && t.startsWith(q)))) g.forEach((t) => terms.add(t));
    });
    return [...terms].filter(Boolean);
  }

  // "Project 5 Unit 2", "P4 U6", "8. ročník", "Family and Friends"
  function vytiahniFiltre(q) {
    const f = {};
    q = q.replace(/\b(?:project|p)\s*([2-5])\b(?:\s*(?:unit|u)\s*(\d|intro))?/, (m, k, u) => {
      f.kniha = "project-" + k; if (u) f.unit = u; return " ";
    });
    q = q.replace(/\bfamily\s*(?:and|&)?\s*friends\s*2?\b|\bf&f\s*2?\b/, () => { f.kniha = "family-and-friends-2"; return " "; });
    q = q.replace(/\b(?:unit|u)\s*(\d|intro)\b/, (m, u) => { f.unit = u; return " "; });
    q = q.replace(/\b([4-9])\s*\.?\s*(?:rocnik|roc\.?|trieda|grade)\b/, (m, r) => { f.rocnik = Number(r); return " "; });
    return { f, zvysok: q.replace(/\s+/g, " ").trim() };
  }

  function textLekcie(l) {
    return {
      5: N(l.title), 4: N(l.sk),
      3: N(l.temy.map((t) => t.sk + " " + t.en).join(" | ")),
      2: N(l.slova.join(" | ") + " | " + l.ucebnice.map((u) => u.nazov + (u.unit ? " unit " + u.unit : "")).join(" | ")),
      1: N(l.popis + " | " + l.rocniky.map((r) => r + ". rocnik").join(" ")),
    };
  }
  const indexL = lekcie.map((l) => ({ l, t: textLekcie(l) }));

  function hodnot(t, terms, tokens) {
    let s = 0;
    for (const term of terms) for (const w of [5, 4, 3, 2, 1]) if (zhoda(t[w], term)) s += w * (term === terms[0] ? 2 : 1);
    if (!s && tokens.length > 1) {
      const vsetko = Object.values(t).join(" | ");
      if (tokens.every((tok) => zhoda(vsetko, tok))) s = tokens.length;
    }
    return s;
  }

  function hladaj() {
    const surove = N(pole.value);
    const { f, zvysok } = vytiahniFiltre(surove);
    const rocnik = fR.value ? Number(fR.value) : f.rocnik;
    const kniha = fU.value || f.kniha;
    const tema = fT.value;
    const terms = zvysok ? rozsir(zvysok) : [];
    const tokens = zvysok ? zvysok.split(" ").filter((x) => x.length > 1) : [];

    // Lekcie
    let vysl = indexL
      .filter(({ l }) => !rocnik || l.rocniky.includes(rocnik))
      .filter(({ l }) => !kniha || l.ucebnice.some((u) => u.id === kniha && (!f.unit || u.unit === f.unit)))
      .filter(({ l }) => !tema || l.temy.some((t) => t.id === tema))
      .map(({ l, t }) => ({ l, s: terms.length ? hodnot(t, terms, tokens) : 1 }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.l.datum.localeCompare(a.l.datum));

    outL.innerHTML = vysl.map(({ l }) => kartaHTML(l)).join("");

    // Unity v učebniciach (iba ak sa niečo hľadá)
    let unity = [];
    if (terms.length || f.kniha || f.unit) {
      const knihyRocnika = rocnik ? (rocniky.find((r) => r.cislo === rocnik) || {}).ucebnice || [] : null;
      ucebnice.forEach((k) => {
        if (kniha && k.id !== kniha) return;
        if (knihyRocnika && !knihyRocnika.includes(k.id)) return;
        k.units.forEach((u) => {
          if (f.unit && String(u.id) !== f.unit) return;
          const zasahy = terms.length ? u.gramatika.filter((g) => terms.some((term) => zhoda(N(g), term))) : u.gramatika;
          if (terms.length && !zasahy.length) return;
          unity.push({ k, u, zasahy });
        });
      });
    }
    sekU.hidden = !unity.length;
    outU.innerHTML = unity.map(unitHTML).join("");

    const hladaSa = surove || rocnik || kniha || tema;
    nic.hidden = !!(vysl.length || unity.length);
    suhrn.textContent = !hladaSa
      ? `Všetky lekcie (${vysl.length}). Začni písať a výsledky sa hneď ukážu.`
      : `${vysl.length === 1 ? "1 lekcia" : vysl.length >= 2 && vysl.length <= 4 ? vysl.length + " lekcie" : vysl.length + " lekcií"}` +
        (unity.length ? ` · ${unity.length} ${unity.length === 1 ? "unit" : unity.length <= 4 ? "unity" : "unitov"} v učebniciach` : "");
  }

  function kartaHTML(l) {
    const e = GB.esc;
    const stitky = l.rocniky.map((r) => `<li class="stitok stitok--rocnik">${r}. roč.</li>`).join("") +
      l.ucebnice.map((u) => `<li class="stitok">${e(u.nazov)}${u.unit ? (u.unit === "intro" ? " · Intro" : " · Unit " + e(u.unit)) : ""}</li>`).join("");
    return `<article class="vysledok">
      <p class="karta__tema">${l.temy.map((t) => e(t.sk)).join(" · ")}</p>
      <h3 class="karta__nadpis"><a href="${GB.odkaz(l.url)}">${e(l.title)}</a></h3>
      ${l.sk ? `<p class="karta__sk">${e(l.sk)}</p>` : ""}
      <p class="karta__popis">${e(l.popis)}</p>
      <ul class="stitky">${stitky}</ul>
    </article>`;
  }

  function unitHTML({ k, u, zasahy }) {
    const e = GB.esc;
    const kotva = GB.odkaz("ucebnice/" + k.id + "/") + "#unit-" + u.id;
    const lekcieUnitu = lekcie.filter((l) => l.ucebnice.some((x) => x.id === k.id && x.unit === String(u.id)));
    return `<li class="vysledok-unit">
      <a href="${kotva}"><strong>${e(k.nazov)} · ${u.id === "intro" ? "Introduction" : "Unit " + e(u.id)}</strong> ${e(u.nazov)}</a>
      <span class="vysledok-unit__gram" lang="en">${zasahy.map(e).join(" · ")}</span>
      ${lekcieUnitu.length ? `<span class="vysledok-unit__lekcie">Lekcia: ${lekcieUnitu.map((l) => `<a href="${GB.odkaz(l.url)}">${e(l.title)}</a>`).join(", ")}</span>` : `<span class="vysledok-unit__nic">lekciu pripravujeme</span>`}
    </li>`;
  }

  let casovac;
  pole.addEventListener("input", () => { clearTimeout(casovac); casovac = setTimeout(hladaj, 120); });
  [fR, fU, fT].forEach((s) => s.addEventListener("change", hladaj));
  form.addEventListener("submit", (e) => { e.preventDefault(); hladaj(); });
  document.querySelectorAll("[data-priklad]").forEach((b) =>
    b.addEventListener("click", () => { pole.value = b.textContent; hladaj(); pole.focus(); })
  );

  try {
    const q = new URLSearchParams(location.search).get("q");
    if (q) pole.value = q;
  } catch (e) {}
  hladaj();
})();
