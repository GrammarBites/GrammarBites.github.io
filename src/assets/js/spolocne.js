// Spoločné pomôcky – načítava sa pred ostatnými skriptmi
window.GB = (function () {
  const html = document.querySelector("[data-root]") || document.documentElement;
  const root = html.dataset.root || "/";
  const preview = html.dataset.preview === "1";

  function odkaz(url) {
    // url je bez úvodnej lomky, napr. "lekcie/first-conditional/"
    let u = root + url;
    if (preview && (u.endsWith("/") || u === root)) u += "index.html";
    return u;
  }

  function normalizuj(t) {
    return String(t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’']/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function data(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function esc(t) {
    return String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Anonymná udalosť do štatistík (GoatCounter). Ak sa skript ešte nenačítal, chvíľu počká.
  function udalost(cesta, nazov, pokus = 0) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: cesta, title: nazov || cesta, event: true });
      } else if (pokus < 10) {
        setTimeout(() => udalost(cesta, nazov, pokus + 1), 500);
      }
    } catch (e) {}
  }

  return { root, preview, odkaz, normalizuj, data, esc, udalost };
})();

// Hlavné menu: ak sa nezmestí, vybledne na okraji a aktuálna položka sa posunie do zorného poľa.
(function () {
  const ul = document.querySelector(".menu ul");
  if (!ul) return;
  const stav = () => {
    const viac = ul.scrollWidth - ul.clientWidth > 2;
    ul.classList.toggle("menu--dalej", viac && ul.scrollLeft < ul.scrollWidth - ul.clientWidth - 2);
    ul.classList.toggle("menu--spat", viac && ul.scrollLeft > 2);
  };
  const aktualna = ul.querySelector('[aria-current="page"]');
  if (aktualna && ul.scrollWidth > ul.clientWidth) {
    const li = aktualna.parentElement;
    if (li.offsetLeft + li.offsetWidth > ul.clientWidth) ul.scrollLeft = li.offsetLeft - 24;
  }
  ul.addEventListener("scroll", stav, { passive: true });
  window.addEventListener("resize", stav);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(stav);
  stav();
})();
