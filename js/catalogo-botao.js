(function () {
  const cfg = window.GF_CADASTRO || {};
  const area = document.querySelector('.hero-actions');
  if (!area || !cfg.supabaseUrl) return;
  fetch(cfg.supabaseUrl + '/rest/v1/rpc/catalogo_publico_status', {
    method: 'POST',
    headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: '{}'
  }).then((r) => r.json()).then((ok) => {
    if (ok !== true) return;
    const a = document.createElement('a');
    a.className = 'button';
    a.href = 'catalogo-embarcacoes.html';
    a.append('Catálogo de embarcações ');
    const seta = document.createElement('span');
    seta.setAttribute('aria-hidden', 'true');
    seta.textContent = '→';
    a.appendChild(seta);
    const cores = area.querySelector('a[href="catalogo.html"]');
    area.insertBefore(a, cores || null);
  }).catch(() => {});
})();
