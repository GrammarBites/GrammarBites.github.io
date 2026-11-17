// Magická tabuľa – chat bez AI. Žiak napíše otázku, chat nájde tabuľu alebo lekciu (motor je v chat-motor.js).
// Spúšťa ho tabula.js: GBTabulaChat({ app, recepty, otvor }).
// Ladenie: pridaj do adresy ?ladenie a pod odpoveďami uvidíš „Ako som to pochopil“.
window.GBTabulaChat = function ({ app, recepty, otvor }) {
  const esc = GB.esc;
  const tichy = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ladenie = /[?&]ladenie\b/.test(location.search);
  const IMG_UCITEL = GB.odkaz("assets/img/postavy/ucitel-hlava.png");
  const IMG_KOZA = GB.odkaz("assets/img/postavy/koza-nechape.png");

  // ---------- dáta: tabule z receptov + lekcie ----------
  const pis = (t) => esc(t).replace(/\{([^#|}]+)(?:#[\w-]+)?(?:\|([\w,]+))?\}/g, (m, w, z) => {
    const f = (z || "").split(",")[0];
    return ["zlta", "ruzova", "modra"].includes(f) ? `<b class="tb-${f}">${w}</b>` : w;
  });
  const boards = Object.entries(recepty).map(([id, r]) => {
    const posledny = r.kroky[r.kroky.length - 1] || {};
    const z = []; let zap = false;
    (posledny.kresli || []).forEach((o) => {
      if (o.op !== "pis") return;
      if (o.styl === "nadpis2") { zap = true; return; }
      if (zap) z.push(pis(o.text));
    });
    return { id, n: r.nazov, ln: r.lekciaNazov || id, q: r.otazky || [r.nazov], k: r.kluce || [], aj: r.aj || [],
      z, p: (posledny.popis || "").replace(/^Hotovo!\s*/, "").replace(/\s*Teraz si to vyskúšaj( sám)?\.$/, ""),
      o: posledny.odkazy || [], kroky: r.kroky.length };
  });
  const lessons = GB.data("data-lekcie-chat") || [];
  const M = vytvorMotor({ boards, lessons, syn: GB.data("data-slovnik") || [] });

  // ---------- prvky ----------
  const log = app.querySelector("[data-chat]");
  const form = app.querySelector("[data-otazka-form]");
  const pole = app.querySelector("[data-otazka-pole]");
  let posledna = null;

  const url = (u) => GB.odkaz(String(u).replace(/^\//, ""));
  const tl = (text, akcia, tiche) => `<button type="button" class="tlacidlo tlacidlo--male${tiche ? " tlacidlo--tiche" : ""}" data-akcia="${esc(akcia)}">${esc(text)}</button>`;
  const odkaz = (text, u) => `<a class="tlacidlo tlacidlo--male tlacidlo--tiche" href="${esc(url(u))}">${esc(text)}</a>`;

  function dole(el) {
    log.hidden = false;
    // nová správa nech je vidno a pod ňou aj pole na ďalšiu otázku
    const r = (el || log.lastElementChild).getBoundingClientRect(), f = form.getBoundingClientRect();
    const dolu = Math.min(r.top - 90, f.bottom + 16 - innerHeight);
    if (dolu > 0) scrollBy({ top: dolu, behavior: tichy ? "auto" : "smooth" });
  }
  function pridaj(kto, html) {
    const el = document.createElement("div");
    el.className = "tc-sprava tc-sprava--" + kto;
    el.innerHTML = (kto === "bot" ? `<img class="tc-kto" src="${IMG_UCITEL}" alt="" width="38" height="38">` : "") + `<div class="tc-bublina">${html}</div>`;
    log.appendChild(el); dole(el); return el;
  }
  function bot(html) {
    if (tichy) return pridaj("bot", html);
    const el = pridaj("bot", '<span class="tc-pise" aria-label="Píšem"><i></i><i></i><i></i></span>');
    setTimeout(() => { el.querySelector(".tc-bublina").innerHTML = html; dole(el); }, 450);
  }
  const nazovTemy = (t) => t.tabula && t.tabula.id === t.id ? t.tabula.q[0]
    : t.lekcia ? t.lekcia.t + (t.lekcia.sk ? " – " + t.lekcia.sk.split(/\s[–-]\s/)[0] : "") : t.tabula.n;

  function akoSomPochopil(r) {
    if (!ladenie || !r) return "";
    const riadky = (r.kandidati || []).map((k) => `<tr><td>${esc(k.id)}</td><td>${k.sk}</td></tr>`).join("");
    return `<details class="tc-ako"><summary>Ako som to pochopil</summary>
      <div>Slová z otázky: ${esc(r.slova.join(" · ")) || "–"}</div>
      ${r.opravy.length ? `<div>Opravené preklepy: ${r.opravy.map(([a, b]) => esc(a) + " → " + esc(b)).join(", ")}</div>` : ""}
      ${riadky ? `<table><tr><td><b>téma</b></td><td><b>zhoda</b></td></tr>${riadky}</table>` : "<div>Žiadna téma sa nepodobá.</div>"}</details>`;
  }

  function odpovedTema(t, r, chyba) {
    posledna = t; const b = t.tabula, l = t.lekcia; let h = "";
    const opr = r ? r.opravy.filter(([a]) => (t.zhody || []).some((z) => z[0] === a)) : [];
    if (opr.length) h += `<p class="tc-pochopil">Rozumiem to ako: ${opr.slice(0, 4).map(([a, x]) => `${esc(a)} → <b>${esc(x)}</b>`).join(", ")}</p>`;
    if (chyba) h += `<p>V tej vete je častá chyba (<b>${esc(chyba)}</b>). Pozri:</p>`;
    if (b) {
      h += `<div class="tc-doska"><p class="tc-doska__nadpis">${esc(b.n)}</p>${b.z.map((x) => `<div>${x}</div>`).join("")}</div><p>${b.p}</p>`;
      h += `<div class="tc-akcie">` + tl(`Vysvetli mi to na tabuli (${b.kroky} krokov)`, "tabula:" + b.id).replace("tlacidlo--male", "");
      if (l && l.pr) h += tl("Ukáž príklad", "priklad", true);
      h += b.o.slice(0, 2).map((o) => odkaz(o.text, o.url)).join("") + `</div>`;
    } else {
      h += `<p><b>${esc(l.t)}</b>${l.sk ? " – " + esc(l.sk) : ""}</p><p>${esc(l.tip || l.p)}</p>`;
      if (l.pr) h += `<p class="tc-priklad" lang="en">${esc(l.pr)}</p>`;
      h += `<p>Tabuľu na toto ešte nemám, ale v lekcii nájdeš ${l.video ? "video, " : ""}výklad a tréner.</p><div class="tc-akcie">${odkaz("Otvoriť lekciu", "lekcie/" + l.id + "/")}</div>`;
    }
    bot(h + akoSomPochopil(r));
  }
  function nahodneOtazky(n) {
    const v = boards.slice().sort(() => Math.random() - 0.5).slice(0, n);
    return `<div class="tc-akcie">${v.map((b) => tl(b.q[0], "otazka:" + b.q[0], true)).join("")}</div>`;
  }
  function neviem(r) {
    GB.udalost("tabula/otazka-bez-odpovede", "Tabuľa: otázka bez odpovede");
    bot(`<img class="tc-koza" src="${IMG_KOZA}" alt="" width="74" height="96"><p><b>Na toto vysvetlenie nemám.</b> Pomáham len s anglickou gramatikou z Grammar Bites.</p><p>Skús to napísať inak, alebo si vyber:</p>`
      + nahodneOtazky(3) + `<p>Niečo ti tu chýba? <a href="${esc(GB.odkaz("kontakt/"))}">Napíš mi</a> a ja to doplním.</p>` + akoSomPochopil(r));
  }

  function reaguj(text) {
    const n = M.norm(text).replace(/[?!.,]+/g, " ").replace(/\s+/g, " ").trim(); const pocet = n.split(" ").length;
    if (/^(ahoj|ahojte|cau|caf|cus|nazdar|zdravim|dobry den|dobry|hello|hi|hey|serus)\b/.test(n) && pocet <= 3)
      return bot(`<p>Ahoj! Napíš, čomu z angličtiny nerozumieš. Pokojne aj bez dĺžňov a s preklepmi.</p>`);
    if (/\b(dakujem|dakujeme|dik|diky|dikes|vdaka|thanks|thank you)\b/.test(n) && pocet <= 5)
      return bot(`<p>Rado sa stalo! Keď budeš chcieť, opýtaj sa na ďalšiu vec.</p>`);
    if (/\b(kto si|co si|si robot|si ai|si clovek|si ucitel|si zivy|umela inteligencia|chatgpt)\b/.test(n))
      return bot(`<p>Som pomocník Magickej tabule. Nie som človek ani umelá inteligencia. Podľa tvojej otázky hľadám vo vysvetleniach, ktoré som pre teba pripravil na Grammar Bites. Preto viem odpovedať len na to, čo tu je.</p>`);
    if (/^(pomoc|help|co vies|co dokazes|s cim mi pomozes|co sa mozem opytat)\b/.test(n))
      return bot(`<p>Viem vysvetliť gramatiku z Grammar Bites. Napríklad:</p>` + nahodneOtazky(4));
    if (posledna && pocet <= 4) {
      if (/\b(priklad|priklady|example|ukaz)\b/.test(n)) return akcia("priklad");
      if (/\b(nerozumiem|nechapem|nechapu|este raz|pomalsie|stale nie)\b/.test(n)) {
        const b = posledna.tabula;
        return bot(b ? `<p>Nevadí. Na tabuli ti to ukážem pomaly, krok po kroku, a po každom kroku sa ťa niečo opýtam.</p><div class="tc-akcie">${tl(`Otvoriť tabuľu (${b.kroky} krokov)`, "tabula:" + b.id)}</div>`
          : `<p>Nevadí. Pozri si v lekcii video a výklad, tam je to pomalšie.</p><div class="tc-akcie">${odkaz("Otvoriť lekciu", "lekcie/" + posledna.id + "/")}</div>`);
      }
      if (/\b(precvic|precvicit|trener|trening|cvicenie|test|skusit)\b/.test(n))
        return bot(`<p>Výborne, precvičovanie je najlepšia cesta.</p><div class="tc-akcie">${odkaz("Tréner a mini test v lekcii", "lekcie/" + posledna.id + "/")}</div>`);
    }
    const r = M.odpovedz(text);
    if (r.typ === "odpoved") return odpovedTema(r.tema, r, r.tema.chyba);
    if (r.typ === "upresni")
      return bot(`<p>Chcem ti dobre poradiť. Čo z toho myslíš?</p><div class="tc-akcie">${r.moznosti.map((t) => tl(nazovTemy(t), "tema:" + t.id, true)).join("")}${tl("Nič z toho", "nic", true)}</div>` + akoSomPochopil(r));
    neviem(r);
  }

  function akcia(a) {
    if (a.startsWith("tabula:")) return otvor(a.slice(7), true);
    if (a.startsWith("tema:")) return odpovedTema(M.tema(a.slice(5)), null);
    if (a.startsWith("otazka:")) { pridaj("ja", esc(a.slice(7))); return reaguj(a.slice(7)); }
    if (a === "priklad" && posledna) {
      const l = posledna.lekcia;
      return bot(l && l.pr ? `<p>Príklad:</p><p class="tc-priklad" lang="en">${esc(l.pr)}</p>${l.tip ? `<p>${esc(l.tip)}</p>` : ""}` : `<p>Príklady nájdeš priamo na tabuli alebo v lekcii.</p>`);
    }
    if (a === "nic") return bot(`<p>Dobre. Skús to napísať inými slovami, alebo napíš priamo vetu, pri ktorej si nie si istý.</p>`);
  }

  log.addEventListener("click", (e) => { const b = e.target.closest("[data-akcia]"); if (b) akcia(b.dataset.akcia); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = pole.value.trim(); if (!t) return;
    GB.udalost("tabula/otazka", "Tabuľa: otázka");
    pridaj("ja", esc(t)); pole.value = ""; reaguj(t);
  });
  const apo = app.querySelector("[data-apostrof]");
  if (apo) apo.addEventListener("click", () => {
    const s = pole.selectionStart ?? pole.value.length;
    pole.setRangeText("'", s, pole.selectionEnd ?? s, "end"); pole.focus();
  });
};
