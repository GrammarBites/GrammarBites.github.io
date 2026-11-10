// Tabuľka nepravidelných slovies: hľadanie, zakrývanie stĺpcov (odkrytie ťuknutím), tlač.
(function () {
  const bezDiakritiky = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  document.querySelectorAll("[data-tabulka-slovies]").forEach((box) => {
    const riadky = [...box.querySelectorAll("tbody tr")];
    riadky.forEach((r) => { r._t = bezDiakritiky(r.dataset.hladat); });
    const hladaj = box.querySelector("[data-hladaj]"), stav = box.querySelector("[data-stav]");
    const nic = box.querySelector("[data-nic]"), odkry = box.querySelector("[data-odkry]");
    const cipy = [...box.querySelectorAll("[data-zakry]")];
    const zrus = box.querySelector("[data-zrus]");
    const KODY = cipy.map((c) => c.dataset.zakry);
    let zakryte = [];

    function filtruj() {
      const q = bezDiakritiky(hladaj.value.trim());
      let n = 0;
      riadky.forEach((r) => { const ok = !q || r._t.includes(q); r.hidden = !ok; if (ok) n++; });
      nic.hidden = n > 0;
      pisStav(n, q);
    }
    function pisStav(n, q) {
      const odkryte = box.querySelectorAll("td.je-zakryta.je-odkryta").length;
      const spolu = box.querySelectorAll("tr:not([hidden]) td.je-zakryta").length;
      let t = q ? `Nájdené: ${n} z ${riadky.length}.` : `Spolu ${riadky.length} slovies.`;
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
    zakry(ulozene.split(",").filter((k) => KODY.includes(k)));
  });
})();
