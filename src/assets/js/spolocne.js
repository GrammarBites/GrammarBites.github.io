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

  return { root, preview, odkaz, normalizuj, data, esc };
})();
