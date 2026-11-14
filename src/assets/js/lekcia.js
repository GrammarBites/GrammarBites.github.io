// Mini test, zväčšenie infografiky, kopírovanie odkazu a anonymné štatistiky
(function () {
  const hlava = document.querySelector("[data-lekcia]");
  const lekcia = hlava ? hlava.dataset.lekcia : "lekcia";

  // ---- Štatistiky: video, stiahnutia ----
  const video = document.querySelector("video.video");
  if (video) {
    let spustene = false;
    video.addEventListener("play", () => { if (!spustene) { spustene = true; GB.udalost("video/" + lekcia, "Video: " + lekcia); } });
    video.addEventListener("ended", () => GB.udalost("video-dopozerane/" + lekcia, "Video dopozerané: " + lekcia));
  }
  document.querySelectorAll(".stiahni a").forEach((a) => {
    a.addEventListener("click", () => {
      const typ = /\.pdf$/i.test(a.getAttribute("href")) ? "pdf" : "obrazok";
      GB.udalost("stiahnutie/" + lekcia + "/" + typ, "Stiahnutie " + typ + ": " + lekcia);
    });
  });
  // ---- Mini test ----
  document.querySelectorAll("[data-test]").forEach((form) => {
    const otazky = [...form.querySelectorAll(".otazka")];
    const znova = form.querySelector("[data-znova]");
    const vysledok = form.querySelector(".test__vysledok");
    const vysledokText = vysledok.querySelector("p");

    // Možnosti sa pri každom pokuse zamiešajú, aby správna odpoveď nebola stále na tom istom mieste.
    // Otázka s data-nemiesaj (v lekcii: nemiesaj: true) si poradie ponechá.
    const zamiesaj = () => otazky.forEach((q) => {
      if (q.hasAttribute("data-nemiesaj")) return;
      const obal = q.querySelector(".moznosti");
      const moznosti = [...obal.querySelectorAll(".moznost")];
      for (let i = moznosti.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moznosti[i], moznosti[j]] = [moznosti[j], moznosti[i]];
      }
      moznosti.forEach((m) => obal.appendChild(m));
    });
    zamiesaj();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let spravne = 0, zodpovedane = 0;
      otazky.forEach((q) => {
        const sprav = q.dataset.spravna;
        const vybrana = q.querySelector("input:checked");
        const spatna = q.querySelector(".otazka__spatna");
        q.classList.remove("je-spravne", "je-zle");
        q.querySelectorAll(".moznost").forEach((m) => m.classList.remove("moznost--spravna", "moznost--zla"));
        const spravnaMoznost = q.querySelector(`input[value="${sprav}"]`).closest(".moznost");
        spravnaMoznost.classList.add("moznost--spravna");
        if (vybrana) zodpovedane++;
        if (vybrana && vybrana.value === sprav) {
          spravne++;
          q.classList.add("je-spravne");
          spatna.textContent = "Správne! " + spatna.dataset.ok;
        } else {
          q.classList.add("je-zle");
          if (vybrana) vybrana.closest(".moznost").classList.add("moznost--zla");
          spatna.textContent = (vybrana ? "Nie celkom. " : "Bez odpovede. ") +
            "Správne je: „" + spravnaMoznost.textContent.trim() + "“. " + spatna.dataset.ok;
        }
        spatna.hidden = false;
        q.querySelectorAll("input").forEach((i) => (i.disabled = true));
      });
      const n = otazky.length;
      const dobre = spravne / n >= 0.8;
      vysledokText.textContent =
        `Máš ${spravne} z ${n} správne. ` +
        (spravne === n ? "Výborne, gramatiku máš zahryznutú!" : dobre ? "Skvelá práca!" : "Pozri si ešte raz výklad a skús to znova.");
      GB.udalost("test/" + lekcia + "/" + spravne + "-z-" + n, "Test " + lekcia + ": " + spravne + "/" + n);
      vysledok.querySelector("[data-obr-dobre]").hidden = !dobre;
      vysledok.querySelector("[data-obr-zle]").hidden = dobre;
      vysledok.hidden = false;
      znova.hidden = false;
      form.querySelector('button[type="submit"]').hidden = true;
      vysledok.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    });

    znova.addEventListener("click", () => {
      form.reset();
      otazky.forEach((q) => {
        q.classList.remove("je-spravne", "je-zle");
        q.querySelectorAll(".moznost").forEach((m) => m.classList.remove("moznost--spravna", "moznost--zla"));
        q.querySelectorAll("input").forEach((i) => (i.disabled = false));
        q.querySelector(".otazka__spatna").hidden = true;
      });
      vysledok.hidden = true;
      znova.hidden = true;
      form.querySelector('button[type="submit"]').hidden = false;
      zamiesaj();
      otazky[0].querySelector("input").focus();
    });
  });

  // ---- Zväčšenie infografiky ----
  const zv = document.querySelector("[data-zvacsi]");
  const dlg = document.querySelector(".zvacsenie");
  if (zv && dlg) {
    zv.addEventListener("click", () => {
      GB.udalost("infografika-zvacsena/" + lekcia, "Infografika zväčšená: " + lekcia);
      if (typeof dlg.showModal === "function") dlg.showModal();
      else window.open(zv.querySelector("img").src, "_blank");
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---- Odkaz na lekciu ----
  const pole = document.getElementById("odkaz-lekcie");
  if (pole) pole.value = location.href.replace(/index\.html$/, "");
  document.querySelectorAll("[data-kopiruj]").forEach((b) => {
    b.addEventListener("click", async () => {
      const el = document.getElementById(b.dataset.kopiruj);
      try {
        await navigator.clipboard.writeText(el.value);
        b.textContent = "Skopírované ✓";
      } catch (e) {
        el.select();
        b.textContent = "Označené – stlač Ctrl+C";
      }
      setTimeout(() => (b.textContent = "Kopírovať odkaz"), 2500);
    });
  });
})();
