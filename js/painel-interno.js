(function () {
  const cfg = window.GF_CADASTRO || {};
  let s = null;
  try {
    s = JSON.parse(sessionStorage.getItem('gf_admin_token') || 'null');
    if (s && s.exp <= Date.now()) s = null;
  } catch (e) {}
  document.getElementById(s ? 'painel' : 'negado').hidden = false;
  if (!s || !cfg.supabaseUrl) return;

  // Mostra quantos cadastros aguardam análise
  fetch(cfg.supabaseUrl + '/rest/v1/cadastros?select=id&status=eq.Pendente', {
    headers: { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + s.t, Prefer: 'count=exact', Range: '0-0' }
  }).then((r) => {
    const total = Number((r.headers.get('content-range') || '').split('/')[1]);
    if (total > 0) {
      const b = document.getElementById('b-pend');
      b.textContent = total + (total === 1 ? ' novo' : ' novos');
      b.hidden = false;
    }
  }).catch(() => {});
})();
