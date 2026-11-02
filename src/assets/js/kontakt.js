// Kontaktný formulár cez Web3Forms (správy chodia na e-mail učiteľa)
(function () {
  const form = document.querySelector("[data-formular]");
  if (!form) return;
  const stav = form.querySelector("[data-stav]");
  const kluc = form.dataset.kluc;

  function ukaz(text, typ) {
    stav.textContent = text;
    stav.className = "formular__stav formular__stav--" + typ;
    stav.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const meno = form.meno.value.trim();
    const sprava = form.sprava.value.trim();
    if (!meno || !sprava) {
      ukaz("Vyplň prezývku aj správu, prosím.", "chyba");
      (meno ? form.sprava : form.meno).focus();
      return;
    }
    if (form.email.value && !form.email.checkValidity()) {
      ukaz("E-mail nevyzerá správne. Oprav ho, alebo ho vymaž.", "chyba");
      form.email.focus();
      return;
    }
    if (!kluc) {
      ukaz("Formulár ešte nie je zapojený, správa sa neodoslala. Skús to o pár dní.", "chyba");
      return;
    }
    const tlacidlo = form.querySelector('button[type="submit"]');
    tlacidlo.disabled = true;
    tlacidlo.textContent = "Odosielam…";
    try {
      const odpoved = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: kluc,
          subject: "Grammar Bites: " + form.kategoria.value,
          from_name: "Grammar Bites – " + meno,
          meno,
          email: form.email.value || "(neuviedol)",
          kategoria: form.kategoria.value,
          sprava,
          botcheck: form.botcheck.checked,
        }),
      });
      const v = await odpoved.json();
      if (v.success) {
        form.reset();
        ukaz("Ďakujem! Správa je odoslaná.", "ok");
      } else {
        ukaz("Správu sa nepodarilo odoslať. Skús to znova o chvíľu.", "chyba");
      }
    } catch (err) {
      ukaz("Nepodarilo sa spojiť so serverom. Skontroluj internet a skús znova.", "chyba");
    }
    tlacidlo.disabled = false;
    tlacidlo.textContent = "Odoslať správu";
  });
})();
