// Tabuľka nepravidelných slovies: hľadanie, zakrývanie stĺpcov (odkrytie ťuknutím), tlač.
(function () {
  const bezDiakritiky = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  document.querySelectorAll("[data-tabulka-slovies]").forEach((box) => {
    const riadky = [...box.querySelectorAll("tbody tr")];
    riadky.forEach((r) => { r._t = bezDiakritiky(r.dataset.hladat); r._t5 = bezDiakritiky(r.dataset.hladat5 || r.dataset.hladat); });
    const hladaj = box.querySelector("[data-hladaj]"), stav = box.querySelector("[data-stav]");
    const nic = box.querySelector("[data-nic]"), odkry = box.querySelector("[data-odkry]");
    const cipy = [...box.querySelectorAll("[data-zakry]")];
    const zrus = box.querySelector("[data-zrus]");
    const KODY = cipy.map((c) => c.dataset.zakry);
    let zakryte = [];
    // filter podľa ročníka: "5" = zoznam 5. ročníka, "skola" = školský zoznam, "" = všetko
    const rocCipy = [...box.querySelectorAll("[data-rocnik]")];
    const nicRoc = box.querySelector("[data-nic-rocnik]");
    box.querySelector("[data-rocnik-vsetky]").addEventListener("click", () => vyberRocnik(""));
    let rocnik = "";
    const vRocniku = (r) => (rocnik === "5" ? r.hasAttribute("data-r5") : rocnik === "skola" ? r.hasAttribute("data-skola") : true);

    // ---------- poradie: podľa abecedy alebo podľa skupín (rodín) ----------
    const telo = box.querySelector("tbody"), porCipy = [...box.querySelectorAll("[data-poradie]")], poznSk = box.querySelector("[data-pozn-skupiny]");
    let SK = { p: [], pp: [] };
    try { SK = JSON.parse(document.getElementById("data-skupiny-slovies").textContent); } catch (e) {}
    const prvy = (t) => String(t || "").split(/[,/]/)[0].trim();
    // slovesá mimo rodín (v úplnej tabuľke) idú do skupín podľa toho, ktoré tvary sú rovnaké
    const DALSIE = [["x-aaa", "Ďalšie: všetky tri tvary rovnaké"], ["x-abb", "Ďalšie: 2. a 3. tvar rovnaký"], ["x-aba", "Ďalšie: 3. tvar = základný"], ["x-abc", "Ďalšie: 2. a 3. tvar sú rôzne"]];
    const vzorec = (r) => { const z = prvy(r.dataset.z), p = prvy(r.dataset.p), pp = prvy(r.dataset.pp); return z === p && p === pp ? "x-aaa" : p === pp ? "x-abb" : z === pp ? "x-aba" : "x-abc"; };
    const hlavicky = [];
    let poradie = "";
    function zorad() {
      hlavicky.splice(0).forEach((h) => h.remove());
      if (poradie !== "skupiny") { riadky.forEach((r) => telo.append(r)); return; }
      const piaty = rocnik === "5", rodiny = piaty ? SK.p : SK.pp;
      const kde = new Map(); rodiny.forEach((ro) => ro.slovesa.forEach((z, i) => kde.set(z, [ro.id, i])));
      const skup = new Map(rodiny.map((ro) => [ro.id, { ...ro, r: [] }]));
      (piaty ? [["x-p", "Ďalšie slovesá"]] : DALSIE).forEach(([id, nazov]) => skup.set(id, { id, nazov, r: [] }));
      riadky.forEach((r) => { const k = kde.get(r.dataset.z); r._por = k ? k[1] : 999; const bezPP = !piaty && !/[a-z]/i.test(r.dataset.pp) && skup.has("samotari"); // can – could – (3. tvar nemá)
        skup.get(k ? k[0] : bezPP ? "samotari" : piaty ? "x-p" : vzorec(r)).r.push(r); });
      skup.forEach((g) => {
        if (!g.r.length) return;
        g.r.sort((a, b) => a._por - b._por);
        const prva = g.r[0].dataset, vzor = g.vzor || (piaty ? `${prva.z} → ${prvy(prva.p)}` : `${prva.z} – ${prvy(prva.p)} – ${prvy(prva.pp)}`);
        const h = document.createElement("tr"); h.className = "ts__skupina";
        const th = document.createElement("th"); th.colSpan = 4; th.scope = "colgroup";
        const b = document.createElement("b"); b.textContent = g.nazov;
        const v = document.createElement("span"); v.className = "ts__vzor"; v.lang = "en"; v.textContent = vzor;
        const n = document.createElement("span"); n.className = "ts__pocet";
        th.append(b, " ", v, " ", n);
        if (g.tip && piaty) { const t = document.createElement("small"); t.textContent = g.tip; th.append(t); }
        h.append(th); h._r = g.r; h._n = n; hlavicky.push(h);
        telo.append(h, ...g.r);
      });
    }
    function vyberPoradie(p) {
      poradie = p;
      porCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.poradie === p ? "true" : "false"));
      poznSk.hidden = p !== "skupiny"; box.classList.toggle("ts--skupiny", p === "skupiny");
      try { localStorage.setItem("gb-tabulka-poradie", p); } catch (e) {}
      zorad(); filtruj();
    }
    porCipy.forEach((c) => c.addEventListener("click", () => vyberPoradie(c.dataset.poradie)));

    let riadkyRoc = riadky.length;
    function vyberRocnik(r) {
      rocnik = r;
      box.classList.toggle("ts--bez-pp", r === "5");
      if (r === "5" && zakryte.includes("pp")) return zorad(), zakry(zakryte.filter((x) => x !== "pp")), ulozRoc();
      rocCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.rocnik === r ? "true" : "false"));
      ulozRoc(); zorad(); filtruj();
    }
    function ulozRoc() {
      rocCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.rocnik === rocnik ? "true" : "false"));
      try { localStorage.setItem("gb-tabulka-rocnik", rocnik); } catch (e) {}
    }
    rocCipy.forEach((c) => c.addEventListener("click", () => vyberRocnik(c.dataset.rocnik)));
    function filtruj() {
      const q = bezDiakritiky(hladaj.value.trim());
      let n = 0;
      let vsetkych = 0, mimo = 0;
      riadky.forEach((r) => {
        // v 5. ročníku sa 3. tvar neučí – nehľadáme v ňom
        const roc = vRocniku(r), hit = !q || (rocnik === "5" ? r._t5 : r._t).includes(q), ok = roc && hit;
        r.hidden = !ok; if (ok) n++; if (roc) vsetkych++; if (hit && !roc) mimo++;
      });
      hlavicky.forEach((h) => { const k = h._r.filter((r) => !r.hidden).length; h.hidden = !k; h._n.textContent = `(${k})`; });
      riadkyRoc = vsetkych;
      nic.hidden = n > 0 || mimo > 0;
      nicRoc.hidden = n > 0 || mimo === 0;
      pisStav(n, q);
    }
    function pisStav(n, q) {
      const odkryte = box.querySelectorAll("td.je-zakryta.je-odkryta").length;
      const spolu = box.querySelectorAll("tr:not([hidden]) td.je-zakryta").length - (rocnik === "5" ? box.querySelectorAll("tr:not([hidden]) td.je-zakryta[data-st=pp]").length : 0);
      let t = q ? `Nájdené: ${n} z ${riadkyRoc}.` : `Spolu ${riadkyRoc} slovies.`;
      if (zakryte.length) t += ` Odkryté: ${Math.min(odkryte, spolu)} / ${spolu} – najprv si tvar povedz nahlas, potom ťukni.`;
      stav.textContent = t;
    }
    function zakry(zoznam) {
      zakryte = zoznam;
      cipy.forEach((c) => c.setAttribute("aria-pressed", zakryte.includes(c.dataset.zakry) ? "true" : "false"));
      box.querySelectorAll("td[data-st]").forEach((td) => {
        const z = zakryte.includes(td.dataset.st);
        td.classList.toggle("je-zakryta", z); td.classList.remove("je-odkryta");
        if (z) { td.tabIndex = 0; td.setAttribute("role", "button"); td.setAttribute("aria-label", "Zakryté – ťukni a odkry"); }
        else { td.removeAttribute("tabindex"); td.removeAttribute("role"); td.removeAttribute("aria-label"); }
      });
      odkry.hidden = zrus.hidden = !zakryte.length;
      filtruj();
      try { localStorage.setItem("gb-tabulka-zakry", zakryte.join(",")); } catch (e) {}
    }
    function odkryBunku(td) {
      if (!td || !td.classList.contains("je-zakryta") || td.classList.contains("je-odkryta")) return;
      td.classList.add("je-odkryta"); td.removeAttribute("aria-label"); td.removeAttribute("role"); td.removeAttribute("tabindex");
      filtruj();
    }
    box.addEventListener("click", (e) => odkryBunku(e.target.closest("td")));
    box.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("td.je-zakryta")) { e.preventDefault(); odkryBunku(e.target); } });
    cipy.forEach((c) => c.addEventListener("click", () => {
      const k = c.dataset.zakry;
      zakry(zakryte.includes(k) ? zakryte.filter((x) => x !== k) : KODY.filter((x) => x === k || zakryte.includes(x)));
    }));
    zrus.addEventListener("click", () => zakry([]));
    odkry.addEventListener("click", () => box.querySelectorAll("td.je-zakryta").forEach((td) => odkryBunku(td)));
    hladaj.addEventListener("input", filtruj);
    box.querySelector("[data-tlac]").addEventListener("click", () => {
      hladaj.value = ""; zakry([]); window.print();
    });
    let ulozene = "";
    try { ulozene = localStorage.getItem("gb-tabulka-zakry") || ""; } catch (e) {}
    let ulozenyRoc = "";
    try { ulozenyRoc = localStorage.getItem("gb-tabulka-rocnik") || ""; } catch (e) {}
    if (rocCipy.some((c) => c.dataset.rocnik === ulozenyRoc)) rocnik = ulozenyRoc;
    box.classList.toggle("ts--bez-pp", rocnik === "5");
    rocCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.rocnik === rocnik ? "true" : "false"));
    let ulozenePor = "";
    try { ulozenePor = localStorage.getItem("gb-tabulka-poradie") || ""; } catch (e) {}
    if (ulozenePor === "skupiny") { poradie = "skupiny"; porCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.poradie === poradie ? "true" : "false")); poznSk.hidden = false; box.classList.add("ts--skupiny"); zorad(); }
    zakry(ulozene.split(",").filter((k) => KODY.includes(k) && !(rocnik === "5" && k === "pp")));
  });
})();
