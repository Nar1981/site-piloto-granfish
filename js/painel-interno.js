(function () {
  let ok = false;
  try {
    const s = JSON.parse(sessionStorage.getItem('gf_admin_token') || 'null');
    ok = !!(s && s.exp > Date.now());
  } catch (e) {}
  document.getElementById(ok ? 'painel' : 'negado').hidden = false;
})();
