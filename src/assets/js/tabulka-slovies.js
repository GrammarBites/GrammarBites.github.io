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

    let riadkyRoc = riadky.length;
    function vyberRocnik(r) {
      rocnik = r;
      box.classList.toggle("ts--bez-pp", r === "5");
      if (r === "5" && zakryte.includes("pp")) return zakry(zakryte.filter((x) => x !== "pp")), ulozRoc();
      rocCipy.forEach((c) => c.setAttribute("aria-pressed", c.dataset.rocnik === r ? "true" : "false"));
      ulozRoc(); filtruj();
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
    zakry(ulozene.split(",").filter((k) => KODY.includes(k) && !(rocnik === "5" && k === "pp")));
  });
})();
