(function () {
  const area = document.querySelector(".hero-actions");
  if (!area) return;
  const a = document.createElement("a");
  a.className = "button";
  a.href = "catalogo-embarcacoes.html";
  a.append("Catálogo de embarcações ");
  const seta = document.createElement("span");
  seta.setAttribute("aria-hidden", "true");
  seta.textContent = "→";
  a.appendChild(seta);
  area.insertBefore(a, area.querySelector('a[href="catalogo.html"]') || null);
})();
