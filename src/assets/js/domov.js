// Grammar Bite dňa – vyberá sa automaticky podľa dátumu z publikovaných lekcií
(function () {
  const lekcie = (GB.data("data-lekcie") || []).filter((l) => l.bite && l.bite.tip);
  const dnes = new Date();
  const datumEl = document.querySelector("[data-dnes]");
  if (datumEl) {
    datumEl.textContent = dnes.toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" });
  }
  if (!lekcie.length) return;

  // Rovnaký výber pre všetkých v ten istý deň; poradie lekcií je zamiešané pevne,
  // aby za sebou nešli lekcie v poradí publikovania.
  const den = Math.floor(Date.UTC(dnes.getFullYear(), dnes.getMonth(), dnes.getDate()) / 864e5);
  const poradie = lekcie
    .map((l, i) => ({ l, k: (Math.imul(i + 1, 2654435761) >>> 0) % 1000 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.l);
  const l = poradie[den % poradie.length];

  const url = GB.odkaz(l.url);
  document.querySelectorAll("[data-bite-odkaz]").forEach((a) => (a.href = url));
  const nazov = document.querySelector(".bite-dna__tema [data-bite-odkaz]");
  if (nazov) nazov.textContent = l.title;
  const set = (sel, t) => { const el = document.querySelector(sel); if (el) el.textContent = t || ""; };
  set("[data-bite-sk]", l.sk);
  set("[data-bite-tip]", l.bite.tip);
  set("[data-bite-priklad]", l.bite.priklad);
})();
